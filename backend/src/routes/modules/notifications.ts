import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

// ─── List my notifications ────────────────────────────────────────
router.get('/', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const rows = (
      await db.query(
        `SELECT id, title, message, type, is_read, action_url, related_entity_type, related_entity_id, notification_type, created_at
         FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
        [userId]
      )
    ).rows
    const unreadCount = (
      await db.query(`SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=false`, [userId])
    ).rows[0].count
    res.json({ notifications: rows, unreadCount })
  } catch (e) {
    next(e)
  }
})

// ─── Mark single notification as read ─────────────────────────────
router.post('/:id/read', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const id = req.params.id
    await db.query(`UPDATE notifications SET is_read=true, read_at=NOW() WHERE id=$1 AND user_id=$2`, [id, userId])
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// ─── Mark all notifications as read ───────────────────────────────
router.post('/read-all', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    await db.query(`UPDATE notifications SET is_read=true, read_at=NOW() WHERE user_id=$1 AND is_read=false`, [userId])
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// ─── Get unread count ─────────────────────────────────────────────
router.get('/unread-count', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const count = (await db.query(`SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=false`, [userId])).rows[0].count
    res.json({ unreadCount: count })
  } catch (e) {
    next(e)
  }
})

// ─── Get notification preferences ─────────────────────────────────
router.get('/prefs', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    let prefs = (await db.query(`SELECT * FROM notification_prefs WHERE user_id=$1`, [userId])).rows[0]
    if (!prefs) {
      prefs = (await db.query(
        `INSERT INTO notification_prefs (user_id) VALUES ($1) RETURNING *`,
        [userId]
      )).rows[0]
    }
    res.json({ prefs })
  } catch (e) {
    next(e)
  }
})

// ─── Update notification preferences ──────────────────────────────
router.patch('/prefs', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const { email_alerts, push_alerts, sms_alerts, notify_rental_updates, notify_kyc_updates, notify_dispute_updates, notify_promotions, notify_referral_rewards } = req.body

    const sets: string[] = []
    const vals: any[] = []
    let idx = 1
    if (email_alerts !== undefined) { sets.push(`email_alerts=$${idx++}`); vals.push(email_alerts) }
    if (push_alerts !== undefined) { sets.push(`push_alerts=$${idx++}`); vals.push(push_alerts) }
    if (sms_alerts !== undefined) { sets.push(`sms_alerts=$${idx++}`); vals.push(sms_alerts) }
    if (notify_rental_updates !== undefined) { sets.push(`notify_rental_updates=$${idx++}`); vals.push(notify_rental_updates) }
    if (notify_kyc_updates !== undefined) { sets.push(`notify_kyc_updates=$${idx++}`); vals.push(notify_kyc_updates) }
    if (notify_dispute_updates !== undefined) { sets.push(`notify_dispute_updates=$${idx++}`); vals.push(notify_dispute_updates) }
    if (notify_promotions !== undefined) { sets.push(`notify_promotions=$${idx++}`); vals.push(notify_promotions) }
    if (notify_referral_rewards !== undefined) { sets.push(`notify_referral_rewards=$${idx++}`); vals.push(notify_referral_rewards) }

    if (sets.length) {
      sets.push(`updated_at=NOW()`)
      vals.push(userId)
      await db.query(
        `INSERT INTO notification_prefs (user_id, ${sets.map(s => s.split('=')[0]).join(',')})
         VALUES (${['$1', ...sets.map((_, i) => `$${i + 2}`)].join(',')})
         ON CONFLICT (user_id) DO UPDATE SET ${sets.join(',')}`,
        [userId, ...vals]
      )
    }
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

export default router
