-- Return Flow & Vision Analysis Tables
-- Run this manually in Neon SQL editor

CREATE TABLE IF NOT EXISTS return_flow_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  phase VARCHAR(20) NOT NULL CHECK (phase IN ('checkout', 'checkin')),
  image_url TEXT NOT NULL,
  view VARCHAR(50) DEFAULT 'front',
  captured_by UUID REFERENCES users(id),
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_return_flow_rental_phase ON return_flow_photos(rental_id, phase);

CREATE TABLE IF NOT EXISTS vision_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rental_id UUID NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
  checkout_phase_id UUID REFERENCES return_flow_photos(id),
  checkin_phase_id UUID REFERENCES return_flow_photos(id),
  integrity_valid BOOLEAN DEFAULT false,
  match_verified BOOLEAN DEFAULT false,
  anomaly_detected BOOLEAN DEFAULT false,
  damage_classification VARCHAR(50),
  severity_score DECIMAL(5,3) DEFAULT 0,
  settlement_action VARCHAR(30),
  settlement_amount DECIMAL(12,2) DEFAULT 0,
  settled BOOLEAN DEFAULT false,
  settled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vision_analyses_rental ON vision_analyses(rental_id);
