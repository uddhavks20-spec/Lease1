import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth, requireRoles } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId, cityId, minRent, maxRent, status, sortBy, q, limit, condition } = req.query
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
    if (condition) {
      const conditions_list = (condition as string).split(',')
      params.push(conditions_list)
      conditions.push(`condition = ANY($${params.length}::varchar[])`)
    }
    if (status) {
      params.push(status)
      conditions.push(`status = $${params.length}`)
    } else {
      conditions.push(`status IN ('approved','active') AND is_available=true`)
    }

    let orderClause = 'ORDER BY i.is_featured DESC, i.created_at DESC'
    if (sortBy === 'price_low') orderClause = 'ORDER BY i.is_featured DESC, i.monthly_rent ASC'
    else if (sortBy === 'price_high') orderClause = 'ORDER BY i.is_featured DESC, i.monthly_rent DESC'
    else if (sortBy === 'popular') orderClause = 'ORDER BY i.is_featured DESC, i.view_count DESC'
    else if (sortBy === 'rating') orderClause = 'ORDER BY i.is_featured DESC, COALESCE(ss.avg_rating, 0) DESC, i.created_at DESC'

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const finalLimit = limit ? parseInt(limit as string) : 50
    const result = await db.query(
      `SELECT i.id, i.title, i.description, i.monthly_rent, i.deposit_amount, i.category_id, i.city_id, i.status, i.retail_price, i.sub_attributes, i.condition, i.verified_status, i.video_url, i.seller_id, i.is_featured,
              u.first_name || ' ' || u.last_name as seller_name, u.avatar_url as seller_avatar,
              COALESCE(ss.avg_rating, 0) as seller_avg_rating, COALESCE(ss.review_count, 0) as seller_review_count,
              (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as image_url
       FROM items i
       JOIN users u ON u.id = i.seller_id
       LEFT JOIN seller_stats ss ON ss.user_id = i.seller_id
       ${where} ${orderClause} LIMIT $${params.length + 1}`,
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
      maxRentDuration = 48,
      images = [],
      videoUrl,
      sellerType,
      resellValue,
      condition = 'Good',
      // Product verification fields
      purchaseReceiptUrl,
      serialNumber,
      originalBoxPhotoUrl,
      damagePhotoUrl,
      verificationNotes,
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
      `INSERT INTO items (seller_id, title, description, category_id, city_id, monthly_rent, deposit_amount, retail_price, sub_attributes, min_rent_duration, max_rent_duration, status, video_url, seller_type, resell_value, condition)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
      [sellerId, title, description, categoryId, cityId, monthlyRent, depositAmount, originalPrice, JSON.stringify(subAttributes), minRentDuration, maxRentDuration, status, videoUrl || null, sellerType || 'B', resellValue || null, condition]
    )
    const itemId = result.rows[0].id

    // Insert images into item_images table
    if (images.length > 0) {
      for (const img of images) {
        await db.query(
          `INSERT INTO item_images (item_id, image_url, is_primary, alt_text) VALUES ($1, $2, $3, $4)`,
          [itemId, img.dataUrl || img.image_url, img.is_primary || false, img.view || null]
        )
      }
    }

    // Insert product verification if any details provided
    if (purchaseReceiptUrl || serialNumber || originalBoxPhotoUrl || damagePhotoUrl) {
      await db.query(
        `INSERT INTO item_verifications (item_id, purchase_receipt_url, serial_number, original_box_photo_url, damage_photo_url, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'pending')`,
        [itemId, purchaseReceiptUrl || null, serialNumber || null, originalBoxPhotoUrl || null, damagePhotoUrl || null, verificationNotes || null]
      )
      // Mark item verification status as pending
      await db.query(`UPDATE items SET verified_status='pending' WHERE id=$1`, [itemId])
    }

    res.status(201).json({ id: itemId })
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

router.patch('/:id/boost', auth(true), requireRoles('seller'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user!.sub
    const itemId = req.params.id
    const item = (await db.query(`SELECT is_boosted FROM items WHERE id=$1 AND seller_id=$2`, [itemId, sellerId])).rows[0]
    if (!item) { res.status(404).json({ error: 'Item not found' }); return }
    const newBoosted = !item.is_boosted
    await db.query(
      `UPDATE items SET is_boosted=$1, boost_start=CASE WHEN $1 THEN NOW() ELSE NULL END, is_featured=$1 WHERE id=$2 AND seller_id=$3`,
      [newBoosted, itemId, sellerId]
    )
    res.json({ ok: true, is_boosted: newBoosted })
  } catch (e) {
    next(e)
  }
})

router.get('/seller/my-items', auth(true), requireRoles('seller'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sellerId = req.user!.sub
    const result = await db.query(
      `SELECT i.id, i.title, i.monthly_rent, i.status, i.seller_type, i.retail_price, i.resell_value, i.recovered_amount, i.condition, i.category_id, c.name as category_name, i.created_at, i.is_boosted, i.is_featured
       FROM items i JOIN categories c ON c.id = i.category_id WHERE seller_id=$1 ORDER BY i.created_at DESC`,
      [sellerId]
    )
    // Compute recovery percentage for each item
    const items = result.rows.map(item => {
      const target = item.seller_type === 'A' && item.resell_value
        ? Math.round(Number(item.resell_value) * 1.15)
        : Number(item.retail_price) || 0
      const recovered = Number(item.recovered_amount) || 0
      const recoveryPct = target > 0 ? Math.min(100, Math.round(recovered / target * 100)) : 0
      return { ...item, recoveryTarget: target, recoveryPct }
    })
    res.json({ items })
  } catch (e) {
    next(e)
  }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params
    const row = (
      await db.query(
        `SELECT i.id, i.title, i.description, i.monthly_rent, i.deposit_amount, i.status, i.category_id, i.city_id, i.retail_price, i.sub_attributes, i.condition, i.verified_status, i.video_url,
                i.seller_type, i.resell_value, i.recovered_amount, i.seller_id,
                u.first_name || ' ' || u.last_name as seller_name,
                u.avatar_url as seller_avatar,
                u.display_name as seller_display_name
         FROM items i JOIN users u ON u.id=i.seller_id
         WHERE i.id=$1`,
        [id]
      )
    ).rows[0]
    if (!row) return res.status(404).json({ error: 'Not found' })
    // Compute recovery percentage
    const target = row.seller_type === 'A' && row.resell_value
      ? Math.round(Number(row.resell_value) * 1.15)
      : Number(row.retail_price) || 0
    const recovered = Number(row.recovered_amount) || 0
    row.recoveryTarget = target
    row.recoveryPct = target > 0 ? Math.min(100, Math.round(recovered / target * 100)) : 0
    const images = (await db.query(`SELECT image_url, is_primary, alt_text FROM item_images WHERE item_id=$1 ORDER BY is_primary DESC, created_at ASC`, [id]))
      .rows
    // Get product verification info
    const verification = (await db.query(
      `SELECT status, purchase_receipt_url, serial_number, original_box_photo_url, damage_photo_url, notes, rejection_reason, created_at
       FROM item_verifications WHERE item_id=$1 ORDER BY created_at DESC LIMIT 1`,
      [id]
    )).rows[0] || null
    // Get seller stats for trust display
    const sellerStats = (await db.query(
      `SELECT avg_rating, review_count, completed_rentals FROM seller_stats WHERE user_id=$1`,
      [row.seller_id]
    )).rows[0] || null
    res.json({ item: row, images, verification, sellerStats })
  } catch (e) {
    next(e)
  }
})

export default router
