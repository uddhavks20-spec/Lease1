import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth, requireRoles } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

router.get('/summary', auth(true), requireRoles('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const revenue = (await db.query(`SELECT COALESCE(SUM(amount),0) as sum FROM payments WHERE status='completed'`))
      .rows[0].sum
    const commission =
      (
        await db.query(
          `SELECT COALESCE(SUM(platform_commission),0) as sum FROM rentals WHERE status IN ('active','completed')`
        )
      ).rows[0].sum || 0
    const activeRentals = (await db.query(`SELECT COUNT(*) FROM rentals WHERE status='active'`)).rows[0].count
    const defaultRate =
      (
        await db.query(
          `SELECT COALESCE(AVG(CASE WHEN status='overdue' THEN 1 ELSE 0 END),0) as rate FROM monthly_payments`
        )
      ).rows[0].rate || 0
    res.json({ revenue, commission, activeRentals, defaultRate })
  } catch (e) {
    next(e)
  }
})

router.get('/seller/stats', auth(true), requireRoles('seller'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user!.sub
    const earningsRes = await db.query(
      `SELECT COALESCE(SUM(total_rent), 0) as total FROM rentals r JOIN items i ON r.item_id=i.id WHERE i.seller_id=$1 AND r.status IN ('active', 'completed')`,
      [sellerId]
    )
    const listingsRes = await db.query(
      `SELECT COUNT(*) as count FROM items WHERE seller_id=$1 AND status='active'`,
      [sellerId]
    )
    const rentalsRes = await db.query(
      `SELECT COUNT(*) as count FROM rentals r JOIN items i ON r.item_id=i.id WHERE i.seller_id=$1`,
      [sellerId]
    )
    const pendingRes = await db.query(
      `SELECT COUNT(*) as count FROM rentals r JOIN items i ON r.item_id=i.id WHERE i.seller_id=$1 AND r.status='pending'`,
      [sellerId]
    )

    res.json({
      stats: {
        totalEarnings: Number(earningsRes.rows[0].total),
        activeListings: Number(listingsRes.rows[0].count),
        totalRentals: Number(rentalsRes.rows[0].count),
        pendingRequests: Number(pendingRes.rows[0].count)
      }
    })
  } catch (e) {
    next(e)
  }
})

export default router
