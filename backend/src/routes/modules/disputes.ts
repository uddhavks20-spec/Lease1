import { Router } from 'express'
import { body, param } from 'express-validator'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

// ─── List disputes (for current user) ─────────────────────────────
router.get('/', auth(true), async (req, res, next) => {
  try {
    const userId = req.user!.sub
    const rows = (await db.query(
      `SELECT d.*, r.status as rental_status,
              i.title as item_title,
              i.image_url as item_image
       FROM disputes d
       JOIN rentals r ON d.rental_id = r.id
       JOIN items i ON r.item_id = i.id
       WHERE d.raised_by=$1 OR r.renter_id=$1 OR i.seller_id=$1
       ORDER BY d.created_at DESC`,
      [userId]
    )).rows
    res.json({ disputes: rows })
  } catch (e) {
    next(e)
  }
})

// ─── Create dispute ───────────────────────────────────────────────
router.post(
  '/',
  auth(true),
  body('rentalId').isUUID(),
  body('type').isIn(['damage', 'non_payment', 'quality', 'other']),
  body('description').isString().isLength({ min: 10 }),
  body('title').optional().isString(),
  body('amount_involved').optional().isFloat({ min: 0 }),
  async (req, res, next) => {
    try {
      const userId = req.user!.sub
      const { rentalId, type, description, title, amount_involved } = req.body

      const existing = await db.query(
        `SELECT id FROM disputes WHERE rental_id=$1 AND raised_by=$2 AND status NOT IN ('resolved')`,
        [rentalId, userId]
      )
      if (existing.rowCount) {
        res.status(400).json({ error: 'An active dispute already exists for this rental' })
        return
      }

      const result = await db.query(
        `INSERT INTO disputes (rental_id, raised_by, type, description, title, amount_involved, status)
         VALUES ($1,$2,$3,$4,$5,$6,'open') RETURNING id`,
        [rentalId, userId, type, description, title || type, amount_involved]
      )
      res.status(201).json({ id: result.rows[0].id })
    } catch (e) {
      next(e)
    }
  }
)

// ─── Get single dispute with messages ─────────────────────────────
router.get('/:id', auth(true), async (req, res, next) => {
  try {
    const userId = req.user!.sub
    const dispute = (await db.query(
      `SELECT d.*, r.status as rental_status, r.renter_id,
              i.title as item_title, i.image_url as item_image, i.seller_id
       FROM disputes d
       JOIN rentals r ON d.rental_id = r.id
       JOIN items i ON r.item_id = i.id
       WHERE d.id=$1 AND (d.raised_by=$2 OR r.renter_id=$2 OR i.seller_id=$2)`,
      [req.params.id, userId]
    )).rows[0]

    if (!dispute) {
      res.status(404).json({ error: 'Dispute not found' })
      return
    }

    const messages = (await db.query(
      `SELECT dm.*, u.display_name, u.avatar_url
       FROM dispute_messages dm
       JOIN users u ON dm.user_id = u.id
       WHERE dm.dispute_id=$1 ORDER BY dm.created_at ASC`,
      [req.params.id]
    )).rows

    res.json({ dispute, messages })
  } catch (e) {
    next(e)
  }
})

// ─── Add message to dispute ───────────────────────────────────────
router.post(
  '/:id/messages',
  auth(true),
  body('message').isString().isLength({ min: 1 }),
  async (req, res, next) => {
    try {
      const userId = req.user!.sub
      const { message } = req.body

      const dispute = (await db.query(`SELECT id FROM disputes WHERE id=$1`, [req.params.id])).rows[0]
      if (!dispute) {
        res.status(404).json({ error: 'Dispute not found' })
        return
      }

      await db.query(
        `INSERT INTO dispute_messages (dispute_id, user_id, message) VALUES ($1,$2,$3)`,
        [req.params.id, userId, message]
      )
      await db.query(`UPDATE disputes SET updated_by=$1 WHERE id=$2`, [userId, req.params.id])

      res.status(201).json({ ok: true })
    } catch (e) {
      next(e)
    }
  }
)

// ─── Admin/Seller: Update dispute status ──────────────────────────
router.patch(
  '/:id/status',
  auth(true),
  body('status').isIn(['under_review', 'resolved', 'escalated']),
  body('resolution').optional().isString(),
  async (req, res, next) => {
    try {
      const userId = req.user!.sub
      const { status, resolution } = req.body

      await db.query(
        `UPDATE disputes SET status=$1, resolution=COALESCE($2, resolution), updated_by=$3, resolved_at=CASE WHEN $1 IN ('resolved') THEN NOW() ELSE resolved_at END WHERE id=$4`,
        [status, resolution, userId, req.params.id]
      )
      res.json({ ok: true })
    } catch (e) {
      next(e)
    }
  }
)

export default router
