import { Router, type Request, type Response, type NextFunction } from 'express'
import { body } from 'express-validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../../utils/db'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'
const TOKEN_TTL = '7d'

router.post(
  '/register',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('firstName').isString(),
  body('lastName').isString(),
  body('role').isIn(['seller', 'renter', 'wholesaler']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password, firstName, lastName, role } = req.body
      const existing = await db.query('SELECT id FROM users WHERE email=$1', [email])
      if (existing.rowCount) return       res.status(409).json({ error: 'That username is taken 🎯', description: 'An account already exists with this email.' })

      const roleRes = await db.query('SELECT id FROM roles WHERE name=$1', [role])
      if (!roleRes.rowCount) return       res.status(400).json({ error: 'Wrong class selected 🎮', description: 'The selected role isn\'t valid.' })
      const roleId = roleRes.rows[0].id

      const hash = await bcrypt.hash(password, 10)
      const insertRes = await db.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [email, hash, firstName, lastName, roleId]
      )
      const userId = insertRes.rows[0].id
      const token = jwt.sign({ sub: userId, role }, JWT_SECRET, { expiresIn: TOKEN_TTL })
      return res.status(201).json({ token })
    } catch (e) {
      next(e)
    }
  }
)

router.post(
  '/login',
  body('email').isEmail(),
  body('password').isString(),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body
      const userRes = await db.query(
        `SELECT u.id, u.password_hash, r.name as role
         FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email=$1`,
        [email]
      )
      if (!userRes.rowCount) return res.status(401).json({ error: 'Access denied 🚫', description: 'Email or password is incorrect.' })
      const user = userRes.rows[0]
      const ok = await bcrypt.compare(password, user.password_hash)
      if (!ok) return res.status(401).json({ error: 'Access denied 🚫', description: 'Email or password is incorrect.' })
      const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: TOKEN_TTL })
      return res.json({ token })
    } catch (e) {
      next(e)
    }
  }
)

export default router
