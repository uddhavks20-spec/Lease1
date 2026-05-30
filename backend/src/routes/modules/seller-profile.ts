import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

// GET /api/seller-profile/:userId — public seller storefront (NO contact info)
router.get('/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params

    const user = (await db.query(
      `SELECT u.id, u.display_name, u.first_name, u.last_name, u.avatar_url, u.bio,
              u.store_name, u.created_at as member_since,
              r.name as role
       FROM users u JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1`,
      [userId]
    )).rows[0]
    if (!user) return res.status(404).json({ error: 'User not found' })

    // Get seller stats
    const stats = (await db.query(
      `SELECT * FROM seller_stats WHERE user_id = $1`,
      [userId]
    )).rows[0] || {}

    // Get active items
    const items = (await db.query(
      `SELECT i.id, i.title, i.monthly_rent, i.deposit_amount, i.condition, i.status, i.is_featured,
              (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as image_url
       FROM items i
       WHERE i.seller_id = $1 AND i.status IN ('approved','active') AND i.is_available = true
       ORDER BY i.is_featured DESC, i.created_at DESC
       LIMIT 50`,
      [userId]
    )).rows

    // Get recent reviews (up to 10)
    const reviews = (await db.query(
      `SELECT r.id, r.rating, r.title, r.body, r.created_at,
              u.first_name || ' ' || u.last_name as reviewer_name
       FROM reviews r JOIN users u ON u.id = r.reviewer_id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC LIMIT 10`,
      [userId]
    )).rows

    // NEVER return email, phone, or any contact info
    res.json({
      profile: {
        id: user.id,
        displayName: user.display_name || `${user.first_name} ${user.last_name}`,
        firstName: user.first_name,
        lastName: user.last_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        storeName: user.store_name,
        memberSince: user.member_since,
        role: user.role,
        stats: {
          totalListings: Number(stats.total_listings) || items.length,
          activeListings: items.length,
          totalRentals: Number(stats.total_rentals) || 0,
          completedRentals: Number(stats.completed_rentals) || 0,
          avgRating: Number(stats.avg_rating) || 0,
          reviewCount: Number(stats.review_count) || 0,
          responseTimeHrs: Number(stats.response_time_hrs) || 0,
        },
        badges: [],
      },
      items,
      reviews,
    })
  } catch (e) {
    next(e)
  }
})

// PATCH /api/seller-profile — update own profile (seller only)
router.patch('/', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const { displayName, bio, avatarUrl, storeName } = req.body

    const updates: string[] = []
    const params: any[] = []
    let idx = 1

    if (displayName !== undefined) {
      updates.push(`display_name = $${idx++}`)
      params.push(displayName)
    }
    if (bio !== undefined) {
      updates.push(`bio = $${idx++}`)
      params.push(bio)
    }
    if (avatarUrl !== undefined) {
      updates.push(`avatar_url = $${idx++}`)
      params.push(avatarUrl)
    }
    if (storeName !== undefined) {
      updates.push(`store_name = $${idx++}`)
      params.push(storeName)
    }

    if (updates.length === 0) return       res.status(400).json({ error: 'Nothing to change 🫥', description: 'No fields were provided to update.' })

    params.push(userId)
    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`,
      params
    )

    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

export default router
