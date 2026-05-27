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
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

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

// ─── Tenure Bands ──────────────────────────────────────────────────
const TENURE_BANDS_PRICING = [
  { name: 'Flash', range: [1, 3], tierMult: 1.50, condDisc: { New: 0.03, Mint: 0.04, Good: 0.05, Fair: 0.07, Poor: 0.09 }, depositPct: 0.35, emiHorizon: 12 },
  { name: 'Semester', range: [4, 11], tierMult: 1.10, condDisc: { New: 0.015, Mint: 0.020, Good: 0.030, Fair: 0.045, Poor: 0.065 }, depositPct: 0.30, emiHorizon: 18 },
  { name: 'Annual', range: [12, 18], tierMult: 1.00, condDisc: { New: 0.010, Mint: 0.015, Good: 0.020, Fair: 0.030, Poor: 0.045 }, depositPct: 0.25, emiHorizon: 24 },
  { name: 'Extended', range: [19, 24], tierMult: 0.85, condDisc: { New: 0.005, Mint: 0.008, Good: 0.012, Fair: 0.020, Poor: 0.030 }, depositPct: 0.20, emiHorizon: 36 },
  { name: 'Lifecycle', range: [25, 999], tierMult: 0.75, condDisc: { New: 0.000, Mint: 0.003, Good: 0.005, Fair: 0.010, Poor: 0.015 }, depositPct: 0.15, emiHorizon: 48 },
]

function getTenureBandP(months: number) {
  return TENURE_BANDS_PRICING.find(b => months >= b.range[0] && months <= b.range[1]) || TENURE_BANDS_PRICING[1]
}

// ─── PRICING RESEARCH (for seller pricing engine) ────────────────
export async function generatePricingResearch(
  title: string,
  originalPrice: number,
  condition: string,
  category: string,
  isB2B2C: boolean,
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

  const band = getTenureBandP(tenureMonths || 3)
  const mode = isB2B2C ? 'B2B2C (match competitor rates)' : `P2P (beat competitor rates and ${band.emiHorizon}mo EMI)`

  const genAI = getClient()
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `You are a pricing analyst for a P2P rental marketplace in India.
  
Product: "${title}" | Price: ₹${originalPrice} | Condition: ${condition} | Category: ${category}
Tenure Band: ${band.name} (${band.range[0]}-${band.range[1]} months)
Mode: ${mode}

Return ONLY valid JSON (no markdown, no code fences):
{
  "baseRent": <monthly rent BEFORE condition discount>,
  "competitorRentRange": { "low": <lowest competitor monthly>, "high": <highest competitor monthly> },
  "emiOptions": { "12": <12mo EMI>, "18": <18mo EMI>, "24": <24mo EMI>, "36": <36mo EMI>, "48": <48mo EMI> },
  "marketSummary": "<1-2 sentence insight>"
}

Rules:
- For P2P: baseRent = min(lowest competitor rent, ${band.emiHorizon}mo EMI) — before condition discount
- For B2B2C: baseRent = low competitor rent — match, don't undercut
- Competitor rent: what RentoMojo/Furlenco charge for this item`
  const condDiscValue = band.condDisc[condition as keyof typeof band.condDisc] ?? 0.03

  const result = await model.generateContent([{ text: prompt }])
  const text = result.response.text()
  const jsonMatch = text.match(/\{[\s\S]*\}/)

  if (jsonMatch) {
    const data = JSON.parse(jsonMatch[0])
    const baseRent = data.baseRent || Math.round(originalPrice * 0.045)
    const suggestedRent = Math.round(baseRent * (1 - condDiscValue))

    const emiOptions: Record<string, number> = {}
    for (const b of TENURE_BANDS_PRICING) {
      emiOptions[String(b.emiHorizon)] = data.emiOptions?.[String(b.emiHorizon)] || Math.round(originalPrice / b.emiHorizon)
    }

    return {
      suggestedRent,
      competitorRentRange: data.competitorRentRange || { low: 0, high: 0 },
      emiOptions,
      conditionAdjustment: -condDiscValue,
      marketSummary: data.marketSummary || `[${band.name}] ${condition} discount: ${(condDiscValue * 100).toFixed(1)}% applied.`,
    }
  }

  throw new Error('Failed to parse Gemini pricing response')
}

export function isGeminiAvailable(): boolean {
  return !!API_KEY
}
