import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { generatePricingResearch, isGeminiAvailable } from '../../services/gemini'

const router = Router()

const EMI_ANNUAL_RATE = 0.15
const FINAL_UNDERCUT = 0.065

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

function calcEmiMonthly(mrv: number, months: number): number {
  const n = Math.max(3, Math.min(48, months))
  const totalPayable = mrv + mrv * EMI_ANNUAL_RATE * n / 12
  return Math.round(totalPayable / n)
}

function calcCompMonthly(mrv: number, months: number, compRate: number): number {
  return Math.round(mrv * compRate)
}

function fallbackPricing(originalPrice: number, _condition: string, isB2B2C: boolean, tenureMonths: number) {
  const mo = Math.max(3, Math.min(48, tenureMonths || 3))
  const compRate = matchCompRate('General')
  const compMonthly = calcCompMonthly(originalPrice, mo, compRate)
  const emiMonthly = calcEmiMonthly(originalPrice, mo)
  // P2P: min of EMI & competitor, then 6.5% undercut. B2B2C: match competitor.
  const baseTarget = isB2B2C ? compMonthly : Math.min(compMonthly, emiMonthly)
  const suggestedRent = Math.round(baseTarget * (1 - FINAL_UNDERCUT))

  const competitorRentLow = Math.round(originalPrice * compRate * 0.85)
  const competitorRentHigh = Math.round(originalPrice * compRate * 1.15)

  // EMI options for all standard tenures (including exact rental duration)
  const emiOptions: Record<string, number> = {}
  for (let n = 3; n <= 48; n++) {
    emiOptions[String(n)] = calcEmiMonthly(originalPrice, n)
  }

  return {
    suggestedRent,
    competitorRentRange: { low: competitorRentLow, high: competitorRentHigh },
    emiOptions,
    conditionAdjustment: -FINAL_UNDERCUT,
    marketSummary: `${mo}mo rental: Competitor ₹${compMonthly.toLocaleString('en-IN')}/mo | EMI ₹${emiMonthly.toLocaleString('en-IN')}/mo (incl. 15% APR). Lease beats min by ${(FINAL_UNDERCUT * 100).toFixed(1)}%.`,
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
