-- Item verification & media support

-- Add columns to items table
ALTER TABLE items ADD COLUMN IF NOT EXISTS verified_status VARCHAR(20) DEFAULT 'unverified' CHECK (verified_status IN ('pending', 'verified', 'unverified'));
ALTER TABLE items ADD COLUMN IF NOT EXISTS video_url VARCHAR(500);

-- Item verifications table for product-level KYC
CREATE TABLE IF NOT EXISTS item_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    purchase_receipt_url VARCHAR(500),
    serial_number VARCHAR(100),
    original_box_photo_url VARCHAR(500),
    damage_photo_url VARCHAR(500),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for updated_at (dropped first to avoid errors on re-run)
DROP TRIGGER IF EXISTS update_item_verifications_updated_at ON item_verifications;
CREATE TRIGGER update_item_verifications_updated_at BEFORE UPDATE ON item_verifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();