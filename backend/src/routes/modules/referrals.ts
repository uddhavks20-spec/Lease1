import { Router } from 'express'
import { body } from 'express-validator'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

// ─── Get my referral code ──────────────────────────────────────────
router.get('/my-code', auth(true), async (req, res, next) => {
  try {
    const userId = req.user!.sub
    let row = (await db.query(`SELECT * FROM referral_codes WHERE user_id=$1`, [userId])).rows[0]

    if (!row) {
      const code = userId.replace(/-/g, '').slice(0, 8).toUpperCase()
      row = (await db.query(
        `INSERT INTO referral_codes (user_id, code) VALUES ($1,$2) RETURNING *`,
        [userId, code]
      )).rows[0]
    }

    res.json({ referralCode: row.code })
  } catch (e) {
    next(e)
  }
})

// ─── Track referral (called on signup with ref code) ──────────────
router.post('/track', auth(true), body('referralCode').isString(), async (req, res, next) => {
  try {
    const referredId = req.user!.sub
    const { referralCode } = req.body
    const code = referralCode.toUpperCase()

    const referrer = (await db.query(
      `SELECT user_id FROM referral_codes WHERE code=$1`,
      [code]
    )).rows[0]

    if (!referrer) {
      res.status(404).json({ error: 'Invite not found 🔍', description: 'Check the referral code and try again.' })
      return
    }

    if (referrer.user_id === referredId) {
      res.status(400).json({ error: 'Nice try 😏', description: 'You can\'t use your own referral code.' })
      return
    }

    const existing = await db.query(
      `SELECT id FROM referrals WHERE referrer_id=$1 AND referred_id=$2`,
      [referrer.user_id, referredId]
    )
    if (existing.rowCount) {
      res.json({ ok: true, alreadyTracked: true })
      return
    }

    await db.query(
      `INSERT INTO referrals (referrer_id, referred_id, referral_code, status, reward_amount)
       VALUES ($1,$2,$3,'pending',100)`,
      [referrer.user_id, referredId, code]
    )

    res.status(201).json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// ─── Get my referral stats ─────────────────────────────────────────
router.get('/my-stats', auth(true), async (req, res, next) => {
  try {
    const userId = req.user!.sub

    const totalReferrals = (await db.query(
      `SELECT COUNT(*) as count FROM referrals WHERE referrer_id=$1`,
      [userId]
    )).rows[0].count

    const completedReferrals = (await db.query(
      `SELECT COUNT(*) as count FROM referrals WHERE referrer_id=$1 AND status='completed'`,
      [userId]
    )).rows[0].count

    const totalReward = (await db.query(
      `SELECT COALESCE(SUM(reward_amount),0) as total FROM referrals WHERE referrer_id=$1 AND status='completed' AND reward_claimed=false`,
      [userId]
    )).rows[0].total

    const recentReferrals = (await db.query(
      `SELECT r.created_at, r.status, r.reward_amount, u.display_name, u.avatar_url
       FROM referrals r JOIN users u ON r.referred_id = u.id
       WHERE r.referrer_id=$1 ORDER BY r.created_at DESC LIMIT 20`,
      [userId]
    )).rows

    res.json({ totalReferrals, completedReferrals, totalReward, recentReferrals })
  } catch (e) {
    next(e)
  }
})

// ─── Claim reward credit ──────────────────────────────────────────
router.post('/claim', auth(true), async (req, res, next) => {
  try {
    const userId = req.user!.sub

    const unclaimed = (await db.query(
      `SELECT COALESCE(SUM(reward_amount),0) as total FROM referrals WHERE referrer_id=$1 AND status='completed' AND reward_claimed=false`,
      [userId]
    )).rows[0].total

    if (unclaimed <= 0) {
      res.status(400).json({ error: 'Empty treasure chest 📦', description: 'There are no rewards available.' })
      return
    }

    await db.query(
      `UPDATE users SET credit_balance = credit_balance + $1 WHERE id=$2`,
      [unclaimed, userId]
    )

    await db.query(
      `UPDATE referrals SET reward_claimed=true WHERE referrer_id=$1 AND status='completed' AND reward_claimed=false`,
      [userId]
    )

    res.json({ ok: true, amountClaimed: unclaimed })
  } catch (e) {
    next(e)
  }
})

// ─── Mark referral completed (when referred user completes first rental) ─
router.patch('/:id/complete', auth(true), async (req, res, next) => {
  try {
    await db.query(
      `UPDATE referrals SET status='completed', completed_at=NOW() WHERE id=$1 AND status='pending'`,
      [req.params.id]
    )
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

export default router
