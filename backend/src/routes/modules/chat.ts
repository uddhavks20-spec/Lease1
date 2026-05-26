import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'
import { generateChatResponse, classifyIntentWithLLM, isGeminiAvailable } from '../../services/gemini'

const router = Router()

// ─── ORCHESTRATOR (Intent Classification) ──────────────────────────
type Intent = 'TRANSACTIONAL_SALES' | 'ESCROW_SUPPORT' | 'INTERFACE_OPS'

interface OrchestrationResult {
  intent: Intent
  entities: {
    itemCategory: string | null
    locationAnchor: string | null
    targetUserId: string | null
  }
  dbQueryRequired: boolean
}

function classifyIntent(message: string, role?: string): OrchestrationResult {
  const lower = message.toLowerCase()

  const entities: OrchestrationResult['entities'] = {
    itemCategory: null,
    locationAnchor: null,
    targetUserId: null,
  }

  // Extract item category
  const categories = ['macbook', 'laptop', 'ac', 'air conditioner', 'sofa', 'chair', 'table', 'drone', 'camera', 'calculator', 'projector', 'speaker', 'bicycle', 'washing machine', 'refrigerator', 'tv', 'fridge', 'bed', 'mattress', 'fan', 'heater', 'geyser', 'car', 'scooter', 'bike']
  for (const cat of categories) {
    if (lower.includes(cat)) {
      entities.itemCategory = cat
      break
    }
  }

  // Extract location (hostel, campus area keywords)
  const locationPatterns = ['hostel', 'block', 'campus', 'near', 'km', 'distance']
  for (const loc of locationPatterns) {
    if (lower.includes(loc)) {
      entities.locationAnchor = loc
      break
    }
  }

  // ─── ORCHESTRATOR RULES ──────────────────────────
  // TRANSACTIONAL_SALES: exploring items, pricing, comparing, listing yields, buy vs rent
  const transactionalKeywords = [
    'compare', 'listing', 'price', 'rent', 'lease', 'buy', 'worth', 'cost',
    'rate', 'deposit', 'cheap', 'expensive', 'value', 'earn', 'income',
    'sell', 'list', 'charge', 'how much', 'available', 'search', 'find',
    'recommend', 'which', 'best', 'deal', 'macbook', 'ac', 'sofa', 'laptop',
    'camera', 'drone', 'inventory', 'yield', 'utilization', 'turnover',
    'passive', 'monthly', 'item', 'product', 'looking for', 'need',
  ]

  // ESCROW_SUPPORT: disputes, deposits, refunds, broken items, verification blocks
  const escrowKeywords = [
    'broken', 'damage', 'dispute', 'refund', 'deposit', 'escrow',
    'return', 'charge', 'penalty', 'late', 'missing', 'stolen',
    'complaint', 'issue', 'problem', 'wrong', 'not working', 'defect',
    'unfair', 'deduct', 'human', 'agent', 'talk', 'speak', 'support',
    'verification', 'kyc', 'reject', 'block', 'appeal', 'ticket',
    'condition', 'wear', 'tear', 'evidence', 'photo', 'video',
  ]

  // INTERFACE_OPS: how-to, navigation, guides
  const interfaceKeywords = [
    'how to', 'how do', 'guide', 'steps', 'instructions', 'walkthrough',
    'tutorial', 'help', 'where', 'dashboard', 'account', 'setting',
    'profile', 'sign up', 'register', 'login', 'logout', 'list item',
    'create listing', 'upload', 'image', 'category', 'city', 'update',
    'change', 'edit', 'delete', 'remove', 'navigation', 'interface',
    'platform', 'ops', 'operation', 'onboard', 'verify', 'campus',
    'handover', 'pickup', 'delivery', 'meet', 'scan', 'code',
    'qr', 'schedule', 'booking', 'reserve', 'contract', 'agreement',
  ]

  let escrowScore = 0
  let salesScore = 0
  let opsScore = 0

  // Check dispute/escrow context - active transaction makes this more likely
  if (lower.includes('active') || lower.includes('my rental') || lower.includes('my order')) {
    escrowScore += 2
  }

  for (const kw of transactionalKeywords) {
    if (lower.includes(kw)) salesScore++
  }
  for (const kw of escrowKeywords) {
    if (lower.includes(kw)) escrowScore++
  }
  for (const kw of interfaceKeywords) {
    if (lower.includes(kw)) opsScore++
  }

  // Role-based bias
  if (role === 'seller' || role === 'wholesaler') {
    salesScore += 2 // sellers usually talk about listings/pricing
  }

  // Determine intent
  let intent: Intent = 'TRANSACTIONAL_SALES'
  if (escrowScore > salesScore && escrowScore >= opsScore) intent = 'ESCROW_SUPPORT'
  else if (opsScore > salesScore && opsScore > escrowScore) intent = 'INTERFACE_OPS'

  // Override for explicit intent signals
  if (lower.includes('dispute') || lower.includes('refund') || lower.includes('complaint')) intent = 'ESCROW_SUPPORT'
  if (lower.startsWith('how ') || lower.startsWith('help') || lower.includes('steps to') || lower.includes('guide me')) intent = 'INTERFACE_OPS'

  return {
    intent,
    entities,
    dbQueryRequired: intent === 'TRANSACTIONAL_SALES' || intent === 'ESCROW_SUPPORT',
  }
}

// ─── DATA FETCHER ────────────────────────────────────────────────────
async function fetchTransactionalData(itemCategory?: string | null) {
  let query = `
    SELECT i.id, i.title, i.description, i.monthly_rent, i.deposit_amount, i.retail_price, i.condition, i.verified_status,
           (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as image_url,
           u.first_name || ' ' || u.last_name as seller_name,
           c.name as city_name
    FROM items i
    JOIN users u ON u.id = i.seller_id
    JOIN cities c ON c.id = i.city_id
    WHERE i.status = 'active' AND i.is_available = true
  `
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
  const deposits = await db.query(
    `SELECT d.id, d.amount, d.status, d.deduction_amount, d.deduction_reason, r.id as rental_id, r.status as rental_status
     FROM deposits d
     JOIN rentals r ON r.id = d.rental_id
     WHERE r.renter_id = $1 OR r.seller_id = $1
     ORDER BY d.created_at DESC LIMIT 5`,
    [userId]
  )
  const disputes = await db.query(
    `SELECT id, type, status, description, created_at
     FROM disputes WHERE raised_by = $1 ORDER BY created_at DESC LIMIT 5`,
    [userId]
  )
  return {
    deposits: deposits.rows,
    disputes: disputes.rows,
    hasActiveDeposits: deposits.rows.some((d: any) => d.status === 'held'),
    openDisputes: disputes.rows.filter((d: any) => d.status === 'open' || d.status === 'under_review'),
  }
}

async function fetchRenterStats(userId: string) {
  const rentals = await db.query(
    `SELECT COUNT(*) as total,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count
     FROM rentals WHERE renter_id = $1`,
    [userId]
  )
  return rentals.rows[0]
}

async function fetchSellerStats(userId: string) {
  const items = await db.query(
    `SELECT COUNT(*) as total_listings,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_listings,
            SUM(CASE WHEN is_available THEN 1 ELSE 0 END) as available
     FROM items WHERE seller_id = $1`,
    [userId]
  )
  return items.rows[0]
}

// ─── SPECIALIST AGENT: SALES & YIELD STRATEGIST ──────────────────
function generateSalesResponse(
  message: string,
  listings: any[],
  entities: OrchestrationResult['entities'],
  role?: string,
  userId?: string,
  sellerStats?: any,
  renterStats?: any,
): { reply: string; table?: any[] } {
  const lower = message.toLowerCase()

  // Buy vs Rent calculation
  if ((lower.includes('buy') || lower.includes('purchase')) && (lower.includes('rent') || lower.includes('lease'))) {
    const buyPrice = 120000
    const dailyRate = 250
    const days = 60
    const rentTotal = dailyRate * days
    const diff = buyPrice - rentTotal
    const percent = Math.round((diff / buyPrice) * 100)
    return {
      reply: `Buying new = **₹${buyPrice.toLocaleString('en-IN')}**. You need it **${days} days**. Renting = **₹${rentTotal.toLocaleString('en-IN')}** total. That's **₹${diff.toLocaleString('en-IN')}** still in your pocket — for literally the same outcome. At ${days} days of usage, renting is the obvious play. You save **${percent}%** with zero headache. If you were gonna use it for 8+ months, buying secondhand starts to make sense — but for ${days} days? Rent it and move on.`,
      table: [
        { 'Metric': 'Buy Price', 'Value': '₹' + buyPrice.toLocaleString('en-IN') },
        { 'Metric': 'Rent Total (' + days + ' days)', 'Value': '₹' + rentTotal.toLocaleString('en-IN') },
        { 'Metric': 'You Save by Renting', 'Value': '₹' + diff.toLocaleString('en-IN') },
        { 'Metric': 'Savings %', 'Value': percent + '%' },
      ],
    }
  }

  // Seller / Wholesaler pricing advice
  if (role === 'seller' || role === 'wholesaler' || lower.includes('seller') || lower.includes('list') || lower.includes('charge') || lower.includes('price')) {
    if (role === 'wholesaler' || lower.includes('wholesale') || lower.includes('volume') || lower.includes('inventory') || lower.includes('turnover')) {
      const itemValue = 50000
      const dailyRate = Math.round(itemValue * 0.015)
      const monthly = dailyRate * 15
      return {
        reply: `For a **₹${itemValue.toLocaleString('en-IN')}** item, your suggested daily wholesale rate is **₹${dailyRate}/day**. At 50% utilization (15 days/month), that's **₹${monthly.toLocaleString('en-IN')}/month**. Pro tip: adjusting your rate down by just 8% can push utilization to 90%+ — yielding higher predictable monthly cash flow than sitting on idle inventory at a higher price. Volume > margin in this market.`,
        table: [
          { 'Metric': 'Suggested Daily Rate', 'Value': '₹' + dailyRate + '/day' },
          { 'Metric': 'Est. Monthly (15 days)', 'Value': '₹' + monthly.toLocaleString('en-IN') },
          { 'Metric': 'Strategy', 'Value': 'Volume > Margin' },
        ],
      }
    }
    // Individual seller
    const itemValue = 50000
    const dailyRate = Math.round(itemValue * 0.015)
    const deposit = Math.round(itemValue * 0.3)
    const monthly = dailyRate * 15
    const semester = dailyRate * 60
    return {
      reply: `For an item worth around **₹${itemValue.toLocaleString('en-IN')}**, here's what I'd recommend:\n\n**Rate:** ₹${dailyRate}/day (that's ~1.5% of item value — standard for the platform)\n**Deposit:** ₹${deposit.toLocaleString('en-IN')} (covers you without scaring renters off)\n\nAt ₹${dailyRate}/day, even 15 rental days/month = **₹${monthly.toLocaleString('en-IN')}/month** in passive income. Over a semester that's **₹${semester.toLocaleString('en-IN')}**. An asset unlisted is a daily financial loss.\n\nQuick tip: keep your pickup radius small (under 1km) — builds trust, better reviews, higher rating over time.`,
      table: [
        { 'Metric': 'Suggested Daily Rate', 'Value': '₹' + dailyRate + '/day' },
        { 'Metric': 'Security Deposit', 'Value': '₹' + deposit.toLocaleString('en-IN') },
        { 'Metric': 'Est. Monthly Income', 'Value': '₹' + monthly.toLocaleString('en-IN') },
        { 'Metric': 'Est. Semester Income', 'Value': '₹' + semester.toLocaleString('en-IN') },
      ],
    }
  }

  // Live listings available — show actual data
  if (listings.length > 0) {
    const table = listings.map((l: any, i: number) => ({
      '#': i + 1,
      'Item': l.title,
      'Rate': '₹' + Number(l.monthly_rent).toLocaleString('en-IN') + '/mo',
      'Deposit': '₹' + Number(l.deposit_amount).toLocaleString('en-IN'),
      'Seller': l.seller_name,
      'Location': l.city_name || 'Campus',
    }))

    const best = listings[0]
    const cheapest = listings.reduce((a: any, b: any) => Number(a.monthly_rent) < Number(b.monthly_rent) ? a : b)
    const msg = listings.length === 1
      ? `Found **${listings[0].title}** at **₹${Number(listings[0].monthly_rent).toLocaleString('en-IN')}/month** with a deposit of **₹${Number(listings[0].deposit_amount).toLocaleString('en-IN')}**. Here's the cash-flow advantage: buying this new costs roughly ₹${Number(best.retail_price || best.monthly_rent * 12).toLocaleString('en-IN')}. By renting it for the time you actually need, your total layout is only the monthly rent. You keep the rest of your cash completely liquid while dodging the long-term depreciation curve.`
      : `Found **${listings.length} active listings** matching your search. The cheapest option is **${cheapest.title}** at **₹${Number(cheapest.monthly_rent).toLocaleString('en-IN')}/month** from **${cheapest.seller_name}** in **${cheapest.city_name || 'Campus'}**. Scroll the table for the full breakdown.`

    return { reply: msg, table }
  }

  // Wholesaler stats context
  if (role === 'wholesaler') {
    return {
      reply: `As a wholesaler, your focus should be on volume and turnover. Holding onto rigid prices while inventory sits idle degrades your ROI. Adjust your daily rate to hit 90%+ utilization. Want me to help price a specific product?`,
    }
  }

  // Seller stats context
  if (role === 'seller' && sellerStats) {
    return {
      reply: `You have **${sellerStats.active_listings} active listings** out of **${sellerStats.total_listings} total**. ${sellerStats.available > 0 ? `${sellerStats.available} items are available for rent right now.` : 'List more items to start earning passive income!'} Tell me an item you want to list and its value, and I'll suggest optimal pricing.`,
    }
  }

  // No listings found
  return {
    reply: `I couldn't find any active listings matching that right now. Want to try a different search term, or would you like me to help you figure out buy-vs-rent math for a specific item?`,
  }
}

// ─── SPECIALIST AGENT: ESCROW & DISPUTE ARBITRATOR ───────────────
function generateSupportResponse(message: string, escrowData?: any, userId?: string): { reply: string; ticket?: string } {
  const lower = message.toLowerCase()

  // Escrow explanation
  if (lower.includes('how') && (lower.includes('escrow') || lower.includes('deposit') || lower.includes('safe') || lower.includes('trust') || lower.includes('protect'))) {
    return {
      reply: "Lease holds all security deposits inside a secure, neutral escrow account. These funds are completely locked and cannot be accessed by the owner until both parties digitally sign off on a frictionless checkout. This setup ensures protection against unfair deductions or missing gear. Both sides stay protected throughout the rental period.",
    }
  }

  // Deposit refund
  if (lower.includes('refund') || lower.includes('deposit back') || lower.includes('return deposit') || lower.includes('release')) {
    if (escrowData?.hasActiveDeposits) {
      const d = escrowData.deposits.find((d: any) => d.status === 'held')
      return {
        reply: `You have an active deposit of **₹${Number(d?.amount || 0).toLocaleString('en-IN')}** (Rental #${d?.rental_id?.slice(0, 8)}). Deposits are released within 24 hours after both parties sign off on return. If you believe there's an unfair hold, upload a timestamped image or short video directly into this chat and I'll flag it for review.`,
      }
    }
    return {
      reply: "I don't see any active deposits in your account currently. Refunds are processed automatically within 24 hours after the item is returned and both parties confirm checkout. If you have a specific rental in mind, tell me the rental ID and I'll check the status.",
    }
  }

  // Dispute / damage
  if (lower.includes('broken') || lower.includes('damage') || lower.includes('dispute') || lower.includes('not working') || lower.includes('defect') || lower.includes('issue') || lower.includes('problem')) {
    const ticketId = 'TKT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
    return {
      reply: `I understand you're having an issue. Here's what to do:\n\n1. Take a **timestamped photo or short video** showing the issue clearly\n2. Upload it directly to this chat\n3. Our vision validation system cross-checks against baseline condition photos from initial handover\n\nI've generated a **support ticket (${ticketId})** for your case. A human admin will review within 24 hours.\n\n> ⚠️ Please note: I cannot issue refunds, override penalties, or lift security holds directly — only a platform administrator can authorize those actions.`,
      ticket: JSON.stringify({
        ticketId,
        userId,
        problemDescription: message,
        timestamp: new Date().toISOString(),
      }),
    }
  }

  // Verification blocks
  if (lower.includes('verification') || lower.includes('kyc') || lower.includes('reject') || lower.includes('pending')) {
    return {
      reply: "Verifications are typically processed within 24-48 hours. If yours is stuck on 'pending', it may need additional documentation. Check your KYC dashboard to ensure all required documents (Aadhaar, PAN, College ID) are uploaded clearly. If you've been waiting more than 48 hours, I can escalate this to an admin.",
    }
  }

  // Ticket / human escalation
  if (lower.includes('human') || lower.includes('talk') || lower.includes('speak') || lower.includes('agent') || lower.includes('admin') || lower.includes('escalate')) {
    const ticketId = 'TKT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase()
    return {
      reply: `I understand you need to speak with a human. I've generated **ticket ${ticketId}** and routed it to our admin team. They'll reach out to you at the email on your account within **24 hours**.\n\nFor faster assistance, you can also contact directly:\n📧 kishanuddhav2004@gmail.com\n📞 +91 9336185009`,
      ticket: JSON.stringify({
        ticketId,
        userId,
        type: 'human_escalation',
        problemDescription: message,
        timestamp: new Date().toISOString(),
      }),
    }
  }

  // General fallback
  return {
    reply: "I'm here to help with any deposit, dispute, or platform safety concerns. Security deposits are held in escrow and fully protected. If you're experiencing an issue, please describe what happened and I'll guide you through the next steps. If you need immediate human support, just say 'talk to agent'.",
  }
}

// ─── SPECIALIST AGENT: INTERFACE & OPS GUIDE ─────────────────────
function generateOpsResponse(message: string): { reply: string; sections?: { title: string; steps: string[] }[] } {
  const lower = message.toLowerCase()

  // How to list an item
  if (lower.includes('list') || lower.includes('sell') || (lower.includes('create') && lower.includes('listing'))) {
    return {
      reply: "**How to Create a Listing**\n\nHere's a step-by-step guide:\n\n1. Open your **Account Dashboard** and click **'List Item'**\n2. Upload at least **1 high-quality photo** (front view) — you can add up to 4 views\n3. Set a **clear daily or monthly rental price**. Need help pricing? Ask me!\n4. Define the **required security deposit** (typically 20-40% of item value)\n5. Confirm your **local pickup campus radius**\n\nOnce submitted, your listing goes to admin verification. In test mode, it's approved instantly.",
      sections: [
        { title: 'Quick Tips', steps: [
          'Use well-lit photos showing the item from multiple angles',
          'Set a competitive rate — check similar items in your area',
          'Keep your pickup radius under 1km for better trust scores',
        ]},
      ],
    }
  }

  // How platform works
  if (lower.includes('platform') || lower.includes('how it works') || lower.includes('how does') || (lower.includes('what') && lower.includes('lease'))) {
    return {
      reply: "**How Lease Works**\n\nHere's the workflow in 4 simple steps:\n\n1. **Student Verification** — Verify your active campus credentials to join the trusted network\n2. **Safe Booking** — Reserve items locally and keep your deposit protected in escrow\n3. **Simple Handover** — Meet up on campus, review the item's condition, and scan the handover code\n4. **Easy Return** — Return the item when your booking ends to trigger your instant deposit refund\n\nIt's that simple. No paperwork, no long-term commitment.",
    }
  }

  // Account / Profile
  if (lower.includes('account') || lower.includes('profile') || lower.includes('setting') || lower.includes('update') || lower.includes('edit')) {
    return {
      reply: "**Managing Your Account**\n\nTo update your profile or settings:\n\n- **Edit Profile:** Go to your Dashboard → Click your name/avatar → Edit profile\n- **Change Password:** Settings → Security → Update password\n- **Update KYC:** Settings → Verification → Upload documents\n- **View Your Listings:** Dashboard → My Items\n- **View Your Rentals:** Dashboard → My Rentals\n\nIf you're having trouble with any specific setting, let me know which one!",
    }
  }

  // Signup / Registration
  if (lower.includes('sign up') || lower.includes('register') || lower.includes('create account') || lower.includes('join')) {
    return {
      reply: "**Creating an Account**\n\n1. Go to the Login page and click **'Sign Up'**\n2. Enter your **email**, **password**, **first name**, and **last name**\n3. Select your **role**: Renter, Seller, or Wholesaler\n4. Complete your **KYC verification** (Aadhaar, PAN, College ID)\n5. You're in! Start browsing or listing items immediately.\n\nNeed help with a specific step? Just ask!",
    }
  }

  // Handover / Return process
  if (lower.includes('handover') || lower.includes('return') || lower.includes('pickup') || lower.includes('delivery') || lower.includes('meet')) {
    return {
      reply: "**Handover & Return Process**\n\n**At Pickup:**\n1. Meet the seller at the agreed campus location\n2. Inspect the item's condition together\n3. The seller scans the handover QR code from their dashboard\n4. You'll both receive a confirmation notification\n\n**At Return:**\n1. Meet at the same location (or agreed spot)\n2. Both parties inspect the item for damage\n3. The seller marks the rental as returned\n4. Your deposit is refunded within 24 hours\n\nBoth parties must digitally sign off. This protects everyone.",
    }
  }

  // Categories / Browse
  if (lower.includes('browse') || lower.includes('search') || lower.includes('find') || lower.includes('category') || lower.includes('filter')) {
    return {
      reply: "**Browsing Items on Lease**\n\n1. Go to the **Browse** page from the navigation bar\n2. Use the search bar to find specific items\n3. **Filter by:**\n   - Category (electronics, furniture, appliances, etc.)\n   - City/location\n   - Price range (min/max rent)\n   - Sort by: newest, price (low-high), price (high-low), popular\n\nEach listing shows the monthly rent, security deposit, seller info, and verification status. Click any item for full details and images.",
    }
  }

  // General help
  return {
    reply: "**I'm your Lease Operations Guide.** I can help you with:\n\n- **How to list an item** — Step-by-step listing creation guide\n- **How the platform works** — Overview of the lease workflow\n- **Managing your account** — Profile settings, KYC, password\n- **Creating an account** — Registration walkthrough\n- **Handover & return process** — Pickup and return instructions\n- **Browsing & searching** — Finding items with filters\n\nWhat would you like to learn about?",
  }
}

// ─── CHAT ENDPOINT ───────────────────────────────────────────────────
// ─── STATUS ENDPOINT ───────────────────────────────────────────────
router.get('/status', (_req: Request, res: Response) => {
  res.json({
    ai: isGeminiAvailable() ? 'gemini-1.5-flash' : 'rule-based',
    geminiConfigured: isGeminiAvailable(),
    message: isGeminiAvailable()
      ? 'Gemini 1.5 Flash is active — natural responses + vision analysis enabled'
      : 'Rule-based mode — set GEMINI_API_KEY for AI-powered responses',
  })
})

router.post('/', auth(false), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, role, activeTxId } = req.body
    const userId = req.user?.sub || 'anonymous'

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' })
    }

    // STEP 1: Orchestrator classifies intent
    let orchestration: OrchestrationResult
    if (isGeminiAvailable()) {
      try {
        const llmOrch = await classifyIntentWithLLM(message, role)
        orchestration = {
          intent: llmOrch.target_routing,
          entities: {
            itemCategory: llmOrch.entities_extracted.item_category,
            locationAnchor: llmOrch.entities_extracted.location_anchor,
            targetUserId: llmOrch.entities_extracted.target_user_id,
          },
          dbQueryRequired: true,
        }
      } catch {
        orchestration = classifyIntent(message, role)
      }
    } else {
      orchestration = classifyIntent(message, role)
    }

    // STEP 2: Fetch real data based on routing
    let dbContext: any = {}
    let specialistResponse: { reply: string; table?: any[]; ticket?: string } = { reply: '' }

    if (orchestration.intent === 'TRANSACTIONAL_SALES') {
      const [listings, sellerStats, renterStats] = await Promise.all([
        fetchTransactionalData(orchestration.entities.itemCategory),
        userId !== 'anonymous' ? fetchSellerStats(userId).catch(() => null) : null,
        userId !== 'anonymous' ? fetchRenterStats(userId).catch(() => null) : null,
      ])
      dbContext = { listings, sellerStats, renterStats }

      if (isGeminiAvailable()) {
        const dbStr = `Listings: ${JSON.stringify(listings)}\nSellerStats: ${JSON.stringify(sellerStats)}\nRenterStats: ${JSON.stringify(renterStats)}`
        const systemPrompt = `You are a sharp, analytical marketplace sales strategist for Lease. Your objective is to drive transaction velocity.
- NEVER invent listings or prices. Use ONLY the attached database context.
- If no matching listings exist, politely say so and offer a waitlist.
- For renters: highlight cash-flow advantage of renting vs buying. Use real numbers.
- For owners: frame idle items as losing money daily.
- For wholesalers: focus on volume metrics and utilization.
- Use bold for numbers: **₹X,XXX**
- Be concise (2-4 sentences). End with a question to keep conversation going.`
        const reply = await generateChatResponse(systemPrompt, dbStr, message)
        specialistResponse = { reply, table: listings.length > 0 ? listings.slice(0, 5).map((l: any, i: number) => ({
          '#': i + 1, 'Item': l.title, 'Rate': '₹' + Number(l.monthly_rent).toLocaleString('en-IN') + '/mo',
          'Deposit': '₹' + Number(l.deposit_amount).toLocaleString('en-IN'), 'Seller': l.seller_name,
        })) : undefined }
      } else {
        specialistResponse = generateSalesResponse(message, listings, orchestration.entities, role, userId, sellerStats, renterStats)
      }

    } else if (orchestration.intent === 'ESCROW_SUPPORT') {
      const escrowData = userId !== 'anonymous' ? await fetchEscrowData(userId).catch(() => null) : null
      dbContext = { escrowData }

      if (isGeminiAvailable()) {
        const dbStr = `EscrowData: ${JSON.stringify(escrowData)}`
        const systemPrompt = `You are a calm, analytical escrow and dispute specialist for Lease.
- Security deposits are held in escrow, fully locked until both parties sign off.
- You cannot issue refunds, override penalties, or lift holds directly.
- If a dispute can't be resolved, generate a ticket ID and route to human admin.
- Be transparent, professional, and grounded in platform rules.
- Use bold for key numbers. Be concise.`
        const reply = await generateChatResponse(systemPrompt, dbStr, message)
        specialistResponse = { reply }
      } else {
        specialistResponse = generateSupportResponse(message, escrowData, userId)
      }

    } else {
      if (isGeminiAvailable()) {
        const systemPrompt = `You are the Lease product operations guide. Transform operational processes into scannable step-by-step instructions.
- Use bullet points and numbered lists.
- Cover: platform workflow, creating listings, account management, handover/return process.
- Be friendly and clear. Never dump walls of prose.`
        const reply = await generateChatResponse(systemPrompt, '[SYSTEM NOTE]: Provide structural navigation guides only.', message)
        specialistResponse = { reply }
      } else {
        specialistResponse = generateOpsResponse(message)
      }
    }

    // STEP 3: Return structured response
    return res.json({
      reply: specialistResponse.reply,
      intent: orchestration.intent,
      entities: orchestration.entities,
      table: specialistResponse.table || null,
      escalationTicket: specialistResponse.ticket || null,
    })

  } catch (e) {
    next(e)
  }
})

export default router
