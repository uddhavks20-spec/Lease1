-- Lease Money - Credit & BNPL System
-- Run this after schema.sql in Neon SQL Editor

CREATE TABLE IF NOT EXISTS credit_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id),
    credit_score INTEGER NOT NULL DEFAULT 500,
    credit_limit DECIMAL(12,2) NOT NULL DEFAULT 5000.00,
    used_credit DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    available_credit DECIMAL(12,2) GENERATED ALWAYS AS (credit_limit - used_credit) STORED,
    total_rentals INTEGER NOT NULL DEFAULT 0,
    completed_rentals INTEGER NOT NULL DEFAULT 0,
    late_returns INTEGER NOT NULL DEFAULT 0,
    on_time_returns INTEGER NOT NULL DEFAULT 0,
    disputes_count INTEGER NOT NULL DEFAULT 0,
    xp_points INTEGER NOT NULL DEFAULT 0,
    is_frozen BOOLEAN NOT NULL DEFAULT FALSE,
    tier VARCHAR(20) NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lease_money_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    rental_id UUID REFERENCES rentals(id),
    type VARCHAR(30) NOT NULL CHECK (type IN (
        'credit_limit_increase', 'rental_charge', 'monthly_payment',
        'late_fee', 'platform_fee', 'deposit_hold', 'deposit_refund',
        'deposit_deduction', 'payment_received', 'credit_used', 'credit_restored'
    )),
    amount DECIMAL(12,2) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_scores_user ON credit_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_lease_transactions_user ON lease_money_transactions(user_id);

-- Function to auto-calculate credit score
CREATE OR REPLACE FUNCTION calculate_credit_score(
  p_xp_points INTEGER,
  p_completed_rentals INTEGER,  
  p_late_returns INTEGER,
  p_disputes_count INTEGER,
  p_on_time_returns INTEGER
) RETURNS INTEGER AS $$
DECLARE
  score INTEGER;
BEGIN
  score := 500
    + LEAST(p_xp_points * 2, 200)
    + LEAST(p_completed_rentals * 75, 300)
    + LEAST(p_on_time_returns * 50, 200)
    - LEAST(p_late_returns * 50, 200)
    - LEAST(p_disputes_count * 100, 300);
  RETURN GREATEST(300, LEAST(score, 900));
END;
$$ LANGUAGE plpgsql;

-- Function to auto-calculate credit limit
CREATE OR REPLACE FUNCTION calculate_credit_limit(p_credit_score INTEGER) RETURNS DECIMAL AS $$
BEGIN
  RETURN LEAST(
    50000,
    GREATEST(2000, (p_credit_score - 300) * 80)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to determine tier
CREATE OR REPLACE FUNCTION calculate_tier(p_credit_score INTEGER) RETURNS VARCHAR AS $$
BEGIN
  RETURN CASE
    WHEN p_credit_score >= 800 THEN 'platinum'
    WHEN p_credit_score >= 650 THEN 'gold'
    WHEN p_credit_score >= 450 THEN 'silver'
    ELSE 'bronze'
  END;
END;
$$ LANGUAGE plpgsql;
