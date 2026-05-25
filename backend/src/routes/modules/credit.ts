import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

// Get current user's Lease Money profile
router.get('/me', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub

    // Get or create credit profile
    let profile = await db.query('SELECT * FROM credit_scores WHERE user_id = $1', [userId])
    
    if (!profile.rows.length) {
      const user = await db.query('SELECT xp_points FROM users WHERE id = $1', [userId])
      const xp = user.rows[0]?.xp_points || 0
      
      const score = 500 + LEAST(xp * 2, 200)
      const limit = LEAST(50000, GREATEST(2000, (score - 300) * 80))
      const tier = score >= 800 ? 'platinum' : score >= 650 ? 'gold' : score >= 450 ? 'silver' : 'bronze'

      profile = await db.query(
        `INSERT INTO credit_scores (user_id, credit_score, credit_limit, xp_points, tier)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, score, limit, xp, tier]
      )
    }

    const row = profile.rows[0]
    res.json({
      creditScore: row.credit_score,
      creditLimit: parseFloat(row.credit_limit),
      usedCredit: parseFloat(row.used_credit),
      availableCredit: parseFloat(row.available_credit),
      tier: row.tier,
      totalRentals: row.total_rentals,
      completedRentals: row.completed_rentals,
      lateReturns: row.late_returns,
      onTimeReturns: row.on_time_returns,
      isFrozen: row.is_frozen,
    })
  } catch (e) {
    next(e)
  }
})

// Calculate rental cost breakdown
router.post('/calculate', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { monthlyRent, durationMonths, depositAmount } = req.body
    const rent = parseFloat(monthlyRent) || 0
    const duration = parseInt(durationMonths) || 1
    const deposit = parseFloat(depositAmount) || 0

    const COMMISSION_PERCENT = parseFloat(process.env.COMMISSION_PERCENT || '10')
    
    const totalRent = rent * duration
    const platformFee = totalRent * (COMMISSION_PERCENT / 100)
    const totalCharge = totalRent + platformFee + deposit

    // Slice-style: split into 3 payments
    const installmentAmount = Math.round((totalRent + platformFee) / 3)
    
    // Late fee calculation
    const dailyLateFee = Math.round(rent * 0.02) // 2% of monthly rent per day
    const gracePeriodDays = 3
    const maxLateFee = Math.round(rent * 0.5) // capped at 50% of monthly rent

    res.json({
      breakdown: {
        monthlyRent: rent,
        durationMonths: duration,
        totalRent,
        platformFee,
        platformFeePercent: COMMISSION_PERCENT,
        deposit,
        totalCharge,
      },
      installmentPlan: {
        totalInstallments: 3,
        perInstallment: installmentAmount,
        schedule: [
          { due: 'At booking', amount: installmentAmount + deposit },
          { due: 'After 30 days', amount: installmentAmount },
          { due: 'After 60 days', amount: installmentAmount },
        ],
      },
      lateFeePolicy: {
        dailyLateFee,
        gracePeriodDays,
        maxLateFee,
        maxLateFeePercent: '50% of monthly rent',
      },
    })
  } catch (e) {
    next(e)
  }
})

// Get transaction history
router.get('/transactions', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const result = await db.query(
      `SELECT * FROM lease_money_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20`,
      [userId]
    )
    res.json({ transactions: result.rows })
  } catch (e) {
    next(e)
  }
})

function LEAST(a: number, b: number) { return a < b ? a : b }
function GREATEST(a: number, b: number) { return a > b ? a : b }

export default router
