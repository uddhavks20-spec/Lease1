import { Router } from 'express'
import { body } from 'express-validator'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

router.post(
  '/',
  auth(true),
  body('rentalId').isUUID(),
  body('type').isIn(['damage', 'non_payment', 'quality', 'other']),
  body('description').isString(),
  async (req, res, next) => {
    try {
      const userId = req.user!.sub
      const { rentalId, type, description } = req.body
      const result = await db.query(
        `INSERT INTO disputes (rental_id, raised_by, type, description, status)
         VALUES ($1,$2,$3,$4,'open') RETURNING id`,
        [rentalId, userId, type, description]
      )
      res.status(201).json({ id: result.rows[0].id })
    } catch (e) {
      next(e)
    }
  }
)

export default router
