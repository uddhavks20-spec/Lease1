import jwt from 'jsonwebtoken'
import type { Request, Response, NextFunction } from 'express'

export interface AuthPayload {
  sub: string
  role: 'admin' | 'seller' | 'renter' | 'wholesaler'
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret'

export function auth(required = true) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization
    if (!header) {
      if (required) return       res.status(401).json({ error: 'No entry pass 🎫', description: 'Authentication is required.' })
      return next()
    }
    const token = header.replace('Bearer ', '')
    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthPayload
      req.user = payload
      next()
    } catch {
      if (required) return       res.status(401).json({ error: 'Session timed out ⏰', description: 'Please sign in again.' })
      next()
    }
  }
}

export function requireRoles(...roles: AuthPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return       res.status(401).json({ error: 'You shall not pass 🚷', description: 'You don\'t have permission for this action.' })
    if (!roles.includes(req.user.role)) return       res.status(403).json({ error: 'You shall not pass 🚷', description: 'You don\'t have permission for this action.' })
    next()
  }
}
