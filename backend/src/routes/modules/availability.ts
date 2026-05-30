import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

// GET /api/availability/:itemId — get all unavailable date ranges (booked + blocked)
router.get('/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params

    // Booked dates from active/approved rentals
    const booked = (await db.query(
      `SELECT id, start_date, end_date, 'rental' as source
       FROM rentals
       WHERE item_id = $1 AND status IN ('approved', 'scheduled', 'active')
         AND start_date IS NOT NULL AND end_date IS NOT NULL
       ORDER BY start_date`,
      [itemId]
    )).rows

    // Seller-blocked dates
    const blocked = (await db.query(
      `SELECT id, start_date, end_date, reason, 'block' as source
       FROM item_availability_blocks
       WHERE item_id = $1
       ORDER BY start_date`,
      [itemId]
    )).rows

    res.json({ unavailable: [...booked, ...blocked] })
  } catch (e) {
    next(e)
  }
})

// POST /api/availability/:itemId/block — block a date range (seller only)
router.post('/:itemId/block', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const { itemId } = req.params
    const { startDate, endDate, reason } = req.body

    // Verify ownership
    const item = (await db.query(
      `SELECT id, seller_id FROM items WHERE id=$1`,
      [itemId]
    )).rows[0]
    if (!item) return res.status(404).json({ error: 'Item not found' })
    if (item.seller_id !== userId && req.user!.role !== 'admin') {
      return       res.status(403).json({ error: 'Seller only zone 🚧', description: 'Only sellers can block dates.' })
    }

    if (!startDate || !endDate) return       res.status(400).json({ error: 'Time machine incomplete 📅', description: 'Select both start and end dates.' })

    const result = await db.query(
      `INSERT INTO item_availability_blocks (item_id, start_date, end_date, reason)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [itemId, startDate, endDate, reason || null]
    )

    res.status(201).json({ id: result.rows[0].id })
  } catch (e) {
    next(e)
  }
})

// DELETE /api/availability/block/:id — remove a block
router.delete('/block/:id', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const { id } = req.params

    const block = (await db.query(
      `SELECT ab.id, ab.item_id, i.seller_id
       FROM item_availability_blocks ab
       JOIN items i ON i.id = ab.item_id
       WHERE ab.id = $1`,
      [id]
    )).rows[0]
    if (!block) return res.status(404).json({ error: 'Block not found' })
    if (block.seller_id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'You shall not pass 🚷', description: 'You don\'t have permission for this action.' })
    }

    await db.query(`DELETE FROM item_availability_blocks WHERE id=$1`, [id])
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// GET /api/availability/:itemId/check — check if a date range is available
router.get('/:itemId/check', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params
    const { start, end } = req.query as { start?: string; end?: string }

    if (!start || !end) return       res.status(400).json({ error: 'Time machine incomplete 📅', description: 'Select both start and end dates.' })

    const result = (await db.query(
      `SELECT is_item_available($1, $2, $3) as available`,
      [itemId, start, end]
    )).rows[0]

    res.json({ available: result?.available || false })
  } catch (e) {
    next(e)
  }
})

export default router
