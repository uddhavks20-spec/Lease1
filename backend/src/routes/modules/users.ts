import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'
import jwt from 'jsonwebtoken'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const TOKEN_TTL = '7d'

router.get('/me', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const result = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.xp_points, u.level, u.phone, r.name as role
       FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1`,
      [userId]
    )
    const u = result.rows[0]
    const me = {
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      phone: u.phone,
      xpPoints: u.xp_points,
      level: u.level,
      role: u.role,
    }
    res.json({ user: me })
  } catch (e) {
    next(e)
  }
})

router.patch('/me', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const { firstName, lastName, phone } = req.body
    const updates: string[] = []
    const values: any[] = []
    let idx = 1

    if (firstName) { updates.push(`first_name = $${idx++}`); values.push(firstName) }
    if (lastName) { updates.push(`last_name = $${idx++}`); values.push(lastName) }
    if (phone !== undefined) { updates.push(`phone = $${idx++}`); values.push(phone) }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' })

    values.push(userId)
    await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, values)
    res.json({ success: true })
  } catch (e) {
    next(e)
  }
})

router.delete('/me', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    await db.query('UPDATE users SET is_active = false WHERE id = $1', [userId])
    res.json({ success: true })
  } catch (e) {
    next(e)
  }
})

router.get('/me/roles', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const result = await db.query(
      `SELECT r.name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = $1`,
      [userId]
    )
    res.json({ roles: result.rows.map(r => r.name) })
  } catch (e) {
    next(e)
  }
})

router.post('/me/add-role', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const { role } = req.body

    const roleRes = await db.query('SELECT id FROM roles WHERE name = $1', [role])
    if (!roleRes.rowCount) return res.status(400).json({ error: 'Invalid role' })

    await db.query('UPDATE users SET role_id = $1 WHERE id = $2', [roleRes.rows[0].id, userId])

    const token = jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: TOKEN_TTL })
    res.json({ token, role })
  } catch (e) {
    next(e)
  }
})

export default router
