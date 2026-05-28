import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { generatePricingResearch, estimateResellValue, isGeminiAvailable } from '../../services/gemini'

const router = Router()

const EMI_ANNUAL_RATE = 0.15
const PLATFORM_TAKE = 0.20

function tenureFactor(n: number): number {
  return 0.6 + 0.4 * Math.pow(12 / Math.max(3, Math.min(48, n)), 0.5)
}
const TYPE_A_BEAT = 1.15
const TYPE_B_MONTHLY = 0.05

const COMPETITOR_RATES: Record<string, number> = {
  Electronics: 0.060, Appliance: 0.055, Furniture: 0.040, Lifestyle: 0.075,
}

const CONDITION_RENT_FACTOR: Record<string, number> = {
  'New': 1.00, 'Mint': 0.95, 'Good': 0.88, 'Fair': 0.78, 'Poor': 0.65,
}
const CONDITION_UNDERCUT: Record<string, number> = {
  'New': 0.02, 'Mint': 0.03, 'Good': 0, 'Fair': 0, 'Poor': 0,
}

const TENURE_BANDS = [
  { min: 1, max: 3, emiHorizon: 12 },
  { min: 4, max: 11, emiHorizon: 18 },
  { min: 12, max: 18, emiHorizon: 24 },
  { min: 19, max: 24, emiHorizon: 36 },
  { min: 25, max: 48, emiHorizon: 48 },
]

function getTenureBand(months: number) {
  return TENURE_BANDS.find(b => months >= b.min && months <= b.max) || TENURE_BANDS[2]
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
  const band = getTenureBand(n)
  const totalPayable = mrv + mrv * EMI_ANNUAL_RATE * band.emiHorizon / 12
  return Math.round(totalPayable / band.emiHorizon)
}

function evaluateDuration(
  mrv: number,
  n: number,
  compRate: number,
  sellerType: string,
  resellValue: number | null,
  condition = 'Good'
) {
  const compMonthly = Math.round(mrv * compRate)
  const emiMonthly = calcEmiMonthly(mrv, n)
  const benchmark = Math.min(compMonthly, emiMonthly)
  const undC = CONDITION_UNDERCUT[condition] ?? 0
  const condFactor = CONDITION_RENT_FACTOR[condition] ?? 0.88
  const baseline = Math.round(benchmark * (1 - undC))
  const rent = Math.round(baseline * condFactor * tenureFactor(n))
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
    viable = true
    need = Math.round((resellValue || mrv) * TYPE_B_MONTHLY)
    gap = null
  }

  return { n, rent, sellerPayout, platformTake, viable, need, gap, benchmark, compMonthly, emiMonthly, tenureFactor: tenureFactor(n) }
}

router.post('/estimate', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, originalPrice, resellValue, sellerType, category, tenureMonths, condition } = req.body

    if (!title || !originalPrice) {
      return res.status(400).json({ error: 'title and originalPrice required' })
    }

    const mrv = originalPrice
    const rv = resellValue || null
    const st = sellerType || 'B'
    const compRate = matchCompRate(category || 'General')
    const cond = condition || 'Good'

    // Evaluate all durations 3-48
    const allDurations = []
    for (let n = 3; n <= 48; n++) {
      allDurations.push(evaluateDuration(mrv, n, compRate, st, rv, cond))
    }

    const viable = allDurations.filter(d => d.viable)
    const best = viable.length > 0
      ? viable.reduce((a, b) => a.sellerPayout > b.sellerPayout ? a : b)
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
      conditionAdjustment: -(1 - (CONDITION_RENT_FACTOR[cond] ?? 0.88)),
      marketSummary: res.data?.marketSummary ||
        `${currentN}mo rental: Competitor ₹${current.compMonthly.toLocaleString('en-IN')}/mo | EMI ₹${current.emiMonthly.toLocaleString('en-IN')}/mo. Lease priced at ₹${current.rent}/mo (${cond} condition).`,
    })
  } catch (e) {
    next(e)
  }
})

// ─── RESELL VALUE ESTIMATION ──────────────────────────────────────
router.post('/estimate-resell', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, originalPrice, condition, category, attributes } = req.body

    if (!title || !originalPrice) {
      return res.status(400).json({ error: 'title and originalPrice required' })
    }

    const result = await estimateResellValue(
      title,
      originalPrice,
      condition || 'Good',
      category || 'General',
      attributes || {},
    )

    res.json(result)
  } catch (e) {
    next(e)
  }
})

export default router
