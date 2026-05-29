-- Phase 4: Personality Matching (Renter + Seller/Item personalities)

ALTER TABLE users ADD COLUMN IF NOT EXISTS renter_personality VARCHAR(30);
ALTER TABLE users ADD COLUMN IF NOT EXISTS personality_answers JSONB;

ALTER TABLE items ADD COLUMN IF NOT EXISTS seller_personality VARCHAR(30);
ALTER TABLE items ADD COLUMN IF NOT EXISTS seller_personality_answers JSONB;
