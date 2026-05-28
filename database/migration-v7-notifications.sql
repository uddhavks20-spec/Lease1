-- Phase 3.5: Automated Notifications & Email Service

-- ─── 1. NOTIFICATION PREFERENCES ──────────────────────────────────
CREATE TABLE IF NOT EXISTS notification_prefs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email_alerts BOOLEAN DEFAULT true,
  push_alerts  BOOLEAN DEFAULT true,
  sms_alerts   BOOLEAN DEFAULT false,
  -- Per-type toggles
  notify_rental_updates    BOOLEAN DEFAULT true,
  notify_kyc_updates       BOOLEAN DEFAULT true,
  notify_dispute_updates   BOOLEAN DEFAULT true,
  notify_promotions        BOOLEAN DEFAULT true,
  notify_referral_rewards  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. EMAIL LOGS (audit trail for sent emails)───────────────────
CREATE TABLE IF NOT EXISTS email_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES users(id),
  to_email        VARCHAR(255) NOT NULL,
  subject         VARCHAR(500) NOT NULL,
  template_name   VARCHAR(100),
  status          VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced')),
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 3. ENHANCE NOTIFICATIONS TABLE ──────────────────────────────
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url VARCHAR(500);
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50) DEFAULT 'info';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS metadata JSONB;

-- ─── 4. DEFAULT PREFERENCES FOR EXISTING USERS ───────────────────
INSERT INTO notification_prefs (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM notification_prefs)
ON CONFLICT (user_id) DO NOTHING;
