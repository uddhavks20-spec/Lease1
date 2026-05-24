import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth, requireRoles } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, cityId, minRent, maxRent, status, sortBy, q, limit } = req.query
    const conditions: string[] = []
    const params: any[] = []
    
    if (q) {
      params.push(`%${q}%`)
      conditions.push(`(title ILIKE $${params.length} OR description ILIKE $${params.length})`)
    }
    if (categoryId) {
      params.push(categoryId)
      conditions.push(`category_id = $${params.length}`)
    }
    if (cityId) {
      params.push(cityId)
      conditions.push(`city_id = $${params.length}`)
    }
    if (minRent) {
      params.push(minRent)
      conditions.push(`monthly_rent >= $${params.length}`)
    }
    if (maxRent) {
      params.push(maxRent)
      conditions.push(`monthly_rent <= $${params.length}`)
    }
    if (status) {
      params.push(status)
      conditions.push(`status = $${params.length}`)
    } else {
      conditions.push(`status='active' AND is_available=true`)
    }

    let orderClause = 'ORDER BY created_at DESC'
    if (sortBy === 'price_low') orderClause = 'ORDER BY monthly_rent ASC'
    else if (sortBy === 'price_high') orderClause = 'ORDER BY monthly_rent DESC'
    else if (sortBy === 'popular') orderClause = 'ORDER BY view_count DESC'

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const finalLimit = limit ? parseInt(limit as string) : 50
    const result = await db.query(
      `SELECT i.id, i.title, i.description, i.monthly_rent, i.deposit_amount, i.category_id, i.city_id, i.status, i.retail_price, i.sub_attributes,
              (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as image_url
       FROM items i ${where} ${orderClause} LIMIT $${params.length + 1}`,
      [...params, finalLimit]
    )
    res.json({ items: result.rows })
  } catch (e) {
    next(e)
  }
})

router.post('/', auth(true), requireRoles('seller'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user!.sub
    const {
      title,
      description,
      categoryId,
      cityId,
      monthlyRent,
      depositAmount,
      originalPrice,
      subAttributes = {},
      minRentDuration = 3,
      maxRentDuration = 12,
    } = req.body

    // Prevent duplicate listings from the same seller with the same title
    const existing = await db.query(
      `SELECT id FROM items WHERE seller_id=$1 AND title=$2 AND status != 'rejected'`,
      [sellerId, title]
    )
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You already have a listing with this title' })
    }

    const status = process.env.TEST_MODE === 'true' ? 'approved' : 'pending'
    const result = await db.query(
      `INSERT INTO items (seller_id, title, description, category_id, city_id, monthly_rent, deposit_amount, retail_price, sub_attributes, min_rent_duration, max_rent_duration, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      [sellerId, title, description, categoryId, cityId, monthlyRent, depositAmount, originalPrice, JSON.stringify(subAttributes), minRentDuration, maxRentDuration, status]
    )
    res.status(201).json({ id: result.rows[0].id })
  } catch (e) {
    next(e)
  }
})

router.patch('/:id/pause', auth(true), requireRoles('seller'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user!.sub
    const itemId = req.params.id
    await db.query(`UPDATE items SET status='paused' WHERE id=$1 AND seller_id=$2`, [itemId, sellerId])
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

router.get('/seller/my-items', auth(true), requireRoles('seller'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user!.sub
    const result = await db.query(
      `SELECT id, title, monthly_rent, status, created_at
       FROM items WHERE seller_id=$1 ORDER BY created_at DESC`,
      [sellerId]
    )
    res.json({ items: result.rows })
  } catch (e) {
    next(e)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const row = (
      await db.query(
        `SELECT i.id, i.title, i.description, i.monthly_rent, i.deposit_amount, i.status, i.category_id, i.city_id, i.retail_price, i.sub_attributes,
                u.first_name || ' ' || u.last_name as seller_name
         FROM items i JOIN users u ON u.id=i.seller_id
         WHERE i.id=$1`,
        [id]
      )
    ).rows[0]
    if (!row) return res.status(404).json({ error: 'Not found' })
    const images = (await db.query(`SELECT image_url, is_primary, alt_text FROM item_images WHERE item_id=$1`, [id]))
      .rows
    res.json({ item: row, images })
  } catch (e) {
    next(e)
  }
})

export default router
