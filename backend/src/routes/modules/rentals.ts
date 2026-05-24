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
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const renterId = req.user!.sub
      const { itemId, durationMonths, deliveryAddress, deliveryNotes } = req.body
      const allowPending = process.env.TEST_MODE === 'true'
      const itemRes = await db.query(
        `SELECT id, seller_id, monthly_rent, deposit_amount FROM items WHERE id=$1 AND (status IN ('approved','active') OR ($2 AND status='pending'))`,
        [itemId, allowPending]
      )
      if (!itemRes.rowCount) return res.status(404).json({ error: 'Item not available' })
      const item = itemRes.rows[0]

      const totalRent = Number(item.monthly_rent) * Number(durationMonths)
      const depositAmount = Number(item.deposit_amount)
      const firstMonth = Number(item.monthly_rent)
      const platformCommission = calculateCommission(firstMonth)

      const result = await withTransaction(async (client) => {
        const rentalIns = await client.query(
          `INSERT INTO rentals (item_id, renter_id, duration_months, total_rent, deposit_amount, platform_commission, status, delivery_address, delivery_notes, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,'pending',$7,$8,$2) RETURNING id`,
          [itemId, renterId, durationMonths, totalRent, depositAmount, platformCommission, deliveryAddress, deliveryNotes]
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
          `SELECT id, item_id, duration_months, total_rent, deposit_amount, platform_commission, status, start_date, end_date, actual_end_date, created_at, updated_at
           FROM rentals WHERE renter_id=$1 ORDER BY created_at DESC`,
          [userId]
        )
      ).rows
    } else if (role === 'seller') {
      rows = (
        await db.query(
          `SELECT r.id, r.item_id, r.duration_months, r.status, r.start_date, r.end_date, r.actual_end_date, r.created_at, r.updated_at
           FROM rentals r JOIN items i ON i.id=r.item_id WHERE i.seller_id=$1 ORDER BY r.created_at DESC`,
          [userId]
        )
      ).rows
    } else {
      if (status) {
        rows = (await db.query(`SELECT * FROM rentals WHERE status=$1 ORDER BY created_at DESC LIMIT 100`, [status]))
          .rows
      } else {
        rows = (await db.query(`SELECT * FROM rentals ORDER BY created_at DESC LIMIT 100`)).rows
      }
    }
    res.json({ rentals: rows })
  } catch (e) {
    next(e)
  }
})

export default router
