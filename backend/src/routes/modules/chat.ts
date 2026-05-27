import { Router, type Request, type Response, type NextFunction } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'
import { generateChatResponse, classifyIntentWithLLM, isGeminiAvailable } from '../../services/gemini'

const router = Router()

// ─── TENURE BANDS ──────────────────────────────────────────────────
const TENURE_BANDS = [
  { id: 'flash', label: 'Flash', min: 1, max: 3, tier: 1.50, depositPct: 0.35, emiHorizon: 12 },
  { id: 'semester', label: 'Semester', min: 4, max: 11, tier: 1.10, depositPct: 0.30, emiHorizon: 18 },
  { id: 'annual', label: 'Annual', min: 12, max: 18, tier: 1.00, depositPct: 0.25, emiHorizon: 24 },
  { id: 'extended', label: 'Extended', min: 19, max: 24, tier: 0.85, depositPct: 0.20, emiHorizon: 36 },
  { id: 'lifecycle', label: 'Lifecycle', min: 25, max: 48, tier: 0.75, depositPct: 0.15, emiHorizon: 48 },
]

const CONDITION_DISCOUNT = { 'New': 0.03, 'Mint': 0.02, 'Good': 0.01, 'Fair': 0.005, 'Poor': 0.00 }
const COMPETITOR_RATES: Record<string, number> = {
  Electronics: 0.060, Appliance: 0.055, Furniture: 0.040, Lifestyle: 0.075,
}
const EMI_ANNUAL_RATE = 0.15
const PLATFORM_TAKE = 0.15

function getTenureBand(months: number) {
  return TENURE_BANDS.find(b => months >= b.min && months <= b.max) || TENURE_BANDS[0]
}

function calcEmiTotal(mrv: number, months: number): number {
  return mrv + mrv * EMI_ANNUAL_RATE * months / 12
}

// ─── SESSION STORE ────────────────────────────────────────────────
interface SessionState {
  role: string | null
  itemOfInterest: string | null
  tenureMonths: number | null
  budgetSignal: string | null
  campus: string | null
  urgency: string | null
  emiTemptation: boolean
  hinglishMode: boolean
  messagesInSession: number
  unresolvedQuestions: string[]
  monthsAlreadyPaid: number
  suggestionPath: string[]
}

const sessions = new Map<string, SessionState>()

function getSession(userId: string): SessionState {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      role: null, itemOfInterest: null, tenureMonths: null,
      budgetSignal: null, campus: null, urgency: null,
      emiTemptation: false, hinglishMode: false,
      messagesInSession: 0, unresolvedQuestions: [],
      monthsAlreadyPaid: 0, suggestionPath: [],
    })
  }
  return sessions.get(userId)!
}

// ─── HINGLISH NORMALIZER ──────────────────────────────────────────
interface NormalizedInput {
  intent: 'rent' | 'list' | 'pricing_query' | 'general'
  itemHint: string | null
  tenureHint: number | null
  budgetSignal: string | null
}

const HINGLISH_MAP: Record<string, string> = {
  'chahiye': 'rent', 'lena hai': 'rent', 'rent karna hai': 'rent',
  'dena hai': 'list', 'list karna hai': 'list', 'kirayey pe dena': 'list',
  'kitna': 'pricing_query', 'price kya': 'pricing_query',
  'bhai': '', 'yaar': '', 'sab': '',
}
const HINGLISH_MONTHS: Record<string, number> = {
  'semester bhar': 6, '6 mahine': 6, 'saat mahine': 7, '8 mahine': 8,
  '2 mahine': 2, 'do mahine': 2, '3 mahine': 3, 'teen mahine': 3,
  '4 mahine': 4, '5 mahine': 5, '9 mahine': 9, '10 mahine': 10,
  '1 saal': 12, 'saal bhar': 12, '2 saal': 24,
}

function normalizeHinglish(message: string): NormalizedInput {
  const lower = message.toLowerCase().trim()
  let intent: NormalizedInput['intent'] = 'general'
  let itemHint: string | null = null
  let tenureHint: number | null = null
  let budgetSignal: string | null = null

  // Intent detection
  if (lower.includes('chahiye') || lower.includes('lena hai') || lower.includes('rent karna')) intent = 'rent'
  else if (lower.includes('dena hai') || lower.includes('list karna') || lower.includes('kirayey pe dena')) intent = 'list'
  else if (lower.includes('kitna') || lower.includes('price kya') || lower.includes('cost kya')) intent = 'pricing_query'

  // Budget signal
  if (lower.includes('sasta') || lower.includes('budget') || lower.includes('kam paise') || lower.includes('tight') || lower.includes('cheap')) budgetSignal = 'tight'
  else if (lower.includes('best') || lower.includes('top') || lower.includes('premium') || lower.includes('flexible')) budgetSignal = 'flexible'

  // Tenure detection from Hinglish
  for (const [phrase, months] of Object.entries(HINGLISH_MONTHS)) {
    if (lower.includes(phrase)) { tenureHint = months; break }
  }

  // Item detection - common rental items
  const items = ['laptop', 'ac', 'air conditioner', 'cycle', 'bicycle', 'fridge', 'refrigerator',
    'washing machine', 'tv', 'sofa', 'table', 'chair', 'bed', 'mattress', 'fan', 'heater',
    'geyser', 'camera', 'speaker', 'drone', 'projector', 'calculator', 'macbook', 'book', 'kindle']
  for (const item of items) {
    if (lower.includes(item)) { itemHint = item; break }
  }

  return { intent, itemHint, tenureHint, budgetSignal }
}

// ─── SUGGESTION TREE ─────────────────────────────────────────────
const SUGGESTION_TREE: Record<string, string[]> = {
  entry: [
    'I want to rent something',
    'I want to list/sell something',
    'I have a complaint',
    'How does Lease work?',
    'Pricing help',
  ],
  rent_categories: [
    '📱 Laptop / Electronics',
    '❄️ AC / Appliance',
    '🪑 Furniture (sofa, table, bed)',
    '🚲 Cycle / Sports',
    '📚 Books / Study',
    '🎧 Lifestyle (speaker, camera)',
  ],
  sell_categories: [
    '📱 Sell Electronics',
    '❄️ Sell Appliance',
    '🪑 Sell Furniture',
    '📚 Sell Books',
    '🎧 Sell Lifestyle',
    '❓ What should I charge?',
  ],
  complaint: [
    '💰 Deposit not refunded',
    '🔧 Item is damaged',
    '⚖️ Dispute with buyer/seller',
    '👤 Account issue',
    '🎧 Talk to a human agent',
  ],
  guide: [
    '📖 How renting works',
    '📋 How listing works',
    '🔒 Deposit & escrow explained',
    '🛡️ Trust & safety',
    '🚀 Getting started guide',
  ],
  rent_tenure: [
    '⚡ Flash — 1 to 3 months',
    '📅 Semester — 4 to 11 months',
    '📆 Annual — 12 to 18 months',
    '🔄 Extended — 19+ months',
    '🤔 Not sure — what\'s best for me?',
  ],
  sell_value: [
    '₹ 1,000 – 5,000 range',
    '₹ 5,000 – 20,000 range',
    '₹ 20,000 – 50,000 range',
    '₹ 50,000+ range',
    '❓ Help me estimate',
  ],
  rent_budget: [
    '💰 Tight budget — lowest rent',
    '⚖️ Balanced — good value',
    '💎 Premium — best quality',
    '📊 Compare rent vs buying/EMI',
    '📋 Show me available listings',
    '🔒 Tell me about deposit',
  ],
  sell_actions: [
    '📊 Calculate my earnings',
    '📋 List this item now',
    '🏆 Compare with competitors',
    '💡 Tips to rent faster',
    '🔒 Damage protection?',
  ],
  rent_solution: [
    '📊 Show pricing breakdown',
    '✅ Start booking process',
    '❓ Any hidden charges?',
    '🎯 How to get zero deposit?',
    '🎧 Talk to a human',
    '🔄 Start over',
  ],
  sell_solution: [
    '📋 Finalize my listing',
    '📈 How to get more bookings',
    '🛡️ Damage protection details',
    '💰 Payout & payment terms',
    '🎧 Talk to a human',
    '🔄 Start over',
  ],
}

function getSuggestions(session: SessionState): string[] | null {
  if (session.messagesInSession >= 10) return null

  if (!session.role) return SUGGESTION_TREE.entry
  if (session.role === 'complaint') return SUGGESTION_TREE.complaint
  if (session.role === 'guide') return SUGGESTION_TREE.guide
  if (session.role === 'seller') {
    if (!session.itemOfInterest) return SUGGESTION_TREE.sell_categories
    if (session.suggestionPath.includes('sell_solution')) return null
    return SUGGESTION_TREE.sell_actions
  }
  // renter
  if (!session.itemOfInterest) return SUGGESTION_TREE.rent_categories
  if (!session.tenureMonths) return SUGGESTION_TREE.rent_tenure
  if (session.suggestionPath.includes('rent_solution')) return null
  return SUGGESTION_TREE.rent_budget
}

// ─── UPDATE SESSION FROM MESSAGE ─────────────────────────────────
function updateSession(session: SessionState, message: string, normalized: NormalizedInput) {
  session.messagesInSession++

  // Reset role when intent contradicts previous role
  if (normalized.intent === 'rent' && session.role === 'seller') {
    session.role = 'renter'
    session.itemOfInterest = null
    session.tenureMonths = null
  } else if (normalized.intent === 'list' && session.role === 'renter') {
    session.role = 'seller'
    session.itemOfInterest = null
    session.tenureMonths = null
  } else if (normalized.intent === 'rent') {
    session.role = 'renter'
  } else if (normalized.intent === 'list') {
    session.role = 'seller'
  }

  if (normalized.itemHint) session.itemOfInterest = normalized.itemHint
  if (normalized.tenureHint) session.tenureMonths = normalized.tenureHint
  if (normalized.budgetSignal) session.budgetSignal = normalized.budgetSignal

  // Hinglish detection
  const hinglishWords = ['hai', 'nahi', 'bhai', 'yaar', 'kya', 'kitna', 'acha', 'thoda', 'chahiye', 'wala', 'mera', 'tera']
  const wordCount = message.toLowerCase().split(/\s+/).length
  const hinglishCount = hinglishWords.filter(w => message.toLowerCase().includes(w)).length
  if (hinglishCount >= 2 || hinglishCount / wordCount > 0.15) session.hinglishMode = true

  // EMI temptation
  if (message.toLowerCase().includes('emi') || message.toLowerCase().includes('loan') || message.toLowerCase().includes('buy karna') || message.toLowerCase().includes('purchase')) {
    session.emiTemptation = true
  }

  // Campus detection
  const campusPatterns = ['iit', 'nit', 'campus', 'hostel', 'pg', 'college', 'university', 'kanpur', 'delhi', 'bangalore']
  for (const p of campusPatterns) {
    if (message.toLowerCase().includes(p)) { session.campus = p; break }
  }

  // Urgency
  if (message.toLowerCase().includes('asap') || message.toLowerCase().includes('urgent') || message.toLowerCase().includes('jaldi') || message.toLowerCase().includes('today')) session.urgency = 'asap'
  else if (message.toLowerCase().includes('planning') || message.toLowerCase().includes('thinking') || message.toLowerCase().includes('sometime')) session.urgency = 'planning'

  // Suggestion path — advance when user completes a stage
  if (normalized.intent === 'rent' && !session.suggestionPath.includes('intent_rent')) session.suggestionPath.push('intent_rent')
  if (normalized.intent === 'list' && !session.suggestionPath.includes('intent_sell')) session.suggestionPath.push('intent_sell')
  if (normalized.itemHint && !session.suggestionPath.includes('item_chosen')) session.suggestionPath.push('item_chosen')
  if (normalized.tenureHint && !session.suggestionPath.includes('tenure_chosen')) session.suggestionPath.push('tenure_chosen')
}

// ─── TENURE-AWARE PRICING ENGINE ──────────────────────────────────
interface PricingResult {
  leaseRent: number
  deposit: number
  renterTotal: number
  competitorTotal: number
  emiTotal: number
  savingVsEmi: number
  savingVsComp: number
  band: string
  sellerPayout: number
  platformTake: number
  months: number
}

function computePricing(
  mrv: number, condition: string, category: string, months: number, source: 'P2P' | 'B2B2C' = 'P2P'
): PricingResult {
  const band = getTenureBand(months)
  const compRate = COMPETITOR_RATES[category] || 0.060
  const condDisc = CONDITION_DISCOUNT[condition as keyof typeof CONDITION_DISCOUNT] || 0.01

  const baseRent = Math.round(mrv * compRate * (1 - 0.04)) // 4% undercut
  const leaseRent = Math.round(baseRent * band.tier * (1 - condDisc))
  const deposit = Math.round(mrv * band.depositPct)

  const compMonthly = Math.round(mrv * compRate)
  const competitorTotal = compMonthly * months

  const emiTotal = Math.round(calcEmiTotal(mrv, band.emiHorizon))
  const emiMonthly = Math.round(emiTotal / band.emiHorizon)
  const emiTotalForTenure = emiMonthly * months

  const renterTotal = leaseRent * months
  const savingVsEmi = emiTotalForTenure - renterTotal
  const savingVsComp = competitorTotal - renterTotal
  const sellerPayout = Math.round(leaseRent * (1 - PLATFORM_TAKE))
  const platformTakeCalc = leaseRent - sellerPayout

  return {
    leaseRent, deposit, renterTotal, competitorTotal,
    emiTotal: emiTotalForTenure, savingVsEmi, savingVsComp,
    band: band.label, sellerPayout, platformTake: platformTakeCalc, months,
  }
}

// ─── EMI SWITCHER ────────────────────────────────────────────────
function getEmiSwitcherStep(pricing: PricingResult, session: SessionState): { step: number; response: string } {
  const band = getTenureBand(session.tenureMonths || 12)

  // Step determination based on spec
  if (band.id === 'flash') {
    return {
      step: 1,
      response: `You want this for ${pricing.months} months. EMI over ${band.emiHorizon}mo = ₹${Math.round(pricing.emiTotal / band.emiHorizon).toLocaleString('en-IN')}/mo × ${band.emiHorizon} = ₹${pricing.emiTotal.toLocaleString('en-IN')} total. Renting = ₹${pricing.leaseRent.toLocaleString('en-IN')}/mo × ${pricing.months} = ₹${pricing.renterTotal.toLocaleString('en-IN')}. There's literally no world where EMI makes sense here. You'd be paying for ${band.emiHorizon - pricing.months} months of something you returned after ${pricing.months}.`,
    }
  }

  if (band.id === 'semester') {
    if (session.budgetSignal === 'tight') {
      return {
        step: 2,
        response: `Renting ${pricing.months}mo = ₹${pricing.renterTotal.toLocaleString('en-IN')} total. EMI ${band.emiHorizon}mo = ₹${Math.round(pricing.emiTotal / band.emiHorizon).toLocaleString('en-IN')}/mo = ₹${pricing.emiTotal.toLocaleString('en-IN')} total. Renting saves ₹${pricing.savingVsEmi.toLocaleString('en-IN')} and you walk away with no asset to depreciate. BUT — if you think you'll keep using this after ${pricing.months} months, tell me. There's a way to apply your rent toward a refurb purchase.`,
      }
    }
    return {
      step: 2,
      response: `Renting ${pricing.months}mo = ₹${pricing.renterTotal.toLocaleString('en-IN')}. EMI ${band.emiHorizon}mo = ₹${pricing.emiTotal.toLocaleString('en-IN')}. Renting saves ₹${pricing.savingVsEmi.toLocaleString('en-IN')} and zero ownership risk. Want me to run both scenarios side by side?`,
    }
  }

  if (band.id === 'annual') {
    return {
      step: 3,
      response: `Honest take: at ${pricing.months} months, EMI and renting are within ₹${Math.abs(pricing.savingVsEmi).toLocaleString('en-IN')}/mo of each other. What renting gives you: zero ownership risk, ₹${pricing.deposit.toLocaleString('en-IN')} less locked up (vs down payment), and your Lease Credit Score gets you zero-deposit for future rentals. If you KNOW you'll want to keep this after a year — EMI might actually win. Want me to run both scenarios side by side?`,
    }
  }

  // Extended / Lifecycle
  if (pricing.savingVsEmi < 5000 && session.budgetSignal !== 'tight') {
    return {
      step: 5,
      response: `At ${pricing.months} months, you're in near-ownership territory. Total rent = ₹${pricing.renterTotal.toLocaleString('en-IN')}. Total EMI = ₹${pricing.emiTotal.toLocaleString('en-IN')}. Gap = ₹${Math.abs(pricing.savingVsEmi).toLocaleString('en-IN')}. If you WANT to own it — EMI makes sense. I'll refer you to our partner and you still keep your Lease Credit Score.`,
    }
  }

  // Tight budget override
  if (session.budgetSignal === 'tight') {
    return {
      step: 1,
      response: `EMI locks you in for ${band.emiHorizon} months. Miss two payments and your credit score takes a hit. Renting = no commitment, cancel anytime. For where you're at right now, renting is the safer call.`,
    }
  }

  return {
    step: 4,
    response: `At ${pricing.months}mo, renting = ₹${pricing.renterTotal.toLocaleString('en-IN')}, EMI = ₹${pricing.emiTotal.toLocaleString('en-IN')}. You save ₹${pricing.savingVsEmi.toLocaleString('en-IN')}. Want to explore Rent-to-Own?`,
  }
}

// ─── PROACTIVE NUDGES (based on SESSION_STATE) ───────────────────
function getProactiveNudge(session: SessionState, pricing?: PricingResult): string | null {
  if (!session.tenureMonths || !pricing) return null

  if (session.tenureMonths >= 12) {
    return `By the way, at ${session.tenureMonths}+ months you qualify for our Annual Lease discount — 9% off total if you prepay. Want me to calculate that?`
  }
  if (session.budgetSignal === 'tight') {
    return `Quick tip: Fair condition items are 4.5% cheaper and functionally the same for study use. Want me to show only Fair/Good listings?`
  }
  if (session.campus && (session.campus === 'hostel' || session.campus === 'pg')) {
    return `Your deposit is refunded in full when you return items — so even if you move out early, you get it back. Just flag it 2 weeks in advance.`
  }
  return null
}

// ─── DATA FETCHER ─────────────────────────────────────────────────
async function fetchTransactionalData(itemCategory?: string | null) {
  let query = `
    SELECT i.id, i.title, i.description, i.monthly_rent, i.deposit_amount, i.retail_price, i.condition,
           (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as image_url,
           u.first_name || ' ' || u.last_name as seller_name, c.name as city_name
    FROM items i JOIN users u ON u.id = i.seller_id JOIN cities c ON c.id = i.city_id
    WHERE i.status = 'active' AND i.is_available = true`
  const params: any[] = []
  if (itemCategory) {
    params.push(`%${itemCategory}%`)
    query += ` AND (i.title ILIKE $${params.length} OR i.description ILIKE $${params.length})`
  }
  query += ` ORDER BY i.monthly_rent ASC LIMIT 10`
  const result = await db.query(query, params)
  return result.rows
}

async function fetchEscrowData(userId: string) {
  const [deposits, disputes] = await Promise.all([
    db.query(`SELECT d.id, d.amount, d.status, d.deduction_amount, d.deduction_reason, r.id as rental_id, r.status as rental_status
      FROM deposits d JOIN rentals r ON r.id = d.rental_id
      WHERE r.renter_id = $1 OR r.seller_id = $1 ORDER BY d.created_at DESC LIMIT 5`, [userId]),
    db.query(`SELECT id, type, status, description, created_at FROM disputes WHERE raised_by = $1 ORDER BY created_at DESC LIMIT 5`, [userId]),
  ])
  return {
    deposits: deposits.rows,
    disputes: disputes.rows,
    hasActiveDeposits: deposits.rows.some((d: any) => d.status === 'held'),
    openDisputes: disputes.rows.filter((d: any) => d.status === 'open' || d.status === 'under_review'),
  }
}

// ─── GENERATE LEASE GURU RESPONSE ────────────────────────────────
async function generateLeaseGuruResponse(
  message: string,
  session: SessionState,
  listings: any[],
  userRole?: string,
): Promise<{ reply: string; table?: any[] }> {
  const normalized = normalizeHinglish(message)
  updateSession(session, message, normalized)

  // If Gemini is available, use it with the full system prompt
  if (isGeminiAvailable()) {
    const dbStr = `Listings: ${JSON.stringify(listings)}\nSession State: ${JSON.stringify(session)}`
    const tenureInfo = session.tenureMonths
      ? computePricing(50000, 'Good', 'Electronics', session.tenureMonths)
      : null
    const proactiveNudge = getProactiveNudge(session, tenureInfo || undefined)

    const systemPrompt = `You are Lease Guru — the conversational AI for Lease, a peer-to-peer student rental marketplace.

Your vibe: the financially sharp friend in the hostel who always knows the smarter move. You think in ROI. You speak like a real person, not a chatbot.

## SESSION STATE
${JSON.stringify(session, null, 2)}

## PRICING CONTEXT
${tenureInfo ? `Current tenure: ${session.tenureMonths}mo (${tenureInfo.band} band)
Lease rent: ₹${tenureInfo.leaseRent.toLocaleString('en-IN')}/mo
Deposit: ₹${tenureInfo.deposit.toLocaleString('en-IN')}
Competitor: ₹${Math.round(tenureInfo.competitorTotal / session.tenureMonths!).toLocaleString('en-IN')}/mo
EMI (${getTenureBand(session.tenureMonths!).emiHorizon}mo): ₹${Math.round(tenureInfo.emiTotal / getTenureBand(session.tenureMonths!).emiHorizon).toLocaleString('en-IN')}/mo` : 'No tenure established yet'}

## RULES
- Determine the user's intent from their CURRENT message: are they looking to rent (renter) or list/sell (seller)? Do NOT rely on session role — use the current message.
- If they want to list/sell → give seller advice (pricing, deposit, daily rate)
- If they want to rent → give renter advice (pricing breakdown by tenure, EMI comparison)
- If unsure, ask ONE clarifying question
- NEVER ask more than one question per message
- NEVER start with "Great question!" or "Certainly!"
- NEVER repeat what the user just said back to them
- Keep responses under 150 words unless showing math
- If the user is in Hinglish mode (${session.hinglishMode}), respond in the same mix
- Bold key numbers: **₹X,XXX**
- For math-heavy responses, use a table
- Lead with the insight/recommendation, then show numbers
${proactiveNudge ? `\n## PROACTIVE NUDGE (optional)\n${proactiveNudge}` : ''}
${session.emiTemptation ? `\n## EMI TEMPTATION DETECTED\nUse the EMI switcher logic based on tenure band and budget signal.` : ''}

## CONVERSATION FLOW
1. If tenure unknown → ask ONE question: "How long do you need it?"
2. If item + price known → show pricing breakdown by tenure band
3. If EMI mentioned → use EMI switcher based on tenure + budget
4. Never ask what you can infer from session state`

    try {
      const reply = await generateChatResponse(systemPrompt, dbStr, message)
      return {
        reply,
        table: listings.length > 0 ? listings.slice(0, 5).map((l: any, i: number) => ({
          '#': i + 1, 'Item': l.title,
          'Rate': '₹' + Number(l.monthly_rent).toLocaleString('en-IN') + '/mo',
          'Deposit': '₹' + Number(l.deposit_amount).toLocaleString('en-IN'),
          'Seller': l.seller_name,
        })) : undefined,
      }
    } catch {
      // fall through to rule-based
    }
  }

  // ─── RULE-BASED FALLBACK ──────────────────────────────────────
  const lower = message.toLowerCase()

  // Hinglish greeting
  if (session.hinglishMode) {
    if (normalized.intent === 'rent') {
      const item = normalized.itemHint || 'item'
      return { reply: `${item} chahiye? Batao kitne mahine ke liye chahiye — usi hisaab se price bataunga.` }
    }
    if (normalized.intent === 'list') {
      return { reply: 'Apna item list karna chahte ho? Batao kaunsa item hai aur kitne ka kharida tha — main suggest karunga kitna rent lena chahiye.' }
    }
  }

  // Buy vs rent
  if ((lower.includes('buy') || lower.includes('purchase')) && (lower.includes('rent') || lower.includes('lease'))) {
    const buyPrice = 120000
    const days = 60
    const rentTotal = 250 * days
    const diff = buyPrice - rentTotal
    return {
      reply: `Buying new = **₹${buyPrice.toLocaleString('en-IN')}**. You need it **${days} days**. Renting = **₹${rentTotal.toLocaleString('en-IN')}** total. You save **₹${diff.toLocaleString('en-IN')}** (${Math.round(diff / buyPrice * 100)}%). For ${days} days usage, renting is the obvious play.`,
      table: [
        { 'Metric': 'Buy Price', 'Value': '₹' + buyPrice.toLocaleString('en-IN') },
        { 'Metric': 'Rent Total', 'Value': '₹' + rentTotal.toLocaleString('en-IN') },
        { 'Metric': 'You Save', 'Value': '₹' + diff.toLocaleString('en-IN') },
      ],
    }
  }

  // Seller pricing advice — check BEFORE listings so seller intent isn't hijacked
  if (normalized.intent === 'list' || session.role === 'seller' || lower.includes('list') || lower.includes('sell') || lower.includes('charge')) {
    const itemValue = 50000
    const dailyRate = Math.round(itemValue * 0.015)
    const deposit = Math.round(itemValue * 0.3)
    return {
      reply: `For **₹${itemValue.toLocaleString('en-IN')}** item: suggest **₹${dailyRate}/day** (~1.5% of value). Deposit **₹${deposit.toLocaleString('en-IN')}**. At 15 days/mo = **₹${(dailyRate * 15).toLocaleString('en-IN')}/mo** passive income. Semester = **₹${(dailyRate * 60).toLocaleString('en-IN')}**. Quick tip: keep pickup radius under 1km for better trust scores.`,
      table: [
        { 'Metric': 'Daily Rate', 'Value': '₹' + dailyRate + '/day' },
        { 'Metric': 'Deposit', 'Value': '₹' + deposit.toLocaleString('en-IN') },
        { 'Metric': 'Monthly (15 days)', 'Value': '₹' + (dailyRate * 15).toLocaleString('en-IN') },
      ],
    }
  }

  // Pricing inquiry (renter-side)
  if (normalized.intent === 'pricing_query' || lower.includes('price') || lower.includes('cost') || lower.includes('rate')) {
    if (!normalized.itemHint) return { reply: 'Kaunse item ki price chahiye? Batao item ka naam aur kitne der ke liye chahiye.' }
    if (!session.tenureMonths) return { reply: `${normalized.itemHint} ke liye price batane se pehle — kitne mahine ke liye chahiye? Usi hisaab se rent change hota hai.` }

    const pricing = computePricing(50000, 'Good', 'Electronics', session.tenureMonths)
    const emiStep = session.emiTemptation ? getEmiSwitcherStep(pricing, session) : null
    return {
      reply: `${normalized.itemHint} ke liye ${session.tenureMonths}mo ka breakdown:
• Lease: **₹${pricing.leaseRent.toLocaleString('en-IN')}/mo** (${pricing.band} band)
• Deposit: **₹${pricing.deposit.toLocaleString('en-IN')}** (refundable)
• Competitor: ₹${Math.round(pricing.competitorTotal / pricing.months).toLocaleString('en-IN')}/mo
• Total rent: ₹${pricing.renterTotal.toLocaleString('en-IN')}
${emiStep ? `\n${emiStep.response}` : ''}`,
    }
  }

  // Live listings available — only for renter intent, not seller
  if (listings.length > 0 && !lower.includes('list') && !lower.includes('sell')) {
    const cheapest = listings.reduce((a: any, b: any) => Number(a.monthly_rent) < Number(b.monthly_rent) ? a : b)
    return {
      reply: `Found **${listings.length} active listings**. Cheapest: **${cheapest.title}** at **₹${Number(cheapest.monthly_rent).toLocaleString('en-IN')}/mo** from **${cheapest.seller_name}**. Want to compare or want pricing advice?`,
      table: listings.map((l: any, i: number) => ({
        '#': i + 1, 'Item': l.title,
        'Rate': '₹' + Number(l.monthly_rent).toLocaleString('en-IN') + '/mo',
        'Deposit': '₹' + Number(l.deposit_amount).toLocaleString('en-IN'),
        'Seller': l.seller_name,
      })),
    }
  }

  // Session-based follow-up (renter)
  if (!session.tenureMonths && session.itemOfInterest && session.role !== 'seller') {
    return { reply: `So you're looking at **${session.itemOfInterest}** — how long do you need it? A few weeks, a semester, or the full year? The price changes a lot based on that.` }
  }

  // Escrow / deposit
  if (lower.includes('deposit') || lower.includes('escrow') || lower.includes('refund') || lower.includes('security')) {
    return { reply: `Security deposits are held in **escrow** — fully protected and locked until both parties sign off on return. Refunds processed within 24 hours after checkout. No one can touch the deposit without your digital sign-off.` }
  }

  // How platform works
  if (lower.includes('how') || lower.includes('help') || lower.includes('guide') || lower.includes('what')) {
    return { reply: `Lease lets you rent or list items within campus. **For renters:** browse items, book for the time you need, pay monthly — no long-term commitment. **For sellers:** list your idle items, earn passive income, deposit protects you. Everything is secured by escrow. What do you want to do — rent something or list something?` }
  }

  // Default
  return { reply: `I'm Lease Guru. I can help with pricing, finding items, or understanding how the platform works. What do you need?` }
}

// ─── IDENTIFY ITEM FROM IMAGE ─────────────────────────────────────
router.post('/identify-item', auth(false), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { image } = req.body
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Base64 image data is required' })
    }

    // Use Gemini vision to identify the item
    if (isGeminiAvailable()) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

      const prompt = `Identify the main item in this image. Return ONLY valid JSON (no markdown):
{
  "itemName": "<best item name for marketplace listing>",
  "category": "Electronics" | "Appliance" | "Furniture" | "Lifestyle" | "Book" | "Other",
  "estimatedRetailPrice": <numeric best guess of new price in INR>,
  "condition": "New" | "Mint" | "Good" | "Fair" | "Poor",
  "specs": ["<key visible feature>", "<another>"],
  "confidence": "high" | "medium" | "low"
}`

      const mimeType = image.startsWith('data:') ? image.split(';')[0].split(':')[1] : 'image/jpeg'
      const base64Data = image.includes('base64,') ? image.split('base64,')[1] : image

      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { data: base64Data, mimeType } },
      ])

      const text = result.response.text()
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return res.json(JSON.parse(jsonMatch[0]))
      }
    }

    return res.json({
      itemName: null, category: 'Other', estimatedRetailPrice: null, condition: 'Good',
      specs: [], confidence: 'low',
    })
  } catch (e) {
    next(e)
  }
})

// ─── CHAT STATUS ──────────────────────────────────────────────────
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    ai: isGeminiAvailable() ? 'gemini-2.5-flash' : 'rule-based',
    geminiConfigured: isGeminiAvailable(),
    sessionCount: sessions.size,
    message: isGeminiAvailable()
      ? 'Gemini 2.5 Flash active — natural responses, Hinglish, tenure-aware pricing'
      : 'Rule-based mode — set GEMINI_API_KEY for AI-powered responses',
  })
})

// ─── CHAT ENDPOINT ────────────────────────────────────────────────
router.post('/', auth(false), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, role } = req.body
    const userId = req.user?.sub || 'anonymous'

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' })
    }

    const session = getSession(userId)
    const lower = message.toLowerCase()

    // Fetch listings for transactional context
    const itemCategory = session.itemOfInterest
    const listings = await fetchTransactionalData(itemCategory).catch(() => [])

    // Generate response
    const { reply, table } = await generateLeaseGuruResponse(message, session, listings, role)

    return res.json({
      reply,
      intent: 'TRANSACTIONAL_SALES',
      entities: { itemCategory: session.itemOfInterest, locationAnchor: session.campus, targetUserId: null },
      table: table || null,
      escalationTicket: null,
      sessionState: {
        role: session.role,
        itemOfInterest: session.itemOfInterest,
        tenure: session.tenureMonths,
        budgetSignal: session.budgetSignal,
        hinglishMode: session.hinglishMode,
      },
      suggestions: getSuggestions(session),
    })
  } catch (e) {
    next(e)
  }
})

export default router
