import { Router } from 'express'
import { body } from 'express-validator'
import { auth } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

router.get('/me', auth(true), async (req, res, next) => {
  try {
    const userId = req.user!.sub
    const row = (await db.query(`SELECT * FROM kycs WHERE user_id=$1`, [userId])).rows[0] || null
    res.json({ kyc: row })
  } catch (e) {
    next(e)
  }
})

router.post(
  '/me',
  auth(true),
  body('document_type').optional().isIn(['aadhaar', 'pan', 'driving_license', 'voter_id', 'passport', 'student_id']),
  async (req, res, next) => {
    try {
      const userId = req.user!.sub
      const {
        aadhaarNumber, panNumber, collegeId,
        documentFrontUrl, documentBackUrl, selfieUrl,
        document_type, document_number, document_url,
      } = req.body

      const existing = await db.query(`SELECT id FROM kycs WHERE user_id=$1`, [userId])

      const fields: string[] = []
      const values: any[] = []
      let idx = 1

      if (aadhaarNumber !== undefined) { fields.push(`aadhaar_number=$${idx++}`); values.push(aadhaarNumber) }
      if (panNumber !== undefined) { fields.push(`pan_number=$${idx++}`); values.push(panNumber) }
      if (collegeId !== undefined) { fields.push(`college_id=$${idx++}`); values.push(collegeId) }
      if (documentFrontUrl !== undefined) { fields.push(`document_front_url=$${idx++}`); values.push(documentFrontUrl) }
      if (documentBackUrl !== undefined) { fields.push(`document_back_url=$${idx++}`); values.push(documentBackUrl) }
      if (selfieUrl !== undefined) { fields.push(`selfie_url=$${idx++}`); values.push(selfieUrl) }
      if (document_type !== undefined) { fields.push(`document_type=$${idx++}`); values.push(document_type) }
      if (document_number !== undefined) { fields.push(`document_number=$${idx++}`); values.push(document_number) }
      if (document_url !== undefined) { fields.push(`document_url=$${idx++}`); values.push(document_url) }

      if (existing.rowCount) {
        fields.push(`status='pending'`, `updated_at=NOW()`)
        await db.query(`UPDATE kycs SET ${fields.join(',')} WHERE user_id=$${idx}`, [...values, userId])
      } else {
        const cols = ['user_id', 'status', ...fields.map(f => f.split('=')[0])]
        const placeholders = cols.map((_, i) => `$${i + 1}`)
        const vals = [userId, 'pending']
        for (const f of fields) {
          const valIdx = fields.indexOf(f)
          vals.push(values[valIdx])
        }
        await db.query(
          `INSERT INTO kycs (${cols.join(',')}) VALUES (${placeholders.join(',')})`,
          vals
        )
      }

      res.json({ ok: true })
    } catch (e) {
      next(e)
    }
  }
)

export default router
