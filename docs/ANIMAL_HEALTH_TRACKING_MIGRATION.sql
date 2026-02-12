-- =====================================================
-- Animal Health & Tracking Features - Database Schema
-- =====================================================
-- This migration adds comprehensive animal tracking:
-- 1. Animal source/acquisition info (existing table extension)
-- 2. Shedding logs
-- 3. Brumation/hibernation logs
-- 4. Vet records
-- 5. Length measurements
-- =====================================================

-- =====================================================
-- 1. Extend enclosure_animals table
-- =====================================================
-- Add basic animal info fields
ALTER TABLE enclosure_animals
ADD COLUMN IF NOT EXISTS source TEXT, -- 'breeder', 'pet-store', 'rescue', 'wild-caught', 'bred-by-me', 'adopted', 'other'
ADD COLUMN IF NOT EXISTS source_details TEXT, -- Name of breeder, store, rescue org, etc.
ADD COLUMN IF NOT EXISTS acquisition_date DATE,
ADD COLUMN IF NOT EXISTS acquisition_price NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS acquisition_notes TEXT;

-- Add index for querying by source
CREATE INDEX IF NOT EXISTS idx_enclosure_animals_source ON enclosure_animals(source);
CREATE INDEX IF NOT EXISTS idx_enclosure_animals_acquisition_date ON enclosure_animals(acquisition_date);

-- =====================================================
-- 2. Shedding Logs Table
-- =====================================================
-- Tracks shed events and quality
CREATE TABLE IF NOT EXISTS shed_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enclosure_animal_id UUID NOT NULL REFERENCES enclosure_animals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shed_date DATE NOT NULL,
  
  -- Shed quality/completeness
  quality TEXT CHECK (quality IN ('complete', 'incomplete', 'stuck-shed', 'assisted')),
  
  -- Details
  shed_in_one_piece BOOLEAN DEFAULT NULL, -- true if full body shed in one piece
  problem_areas TEXT[], -- e.g., ['toes', 'tail-tip', 'eye-caps']
  humidity_percent INTEGER, -- Tank humidity during shed
  
  -- Observations
  notes TEXT,
  photos TEXT[], -- Array of image URLs
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shed_logs_animal_id ON shed_logs(enclosure_animal_id);
CREATE INDEX IF NOT EXISTS idx_shed_logs_user_id ON shed_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_shed_logs_date ON shed_logs(shed_date DESC);
CREATE INDEX IF NOT EXISTS idx_shed_logs_quality ON shed_logs(quality);

-- RLS Policies
ALTER TABLE shed_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own shed logs"
  ON shed_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shed logs"
  ON shed_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shed logs"
  ON shed_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shed logs"
  ON shed_logs FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 3. Brumation Logs Table
-- =====================================================
-- Tracks brumation/hibernation periods for reptiles
CREATE TABLE IF NOT EXISTS brumation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enclosure_animal_id UUID NOT NULL REFERENCES enclosure_animals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Period tracking
  start_date DATE NOT NULL,
  end_date DATE, -- NULL if still in brumation
  duration_days INTEGER, -- Auto-calculated
  
  -- Conditions
  temperature_low INTEGER, -- Lowest temp in Fahrenheit
  temperature_high INTEGER, -- Highest temp in Fahrenheit
  
  -- Behavior notes
  activity_level TEXT CHECK (activity_level IN ('inactive', 'occasional-movement', 'restless', 'normal')),
  eating_during BOOLEAN DEFAULT false,
  drinking_during BOOLEAN DEFAULT true,
  weight_loss_grams NUMERIC(10,2), -- Weight lost during brumation
  
  -- Notes
  preparation_notes TEXT, -- What you did to prepare
  notes TEXT, -- General observations
  photos TEXT[], -- Array of image URLs
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_brumation_logs_animal_id ON brumation_logs(enclosure_animal_id);
CREATE INDEX IF NOT EXISTS idx_brumation_logs_user_id ON brumation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_brumation_logs_start_date ON brumation_logs(start_date DESC);
CREATE INDEX IF NOT EXISTS idx_brumation_logs_active ON brumation_logs(end_date) WHERE end_date IS NULL;

-- RLS Policies
ALTER TABLE brumation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own brumation logs"
  ON brumation_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own brumation logs"
  ON brumation_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own brumation logs"
  ON brumation_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own brumation logs"
  ON brumation_logs FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 4. Vet Records Table
-- =====================================================
-- Tracks veterinary visits and health records
CREATE TABLE IF NOT EXISTS vet_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enclosure_animal_id UUID NOT NULL REFERENCES enclosure_animals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Visit info
  visit_date DATE NOT NULL,
  visit_type TEXT NOT NULL CHECK (visit_type IN ('checkup', 'illness', 'injury', 'surgery', 'emergency', 'follow-up', 'other')),
  
  -- Vet info
  vet_name TEXT,
  clinic_name TEXT,
  clinic_phone TEXT,
  
  -- Health details
  chief_complaint TEXT, -- Why you went
  diagnosis TEXT,
  treatment TEXT,
  prescriptions TEXT[], -- Array of medications prescribed
  
  -- Cost tracking
  cost NUMERIC(10,2),
  currency TEXT DEFAULT 'USD',
  
  -- Follow-up
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_date DATE,
  follow_up_notes TEXT,
  
  -- Documents
  notes TEXT,
  documents TEXT[], -- Array of document URLs (PDFs, images)
  photos TEXT[], -- Array of photo URLs
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vet_records_animal_id ON vet_records(enclosure_animal_id);
CREATE INDEX IF NOT EXISTS idx_vet_records_user_id ON vet_records(user_id);
CREATE INDEX IF NOT EXISTS idx_vet_records_visit_date ON vet_records(visit_date DESC);
CREATE INDEX IF NOT EXISTS idx_vet_records_visit_type ON vet_records(visit_type);
CREATE INDEX IF NOT EXISTS idx_vet_records_follow_up ON vet_records(follow_up_date) WHERE follow_up_needed = true;

-- RLS Policies
ALTER TABLE vet_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own vet records"
  ON vet_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vet records"
  ON vet_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vet records"
  ON vet_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vet records"
  ON vet_records FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 5. Length Logs Table
-- =====================================================
-- Tracks animal length measurements (similar to weight_logs)
CREATE TABLE IF NOT EXISTS length_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enclosure_animal_id UUID NOT NULL REFERENCES enclosure_animals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Measurement
  date DATE NOT NULL,
  length NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('inches', 'cm', 'feet', 'meters')),
  
  -- Measurement details
  measurement_type TEXT CHECK (measurement_type IN ('snout-to-vent', 'total-length', 'carapace-length', 'other')),
  
  -- Context
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_length_logs_animal_id ON length_logs(enclosure_animal_id);
CREATE INDEX IF NOT EXISTS idx_length_logs_user_id ON length_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_length_logs_date ON length_logs(date DESC);

-- RLS Policies
ALTER TABLE length_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own length logs"
  ON length_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own length logs"
  ON length_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own length logs"
  ON length_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own length logs"
  ON length_logs FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Triggers for updated_at timestamps
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all new tables
CREATE TRIGGER update_shed_logs_updated_at
  BEFORE UPDATE ON shed_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brumation_logs_updated_at
  BEFORE UPDATE ON brumation_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vet_records_updated_at
  BEFORE UPDATE ON vet_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_length_logs_updated_at
  BEFORE UPDATE ON length_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Auto-calculate duration_days for brumation_logs
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_brumation_duration()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_date IS NOT NULL THEN
    NEW.duration_days = NEW.end_date - NEW.start_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_brumation_duration_trigger
  BEFORE INSERT OR UPDATE ON brumation_logs
  FOR EACH ROW
  EXECUTE FUNCTION calculate_brumation_duration();

-- =====================================================
-- Comments for documentation
-- =====================================================
COMMENT ON TABLE shed_logs IS 'Tracks reptile/amphibian shed events and quality';
COMMENT ON TABLE brumation_logs IS 'Tracks brumation/hibernation periods for reptiles';
COMMENT ON TABLE vet_records IS 'Tracks veterinary visits and health records';
COMMENT ON TABLE length_logs IS 'Tracks animal length measurements over time';

COMMENT ON COLUMN shed_logs.quality IS 'Quality of shed: complete, incomplete, stuck-shed, or assisted';
COMMENT ON COLUMN shed_logs.problem_areas IS 'Body parts with shed problems: toes, tail-tip, eye-caps, etc.';
COMMENT ON COLUMN brumation_logs.activity_level IS 'Activity during brumation: inactive, occasional-movement, restless, normal';
COMMENT ON COLUMN vet_records.visit_type IS 'Type of vet visit: checkup, illness, injury, surgery, emergency, follow-up, other';
COMMENT ON COLUMN length_logs.measurement_type IS 'How length was measured: snout-to-vent (SVL), total-length, carapace-length, etc.';
