import { Router } from 'express'
import { body, param, query } from 'express-validator'
import { auth, requireRoles } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

// ─── Seller: Create coupon ────────────────────────────────────────
router.post(
  '/',
  auth(true),
  requireRoles('seller'),
  body('code').isString().isLength({ min: 3, max: 50 }),
  body('discount_type').isIn(['percentage', 'fixed']),
  body('discount_value').isFloat({ min: 1 }),
  body('description').optional().isString(),
  body('min_rental_amount').optional().isFloat({ min: 0 }),
  body('max_discount_amount').optional().isFloat({ min: 0 }),
  body('usage_limit').optional().isInt({ min: 1 }),
  body('item_id').optional().isUUID(),
  body('valid_until').optional().isISO8601(),
  async (req, res, next) => {
    try {
      const sellerId = req.user!.sub
      const { code, description, discount_type, discount_value, min_rental_amount, max_discount_amount, usage_limit, item_id, valid_until } = req.body

      const codeUpper = code.toUpperCase()
      const existing = await db.query(`SELECT id FROM coupons WHERE code=$1`, [codeUpper])
      if (existing.rowCount) {
        res.status(409).json({ error: 'Coupon code already exists' })
        return
      }

      const result = await db.query(
        `INSERT INTO coupons (code, description, discount_type, discount_value, min_rental_amount, max_discount_amount, usage_limit, seller_id, item_id, valid_until)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
        [codeUpper, description, discount_type, discount_value, min_rental_amount || 0, max_discount_amount, usage_limit, sellerId, item_id, valid_until]
      )
      res.status(201).json({ id: result.rows[0].id })
    } catch (e) {
      next(e)
    }
  }
)

// ─── Seller: List my coupons ──────────────────────────────────────
router.get('/my', auth(true), requireRoles('seller'), async (req, res, next) => {
  try {
    const sellerId = req.user!.sub
    const rows = (await db.query(
      `SELECT id, code, description, discount_type, discount_value, min_rental_amount, max_discount_amount,
              usage_limit, used_count, is_active, valid_from, valid_until, created_at
       FROM coupons WHERE seller_id=$1 ORDER BY created_at DESC`,
      [sellerId]
    )).rows
    res.json({ coupons: rows })
  } catch (e) {
    next(e)
  }
})

// ─── Seller: toggle coupon active ─────────────────────────────────
router.patch('/:id/toggle', auth(true), requireRoles('seller'), async (req, res, next) => {
  try {
    const sellerId = req.user!.sub
    const { id } = req.params
    await db.query(
      `UPDATE coupons SET is_active = NOT is_active WHERE id=$1 AND seller_id=$2`,
      [id, sellerId]
    )
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// ─── Seller: delete coupon ────────────────────────────────────────
router.delete('/:id', auth(true), requireRoles('seller'), async (req, res, next) => {
  try {
    const sellerId = req.user!.sub
    await db.query(`DELETE FROM coupons WHERE id=$1 AND seller_id=$2`, [req.params.id, sellerId])
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// ─── Public: Validate & apply coupon ──────────────────────────────
router.get('/validate', auth(true), query('code').isString(), query('amount').optional().isFloat(), async (req, res, next) => {
  try {
    const code = (req.query.code as string).toUpperCase()
    const amount = parseFloat(req.query.amount as string) || 0

    const coupon = (await db.query(
      `SELECT * FROM coupons WHERE code=$1 AND is_active=true AND (valid_until IS NULL OR valid_until > NOW())`,
      [code]
    )).rows[0]

    if (!coupon) {
      res.status(404).json({ valid: false, error: 'Invalid or expired coupon code' })
      return
    }

    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      res.status(400).json({ valid: false, error: 'Coupon usage limit reached' })
      return
    }

    if (amount < coupon.min_rental_amount) {
      res.status(400).json({ valid: false, error: `Minimum rental amount of ₹${coupon.min_rental_amount} required` })
      return
    }

    let discount = coupon.discount_type === 'percentage'
      ? Math.round(amount * coupon.discount_value / 100)
      : coupon.discount_value

    if (coupon.max_discount_amount && discount > coupon.max_discount_amount) {
      discount = coupon.max_discount_amount
    }

    res.json({ valid: true, coupon, discount })
  } catch (e) {
    next(e)
  }
})

export default router
