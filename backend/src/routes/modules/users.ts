import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

router.get('/me', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const result = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.xp_points, u.level, r.name as role
       FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1`,
      [userId]
    )
    const u = result.rows[0]
    const me = {
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      xpPoints: u.xp_points,
      level: u.level,
      role: u.role,
    }
    res.json({ user: me })
  } catch (e) {
    next(e)
  }
})

export default router
