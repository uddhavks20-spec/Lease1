import Razorpay from 'razorpay'
import crypto from 'crypto'

const key_id = process.env.RAZORPAY_KEY_ID || ''
const key_secret = process.env.RAZORPAY_KEY_SECRET || ''
const webhook_secret = process.env.RAZORPAY_WEBHOOK_SECRET || ''

const mock = !key_id || !key_secret

export const razorpay: any = mock
  ? {
      orders: {
        create: async (opts: any) => ({
          id: `order_mock_${Date.now()}`,
          amount: opts.amount,
          currency: opts.currency || 'INR',
          status: 'created',
          notes: opts.notes || {},
        }),
      },
    }
  : new Razorpay({ key_id, key_secret })

export function verifyWebhookSignature(payload: string, signature: string) {
  if (!webhook_secret) return true
  const expected = crypto.createHmac('sha256', webhook_secret).update(payload, 'utf8').digest('hex')
  return expected === signature
}

export function calculateCommission(amount: number): number {
  const pct = Number(process.env.COMMISSION_PERCENT || '10') // default 10%
  return Math.round((amount * pct) / 100)
}
