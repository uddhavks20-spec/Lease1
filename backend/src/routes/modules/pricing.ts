import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { generatePricingResearch, isGeminiAvailable } from '../../services/gemini'

const router = Router()

const COMPETITOR_RATES: Record<string, number> = {
  Electronics: 0.060, Appliance: 0.055, Furniture: 0.040, Lifestyle: 0.075,
}

function matchCompRate(category: string): number {
  const cat = category.toLowerCase()
  if (cat.includes('electronics')) return COMPETITOR_RATES.Electronics
  if (cat.includes('appliance')) return COMPETITOR_RATES.Appliance
  if (cat.includes('furniture')) return COMPETITOR_RATES.Furniture
  if (cat.includes('lifestyle')) return COMPETITOR_RATES.Lifestyle
  return 0.060
}

function calcTierMult(months: number): number {
  const m = Math.max(3, Math.min(48, months))
  return 1.55 - m * (0.75 / 45)
}

function calcEmiHorizon(months: number): number {
  const m = Math.max(3, Math.min(48, months))
  return Math.round(12 + (m - 3) * (36 / 45))
}

const COND_DISC_3MO: Record<string, number> = { New: 0.03, Mint: 0.04, Good: 0.05, Fair: 0.07, Poor: 0.09 }
const COND_DISC_48MO: Record<string, number> = { New: 0.0, Mint: 0.003, Good: 0.005, Fair: 0.01, Poor: 0.015 }

function calcCondDisc(months: number, condition: string): number {
  const m = Math.max(3, Math.min(48, months))
  const start = COND_DISC_3MO[condition] ?? 0.05
  const end = COND_DISC_48MO[condition] ?? 0.005
  return start + (m - 3) * (end - start) / 45
}

function fallbackPricing(originalPrice: number, condition: string, isB2B2C: boolean, tenureMonths: number) {
  const mo = Math.max(3, Math.min(48, tenureMonths || 3))
  const compRate = matchCompRate('General')
  const compMonthly = Math.round(originalPrice * compRate * calcTierMult(mo))
  const emiH = calcEmiHorizon(mo)
  const minEmi = Math.round(originalPrice / emiH)
  // P2P: beat both competitor and EMI. B2B2C: match competitor.
  const baseTarget = isB2B2C ? compMonthly : Math.min(compMonthly, minEmi)
  const condDiscValue = calcCondDisc(mo, condition)
  const suggestedRent = Math.round(baseTarget * (1 - condDiscValue))

  const competitorRentLow = Math.round(originalPrice * compRate * 0.85)
  const competitorRentHigh = Math.round(originalPrice * compRate * 1.15)

  const emiOptions: Record<string, number> = {}
  for (let h = 12; h <= 48; h += 6) {
    emiOptions[String(h)] = Math.round(originalPrice / h)
  }

  return {
    suggestedRent,
    competitorRentRange: { low: competitorRentLow, high: competitorRentHigh },
    emiOptions,
    conditionAdjustment: -condDiscValue,
    marketSummary: `Competitor: ~₹${compMonthly.toLocaleString('en-IN')}/mo. EMI (${emiH}mo): ₹${minEmi.toLocaleString('en-IN')}/mo. Saving: ₹${(baseTarget - suggestedRent).toLocaleString('en-IN')}/mo from condition discount.`,
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
