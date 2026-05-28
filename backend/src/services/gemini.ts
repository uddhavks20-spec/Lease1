import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = process.env.GEMINI_API_KEY
const MODEL_PREFERRED = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
const MODEL_FALLBACK = 'gemini-2.0-flash'

function getClient() {
  if (!API_KEY) throw new Error('GEMINI_API_KEY not set')
  return new GoogleGenerativeAI(API_KEY)
}

async function generateWithFallback(contents: any[]): Promise<any> {
  const models = [MODEL_PREFERRED, MODEL_FALLBACK]
  const seen = new Set<string>()
  for (const modelName of models) {
    if (seen.has(modelName)) continue
    seen.add(modelName)
    try {
      const genAI = getClient()
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent(contents)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[Gemini] model "${modelName}" failed: ${msg}`)
    }
  }
  throw new Error(`Gemini unavailable — tried ${[...seen].join(', ')}`)
}

// ─── TEXT GENERATION (for chatbot specialist agents) ──────────────
export async function generateChatResponse(
  systemPrompt: string,
  dbContext: string,
  userMessage: string,
): Promise<string> {
  if (!API_KEY) {
    return `[MOCK] System: ${systemPrompt.slice(0, 80)}... | Context: ${dbContext.slice(0, 80)}... | User: ${userMessage}`
  }

  const result = await generateWithFallback([
    { text: `${systemPrompt}\n\n${dbContext}\n\nUser message: ${userMessage}` },
  ])

  return result.response.text()
}

// ─── VISION ANALYSIS (for damage detection pipeline) ──────────────
interface VisionAnalysisResult {
  integrity_valid: boolean
  match_verified: boolean
  anomaly_detected: boolean
  damage_vector: {
    classification: string
    pixel_coordinates: [number, number, number, number] | null
    severity_score: number
  }
}

export async function analyzeImages(
  checkoutImages: string[],
  checkinImages: string[],
): Promise<VisionAnalysisResult> {
  if (!API_KEY || checkoutImages.length === 0 || checkinImages.length === 0) {
    return {
      integrity_valid: true,
      match_verified: true,
      anomaly_detected: false,
      damage_vector: { classification: 'NONE', pixel_coordinates: null, severity_score: 0 },
    }
  }

  const prompt = `You are a production vision analytics engine for a rental marketplace.
Compare the CHECKOUT (handover baseline) images against the CHECKIN (return) images.
Follow this strict pipeline:
1. IMAGE_INTEGRITY_CHECK: Verify image clarity
2. OBJECT_ALIGNMENT: Confirm same item
3. EXCLUSION_FILTER: Ignore expected micro wear-and-tear (fingerprints, light dust)
4. SURFACE_ANOMALIES: Scan for cracks, deep abrasions, punctures
5. MATERIAL_REMOVAL: Check missing parts (caps, covers, attachments)
6. STATE_SHIFTS: Check bent ports, split cables, cracked displays

Return ONLY valid JSON (no markdown, no code fences):
{
  "integrity_valid": true/false,
  "match_verified": true/false,
  "anomaly_detected": true/false,
  "damage_vector": {
    "classification": "SCREEN_CRACK" | "HOUSING_DENT" | "MISSING_COMPONENT" | "SURFACE_ABRASION" | "NONE",
    "pixel_coordinates": [x1, y1, x2, y2] or null,
    "severity_score": 0.00 to 1.00
  }
}`

  const imageParts = [
    ...checkoutImages.map(url => ({ inlineData: { data: url.split(',')[1] || '', mimeType: 'image/jpeg' } })),
    ...checkinImages.map(url => ({ inlineData: { data: url.split(',')[1] || '', mimeType: 'image/jpeg' } })),
  ]

  const result = await generateWithFallback([
    { text: prompt },
    { text: `Checkout baseline count: ${checkoutImages.length}, Return images count: ${checkinImages.length}` },
    ...imageParts,
  ])

  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0])
  }

  return {
    integrity_valid: true,
    match_verified: true,
    anomaly_detected: false,
    damage_vector: { classification: 'NONE', pixel_coordinates: null, severity_score: 0 },
  }
}

// ─── INTENT CLASSIFICATION (for orchestrator) ────────────────────
export async function classifyIntentWithLLM(userMessage: string, role?: string): Promise<{
  target_routing: 'TRANSACTIONAL_SALES' | 'ESCROW_SUPPORT' | 'INTERFACE_OPS'
  entities_extracted: { item_category: string | null; location_anchor: string | null; target_user_id: string | null }
}> {
  if (!API_KEY) {
    return {
      target_routing: 'TRANSACTIONAL_SALES',
      entities_extracted: { item_category: null, location_anchor: null, target_user_id: null },
    }
  }

  const result = await generateWithFallback([
    {
      text: `You are the Lease orchestrator router. Classify this user message into exactly one segment.
Return ONLY valid JSON:
{
  "target_routing": "TRANSACTIONAL_SALES" | "ESCROW_SUPPORT" | "INTERFACE_OPS",
  "entities_extracted": {
    "item_category": string | null,
    "location_anchor": string | null,
    "target_user_id": string | null
  }
}

Rules:
- TRANSACTIONAL_SALES: exploring items, pricing, comparing, buy-vs-rent, listing yields
- ESCROW_SUPPORT: broken items, disputes, deposits, refunds, verification blocks, human agent
- INTERFACE_OPS: how-to guides, navigation, onboarding, platform instructions

User role: ${role || 'unknown'}
Message: ${userMessage}`,
    },
  ])

  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) return JSON.parse(jsonMatch[0])

  return {
    target_routing: 'TRANSACTIONAL_SALES',
    entities_extracted: { item_category: null, location_anchor: null, target_user_id: null },
  }
}

// ─── GEMINI-POWERED ITEM PRICING (for chatbot) ────────────────────
interface GeminiItemPricing {
  leaseRent: number
  deposit: number
  competitorRent: number
  savingsPerMonth: number
  reasoning: string
}

export async function generateGeminiPricing(
  itemName: string,
  retailPrice: number,
  condition: string,
  category: string,
  specs: string,
  tenureMonths: number,
): Promise<GeminiItemPricing> {
  if (!API_KEY) {
    return {
      leaseRent: 0, deposit: 0, competitorRent: 0,
      savingsPerMonth: 0, reasoning: 'AI not connected',
    }
  }

  const prompt = `You are a pricing analyst for Lease, a P2P rental marketplace in India.
Given an item, its retail price, condition, category, specifications, and rental tenure,
estimate realistic monthly rent, deposit, and competitor price.

Item: ${itemName}
Retail Price: ₹${retailPrice}
Condition: ${condition} (New/Mint/Good/Fair/Poor)
Category: ${category}
Specifications: ${specs || 'Not specified'}
Tenure: ${tenureMonths} months

Return ONLY valid JSON (no markdown, no code fences):
{
  "leaseRent": <realistic monthly rent on Lease, in ₹>,
  "deposit": <refundable deposit, typically 15-35% of retail price depending on tenure, in ₹>,
  "competitorRent": <what RentoMojo/Furlenco would charge monthly for same item+tenure, in ₹>,
  "reasoning": "<1 sentence explaining the pricing logic>"
}

Rules:
- The rent must be LOWER than competitorRent (Lease undercuts competitors)
- But not too low — keep within 5-35% cheaper depending on tenure band
- Consider: item age, condition, brand value, category-specific depreciation
- Electronics lose value faster than furniture; books are cheapest
- For short tenures (1-3mo), monthly rent is higher; for long tenures (12+mo), it's lower
- Deposit should NOT exceed 35% of retail price
- Be realistic about the Indian student rental market
- If condition is Poor, reduce rent by ~15-25% vs Good
- If condition is New or Mint, rent can be ~5-15% higher than Good (item is more valuable)
- If category is Books, rent should be very low (₹50-500/mo range)
- If category is Electronics (laptops, phones), rent is typically 3-6% of retail per month
- For Furniture (sofa, bed), rent is typically 2-4% of retail per month
`

  const result = await generateWithFallback([{ text: prompt }])
  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    const data = JSON.parse(jsonMatch[0])
    return {
      leaseRent: Math.round(data.leaseRent || 0),
      deposit: Math.round(data.deposit || 0),
      competitorRent: Math.round(data.competitorRent || 0),
      savingsPerMonth: Math.round((data.competitorRent || 0) - (data.leaseRent || 0)),
      reasoning: data.reasoning || 'Based on market data',
    }
  }

  return {
    leaseRent: 0, deposit: 0, competitorRent: 0,
    savingsPerMonth: 0, reasoning: 'Pricing engine unavailable',
  }
}

const EMI_ANNUAL_RATE = 0.15
const FINAL_UNDERCUT = 0.065

function calcEmiMonthly(mrv: number, months: number): number {
  const n = Math.max(3, Math.min(48, months))
  const totalPayable = mrv + mrv * EMI_ANNUAL_RATE * n / 12
  return Math.round(totalPayable / n)
}

// ─── PRICING RESEARCH (for seller pricing engine) ────────────────
export async function generatePricingResearch(
  title: string,
  originalPrice: number,
  sellerType: string,
  category: string,
  tenureMonths?: number,
): Promise<{
  suggestedRent: number
  competitorRentRange: { low: number; high: number }
  emiOptions: Record<string, number>
  conditionAdjustment: number
  marketSummary: string
}> {
  if (!API_KEY) {
    throw new Error('GEMINI_API_KEY not set')
  }

  const mo = Math.max(3, Math.min(48, tenureMonths || 3))
  const isB2B2C = false

  const prompt = `You are a pricing analyst for a P2P rental marketplace in India.
  
Product: "${title}" | Retail Price: ₹${originalPrice} | Category: ${category}
Duration: ${mo} months

Return ONLY valid JSON (no markdown, no code fences):
{
  "competitorRentRange": { "low": <lowest competitor monthly rent for exactly ${mo}mo duration from RentoMojo/Furlenco/OLX>, "high": <highest competitor monthly for ${mo}mo> },
  "marketSummary": "<1-2 sentence Indian market insight>"
}

Rules:
- Competitor monthly = what RentoMojo/Furlenco charge for a ${mo}mo rental of this item divided by ${mo}
- Include platform fees, delivery/setup charges in competitor total
- OLX/Cashify resell data can inform the upper bound`

  const result = await generateWithFallback([{ text: prompt }])
  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    const data = JSON.parse(jsonMatch[0])

    const compRate = 0.06
    const compMonthly = data.competitorRentRange?.low || Math.round(originalPrice * compRate)

    return {
      suggestedRent: 0, // pricing.ts computes the final rent
      competitorRentRange: data.competitorRentRange || { low: compMonthly, high: Math.round(compMonthly * 1.2) },
      emiOptions: {},
      conditionAdjustment: 0,
      marketSummary: data.marketSummary || `${mo}mo: Competitor ~₹${compMonthly.toLocaleString('en-IN')}/mo.`,
    }
  }

  throw new Error('Failed to parse Gemini pricing response')
}

// ─── RESELL VALUE ESTIMATION (for seller pricing engine) ──────────
export async function estimateResellValue(
  title: string,
  originalPrice: number,
  condition: string,
  category: string,
  attributes: Record<string, string>,
): Promise<{ estimatedResellValue: number; confidence: 'high' | 'medium' | 'low'; reasoning: string }> {
  // Category-specific depreciation base rates (at Good condition)
  const CATEGORY_DEPRECIATION: Record<string, number> = {
    Electronics: 0.55, Appliance: 0.50, Furniture: 0.40,
    Lifestyle: 0.45, Books: 0.20, Cycle: 0.50, General: 0.50,
  }
  const CONDITION_ADJ: Record<string, number> = {
    'New': 1.30, 'Mint': 1.15, 'Good': 1.00, 'Fair': 0.80, 'Poor': 0.55,
  }
  const baseDep = CATEGORY_DEPRECIATION[category] || 0.50
  const condAdj = CONDITION_ADJ[condition] || 1.00
  const fallbackValue = Math.round(originalPrice * baseDep * condAdj)

  if (!API_KEY) {
    return {
      estimatedResellValue: fallbackValue,
      confidence: 'low',
      reasoning: `AI not available — ${category} base + ${condition} adjustment`,
    }
  }

  const specsText = Object.entries(attributes)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')

  const prompt = `You are a second-hand marketplace valuation expert for India (OLX, Cashify, Quikr).

Product: "${title}"
Original Price: ₹${originalPrice}
Condition: ${condition}
Category: ${category}
Specifications: ${specsText || 'Not specified'}

Return ONLY valid JSON (no markdown, no code fences):
{
  "estimatedResellValue": <what this item would realistically sell for on OLX/Cashify in its current condition>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "<1 sentence explaining the valuation>"
}

Rules:
- Be realistic about Indian second-hand market prices
- Consider brand, model year, storage size, RAM, and other specs when estimating
- Electronics lose 20-40% value, furniture 40-60%, books 60-80%
- A "New" condition item should retain ~70-85% of retail value
- A "Poor" condition item should retain ~15-30% of retail value
- Factor in the specified condition and specifications explicitly`

  const result = await generateWithFallback([{ text: prompt }])
  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    const data = JSON.parse(jsonMatch[0])
    return {
      estimatedResellValue: data.estimatedResellValue || fallbackValue,
      confidence: data.confidence || 'medium',
      reasoning: data.reasoning || 'Estimated from market data',
    }
  }

  return {
    estimatedResellValue: fallbackValue,
    confidence: 'low',
    reasoning: `AI response parsing failed — ${category} depreciation base with ${condition} condition`,
  }
}

// ─── CONDITION ASSESSMENT (Vision + questionnaire) ────────────────
export async function assessItemCondition(
  images: string[],
  answers: Record<string, string>,
): Promise<{ condition: 'New' | 'Mint' | 'Good' | 'Fair' | 'Poor'; reasoning: string; confidence: 'high' | 'medium' | 'low' }> {
  if (!API_KEY || images.length === 0) {
    return assessFromQuestionnaireOnly(answers)
  }

  const qText = Object.entries(answers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')

  const prompt = `You are a product condition assessment expert for a P2P rental marketplace.

You have PHOTOS of the item and SELLER ANSWERS:
${qText}

Return ONLY valid JSON:
{"condition":"New"|"Mint"|"Good"|"Fair"|"Poor","reasoning":"<why>","confidence":"high"|"medium"|"low"}

Rules:
- New: factory sealed or used <1 week, zero scratches/dents, all accessories work
- Mint: 0-2 micro scratches (invisible at arm's length), no dents, all features work
- Good: 1-3 visible scratches, no/minor dents, all major features work
- Fair: 4-10 scratches, 1-2 dents, 1-2 non-critical features not working
- Poor: heavy scratches, 3+ dents, critical features not working, heavy wear
- Cross-check images vs answers. Downgrade if images show more damage. Upgrade if better.`

  const imageParts = images.map(img => ({
    inlineData: { data: img.includes(',') ? img.split(',')[1] : img, mimeType: 'image/jpeg' },
  }))

  const result = await generateWithFallback([{ text: prompt }, ...imageParts])
  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    const data = JSON.parse(jsonMatch[0])
    const valid = ['New', 'Mint', 'Good', 'Fair', 'Poor']
    return {
      condition: valid.includes(data.condition) ? data.condition : 'Good',
      reasoning: data.reasoning || 'Assessed from images and answers',
      confidence: data.confidence || 'medium',
    }
  }

  return assessFromQuestionnaireOnly(answers)
}

function assessFromQuestionnaireOnly(
  answers: Record<string, string>,
): { condition: 'New' | 'Mint' | 'Good' | 'Fair' | 'Poor'; reasoning: string; confidence: 'low' } {
  const scratchMap: Record<string, number> = { '0': 4, '1-3': 2, '4-10': 1, '10+': 0 }
  const dentMap: Record<string, number> = { '0': 4, '1-2': 2, '3-5': 1, '5+': 0 }
  const featureMap: Record<string, number> = { 'All': 4, 'Minor issues': 2, 'Major issues': 1, 'Not working': 0 }
  const accessoryMap: Record<string, number> = { 'All': 4, 'Some': 2, 'None': 0 }
  const appearMap: Record<string, number> = { 'Mint': 4, 'Good': 3, 'Fair': 1, 'Poor': 0 }

  const score = (scratchMap[answers.scratches] ?? 2) + (dentMap[answers.dents] ?? 2)
    + (featureMap[answers.features] ?? 2) + (accessoryMap[answers.accessories] ?? 2)
    + (appearMap[answers.appearance] ?? 2)

  const conditions: Array<{ min: number; label: 'New' | 'Mint' | 'Good' | 'Fair' | 'Poor' }> = [
    { min: 18, label: 'New' }, { min: 14, label: 'Mint' },
    { min: 9, label: 'Good' }, { min: 4, label: 'Fair' }, { min: 0, label: 'Poor' },
  ]

  const result = conditions.find(c => score >= c.min) || conditions[conditions.length - 1]

  return {
    condition: result.label,
    reasoning: `Questionnaire score ${score}/20`,
    confidence: 'low',
  }
}

export function isGeminiAvailable(): boolean {
  return !!API_KEY
}
