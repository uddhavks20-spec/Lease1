-- Phase 3: Revenue & Scaling (Coupons, Referrals, KYC Enhancement, Disputes, Cities, Featured)

-- ─── 1. COUPONS & DISCOUNT CODES ──────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code            VARCHAR(50) UNIQUE NOT NULL,
  description     TEXT,
  discount_type   VARCHAR(10) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value  DECIMAL(10,2) NOT NULL CHECK (discount_value > 0),
  min_rental_amount DECIMAL(10,2) DEFAULT 0,
  max_discount_amount DECIMAL(10,2),
  usage_limit     INTEGER,
  used_count      INTEGER DEFAULT 0,
  seller_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id         UUID REFERENCES items(id) ON DELETE CASCADE,
  is_active       BOOLEAN DEFAULT true,
  valid_from      TIMESTAMPTZ DEFAULT NOW(),
  valid_until     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_seller ON coupons(seller_id);

-- ─── 2. REFERRAL SYSTEM ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS referral_codes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  code        VARCHAR(20) UNIQUE NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referrals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_code   VARCHAR(20) NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  reward_amount   DECIMAL(10,2) DEFAULT 0,
  reward_claimed  BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  UNIQUE(referrer_id, referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- ─── 3. KYC ENHANCEMENT ───────────────────────────────────────────
ALTER TABLE kycs ADD COLUMN IF NOT EXISTS document_type VARCHAR(30)
  CHECK (document_type IN ('aadhaar', 'pan', 'driving_license', 'voter_id', 'passport', 'student_id'));

-- ─── 4. DISPUTE ENHANCEMENT ───────────────────────────────────────
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS title VARCHAR(200);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS amount_involved DECIMAL(10,2);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

CREATE TABLE IF NOT EXISTS dispute_messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispute_id  UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES users(id),
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dispute_messages ON dispute_messages(dispute_id);

-- ─── 5. COUPON ON RENTALS ─────────────────────────────────────────
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- ─── 6. CITY EXPANSION ────────────────────────────────────────────
ALTER TABLE cities ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS coverage_area TEXT;
ALTER TABLE cities ADD COLUMN IF NOT EXISTS colleges TEXT[];
ALTER TABLE cities ADD COLUMN IF NOT EXISTS estimated_users INTEGER DEFAULT 0;

-- ─── 7. FEATURED/BOSTED SELLER CONTROL ────────────────────────────
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT false;
ALTER TABLE items ADD COLUMN IF NOT EXISTS boost_start TIMESTAMPTZ;

-- ─── 8. SELLER CREDIT BALANCE (for rewards/commission credit) ─────
ALTER TABLE users ADD COLUMN IF NOT EXISTS credit_balance DECIMAL(10,2) DEFAULT 0;

-- ─── 9. AUTO-GENERATE REFERRAL CODE FOR EXISTING USERS ────────────
INSERT INTO referral_codes (user_id, code)
SELECT id, UPPER(SUBSTRING(REPLACE(id::text, '-', ''), 1, 8))
FROM users
WHERE id NOT IN (SELECT user_id FROM referral_codes)
ON CONFLICT (user_id) DO NOTHING;

