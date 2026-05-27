import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { generatePricingResearch, isGeminiAvailable } from '../../services/gemini'

const router = Router()

const CONDITION_ADJUSTMENTS: Record<string, number> = {
  'Brand New': 0,
  'Like New': 0,
  'Good': -0.015,
  'Fair': -0.045,
}

// Fallback multiplier: ~4% of retail for P2P, ~5% for B2B2C
const FALLBACK_P2P_MULTIPLIER = 0.04
const FALLBACK_B2B_MULTIPLIER = 0.05

function fallbackPricing(originalPrice: number, condition: string, isB2B2C: boolean) {
  const baseMult = isB2B2C ? FALLBACK_B2B_MULTIPLIER : FALLBACK_P2P_MULTIPLIER
  const condAdj = CONDITION_ADJUSTMENTS[condition] || 0
  const suggestedRent = Math.round(originalPrice * (baseMult + condAdj))

  const competitorRentLow = Math.round(originalPrice * 0.045)
  const competitorRentHigh = Math.round(originalPrice * 0.065)

  // EMI: ~2.5-3% per month for 12 months (typical credit card EMI rate)
  const emi3 = Math.round(originalPrice * 0.35)
  const emi6 = Math.round(originalPrice * 0.18)
  const emi12 = Math.round(originalPrice * 0.092)

  return {
    suggestedRent,
    competitorRentRange: { low: competitorRentLow, high: competitorRentHigh },
    emiOptions: { '3': emi3, '6': emi6, '12': emi12 },
    conditionAdjustment: condAdj,
    marketSummary: `Competitor rentals: ₹${competitorRentLow.toLocaleString('en-IN')}–₹${competitorRentHigh.toLocaleString('en-IN')}/mo. EMI starts at ₹${emi12.toLocaleString('en-IN')}/mo for 12mo.`,
  }
}

router.post('/estimate', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, originalPrice, condition, category, isB2B2C } = req.body

    if (!title || !originalPrice) {
      return res.status(400).json({ error: 'title and originalPrice required' })
    }

    if (isGeminiAvailable()) {
      try {
        const result = await generatePricingResearch(title, originalPrice, condition || 'Like New', category || 'General', !!isB2B2C)
        return res.json(result)
      } catch (e) {
        // Fall through to fallback
      }
    }

    const result = fallbackPricing(originalPrice, condition || 'Like New', !!isB2B2C)
    res.json(result)
  } catch (e) {
    next(e)
  }
})

export default router
