import { Router, type Request, type Response, type NextFunction } from 'express'
import { auth, requireRoles } from '../../middleware/auth'
import { db } from '../../utils/db'

const router = Router()

// All routes require wholesaler auth
router.use(auth(true), requireRoles('wholesaler'))

// GET dashboard stats
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wsId = req.user!.sub
    const totalProducts = (await db.query('SELECT COUNT(*) FROM wholesale_products WHERE wholesaler_id=$1', [wsId])).rows[0].count
    const totalUnits = (await db.query('SELECT COALESCE(SUM(quantity_available),0) FROM wholesale_products WHERE wholesaler_id=$1', [wsId])).rows[0].coalesce
    const pendingKyc = (await db.query("SELECT status FROM wholesaler_kycs WHERE user_id=$1", [wsId])).rows[0]
    res.json({
      stats: {
        totalProducts: parseInt(totalProducts),
        totalUnits: parseInt(totalUnits),
        pendingOrders: 0,
        kycStatus: pendingKyc?.status || 'not_submitted'
      }
    })
  } catch (e) { next(e) }
})

// GET all products for this wholesaler
router.get('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wsId = req.user!.sub
    const rows = (await db.query(
      'SELECT id, title, brand, quantity_available, min_order_quantity, price_per_unit, suggested_retail_price, delivery_timeline, status, created_at FROM wholesale_products WHERE wholesaler_id=$1 ORDER BY created_at DESC',
      [wsId]
    )).rows
    res.json({ products: rows })
  } catch (e) { next(e) }
})

// POST create a new wholesale product
router.post('/products', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wsId = req.user!.sub
    const { title, description, brand, categoryId, quantityAvailable, minOrderQuantity, pricePerUnit, suggestedRetailPrice, deliveryTimeline, images } = req.body
    if (!title || !pricePerUnit || !quantityAvailable) {
      return res.status(400).json({ error: 'Title, price per unit, and quantity are required' })
    }
    const result = await db.query(
      'INSERT INTO wholesale_products (wholesaler_id, title, description, brand, category_id, quantity_available, min_order_quantity, price_per_unit, suggested_retail_price, delivery_timeline, images) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id',
      [wsId, title, description, brand || null, categoryId || null, quantityAvailable, minOrderQuantity || 1, pricePerUnit, suggestedRetailPrice || null, deliveryTimeline || null, JSON.stringify(images || [])]
    )
    res.status(201).json({ id: result.rows[0].id })
  } catch (e) { next(e) }
})

// PATCH update product
router.patch('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wsId = req.user!.sub
    const { id } = req.params
    const { title, description, brand, quantityAvailable, minOrderQuantity, pricePerUnit, suggestedRetailPrice, deliveryTimeline, status } = req.body
    await db.query(
      'UPDATE wholesale_products SET title=$1, description=$2, brand=$3, quantity_available=$4, min_order_quantity=$5, price_per_unit=$6, suggested_retail_price=$7, delivery_timeline=$8, status=$9, updated_at=NOW() WHERE id=$10 AND wholesaler_id=$11',
      [title, description, brand, quantityAvailable, minOrderQuantity, pricePerUnit, suggestedRetailPrice, deliveryTimeline, status, id, wsId]
    )
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// DELETE product
router.delete('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wsId = req.user!.sub
    await db.query('DELETE FROM wholesale_products WHERE id=$1 AND wholesaler_id=$2', [req.params.id, wsId])
    res.json({ ok: true })
  } catch (e) { next(e) }
})

// GET KYC status
router.get('/kyc', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wsId = req.user!.sub
    const row = (await db.query('SELECT * FROM wholesaler_kycs WHERE user_id=$1', [wsId])).rows[0] || null
    res.json({ kyc: row })
  } catch (e) { next(e) }
})

// POST submit KYC
router.post('/kyc', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const wsId = req.user!.sub
    const { businessName, gstNumber, businessAddress, businessRegistrationUrl, gstCertificateUrl, panCardUrl, bankAccountNumber, ifscCode } = req.body
    const existing = await db.query('SELECT id FROM wholesaler_kycs WHERE user_id=$1', [wsId])
    if (existing.rows.length > 0) {
      await db.query(
        "UPDATE wholesaler_kycs SET business_name=$1, gst_number=$2, business_address=$3, business_registration_url=$4, gst_certificate_url=$5, pan_card_url=$6, bank_account_number=$7, ifsc_code=$8, status='pending', updated_at=NOW() WHERE user_id=$9",
        [businessName, gstNumber, businessAddress, businessRegistrationUrl, gstCertificateUrl, panCardUrl, bankAccountNumber, ifscCode, wsId]
      )
    } else {
      await db.query(
        "INSERT INTO wholesaler_kycs (user_id, business_name, gst_number, business_address, business_registration_url, gst_certificate_url, pan_card_url, bank_account_number, ifsc_code, status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending')",
        [wsId, businessName, gstNumber, businessAddress, businessRegistrationUrl, gstCertificateUrl, panCardUrl, bankAccountNumber, ifscCode]
      )
    }
    res.json({ ok: true })
  } catch (e) { next(e) }
})

export default router
