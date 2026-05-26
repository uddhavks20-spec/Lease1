import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth, requireRoles } from '../../middleware/auth'
import { db, withTransaction } from '../../utils/db'
import { analyzeImages, isGeminiAvailable } from '../../services/gemini'

const router = Router()

// ─── STAGE 1: PREPROCESSING ────────────────────────────────────────
function preprocessImage(imageUrl: string): { valid: boolean; reason?: string } {
  if (!imageUrl || imageUrl.trim().length === 0) {
    return { valid: false, reason: 'EMPTY_URL' }
  }
  // Basic URL validation
  if (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
    return { valid: false, reason: 'INVALID_URL_FORMAT' }
  }
  // Size check for data URLs (placeholder — real implementation uses sharp/jimp)
  if (imageUrl.startsWith('data:') && imageUrl.length < 100) {
    return { valid: false, reason: 'IMAGE_TOO_SMALL' }
  }
  return { valid: true }
}

// ─── STAGE 2 + 3: VISION ANALYSIS (mock — swap for GPT-4o/Claude) ──
interface VisionResult {
  integrity_valid: boolean
  match_verified: boolean
  anomaly_detected: boolean
  damage_vector: {
    classification: string
    pixel_coordinates: [number, number, number, number] | null
    severity_score: number
  }
}

async function runVisionAnalysis(
  checkoutImages: string[],
  checkinImages: string[],
): Promise<VisionResult> {
  if (checkoutImages.length === 0 || checkinImages.length === 0) {
    return {
      integrity_valid: false,
      match_verified: false,
      anomaly_detected: false,
      damage_vector: { classification: 'NONE', pixel_coordinates: null, severity_score: 0 },
    }
  }

  // Use Gemini 1.5 Flash Vision if API key is configured
  if (isGeminiAvailable()) {
    const result = await analyzeImages(checkoutImages, checkinImages)
    return result
  }

  // Fallback mock — keyword-based
  const combinedUrl = [...checkoutImages, ...checkinImages].join(' ').toLowerCase()
  const hasDamageKeywords = ['crack', 'broken', 'damage', 'scratch', 'dent', 'missing'].some(k => combinedUrl.includes(k))

  if (hasDamageKeywords) {
    return {
      integrity_valid: true,
      match_verified: true,
      anomaly_detected: true,
      damage_vector: {
        classification: combinedUrl.includes('crack') ? 'SCREEN_CRACK'
          : combinedUrl.includes('dent') ? 'HOUSING_DENT'
          : combinedUrl.includes('missing') ? 'MISSING_COMPONENT'
          : 'SURFACE_ABRASION',
        pixel_coordinates: [100, 100, 300, 300],
        severity_score: combinedUrl.includes('crack') ? 0.65 : 0.25,
      },
    }
  }

  return {
    integrity_valid: true,
    match_verified: true,
    anomaly_detected: false,
    damage_vector: { classification: 'NONE', pixel_coordinates: null, severity_score: 0 },
  }
}

// ─── STAGE 4: SETTLEMENT ARBITRATOR ────────────────────────────────
const DEDUCTION_RATES: Record<string, number> = {
  SCREEN_CRACK: 1500,
  HOUSING_DENT: 300,
  MISSING_COMPONENT: 500,
  SURFACE_ABRASION: 150,
  NONE: 0,
}

async function executeSettlement(
  rentalId: string,
  visionResult: VisionResult,
): Promise<{ action: string; amount: number; message: string }> {
  const { anomaly_detected, damage_vector } = visionResult

  // Path 1: No anomaly — full release
  if (!anomaly_detected || damage_vector.severity_score <= 0.30) {
    await db.query(
      `UPDATE deposits SET status='refunded', refunded_to_renter=amount, refunded_at=NOW()
       WHERE rental_id=$1`,
      [rentalId],
    )
    await db.query(`UPDATE rentals SET status='completed', actual_end_date=NOW()::date WHERE id=$1`, [rentalId])

    if (!anomaly_detected) {
      return {
        action: 'RELEASED_FULL',
        amount: 0,
        message: 'Item inspection completed successfully. No variations from the baseline condition were observed. Your deposit has been marked for immediate, full release from escrow.',
      }
    }
    return {
      action: 'RELEASED_FULL_WITH_WEAR',
      amount: 0,
      message: 'Inspection completed. Minor cosmetic variations were observed, consistent with expected standard handling. Your full security deposit has been released back to your account.',
    }
  }

  // Path 2: Critical damage — deduction
  const deductionAmount = DEDUCTION_RATES[damage_vector.classification] || 400

  await db.query(
    `UPDATE deposits SET status='deducted', deduction_amount=$2, deduction_reason=$3,
     refunded_to_renter=GREATEST(amount - $2, 0), refunded_at=NOW()
     WHERE rental_id=$1`,
    [rentalId, deductionAmount, `Damage detected: ${damage_vector.classification} (severity: ${damage_vector.severity_score})`],
  )
  await db.query(`UPDATE rentals SET status='completed', actual_end_date=NOW()::date WHERE id=$1`, [rentalId])

  // Create dispute record for audit trail
  await db.query(
    `INSERT INTO disputes (rental_id, raised_by, type, description, status)
     VALUES ($1, (SELECT seller_id FROM items i JOIN rentals r ON r.item_id=i.id WHERE r.id=$1), 'damage', $2, 'under_review')`,
    [rentalId, `Auto-detected: ${damage_vector.classification} (severity: ${damage_vector.severity_score}). Deduction: ₹${deductionAmount}`],
  )

  return {
    action: 'HELD_IN_DISPUTE',
    amount: deductionAmount,
    message: `Our state evaluation detected a material structural change (${damage_vector.classification}) relative to the initial pickup photos. In accordance with Section 4 of the User Agreement, a processing hold of ₹${deductionAmount} has been applied to the escrow balance. The remaining deposit has been returned to you.`,
  }
}

// ─── CREATE SETTLEMENT ROUTE ────────────────────────────────────────
router.post('/settle/:rentalId', auth(true), requireRoles('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rentalId } = req.params
    const { damageType, severityScore, manualDeduction } = req.body || {}

    // Fetch stored images
    const checkoutP = db.query(
      `SELECT image_url FROM return_flow_photos WHERE rental_id=$1 AND phase='checkout' ORDER BY created_at ASC`,
      [rentalId],
    )
    const checkinP = db.query(
      `SELECT image_url FROM return_flow_photos WHERE rental_id=$1 AND phase='checkin' ORDER BY created_at ASC`,
      [rentalId],
    )
    const [checkoutRes, checkinRes] = await Promise.all([checkoutP, checkinP])

    const checkoutImages = checkoutRes.rows.map((r: any) => r.image_url)
    const checkinImages = checkinRes.rows.map((r: any) => r.image_url)

    // Run vision analysis
    const visionResult = await runVisionAnalysis(checkoutImages, checkinImages)

    // Override with manual input if provided
    if (damageType) {
      visionResult.anomaly_detected = true
      visionResult.damage_vector.classification = damageType
      visionResult.damage_vector.severity_score = severityScore || 0.5
    }

    // Record analysis
    await db.query(
      `INSERT INTO vision_analyses (rental_id, integrity_valid, match_verified, anomaly_detected,
        damage_classification, severity_score, settlement_action, settlement_amount, settled, settled_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW())`,
      [
        rentalId,
        visionResult.integrity_valid,
        visionResult.match_verified,
        visionResult.anomaly_detected,
        visionResult.damage_vector.classification,
        visionResult.damage_vector.severity_score,
        '',
        0,
      ],
    )

    // Execute settlement
    const settlement = await executeSettlement(rentalId, visionResult)

    res.json({
      success: true,
      assessment: visionResult,
      settlement,
    })
  } catch (e) {
    next(e)
  }
})

// ─── UPLOAD CHECKOUT PHOTOS (handover — seller) ────────────────────
router.post('/checkout/:rentalId', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rentalId } = req.params
    const { images } = req.body // array of { dataUrl, view }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' })
    }

    // Preprocess each image
    for (const img of images) {
      const check = preprocessImage(img.dataUrl || img.image_url)
      if (!check.valid) {
        return res.status(400).json({ error: `Image invalid: ${check.reason}`, imageUrl: img.dataUrl })
      }
    }

    const inserted: any[] = []
    for (const img of images) {
      const result = await db.query(
        `INSERT INTO return_flow_photos (rental_id, phase, image_url, view, captured_by)
         VALUES ($1, 'checkout', $2, $3, $4) RETURNING id`,
        [rentalId, img.dataUrl || img.image_url, img.view || 'front', req.user!.sub],
      )
      inserted.push(result.rows[0])
    }

    // Update rental status to active
    await db.query(
      `UPDATE rentals SET status='active', start_date=COALESCE(start_date, NOW()::date) WHERE id=$1`,
      [rentalId],
    )

    res.json({ success: true, photos: inserted })
  } catch (e) {
    next(e)
  }
})

// ─── UPLOAD CHECK-IN PHOTOS (return — renter) ──────────────────────
router.post('/checkin/:rentalId', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rentalId } = req.params
    const { images } = req.body

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' })
    }

    for (const img of images) {
      const check = preprocessImage(img.dataUrl || img.image_url)
      if (!check.valid) {
        return res.status(400).json({ error: `Image invalid: ${check.reason}` })
      }
    }

    const inserted: any[] = []
    for (const img of images) {
      const result = await db.query(
        `INSERT INTO return_flow_photos (rental_id, phase, image_url, view, captured_by)
         VALUES ($1, 'checkin', $2, $3, $4) RETURNING id`,
        [rentalId, img.dataUrl || img.image_url, img.view || 'front', req.user!.sub],
      )
      inserted.push(result.rows[0])
    }

    res.json({ success: true, photos: inserted, message: 'Return photos uploaded. Admin review pending.' })
  } catch (e) {
    next(e)
  }
})

// ─── GET VISION STATUS ──────────────────────────────────────────────
router.get('/status/:rentalId', auth(true), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rentalId } = req.params

    const [checkoutRes, checkinRes, analysisRes, depositRes] = await Promise.all([
      db.query(`SELECT id, image_url, view, captured_at FROM return_flow_photos WHERE rental_id=$1 AND phase='checkout' ORDER BY created_at`, [rentalId]),
      db.query(`SELECT id, image_url, view, captured_at FROM return_flow_photos WHERE rental_id=$1 AND phase='checkin' ORDER BY created_at`, [rentalId]),
      db.query(`SELECT * FROM vision_analyses WHERE rental_id=$1 ORDER BY created_at DESC LIMIT 1`, [rentalId]),
      db.query(`SELECT * FROM deposits WHERE rental_id=$1`, [rentalId]),
    ])

    res.json({
      rentalId,
      checkoutPhotos: checkoutRes.rows,
      checkinPhotos: checkinRes.rows,
      analysis: analysisRes.rows[0] || null,
      deposit: depositRes.rows[0] || null,
    })
  } catch (e) {
    next(e)
  }
})

export default router
