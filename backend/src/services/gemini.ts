import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = process.env.GEMINI_API_KEY

function getClient() {
  if (!API_KEY) throw new Error('GEMINI_API_KEY not set')
  return new GoogleGenerativeAI(API_KEY)
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

  const genAI = getClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const result = await model.generateContent([
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

  const genAI = getClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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

  const result = await model.generateContent([
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

  const genAI = getClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const result = await model.generateContent([
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

  const genAI = getClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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

  const result = await model.generateContent([{ text: prompt }])
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
  if (!API_KEY) {
    // Fallback: simple depreciation
    const conditionMap: Record<string, number> = { 'New': 0.85, 'Mint': 0.75, 'Good': 0.60, 'Fair': 0.45, 'Poor': 0.30 }
    const mult = conditionMap[condition] || 0.60
    return {
      estimatedResellValue: Math.round(originalPrice * mult),
      confidence: 'low',
      reasoning: 'AI not available — estimated by condition-based depreciation',
    }
  }

  const genAI = getClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

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
- Consider brand depreciation, category-specific resale value
- Electronics lose 20-40% value, furniture 40-60%, books 60-80%
- Factor in the specified condition and specifications`

  const result = await model.generateContent([{ text: prompt }])
  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    const data = JSON.parse(jsonMatch[0])
    return {
      estimatedResellValue: data.estimatedResellValue || Math.round(originalPrice * 0.5),
      confidence: data.confidence || 'medium',
      reasoning: data.reasoning || 'Estimated from market data',
    }
  }

  // Fallback
  const conditionMap: Record<string, number> = { 'New': 0.85, 'Mint': 0.75, 'Good': 0.60, 'Fair': 0.45, 'Poor': 0.30 }
  const mult = conditionMap[condition] || 0.60
  return {
    estimatedResellValue: Math.round(originalPrice * mult),
    confidence: 'low',
    reasoning: 'AI response parsing failed — estimated by condition-based depreciation',
  }
}

export function isGeminiAvailable(): boolean {
  return !!API_KEY
}
