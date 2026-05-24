import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

router.get('/', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const rows = (
      await db.query(
        `SELECT id, title, message, type, is_read, created_at FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
        [userId]
      )
    ).rows
    res.json({ notifications: rows })
  } catch (e) {
    next(e)
  }
})

router.post('/:id/read', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const id = req.params.id
    await db.query(`UPDATE notifications SET is_read=true, read_at=NOW() WHERE id=$1 AND user_id=$2`, [id, userId])
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

export default router
