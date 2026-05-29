import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

const RENTER_TYPES = ['saver', 'trialler', 'flexer', 'switcher', 'missionary', 'aspirer'] as const
const SELLER_TYPES = ['declutterer', 'upgrader', 'collector', 'mogul', 'hobbyist', 'seasonal'] as const

const MATCH_MATRIX: Record<string, Record<string, number>> = {
  saver:       { declutterer: 2, upgrader: 0, collector: 3, mogul: 4, hobbyist: 2, seasonal: 1 },
  trialler:    { declutterer: 0, upgrader: 4, collector: 3, mogul: 3, hobbyist: 4, seasonal: 2 },
  flexer:      { declutterer: 4, upgrader: 0, collector: 0, mogul: 1, hobbyist: 1, seasonal: 3 },
  switcher:    { declutterer: 0, upgrader: 4, collector: 3, mogul: 3, hobbyist: 3, seasonal: 0 },
  missionary:  { declutterer: 3, upgrader: 1, collector: 2, mogul: 4, hobbyist: 2, seasonal: 2 },
  aspirer:     { declutterer: 0, upgrader: 3, collector: 4, mogul: 2, hobbyist: 4, seasonal: 0 },
}

const RENTER_INFO: Record<string, { name: string, motto: string, icon: string }> = {
  saver:      { name: 'The Saver',      motto: 'Best value over time',                                 icon: '🏦' },
  trialler:   { name: 'The Trialler',   motto: 'Try before I buy',                                   icon: '🧪' },
  flexer:     { name: 'The Flexer',     motto: 'On a budget, need it now',                            icon: '💪' },
  switcher:   { name: 'The Switcher',   motto: 'Always want the latest',                              icon: '🔄' },
  missionary: { name: 'The Missionary', motto: 'Need it for a specific purpose',                      icon: '🎯' },
  aspirer:    { name: 'The Aspirer',    motto: 'Live the luxury life',                                icon: '✨' },
}

const SELLER_INFO: Record<string, { name: string, motto: string, icon: string }> = {
  declutterer: { name: 'The Declutterer', motto: 'Dusting it off for cash',                           icon: '🧹' },
  upgrader:    { name: 'The Upgrader',    motto: 'Rent this, fund the next',                          icon: '⬆️' },
  collector:   { name: 'The Collector',   motto: 'My collection, your experience',                    icon: '🎨' },
  mogul:       { name: 'The Mogul',       motto: 'Building a rental empire',                          icon: '💼' },
  hobbyist:    { name: 'The Hobbyist',    motto: 'Share when I don\'t use',                            icon: '🎸' },
  seasonal:    { name: 'The Seasonal',    motto: 'Ride the wave',                                     icon: '🎪' },
}

export function computeMatchScore(renterType: string, sellerType: string): number {
  return MATCH_MATRIX[renterType]?.[sellerType] ?? 1
}

export function getRenterInfo(type: string) {
  return RENTER_INFO[type] || null
}

export function getSellerInfo(type: string) {
  return SELLER_INFO[type] || null
}

// ─── Save/update renter personality ─────────────────────────────
router.post('/renter', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const { personality, answers } = req.body

    if (!RENTER_TYPES.includes(personality)) {
      res.status(400).json({ error: 'Invalid renter personality type' })
      return
    }

    await db.query(
      `UPDATE users SET renter_personality=$1, personality_answers=$2 WHERE id=$3`,
      [personality, answers ? JSON.stringify(answers) : null, userId]
    )

    res.json({
      personality,
      info: RENTER_INFO[personality],
      answers: answers || null,
    })
  } catch (e) {
    next(e)
  }
})

// ─── Get renter personality ─────────────────────────────────────
router.get('/renter', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const row = (await db.query(
      `SELECT renter_personality, personality_answers FROM users WHERE id=$1`,
      [userId]
    )).rows[0]

    if (!row || !row.renter_personality) {
      res.json({ personality: null, info: null, answers: null })
      return
    }

    res.json({
      personality: row.renter_personality,
      info: RENTER_INFO[row.renter_personality] || null,
      answers: row.personality_answers,
    })
  } catch (e) {
    next(e)
  }
})

// ─── Save/update item seller personality ─────────────────────────
router.post('/item/:itemId', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const { itemId } = req.params
    const { personality, answers } = req.body

    if (!SELLER_TYPES.includes(personality)) {
      res.status(400).json({ error: 'Invalid seller personality type' })
      return
    }

    const item = (await db.query(`SELECT seller_id FROM items WHERE id=$1`, [itemId])).rows[0]
    if (!item) {
      res.status(404).json({ error: 'Item not found' })
      return
    }
    if (item.seller_id !== userId) {
      res.status(403).json({ error: 'Only the seller can set item personality' })
      return
    }

    await db.query(
      `UPDATE items SET seller_personality=$1, seller_personality_answers=$2 WHERE id=$3`,
      [personality, answers ? JSON.stringify(answers) : null, itemId]
    )

    res.json({
      itemId,
      personality,
      info: SELLER_INFO[personality],
      answers: answers || null,
    })
  } catch (e) {
    next(e)
  }
})

// ─── Get item seller personality ────────────────────────────────
router.get('/item/:itemId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params
    const row = (await db.query(
      `SELECT seller_personality, seller_personality_answers FROM items WHERE id=$1`,
      [itemId]
    )).rows[0]

    if (!row || !row.seller_personality) {
      res.json({ personality: null, info: null, answers: null })
      return
    }

    res.json({
      personality: row.seller_personality,
      info: SELLER_INFO[row.seller_personality] || null,
      answers: row.seller_personality_answers,
    })
  } catch (e) {
    next(e)
  }
})

// ─── Get match score between renter and item ─────────────────────
router.get('/match/:itemId', auth(false), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.sub
    const { itemId } = req.params

    let renterType = req.query.renterType as string

    if (!renterType && userId) {
      const row = (await db.query(`SELECT renter_personality FROM users WHERE id=$1`, [userId])).rows[0]
      renterType = row?.renter_personality
    }

    const item = (await db.query(`SELECT seller_personality FROM items WHERE id=$1`, [itemId])).rows[0]
    const sellerType = item?.seller_personality

    if (!renterType || !sellerType) {
      res.json({ score: null, match: null })
      return
    }

    const score = computeMatchScore(renterType, sellerType)
    res.json({
      score,
      match: score >= 3 ? 'perfect' : score >= 2 ? 'good' : score >= 1 ? 'fair' : 'poor',
      renterType,
      sellerType,
    })
  } catch (e) {
    next(e)
  }
})

// ─── List all personality types (for UI reference) ──────────────
router.get('/types', (_req: Request, res: Response) => {
  res.json({
    renters: Object.entries(RENTER_INFO).map(([key, val]) => ({ id: key, ...val })),
    sellers: Object.entries(SELLER_INFO).map(([key, val]) => ({ id: key, ...val })),
  })
})

export default router
