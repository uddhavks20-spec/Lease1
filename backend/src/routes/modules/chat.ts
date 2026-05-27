import { Router, type Request, type Response, type NextFunction } from 'express'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'
import { generateChatResponse, isGeminiAvailable } from '../../services/gemini'

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
  conversationHistory: { role: 'user' | 'assistant'; text: string }[]
}

const sessions = new Map<string, SessionState>()

function getSession(userId: string): SessionState {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      role: null, itemOfInterest: null, tenureMonths: null,
      budgetSignal: null, campus: null, urgency: null,
      emiTemptation: false, hinglishMode: false,
      messagesInSession: 0, unresolvedQuestions: [],
      monthsAlreadyPaid: 0, suggestionPath: [], conversationHistory: [],
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

// ─── GENERATE LEASE GURU RESPONSE ────────────────────────────────
async function generateLeaseGuruResponse(
  message: string,
  session: SessionState,
  listings: any[],
  userRole?: string,
): Promise<{ reply: string; table?: any[] }> {
  const normalized = normalizeHinglish(message)
  updateSession(session, message, normalized)

  // Try Gemini first
  if (isGeminiAvailable()) {
    const tenureInfo = session.tenureMonths
      ? computePricing(50000, 'Good', 'Electronics', session.tenureMonths)
      : null

    // Build conversation history text (last 6 exchanges)
    const historyText = session.conversationHistory.slice(-6).map(ex =>
      ex.role === 'user' ? `User: ${ex.text}` : `Lease Guru: ${ex.text}`
    ).join('\n')

    const pricingContext = tenureInfo
      ? `User tenure: ${session.tenureMonths}mo (${tenureInfo.band} band)
  Lease rent: ₹${tenureInfo.leaseRent.toLocaleString('en-IN')}/mo
  Deposit: ₹${tenureInfo.deposit.toLocaleString('en-IN')}
  Competitor: ₹${Math.round(tenureInfo.competitorTotal / session.tenureMonths!).toLocaleString('en-IN')}/mo
  EMI (${getTenureBand(session.tenureMonths!).emiHorizon}mo): ₹${Math.round(tenureInfo.emiTotal / getTenureBand(session.tenureMonths!).emiHorizon).toLocaleString('en-IN')}/mo`
      : 'Tenure not yet established'

    const systemPrompt = `You are Lease Guru, the conversational AI for Lease — a peer-to-peer student rental marketplace.

You are the financially sharp friend in the hostel who always knows the smarter move. You speak naturally, use student slang naturally, and never sound like a customer support bot. You think in ROI and value.

## Your knowledge
- You know everything about the Lease platform: renting items, listing items, pricing, deposits, escrow, EMI vs rent decisions, tenure bands, and competitor pricing.
- You have access to live Google Search for current competitor rates, EMI plans, and product prices.
- You can calculate pricing, compare rent vs EMI, and suggest optimal pricing for sellers.
- If the user speaks in Hinglish, respond in the same natural mix.

## Current session context
- Session state: ${JSON.stringify(session, null, 2)}
- Recent conversation (last few exchanges):
${historyText || '  (new conversation)'}

## Pricing context
${pricingContext}

## Available listings from DB
${listings.length > 0 ? JSON.stringify(listings.slice(0, 3).map(l => ({ title: l.title, rent: l.monthly_rent, deposit: l.deposit_amount, seller: l.seller_name }))) : 'No matching listings found'}

## Guidelines
- Be concise and direct. Students have short attention spans.
- Use **bold** for key numbers (₹ amounts, months, percentages).
- If showing numbers, a short table is better than a paragraph.
- Never invent policies or prices. Use the session context and pricing info above.
- If you don't know something, say so — don't make it up.`

    try {
      const reply = await generateChatResponse(systemPrompt, '', message)
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
      // Gemini failed — minimal fallback, no templates
      return { reply: 'Sorry, my brain is buffering. Can you say that again?' }
    }
  }

  // No API key — dead simple fallback
  return { reply: 'Hi! My AI brain isn\'t connected right now (GEMINI_API_KEY not set). Ask about pricing, listings, or how the platform works.' }
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

    // Fetch listings for transactional context
    const itemCategory = session.itemOfInterest
    const listings = await fetchTransactionalData(itemCategory).catch(() => [])

    // Generate response
    const { reply, table } = await generateLeaseGuruResponse(message, session, listings, role)

    // Save to conversation history (keep last 10 exchanges)
    session.conversationHistory.push({ role: 'user', text: message })
    session.conversationHistory.push({ role: 'assistant', text: reply })
    if (session.conversationHistory.length > 20) {
      session.conversationHistory = session.conversationHistory.slice(-20)
    }

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
