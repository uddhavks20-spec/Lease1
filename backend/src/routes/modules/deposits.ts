import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

router.get('/:rentalId', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rentalId } = req.params
    const result = await db.query(`SELECT * FROM deposits WHERE rental_id=$1`, [rentalId])
    res.json({ deposit: result.rows[0] || null })
  } catch (e) {
    next(e)
  }
})

export default router
