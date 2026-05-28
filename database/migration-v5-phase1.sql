-- Phase 1: Reviews, Wishlist, Seller Profile, Trust Features
-- Runs after v3 condition migration and v4 pricing migration

-- ─── 1. REVIEWS ─────────────────────────────────────────────────────
-- Two-sided: renter rates seller+item, seller rates renter (post-rental only)
CREATE TABLE IF NOT EXISTS reviews (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id     UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  reviewer_id   UUID NOT NULL REFERENCES users(id),
  reviewee_id   UUID NOT NULL REFERENCES users(id),
  item_id       UUID REFERENCES items(id),
  rating        SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title         VARCHAR(120),
  body          TEXT CHECK (char_length(body) <= 2000),
  is_verified   BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(rental_id, reviewer_id, reviewee_id)
);

CREATE INDEX idx_reviews_reviewee ON reviews(reviewee_id);
CREATE INDEX idx_reviews_item ON reviews(item_id);
CREATE INDEX idx_reviews_rental ON reviews(rental_id);

-- ─── 2. WISHLIST / FAVORITES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist_items (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

CREATE INDEX idx_wishlist_user ON wishlist_items(user_id);
CREATE INDEX idx_wishlist_item ON wishlist_items(item_id);

-- ─── 3. SELLER PROFILE FIELDS ──────────────────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT CHECK (char_length(bio) <= 1000);
ALTER TABLE users ADD COLUMN IF NOT EXISTS store_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_prefs JSONB
  DEFAULT '{"email":true,"push":true}';

-- ─── 4. SELLER STATS (aggregated, refreshed via trigger) ────────────
CREATE TABLE IF NOT EXISTS seller_stats (
  user_id           UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_listings    INT DEFAULT 0,
  active_listings   INT DEFAULT 0,
  total_rentals     INT DEFAULT 0,
  completed_rentals INT DEFAULT 0,
  avg_rating        DECIMAL(3,2) DEFAULT 0.00,
  review_count      INT DEFAULT 0,
  response_time_hrs DECIMAL(5,1) DEFAULT 0.0,
  member_since      DATE DEFAULT CURRENT_DATE,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 5. NOTIFICATION TEMPLATES ─────────────────────────────────────
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50)
  DEFAULT 'info';

-- ─── 6. ITEM PROMOTION FIELDS ───────────────────────────────────────
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE items ADD COLUMN IF NOT EXISTS featured_expires TIMESTAMPTZ;
ALTER TABLE items ADD COLUMN IF NOT EXISTS boost_score INT DEFAULT 0;

-- ─── 7. GUARDRAIL: CONTACT INFO BLOCKING ───────────────────────────
-- Prevent phone/email in item descriptions
CREATE OR REPLACE FUNCTION guard_item_contact_info()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.description ~* '(whatsapp|phone|mobile|call me|\d{10,}|@gmail|@yahoo|@outlook|@hotmail|@rediffmail)' THEN
    RAISE EXCEPTION 'Contact information is not allowed in item descriptions. All communication must go through the platform.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS items_no_contact ON items;
CREATE TRIGGER items_no_contact BEFORE INSERT OR UPDATE OF description ON items
  FOR EACH ROW EXECUTE FUNCTION guard_item_contact_info();

-- Prevent phone/email in user bios
CREATE OR REPLACE FUNCTION guard_bio_contact_info()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.bio ~* '(phone|mobile|call me|\d{10,}|contact|@gmail|@yahoo|@outlook|@hotmail)' THEN
    RAISE EXCEPTION 'Contact details are not allowed in your bio.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS users_no_contact ON users;
CREATE TRIGGER users_no_contact BEFORE INSERT OR UPDATE OF bio ON users
  FOR EACH ROW EXECUTE FUNCTION guard_bio_contact_info();

-- ─── 8. SELLER STATS REFRESH FUNCTION ──────────────────────────────
CREATE OR REPLACE FUNCTION refresh_seller_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  stats RECORD;
BEGIN
  -- Aggregate review stats
  SELECT
    COALESCE(AVG(r.rating)::DECIMAL(3,2), 0.00) as avg_rating,
    COUNT(r.id)::INT as review_count
  INTO stats
  FROM reviews r
  WHERE r.reviewee_id = p_user_id;

  -- Upsert into seller_stats
  INSERT INTO seller_stats (user_id, avg_rating, review_count, member_since, updated_at)
  VALUES (
    p_user_id,
    stats.avg_rating,
    stats.review_count,
    (SELECT created_at::DATE FROM users WHERE id = p_user_id),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    avg_rating = EXCLUDED.avg_rating,
    review_count = EXCLUDED.review_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ─── 9. RENTAL STATUS TRACKING ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS rental_status_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id   UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  from_status VARCHAR(30),
  to_status   VARCHAR(30) NOT NULL,
  changed_by  UUID REFERENCES users(id),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rental_status_history_rental ON rental_status_history(rental_id);

-- Automatically log status changes
CREATE OR REPLACE FUNCTION log_rental_status_change()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO rental_status_history (rental_id, from_status, to_status, changed_by, notes)
  VALUES (NEW.id, OLD.status, NEW.status, NEW.approved_by, 'Status updated');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rental_status_change ON rentals;
CREATE TRIGGER rental_status_change AFTER UPDATE OF status ON rentals
  FOR EACH ROW EXECUTE FUNCTION log_rental_status_change();

-- ─── 10. AVAILABILITY CALENDAR ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS item_availability_blocks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id     UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  start_date  DATE NOT NULL,
  end_date    DATE NOT NULL CHECK (end_date >= start_date),
  reason      VARCHAR(100),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_avail_item ON item_availability_blocks(item_id);
CREATE INDEX IF NOT EXISTS idx_avail_dates ON item_availability_blocks(item_id, start_date, end_date);

-- Add date range columns to rentals for calendar lookups
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS end_date DATE;

-- Function to check if a date range is available for an item
CREATE OR REPLACE FUNCTION is_item_available(p_item_id UUID, p_start DATE, p_end DATE)
RETURNS BOOLEAN AS $$
DECLARE
  conflict_count INT;
BEGIN
  -- Check rental conflicts (active/scheduled/approved rentals overlapping)
  SELECT COUNT(*) INTO conflict_count
  FROM rentals
  WHERE item_id = p_item_id
    AND status IN ('approved', 'scheduled', 'active')
    AND start_date IS NOT NULL AND end_date IS NOT NULL
    AND daterange(start_date, end_date, '[]') && daterange(p_start, p_end, '[]');

  IF conflict_count > 0 THEN RETURN FALSE; END IF;

  -- Check seller blocks
  SELECT COUNT(*) INTO conflict_count
  FROM item_availability_blocks
  WHERE item_id = p_item_id
    AND daterange(start_date, end_date, '[]') && daterange(p_start, p_end, '[]');

  RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;
