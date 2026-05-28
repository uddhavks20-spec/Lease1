import { Router, type Request, type Response, type NextFunction } from 'express'
import { body } from 'express-validator'
import { auth, requireRoles } from '../../middleware/auth'
import { db, withTransaction } from '../../utils/db'
import { razorpay, calculateCommission } from '../../services/payments'

const router = Router()

router.post(
  '/',
  auth(true),
  requireRoles('renter'),
  body('itemId').isUUID(),
  body('durationMonths').isInt({ min: 1, max: 24 }),
  body('startDate').optional().isString(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const renterId = req.user!.sub
      const { itemId, durationMonths, deliveryAddress, deliveryNotes, damageWaiver, theftAcknowledged, startDate } = req.body
      const damageWaiverOpted = !!damageWaiver
      const damageWaiverFee = damageWaiverOpted ? 200 : 0
      const theftAck = !!theftAcknowledged
      const allowPending = process.env.TEST_MODE === 'true'

      // Calculate dates
      const start = startDate ? new Date(startDate) : new Date()
      const end = new Date(start)
      end.setMonth(end.getMonth() + Number(durationMonths))

      const fmt = (d: Date) => d.toISOString().split('T')[0]
      const startStr = fmt(start)
      const endStr = fmt(end)

      const itemRes = await db.query(
        `SELECT id, seller_id, monthly_rent, deposit_amount, retail_price FROM items WHERE id=$1 AND (status IN ('approved','active') OR ($2 AND status='pending'))`,
        [itemId, allowPending]
      )
      if (!itemRes.rowCount) return res.status(404).json({ error: 'Item not available' })
      const item = itemRes.rows[0]

      // Check availability
      const availCheck = (await db.query(
        `SELECT is_item_available($1, $2, $3) as available`,
        [itemId, startStr, endStr]
      )).rows[0]
      if (!availCheck?.available) {
        return res.status(409).json({ error: 'Item not available for selected dates' })
      }

      const totalRent = Number(item.monthly_rent) * Number(durationMonths)
      const depositAmount = Number(item.deposit_amount)
      const firstMonth = Number(item.monthly_rent)
      const platformCommission = calculateCommission(firstMonth)

      const result = await withTransaction(async (client) => {
        const rentalIns = await client.query(
          `INSERT INTO rentals (item_id, renter_id, duration_months, total_rent, deposit_amount, platform_commission, status, delivery_address, delivery_notes, created_by, damage_waiver_opted, damage_waiver_fee, theft_protection_acknowledged, start_date, end_date)
           VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$2,$9,$10,$11,$12,$13) RETURNING id`,
          [itemId, renterId, durationMonths, totalRent, depositAmount, platformCommission, deliveryAddress, deliveryNotes, damageWaiverOpted, damageWaiverFee, theftAck, startStr, endStr]
        )
        const rentalId = rentalIns.rows[0].id

        await client.query(
          `INSERT INTO deposits (rental_id, amount, status) VALUES ($1,$2,'held')`,
          [rentalId, depositAmount]
        )

        for (let m = 1; m <= durationMonths; m++) {
          const dueDate = new Date()
          dueDate.setMonth(dueDate.getMonth() + (m - 1))
          await client.query(
            `INSERT INTO monthly_payments (rental_id, month_number, due_date, amount, status)
             VALUES ($1,$2,$3,$4,'pending')`,
            [rentalId, m, dueDate, item.monthly_rent]
          )
        }

        const order = await razorpay.orders.create({
          amount: Math.round((firstMonth + depositAmount + platformCommission) * 100),
          currency: 'INR',
          receipt: `rental_${rentalId}`,
          notes: { rentalId, type: 'initial_payment' },
        })

        await client.query(
          `INSERT INTO payments (rental_id, razorpay_order_id, amount, status)
           VALUES ($1,$2,$3,'pending')`,
          [rentalId, order.id, (firstMonth + depositAmount + platformCommission)]
        )

        return { rentalId, order }
      })

      res.status(201).json({ rentalId: result.rentalId, order: result.order })
    } catch (e) {
      next(e)
    }
  }
)

router.get('/', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const role = req.user!.role
    const { status } = req.query as { status?: string }
    let rows
    if (role === 'renter') {
      rows = (
        await db.query(
          `SELECT r.id, r.item_id, r.duration_months, r.total_rent, r.deposit_amount, r.platform_commission, r.status, r.start_date, r.end_date, r.actual_end_date, r.created_at, r.updated_at,
                  i.title as item_title,
                  (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as item_image
           FROM rentals r JOIN items i ON i.id=r.item_id WHERE r.renter_id=$1 ORDER BY r.created_at DESC`,
          [userId]
        )
      ).rows
    } else if (role === 'seller') {
      rows = (
        await db.query(
          `SELECT r.id, r.item_id, r.duration_months, r.total_rent, r.status, r.start_date, r.end_date, r.actual_end_date, r.created_at, r.updated_at,
                  i.title as item_title,
                  (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as item_image
           FROM rentals r JOIN items i ON i.id=r.item_id WHERE i.seller_id=$1 ORDER BY r.created_at DESC`,
          [userId]
        )
      ).rows
    } else {
      if (status) {
        rows = (await db.query(`
          SELECT r.*, i.title as item_title,
            (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as item_image
          FROM rentals r JOIN items i ON i.id = r.item_id
          WHERE r.status=$1 ORDER BY r.created_at DESC LIMIT 100`, [status]))
          .rows
      } else {
        rows = (await db.query(`
          SELECT r.*, i.title as item_title,
            (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as item_image
          FROM rentals r JOIN items i ON i.id = r.item_id
          ORDER BY r.created_at DESC LIMIT 100`)).rows
      }
    }
    res.json({ rentals: rows })
  } catch (e) {
    next(e)
  }
})

// GET /api/rentals/:id/timeline — status history for a rental
router.get('/:id/timeline', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const { id } = req.params

    // Verify user is participant
    const rental = (await db.query(
      `SELECT r.id, r.renter_id, r.status, r.created_at, r.updated_at, i.seller_id,
              i.title as item_title
       FROM rentals r JOIN items i ON i.id = r.item_id WHERE r.id=$1`,
      [id]
    )).rows[0]
    if (!rental) return res.status(404).json({ error: 'Rental not found' })
    if (rental.renter_id !== userId && rental.seller_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }

    const history = (await db.query(
      `SELECT id, from_status, to_status, notes, created_at
       FROM rental_status_history WHERE rental_id=$1 ORDER BY created_at ASC`,
      [id]
    )).rows

    res.json({ rental, history })
  } catch (e) {
    next(e)
  }
})

// PATCH /api/rentals/:id/status — update rental status
router.patch('/:id/status', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const { id } = req.params
    const { status, notes } = req.body

    const validStatuses = ['pending', 'approved', 'rejected', 'scheduled', 'active', 'completed', 'cancelled', 'disputed']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    const rental = (await db.query(
      `SELECT r.id, r.renter_id, r.status, i.seller_id
       FROM rentals r JOIN items i ON i.id = r.item_id WHERE r.id=$1`,
      [id]
    )).rows[0]
    if (!rental) return res.status(404).json({ error: 'Rental not found' })

    const isAdmin = req.user!.role === 'admin'
    const isSeller = rental.seller_id === userId
    const isRenter = rental.renter_id === userId

    // Validate transition permissions
    const allowedTransitions: Record<string, string[]> = {
      'pending': ['approved', 'rejected', 'cancelled'],
      'approved': ['scheduled', 'cancelled'],
      'scheduled': ['active', 'cancelled'],
      'active': ['completed', 'disputed', 'cancelled'],
      'disputed': ['completed', 'active'],
      'completed': [],
      'cancelled': [],
      'rejected': [],
    }

    const allowed = allowedTransitions[rental.status] || []
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `Cannot transition from ${rental.status} to ${status}` })
    }

    // Permission checks for each transition
    if (status === 'rejected' && !isAdmin && !isSeller) {
      return res.status(403).json({ error: 'Only seller or admin can reject rentals' })
    }
    if (status === 'approved' && !isAdmin && !isSeller) {
      return res.status(403).json({ error: 'Only seller or admin can approve rentals' })
    }
    if (status === 'scheduled' && !isAdmin) {
      return res.status(403).json({ error: 'Only admin can schedule rentals' })
    }
    if (status === 'completed' && !isAdmin) {
      return res.status(403).json({ error: 'Only admin can complete rentals' })
    }
    if (status === 'disputed' && !isRenter && !isSeller) {
      return res.status(403).json({ error: 'Only participants can dispute rentals' })
    }
    if (status === 'cancelled' && !isRenter && !isAdmin) {
      return res.status(403).json({ error: 'Only renter or admin can cancel rentals' })
    }

    await db.query(
      `UPDATE rentals SET status=$1, approved_by=$2 WHERE id=$3`,
      [status, userId, id]
    )

    // Insert status change with notes
    await db.query(
      `INSERT INTO rental_status_history (rental_id, from_status, to_status, changed_by, notes)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, rental.status, status, userId, notes || null]
    )

    res.json({ ok: true, status })
  } catch (e) {
    next(e)
  }
})

export default router
