import { Router, type Request, type Response, type NextFunction } from 'express'
import { db } from '../../utils/db'

const router = Router()

router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const rows = (await db.query(`SELECT id, name, description, icon FROM categories WHERE is_active=true ORDER BY name`))
      .rows
    res.json({ categories: rows })
  } catch (e) {
    next(e)
  }
})

export default router
