import { Router } from 'express'
import { auth, requireRoles } from '../../middleware/auth'
import { db } from '../../utils/db'
import { notifyUser } from '../../services/notifications'

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
    await notifyUser({
      userId,
      title: 'Main Character Verified ✅',
      message: 'Your KYC passed the vibe check. Welcome to the server.',
      type: 'success',
      actionUrl: '/seller/kyc',
      relatedEntityType: 'kyc',
      relatedEntityId: userId,
      sendEmail: true,
      emailTemplate: 'kyc',
      emailData: { status: 'approved' },
    })
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
    await notifyUser({
      userId,
      title: 'NPC Behavior Detected ❌',
      message: 'KYC rejected. Fix your details before you get hard-stuck at the gate.',
      type: 'error',
      actionUrl: '/seller/kyc',
      relatedEntityType: 'kyc',
      relatedEntityId: userId,
      sendEmail: true,
      emailTemplate: 'kyc',
      emailData: { status: 'rejected', reason },
    })
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

// ─── Phase 3: City Management ─────────────────────────────────────
router.get('/cities', async (_req, res, next) => {
  try {
    const rows = (await db.query(
      `SELECT * FROM cities ORDER BY name ASC`
    )).rows
    res.json({ cities: rows })
  } catch (e) { next(e) }
})

router.post('/cities', async (req, res, next) => {
  try {
    const { name, state, is_active, coverage_area, colleges, estimated_users } = req.body
    const result = await db.query(
      `INSERT INTO cities (name, state, is_active, coverage_area, colleges, estimated_users)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [name, state, is_active ?? true, coverage_area, colleges || [], estimated_users || 0]
    )
    res.status(201).json({ id: result.rows[0].id })
  } catch (e) { next(e) }
})

router.patch('/cities/:id', async (req, res, next) => {
  try {
    const { name, state, is_active, coverage_area, colleges, estimated_users } = req.body
    const sets: string[] = []
    const vals: any[] = []
    let idx = 1
    if (name !== undefined) { sets.push(`name=$${idx++}`); vals.push(name) }
    if (state !== undefined) { sets.push(`state=$${idx++}`); vals.push(state) }
    if (is_active !== undefined) { sets.push(`is_active=$${idx++}`); vals.push(is_active) }
    if (coverage_area !== undefined) { sets.push(`coverage_area=$${idx++}`); vals.push(coverage_area) }
    if (colleges !== undefined) { sets.push(`colleges=$${idx++}`); vals.push(colleges) }
    if (estimated_users !== undefined) { sets.push(`estimated_users=$${idx++}`); vals.push(estimated_users) }
    if (sets.length) {
      sets.push(`updated_at=NOW()`)
      vals.push(req.params.id)
      await db.query(`UPDATE cities SET ${sets.join(',')} WHERE id=$${idx}`, vals)
    }
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// ─── Phase 3: Coupon Analytics ────────────────────────────────────
router.get('/coupons', async (_req, res, next) => {
  try {
    const rows = (await db.query(
      `SELECT c.*, u.display_name as seller_name FROM coupons c LEFT JOIN users u ON c.seller_id=u.id ORDER BY c.created_at DESC`
    )).rows
    res.json({ coupons: rows })
  } catch (e) { next(e) }
})

// ─── Phase 3: Referral Analytics ──────────────────────────────────
router.get('/referrals/stats', async (_req, res, next) => {
  try {
    const totalReferrals = (await db.query(`SELECT COUNT(*) FROM referrals`)).rows[0].count
    const completedReferrals = (await db.query(`SELECT COUNT(*) FROM referrals WHERE status='completed'`)).rows[0].count
    const totalRewards = (await db.query(`SELECT COALESCE(SUM(reward_amount),0) FROM referrals WHERE status='completed'`)).rows[0].sum
    const topReferrers = (await db.query(
      `SELECT r.referrer_id, u.display_name, u.avatar_url, COUNT(*) as count, SUM(r.reward_amount) as total_reward
       FROM referrals r JOIN users u ON r.referrer_id=u.id
       WHERE r.status='completed'
       GROUP BY r.referrer_id, u.display_name, u.avatar_url
       ORDER BY count DESC LIMIT 10`
    )).rows
    res.json({ totalReferrals, completedReferrals, totalRewards, topReferrers })
  } catch (e) { next(e) }
})

// ─── Phase 3: Dispute Management ─────────────────────────────────
router.get('/disputes', async (_req, res, next) => {
  try {
    const rows = (await db.query(
      `SELECT d.*, i.title as item_title, u1.display_name as raised_by_name, u2.display_name as resolved_by_name
       FROM disputes d
       JOIN items i ON d.rental_id IN (SELECT id FROM rentals WHERE item_id=i.id)
       LEFT JOIN users u1 ON d.raised_by=u1.id
       LEFT JOIN users u2 ON d.resolved_by=u2.id
       ORDER BY d.created_at DESC`
    )).rows
    res.json({ disputes: rows })
  } catch (e) { next(e) }
})

// ─── Phase 3: Dashboard Summary ──────────────────────────────────
router.get('/dashboard', async (_req, res, next) => {
  try {
    const totalUsers = (await db.query(`SELECT COUNT(*) FROM users`)).rows[0].count
    const totalSellers = (await db.query(`SELECT COUNT(*) FROM users WHERE role='seller'`)).rows[0].count
    const totalRenters = (await db.query(`SELECT COUNT(*) FROM users WHERE role='renter'`)).rows[0].count
    const totalItems = (await db.query(`SELECT COUNT(*) FROM items`)).rows[0].count
    const activeItems = (await db.query(`SELECT COUNT(*) FROM items WHERE status IN ('approved','active')`)).rows[0].count
    const totalRentals = (await db.query(`SELECT COUNT(*) FROM rentals`)).rows[0].count
    const activeRentals = (await db.query(`SELECT COUNT(*) FROM rentals WHERE status='active'`)).rows[0].count
    const revenue = (await db.query(`SELECT COALESCE(SUM(amount),0) FROM payments WHERE status='completed'`)).rows[0].sum
    const commission = (await db.query(`SELECT COALESCE(SUM(platform_commission),0) FROM rentals WHERE status IN ('active','completed')`)).rows[0].sum
    const pendingItems = (await db.query(`SELECT COUNT(*) FROM items WHERE status='pending'`)).rows[0].count
    const pendingKycs = (await db.query(`SELECT COUNT(*) FROM kycs WHERE status='pending'`)).rows[0].count
    const openDisputes = (await db.query(`SELECT COUNT(*) FROM disputes WHERE status NOT IN ('resolved')`)).rows[0].count
    const totalReviews = (await db.query(`SELECT COUNT(*) FROM reviews`)).rows[0].count
    const totalCities = (await db.query(`SELECT COUNT(*) FROM cities WHERE is_active=true`)).rows[0].count
    const totalCoupons = (await db.query(`SELECT COUNT(*) FROM coupons`)).rows[0].count
    const totalReferrals = (await db.query(`SELECT COUNT(*) FROM referrals`)).rows[0].count

    // Monthly revenue chart data (last 6 months)
    const monthlyRevenue = (await db.query(
      `SELECT DATE_TRUNC('month', created_at) as month, COALESCE(SUM(amount),0) as revenue
       FROM payments WHERE status='completed' AND created_at > NOW() - INTERVAL '6 months'
       GROUP BY month ORDER BY month`
    )).rows

    // Recent signups
    const recentUsers = (await db.query(
      `SELECT id, email, role, created_at FROM users ORDER BY created_at DESC LIMIT 10`
    )).rows

    res.json({
      totalUsers, totalSellers, totalRenters,
      totalItems, activeItems,
      totalRentals, activeRentals,
      revenue, commission,
      pendingItems, pendingKycs, openDisputes,
      totalReviews, totalCities, totalCoupons, totalReferrals,
      monthlyRevenue, recentUsers,
    })
  } catch (e) { next(e) }
})
