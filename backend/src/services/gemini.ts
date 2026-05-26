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

export function isGeminiAvailable(): boolean {
  return !!API_KEY
}
