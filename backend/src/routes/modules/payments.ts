import { Router, type Request, type Response, type NextFunction } from 'express'
import { db } from '../../utils/db'
import { verifyWebhookSignature } from '../../services/payments'

const router = Router()

router.post('/webhook', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const signature = req.headers['x-razorpay-signature'] as string
    const payload = JSON.stringify(req.body)
    if (!verifyWebhookSignature(payload, signature)) {
      return res.status(400).json({ error: 'Invalid signature' })
    }
    const event = req.body
    if (event.event === 'payment.captured') {
      const orderId = event.payload.payment.entity.order_id
      const paymentId = event.payload.payment.entity.id
      await db.query(
        `UPDATE payments SET status='completed', razorpay_payment_id=$1, captured_at=NOW() WHERE razorpay_order_id=$2`,
        [paymentId, orderId]
      )
    }
    res.json({ received: true })
  } catch (e) {
    next(e)
  }
})

export default router
