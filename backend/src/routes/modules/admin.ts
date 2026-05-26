import { Router } from 'express'
import { auth, requireRoles } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

router.use(auth(true), requireRoles('admin'))

router.get('/kyc/pending', async (_req, res, next) => {
  try {
    const rows = (await db.query(`SELECT user_id, aadhaar_number, pan_number, college_id, document_front_url, document_back_url, selfie_url, status, created_at FROM kycs WHERE status='pending' ORDER BY created_at ASC`))
      .rows
    res.json({ kycs: rows })
  } catch (e) {
    next(e)
  }
})

router.patch('/items/:id/approve', async (req, res, next) => {
  try {
    const adminId = req.user!.sub
    const itemId = req.params.id
    await db.query(`UPDATE items SET status='approved', approved_by=$1, approved_at=NOW() WHERE id=$2`, [
      adminId,
      itemId,
    ])
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

router.patch('/rentals/:id/approve', async (req, res, next) => {
  try {
    const adminId = req.user!.sub
    const rentalId = req.params.id
    await db.query(`UPDATE rentals SET status='scheduled', approved_by=$1, approved_at=NOW() WHERE id=$2`, [
      adminId,
      rentalId,
    ])
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

router.patch('/rentals/:id/mark-delivered', async (req, res, next) => {
  try {
    const rentalId = req.params.id
    await db.query(`UPDATE rentals SET status='active', start_date=COALESCE(start_date, NOW()::date) WHERE id=$1`, [
      rentalId,
    ])
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

router.patch('/rentals/:id/mark-returned', async (req, res, next) => {
  try {
    const rentalId = req.params.id
    const { damageDeduction = 0, deductionReason } = req.body || {}
    await db.query(
      `UPDATE deposits SET status=CASE WHEN $2 > 0 THEN 'deducted' ELSE 'refunded' END,
       deduction_amount=$2, deduction_reason=$3, refunded_to_renter=GREATEST(amount - $2, 0), refunded_at=NOW()
       WHERE rental_id=$1`,
      [rentalId, damageDeduction, deductionReason]
    )
    await db.query(`UPDATE rentals SET status='completed', actual_end_date=NOW()::date WHERE id=$1`, [rentalId])
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

router.patch('/kyc/:userId/approve', async (req, res, next) => {
  try {
    const adminId = req.user!.sub
    const userId = req.params.userId
    await db.query(
      `UPDATE kycs SET status='approved', verified_by=$1, verified_at=NOW(), updated_at=NOW() WHERE user_id=$2`,
      [adminId, userId]
    )
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

router.patch('/kyc/:userId/reject', async (req, res, next) => {
  try {
    const adminId = req.user!.sub
    const userId = req.params.userId
    const { reason } = req.body || {}
    await db.query(
      `UPDATE kycs SET status='rejected', rejection_reason=$1, verified_by=$2, verified_at=NOW(), updated_at=NOW() WHERE user_id=$3`,
      [reason || 'Rejected', adminId, userId]
    )
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

export default router

// Product verification endpoints
router.get('/verifications/pending', async (_req, res, next) => {
  try {
    const rows = (await db.query(
      `SELECT iv.id, iv.item_id, iv.purchase_receipt_url, iv.serial_number, iv.original_box_photo_url, iv.damage_photo_url, iv.notes, iv.status, iv.created_at,
              i.title as item_title, i.video_url,
              (SELECT image_url FROM item_images WHERE item_id = i.id AND is_primary = true LIMIT 1) as primary_image
       FROM item_verifications iv
       JOIN items i ON i.id = iv.item_id
       WHERE iv.status = 'pending'
       ORDER BY iv.created_at ASC`
    )).rows
    res.json({ verifications: rows })
  } catch (e) {
    next(e)
  }
})

router.patch('/verifications/:itemId/approve', async (req, res, next) => {
  try {
    const adminId = req.user!.sub
    const { itemId } = req.params
    await db.query(
      `UPDATE item_verifications SET status='approved', verified_by=$1, verified_at=NOW(), updated_at=NOW() WHERE item_id=$2`,
      [adminId, itemId]
    )
    await db.query(`UPDATE items SET verified_status='verified' WHERE id=$1`, [itemId])
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})

router.patch('/verifications/:itemId/reject', async (req, res, next) => {
  try {
    const adminId = req.user!.sub
    const { itemId } = req.params
    const { reason } = req.body || {}
    await db.query(
      `UPDATE item_verifications SET status='rejected', rejection_reason=$1, verified_by=$2, verified_at=NOW(), updated_at=NOW() WHERE item_id=$3`,
      [reason || 'Verification failed', adminId, itemId]
    )
    await db.query(`UPDATE items SET verified_status='unverified' WHERE id=$1`, [itemId])
    res.json({ ok: true })
  } catch (e) {
    next(e)
  }
})
// Wholesaler KYC verification endpoints
router.get('/wholesaler-kyc/pending', async (_req, res, next) => {
  try {
    const rows = (await db.query(
      `SELECT wk.*, u.email, u.first_name || ' ' || u.last_name as wholesaler_name
       FROM wholesaler_kycs wk JOIN users u ON u.id=wk.user_id
       WHERE wk.status='pending' ORDER BY wk.created_at ASC`
    )).rows
    res.json({ kycs: rows })
  } catch (e) { next(e) }
})

router.patch('/wholesaler-kyc/:userId/approve', async (req, res, next) => {
  try {
    const adminId = req.user!.sub
    await db.query("UPDATE wholesaler_kycs SET status='approved', verified_by=$1, verified_at=NOW(), updated_at=NOW() WHERE user_id=$2", [adminId, req.params.userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

router.patch('/wholesaler-kyc/:userId/reject', async (req, res, next) => {
  try {
    const adminId = req.user!.sub
    const { reason } = req.body || {}
    await db.query("UPDATE wholesaler_kycs SET status='rejected', rejection_reason=$1, verified_by=$2, verified_at=NOW(), updated_at=NOW() WHERE user_id=$3", [reason || 'Rejected', adminId, req.params.userId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})
