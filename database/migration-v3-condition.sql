-- Update items condition constraint to v3 values
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_condition_check;
ALTER TABLE items ADD CONSTRAINT items_condition_check
  CHECK (condition IN ('New', 'Mint', 'Good', 'Fair', 'Poor'));

-- Migrate existing rows from old to new values
UPDATE items SET condition = 'Mint' WHERE condition = 'excellent';
UPDATE items SET condition = 'Good' WHERE condition = 'good';
UPDATE items SET condition = 'Fair' WHERE condition = 'fair';
UPDATE items SET condition = 'Poor' WHERE condition = 'poor';

-- Damage waiver / theft protection columns (if not yet applied)
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS damage_waiver_opted BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS damage_waiver_fee DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE rentals ADD COLUMN IF NOT EXISTS theft_protection_acknowledged BOOLEAN NOT NULL DEFAULT false;
