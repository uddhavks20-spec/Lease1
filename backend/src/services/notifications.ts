import { db } from '../utils/db'
import { sendEmail, emailTemplates } from './email'

interface NotifyPayload {
  userId: string
  title: string
  message: string
  type?: string
  actionUrl?: string
  relatedEntityType?: string
  relatedEntityId?: string
  metadata?: Record<string, any>
  sendEmail?: boolean
  emailTemplate?: 'rentalStatus' | 'kyc' | 'disputeMessage' | 'referralReward'
  emailData?: any
}

// ─── Create in-app notification + optionally send email ───────────
export async function notifyUser(payload: NotifyPayload) {
  const { userId, title, message, type = 'info', actionUrl, relatedEntityType, relatedEntityId, metadata, sendEmail: shouldEmail, emailTemplate, emailData } = payload

  // Insert in-app notification
  const result = await db.query(
    `INSERT INTO notifications (user_id, title, message, type, action_url, related_entity_type, related_entity_id, notification_type, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
    [userId, title, message, type, actionUrl, relatedEntityType, relatedEntityId, type, metadata ? JSON.stringify(metadata) : null]
  )

  // Send email if opted-in
  if (shouldEmail && emailTemplate) {
    const user = (await db.query(`SELECT email FROM users WHERE id=$1`, [userId])).rows[0]
    if (user) {
      const prefs = (await db.query(`SELECT * FROM notification_prefs WHERE user_id=$1`, [userId])).rows[0]
      const emailOptedIn = prefs?.email_alerts !== false

      if (emailOptedIn) {
        let emailPayload: { subject: string; html: string } | null = null
        switch (emailTemplate) {
          case 'rentalStatus':
            emailPayload = emailTemplates.rentalStatusEmail(emailData?.prevStatus, emailData?.newStatus, emailData?.itemTitle, emailData?.rentalId)
            break
          case 'kyc':
            emailPayload = emailTemplates.kycEmail(emailData?.status, emailData?.reason)
            break
          case 'disputeMessage':
            emailPayload = emailTemplates.disputeMessageEmail(emailData?.disputeTitle, emailData?.message, emailData?.disputeId)
            break
          case 'referralReward':
            emailPayload = emailTemplates.referralRewardEmail(emailData?.rewardAmount)
            break
        }

        if (emailPayload) {
          await sendEmail({
            to: user.email,
            subject: emailPayload.subject,
            html: emailPayload.html,
            userId,
            templateName: emailTemplate,
          })
          await db.query(`UPDATE notifications SET email_sent=true WHERE id=$1`, [result.rows[0].id])
        }
      }
    }
  }

  return result.rows[0]?.id
}

// ─── Notify multiple users at once ───────────────────────────────
export async function notifyUsers(userIds: string[], payload: Omit<NotifyPayload, 'userId'>) {
  for (const userId of userIds) {
    await notifyUser({ ...payload, userId })
  }
}

// ─── Notify all admins ───────────────────────────────────────────
export async function notifyAdmins(payload: Omit<NotifyPayload, 'userId'>) {
  const admins = (await db.query(`SELECT id FROM users WHERE role='admin'`)).rows
  for (const admin of admins) {
    await notifyUser({ ...payload, userId: admin.id })
  }
}
