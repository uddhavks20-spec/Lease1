import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { generatePricingResearch, isGeminiAvailable } from '../../services/gemini'

const router = Router()

// ─── Tenure Bands ──────────────────────────────────────────────────
const TENURE_BANDS = [
  { name: 'Flash', range: [1, 3], tierMult: 1.50, condDisc: { New: 0.03, Mint: 0.04, Good: 0.05, Fair: 0.07, Poor: 0.09 }, depositPct: 0.35, emiHorizon: 12 },
  { name: 'Semester', range: [4, 11], tierMult: 1.10, condDisc: { New: 0.015, Mint: 0.020, Good: 0.030, Fair: 0.045, Poor: 0.065 }, depositPct: 0.30, emiHorizon: 18 },
  { name: 'Annual', range: [12, 18], tierMult: 1.00, condDisc: { New: 0.010, Mint: 0.015, Good: 0.020, Fair: 0.030, Poor: 0.045 }, depositPct: 0.25, emiHorizon: 24 },
  { name: 'Extended', range: [19, 24], tierMult: 0.85, condDisc: { New: 0.005, Mint: 0.008, Good: 0.012, Fair: 0.020, Poor: 0.030 }, depositPct: 0.20, emiHorizon: 36 },
  { name: 'Lifecycle', range: [25, 999], tierMult: 0.75, condDisc: { New: 0.000, Mint: 0.003, Good: 0.005, Fair: 0.010, Poor: 0.015 }, depositPct: 0.15, emiHorizon: 48 },
]

const COMPETITOR_RATES: Record<string, number> = {
  Electronics: 0.060, Appliance: 0.055, Furniture: 0.040, Lifestyle: 0.075,
}

function getTenureBand(months: number) {
  return TENURE_BANDS.find(b => months >= b.range[0] && months <= b.range[1]) || TENURE_BANDS[1]
}

function matchCompRate(category: string): number {
  const cat = category.toLowerCase()
  if (cat.includes('electronics')) return COMPETITOR_RATES.Electronics
  if (cat.includes('appliance')) return COMPETITOR_RATES.Appliance
  if (cat.includes('furniture')) return COMPETITOR_RATES.Furniture
  if (cat.includes('lifestyle')) return COMPETITOR_RATES.Lifestyle
  return 0.060
}

function fallbackPricing(originalPrice: number, condition: string, isB2B2C: boolean, tenureMonths: number) {
  const band = getTenureBand(tenureMonths)
  const compRate = matchCompRate('General')
  const compMonthly = Math.round(originalPrice * compRate * band.tierMult)
  const minEmi = Math.round(originalPrice / band.emiHorizon)
  const baseTarget = Math.min(compMonthly, minEmi)
  const condDiscValue = band.condDisc[condition as keyof typeof band.condDisc] ?? 0.03
  const suggestedRent = Math.round(baseTarget * (1 - condDiscValue))

  const competitorRentLow = Math.round(originalPrice * compRate * 0.85)
  const competitorRentHigh = Math.round(originalPrice * compRate * 1.15)

  const emiOptions: Record<string, number> = {}
  for (const b of TENURE_BANDS) {
    emiOptions[String(b.emiHorizon)] = Math.round(originalPrice / b.emiHorizon)
  }

  return {
    suggestedRent,
    competitorRentRange: { low: competitorRentLow, high: competitorRentHigh },
    emiOptions,
    conditionAdjustment: -condDiscValue,
    marketSummary: `[${band.name}] Competitor: ~₹${compMonthly.toLocaleString('en-IN')}/mo. EMI (${band.emiHorizon}mo): ₹${minEmi.toLocaleString('en-IN')}/mo. Saving: ₹${(baseTarget - suggestedRent).toLocaleString('en-IN')}/mo from condition discount.`,
  }
}

router.post('/estimate', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, originalPrice, condition, category, isB2B2C, tenureMonths } = req.body
    const tenure = tenureMonths || 3

    if (!title || !originalPrice) {
      return res.status(400).json({ error: 'title and originalPrice required' })
    }

    if (isGeminiAvailable()) {
      try {
        const result = await generatePricingResearch(title, originalPrice, condition || 'Like New', category || 'General', !!isB2B2C, tenure)
        return res.json(result)
      } catch (e) {
        // Fall through to fallback
      }
    }

    const result = fallbackPricing(originalPrice, condition || 'Like New', !!isB2B2C, tenure)
    res.json(result)
  } catch (e) {
    next(e)
  }
})

export default router
