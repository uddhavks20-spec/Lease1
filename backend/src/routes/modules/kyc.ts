import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

router.get('/me', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const row = (await db.query(`SELECT * FROM kycs WHERE user_id=$1`, [userId])).rows[0] || null
    res.json({ kyc: row })
  } catch (e) {
    next(e)
  }
})

router.post('/me', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.sub
    const {
      aadhaarNumber,
      panNumber,
      collegeId,
      documentFrontUrl,
      documentBackUrl,
      selfieUrl,
    } = req.body
    const existing = await db.query(`SELECT id FROM kycs WHERE user_id=$1`, [userId])
    if (existing.rowCount) {
      await db.query(
        `UPDATE kycs
         SET aadhaar_number=$1, pan_number=$2, college_id=$3, document_front_url=$4, document_back_url=$5, selfie_url=$6, status='pending', updated_at=NOW()
         WHERE user_id=$7`,
        [aadhaarNumber, panNumber, collegeId, documentFrontUrl, documentBackUrl, selfieUrl, userId]
      )
    } else {
      await db.query(
        `INSERT INTO kycs (user_id, aadhaar_number, pan_number, college_id, document_front_url, document_back_url, selfie_url, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'pending')`,
        [userId, aadhaarNumber, panNumber, collegeId, documentFrontUrl, documentBackUrl, selfieUrl]
      )
    }
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

export default router
