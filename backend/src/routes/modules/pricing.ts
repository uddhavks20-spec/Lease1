import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { generatePricingResearch, isGeminiAvailable } from '../../services/gemini'

const router = Router()

const EMI_ANNUAL_RATE = 0.15
const RENTER_UNDERCUT = 0.04
const PLATFORM_TAKE = 0.15
const TYPE_A_BEAT = 1.15
const TYPE_B_MONTHLY = 0.05

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

function evaluateDuration(
  mrv: number,
  n: number,
  compRate: number,
  sellerType: string,
  resellValue: number | null
) {
  const compMonthly = Math.round(mrv * compRate)
  const emiMonthly = calcEmiMonthly(mrv, n)
  const benchmark = Math.min(compMonthly, emiMonthly)
  const rent = Math.round(benchmark * (1 - RENTER_UNDERCUT))
  const sellerPayout = Math.round(rent * (1 - PLATFORM_TAKE))
  const platformTake = rent - sellerPayout

  let viable: boolean
  let need: number | null = null
  let gap: number | null = null

  if (sellerType === 'A' && resellValue) {
    need = Math.round(resellValue * TYPE_A_BEAT / n)
    viable = sellerPayout >= need
    gap = viable ? 0 : need - sellerPayout
  } else {
    // Type B: always viable (trust-focused, no financial floor)
    viable = true
    need = Math.round((resellValue || mrv) * TYPE_B_MONTHLY)
    gap = null
  }

  return { n, rent, sellerPayout, platformTake, viable, need, gap, benchmark, compMonthly, emiMonthly }
}

router.post('/estimate', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, originalPrice, resellValue, sellerType, category, tenureMonths } = req.body

    if (!title || !originalPrice) {
      return res.status(400).json({ error: 'title and originalPrice required' })
    }

    const mrv = originalPrice
    const rv = resellValue || null
    const st = sellerType || 'B'
    const compRate = matchCompRate(category || 'General')

    // Evaluate all durations 3-48
    const allDurations = []
    for (let n = 3; n <= 48; n++) {
      allDurations.push(evaluateDuration(mrv, n, compRate, st, rv))
    }

    const viable = allDurations.filter(d => d.viable)
    const best = viable.length > 0
      ? viable.reduce((a, b) => a.platformTake * a.n >= b.platformTake * b.n ? a : b)
      : null

    // Current duration info
    const currentN = Math.max(3, Math.min(48, tenureMonths || 3))
    const current = allDurations.find(d => d.n === currentN)!

    // Suggestions if not viable
    const suggestions: any[] = []
    if (!current.viable && viable.length > 0) {
      suggestions.push({
        text: `Try ${viable[0].n} months instead`,
        newN: viable[0].n,
        extraEarnings: viable[0].sellerPayout * viable[0].n - (rv || 0),
      })
    }
    if (!current.viable && st === 'B' && rv) {
      const recMonthly = Math.round(rv * TYPE_B_MONTHLY)
      suggestions.push({
        text: `You'd earn ~₹${recMonthly.toLocaleString('en-IN')}/mo — item stays safe with verified renters`,
        newN: currentN,
      })
    }

    // Free complementary suggestion: if they extend from their chosen N to best N
    if (current.viable && best && best.n > currentN) {
      const gapValue = Math.round((best.sellerPayout * best.n - current.sellerPayout * currentN) * 0.1)
      suggestions.push({
        text: `Extend to ${best.n}mo → get ₹${gapValue.toLocaleString('en-IN')} free credit toward renting another item`,
        newN: best.n,
        freeCredit: gapValue,
      })
    }

    // Gemini for live competitor data (best effort)
    let geminiData = null
    if (isGeminiAvailable()) {
      try {
        geminiData = await generatePricingResearch(title, mrv, st, category || 'General', currentN)
      } catch (e) { /* fall through */ }
    }

    const emiOptions: Record<string, number> = {}
    for (let n = 3; n <= 48; n++) {
      emiOptions[String(n)] = calcEmiMonthly(mrv, n)
    }

    res.json({
      suggestedRent: best ? best.rent : current.rent,
      current,
      best,
      viableDurations: viable.slice(0, 5), // top 5 viable
      totalDurations: allDurations.length,
      suggestions,
      competitorRentRange: geminiData?.competitorRentRange || {
        low: Math.round(mrv * compRate * 0.85),
        high: Math.round(mrv * compRate * 1.15),
      },
      emiOptions,
      conditionAdjustment: -RENTER_UNDERCUT,
      marketSummary: geminiData?.marketSummary ||
        `${currentN}mo rental: Competitor ₹${current.compMonthly.toLocaleString('en-IN')}/mo | EMI ₹${current.emiMonthly.toLocaleString('en-IN')}/mo. Lease beats min by ${(RENTER_UNDERCUT * 100).toFixed(0)}%.`,
    })
  } catch (e) {
    next(e)
  }
})

export default router
