import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

// GET /api/wishlist — list user's wishlist items
router.get('/', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const rows = (await db.query(
      `SELECT w.id, w.item_id, w.created_at,
              i.title, i.monthly_rent, i.deposit_amount, i.status, i.condition,
              (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as image_url
       FROM wishlist_items w
       JOIN items i ON i.id = w.item_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [userId]
    )).rows
    res.json({ items: rows })
  } catch (e) {
    next(e)
  }
})

// POST /api/wishlist/:itemId — add item to wishlist
router.post('/:itemId', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const { itemId } = req.params

    // Check item exists
    const item = (await db.query(`SELECT id FROM items WHERE id=$1`, [itemId])).rows[0]
    if (!item) return res.status(404).json({ error: 'Item not found' })

    // Check not already in wishlist
    const existing = (await db.query(
      `SELECT id FROM wishlist_items WHERE user_id=$1 AND item_id=$2 LIMIT 1`,
      [userId, itemId]
    )).rows[0]
    if (existing) return       res.status(409).json({ error: 'Already on your radar ⭐', description: 'This item is already saved.' })

    const result = await db.query(
      `INSERT INTO wishlist_items (user_id, item_id) VALUES ($1,$2) RETURNING id`,
      [userId, itemId]
    )
    res.status(201).json({ id: result.rows[0].id })
  } catch (e) {
    next(e)
  }
})

// DELETE /api/wishlist/:itemId — remove item from wishlist
router.delete('/:itemId', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const { itemId } = req.params
    await db.query(
      `DELETE FROM wishlist_items WHERE user_id=$1 AND item_id=$2`,
      [userId, itemId]
    )
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

// GET /api/wishlist/check/:itemId — check if item is in user's wishlist
router.get('/check/:itemId', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const { itemId } = req.params
    const row = (await db.query(
      `SELECT id FROM wishlist_items WHERE user_id=$1 AND item_id=$2 LIMIT 1`,
      [userId, itemId]
    )).rows[0]
    res.json({ inWishlist: !!row })
  } catch (e) {
    next(e)
  }
})

export default router
