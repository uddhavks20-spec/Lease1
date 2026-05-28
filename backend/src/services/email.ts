import { db } from '../utils/db'

interface EmailPayload {
  to: string
  subject: string
  html: string
  userId?: string
  templateName?: string
}

// Email templates
function rentalStatusEmail(prevStatus: string, newStatus: string, itemTitle: string, rentalId: string): { subject: string; html: string } {
  const statusLabels: Record<string, string> = {
    pending: 'Pending Approval', approved: 'Approved', scheduled: 'Scheduled for Delivery',
    active: 'Active', completed: 'Completed', cancelled: 'Cancelled', disputed: 'Disputed',
  }
  const subject = `Rental ${statusLabels[newStatus] || newStatus} - ${itemTitle}`
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111; margin-bottom: 16px;">Rental Status Update</h2>
      <p style="color: #555; margin-bottom: 12px;">Your rental for <strong>${itemTitle}</strong> has changed status:</p>
      <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">From: <strong>${statusLabels[prevStatus] || prevStatus}</strong></p>
        <p style="margin: 8px 0 0; color: #111; font-size: 16px;">To: <strong>${statusLabels[newStatus] || newStatus}</strong></p>
      </div>
      <a href="${process.env.FRONTEND_ORIGIN || 'https://lease1.vercel.app'}/renter/rentals/${rentalId}"
         style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
        View Rental
      </a>
      <p style="color: #9ca3af; font-size: 12px; margin-top: 24px;">Lease - Campus Rentals</p>
    </div>`
  return { subject, html }
}

function kycEmail(status: string, reason?: string): { subject: string; html: string } {
  const isApproved = status === 'approved'
  const subject = `KYC ${isApproved ? 'Verified' : 'Update Required'} - Lease`
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111; margin-bottom: 16px;">KYC ${isApproved ? 'Verified ✓' : 'Status Update'}</h2>
      ${isApproved
        ? '<p style="color: #555;">Your KYC documents have been verified. You can now start listing items and renting on Lease!</p>'
        : `<p style="color: #555;">Your KYC verification needs attention:</p>
           <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px; margin: 12px 0;">
             <p style="margin: 0; color: #dc2626;">${reason || 'Please resubmit your documents'}</p>
           </div>`
      }
      <a href="${process.env.FRONTEND_ORIGIN || 'https://lease1.vercel.app'}/seller/kyc"
         style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
        Go to KYC
      </a>
    </div>`
  return { subject, html }
}

function disputeMessageEmail(disputeTitle: string, message: string, disputeId: string): { subject: string; html: string } {
  const subject = `New message on dispute: ${disputeTitle}`
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111; margin-bottom: 16px;">Dispute Update</h2>
      <p style="color: #555; margin-bottom: 8px;">New message on <strong>${disputeTitle}</strong>:</p>
      <div style="background: #f3f4f6; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
        <p style="margin: 0; color: #555; font-style: italic;">${message}</p>
      </div>
      <a href="${process.env.FRONTEND_ORIGIN || 'https://lease1.vercel.app'}/disputes"
         style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
        View Dispute
      </a>
    </div>`
  return { subject, html }
}

function referralRewardEmail(rewardAmount: number): { subject: string; html: string } {
  const subject = `You earned ₹${rewardAmount} from referrals!`
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
      <h2 style="color: #111; margin-bottom: 16px;">Referral Reward 🎉</h2>
      <p style="color: #555;">Congratulations! You've earned <strong style="font-size: 24px; color: #16a34a;">₹${rewardAmount}</strong> from your referrals.</p>
      <p style="color: #555;">The amount has been credited to your Lease wallet.</p>
      <a href="${process.env.FRONTEND_ORIGIN || 'https://lease1.vercel.app'}/referrals"
         style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold;">
        View Referrals
      </a>
    </div>`
  return { subject, html }
}

export const emailTemplates = { rentalStatusEmail, kycEmail, disputeMessageEmail, referralRewardEmail }

// ─── SEND EMAIL ───────────────────────────────────────────────────
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  const isTest = process.env.TEST_MODE === 'true'
  const resendKey = process.env.RESEND_API_KEY

  // In test/dev mode, just log
  if (isTest || !resendKey) {
    console.log(`[EMAIL LOG] To: ${payload.to}`)
    console.log(`[EMAIL LOG] Subject: ${payload.subject}`)
    console.log(`[EMAIL LOG] Template: ${payload.templateName || 'custom'}`)
    return true
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(resendKey)
    await resend.emails.send({
      from: `Lease <${process.env.EMAIL_FROM || 'notifications@lease.in'}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
    })

    await db.query(
      `INSERT INTO email_logs (user_id, to_email, subject, template_name, status) VALUES ($1,$2,$3,$4,'sent')`,
      [payload.userId, payload.to, payload.subject, payload.templateName || null]
    )
    return true
  } catch (err: any) {
    console.error('[EMAIL FAILED]', err.message)
    await db.query(
      `INSERT INTO email_logs (user_id, to_email, subject, template_name, status, error_message) VALUES ($1,$2,$3,$4,'failed',$5)`,
      [payload.userId, payload.to, payload.subject, payload.templateName || null, err.message]
    )
    return false
  }
}
