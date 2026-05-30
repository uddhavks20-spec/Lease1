import { Router, type Request, type Response, type NextFunction } from 'express'
import { body } from 'express-validator'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

// POST /api/reviews — create a review (post-rental only)
router.post(
  '/',
  auth(true),
  body('rentalId').isUUID(),
  body('revieweeId').isUUID(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('title').optional().isString().isLength({ max: 120 }),
  body('body').optional().isString().isLength({ max: 2000 }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reviewerId = req.user!.sub
      const { rentalId, revieweeId, rating, title, body: reviewBody } = req.body

      // Verify rental exists, is completed, and reviewer is a participant
      const rental = (await db.query(
        `SELECT id, renter_id, item_id, status FROM rentals WHERE id=$1`,
        [rentalId]
      )).rows[0]
      if (!rental) return res.status(404).json({ error: 'Rental not found' })
      if (rental.status !== 'completed') {
        return       res.status(400).json({ error: 'Too early for the credits 🎬', description: 'Complete the rental first.' })
      }
      if (rental.renter_id !== reviewerId && rental.revieweeId !== reviewerId) {
        // Also check if user is the seller of the item
        const item = (await db.query(`SELECT seller_id FROM items WHERE id=$1`, [rental.item_id])).rows[0]
        if (!item || item.seller_id !== reviewerId) {
          return       res.status(403).json({ error: 'Admin powers required 👑', description: 'You don\'t have permission.' })
        }
      }

      // Prevent self-review
      if (reviewerId === revieweeId) {
        return       res.status(400).json({ error: 'Self-love detected ❤️', description: 'You can\'t review your own account.' })
      }

      // One review per target per rental
      const existing = (await db.query(
        `SELECT id FROM reviews WHERE rental_id=$1 AND reviewer_id=$2 AND reviewee_id=$3 LIMIT 1`,
        [rentalId, reviewerId, revieweeId]
      )).rows[0]
      if (existing) {
        return       res.status(400).json({ error: 'One review is enough ✍️', description: 'You\'ve already submitted a review.' })
      }

      const result = await db.query(
        `INSERT INTO reviews (rental_id, reviewer_id, reviewee_id, item_id, rating, title, body)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
        [rentalId, reviewerId, revieweeId, rental.item_id, rating, title || null, reviewBody || null]
      )

      // Refresh seller stats
      await db.query(`SELECT refresh_seller_stats($1)`, [revieweeId])

      res.status(201).json({ id: result.rows[0].id })
    } catch (e) {
      next(e)
    }
  }
)

// GET /api/reviews/user/:userId — get reviews for a user (public)
router.get('/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const rows = (await db.query(
      `SELECT r.id, r.rating, r.title, r.body, r.is_verified, r.created_at,
              u.first_name || ' ' || u.last_name as reviewer_name
       FROM reviews r JOIN users u ON u.id = r.reviewer_id
       WHERE r.reviewee_id = $1
       ORDER BY r.created_at DESC LIMIT 50`,
      [userId]
    )).rows
    res.json({ reviews: rows })
  } catch (e) {
    next(e)
  }
})

// GET /api/reviews/item/:itemId — get reviews for an item (public)
router.get('/item/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params
    const rows = (await db.query(
      `SELECT r.id, r.rating, r.title, r.body, r.is_verified, r.created_at,
              u.first_name || ' ' || u.last_name as reviewer_name
       FROM reviews r JOIN users u ON u.id = r.reviewer_id
       WHERE r.item_id = $1
       ORDER BY r.created_at DESC LIMIT 50`,
      [itemId]
    )).rows

    // Aggregate stats
    const stats = (await db.query(
      `SELECT COUNT(*)::INT as count, ROUND(AVG(rating)::DECIMAL, 1) as avg_rating
       FROM reviews WHERE item_id = $1`,
      [itemId]
    )).rows[0]

    res.json({ reviews: rows, stats: { count: Number(stats.count), avgRating: Number(stats.avg_rating) || 0 } })
  } catch (e) {
    next(e)
  }
})

// GET /api/reviews/stats/:userId — aggregated rating stats for a user (public)
router.get('/stats/:userId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = req.params
    const stats = (await db.query(
      `SELECT COUNT(*)::INT as count,
              ROUND(AVG(rating)::DECIMAL, 1) as avg_rating,
              COUNT(*) FILTER (WHERE rating = 5)::INT as five_star,
              COUNT(*) FILTER (WHERE rating = 4)::INT as four_star,
              COUNT(*) FILTER (WHERE rating = 3)::INT as three_star,
              COUNT(*) FILTER (WHERE rating = 2)::INT as two_star,
              COUNT(*) FILTER (WHERE rating = 1)::INT as one_star
       FROM reviews WHERE reviewee_id = $1`,
      [userId]
    )).rows[0]

    res.json({
      count: Number(stats.count),
      avgRating: Number(stats.avg_rating) || 0,
      distribution: {
        5: Number(stats.five_star),
        4: Number(stats.four_star),
        3: Number(stats.three_star),
        2: Number(stats.two_star),
        1: Number(stats.one_star),
      }
    })
  } catch (e) {
    next(e)
  }
})

export default router
