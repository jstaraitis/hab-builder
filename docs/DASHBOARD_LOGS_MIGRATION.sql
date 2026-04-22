-- =====================================================
-- Dashboard Logs Migration
-- =====================================================
-- Adds 4 new tracking tables:
-- 1) poop_logs
-- 2) temp_logs
-- 3) humidity_logs
-- 4) uvb_logs
--
-- Run this in Supabase SQL Editor.
-- =====================================================

-- Shared trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 1) Poop Logs
-- =====================================================
CREATE TABLE IF NOT EXISTS poop_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enclosure_animal_id UUID NOT NULL REFERENCES enclosure_animals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consistency TEXT CHECK (consistency IN ('normal', 'soft', 'runny', 'hard', 'dry', 'watery', 'mucus', 'bloody', 'unknown')),
  color TEXT,
  amount TEXT CHECK (amount IN ('small', 'medium', 'large', 'unknown')),
  urate_present BOOLEAN,
  parasites_seen BOOLEAN,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_poop_logs_animal_id ON poop_logs(enclosure_animal_id);
CREATE INDEX IF NOT EXISTS idx_poop_logs_user_id ON poop_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_poop_logs_logged_at ON poop_logs(logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_poop_logs_animal_logged_at ON poop_logs(enclosure_animal_id, logged_at DESC);

ALTER TABLE poop_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own poop logs"
  ON poop_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own poop logs"
  ON poop_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own poop logs"
  ON poop_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own poop logs"
  ON poop_logs FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trigger_update_poop_logs_updated_at ON poop_logs;
CREATE TRIGGER trigger_update_poop_logs_updated_at
  BEFORE UPDATE ON poop_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2) Temperature Logs
-- =====================================================
CREATE TABLE IF NOT EXISTS temp_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enclosure_id UUID REFERENCES enclosures(id) ON DELETE CASCADE,
  enclosure_animal_id UUID NOT NULL REFERENCES enclosure_animals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  temperature_value NUMERIC(6,2) NOT NULL,
  unit TEXT NOT NULL DEFAULT 'f' CHECK (unit IN ('f', 'c')),
  zone TEXT CHECK (zone IN ('ambient', 'basking', 'cool', 'water', 'substrate', 'other')),
  device_name TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_temp_logs_animal_id ON temp_logs(enclosure_animal_id);
CREATE INDEX IF NOT EXISTS idx_temp_logs_enclosure_id ON temp_logs(enclosure_id);
CREATE INDEX IF NOT EXISTS idx_temp_logs_user_id ON temp_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_logs_recorded_at ON temp_logs(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_temp_logs_animal_recorded_at ON temp_logs(enclosure_animal_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_temp_logs_enclosure_recorded_at ON temp_logs(enclosure_id, recorded_at DESC);

ALTER TABLE temp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own temp logs"
  ON temp_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own temp logs"
  ON temp_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own temp logs"
  ON temp_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own temp logs"
  ON temp_logs FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trigger_update_temp_logs_updated_at ON temp_logs;
CREATE TRIGGER trigger_update_temp_logs_updated_at
  BEFORE UPDATE ON temp_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3) Humidity Logs
-- =====================================================
CREATE TABLE IF NOT EXISTS humidity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enclosure_id UUID REFERENCES enclosures(id) ON DELETE CASCADE,
  enclosure_animal_id UUID NOT NULL REFERENCES enclosure_animals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  humidity_percent INTEGER NOT NULL CHECK (humidity_percent >= 0 AND humidity_percent <= 100),
  zone TEXT CHECK (zone IN ('ambient', 'hide', 'substrate', 'water', 'other')),
  device_name TEXT,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_humidity_logs_animal_id ON humidity_logs(enclosure_animal_id);
CREATE INDEX IF NOT EXISTS idx_humidity_logs_enclosure_id ON humidity_logs(enclosure_id);
CREATE INDEX IF NOT EXISTS idx_humidity_logs_user_id ON humidity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_humidity_logs_recorded_at ON humidity_logs(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_humidity_logs_animal_recorded_at ON humidity_logs(enclosure_animal_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_humidity_logs_enclosure_recorded_at ON humidity_logs(enclosure_id, recorded_at DESC);

ALTER TABLE humidity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own humidity logs"
  ON humidity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own humidity logs"
  ON humidity_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own humidity logs"
  ON humidity_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own humidity logs"
  ON humidity_logs FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trigger_update_humidity_logs_updated_at ON humidity_logs;
CREATE TRIGGER trigger_update_humidity_logs_updated_at
  BEFORE UPDATE ON humidity_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4) UVB Logs
-- =====================================================
CREATE TABLE IF NOT EXISTS uvb_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enclosure_id UUID REFERENCES enclosures(id) ON DELETE CASCADE,
  enclosure_animal_id UUID NOT NULL REFERENCES enclosure_animals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uv_index NUMERIC(6,2) CHECK (uv_index >= 0),
  bulb_type TEXT,
  zone TEXT CHECK (zone IN ('basking', 'ambient', 'other')),
  distance_cm NUMERIC(7,2) CHECK (distance_cm >= 0),
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uvb_logs_animal_id ON uvb_logs(enclosure_animal_id);
CREATE INDEX IF NOT EXISTS idx_uvb_logs_enclosure_id ON uvb_logs(enclosure_id);
CREATE INDEX IF NOT EXISTS idx_uvb_logs_user_id ON uvb_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_uvb_logs_recorded_at ON uvb_logs(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_uvb_logs_animal_recorded_at ON uvb_logs(enclosure_animal_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_uvb_logs_enclosure_recorded_at ON uvb_logs(enclosure_id, recorded_at DESC);

ALTER TABLE uvb_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own uvb logs"
  ON uvb_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uvb logs"
  ON uvb_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uvb logs"
  ON uvb_logs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uvb logs"
  ON uvb_logs FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trigger_update_uvb_logs_updated_at ON uvb_logs;
CREATE TRIGGER trigger_update_uvb_logs_updated_at
  BEFORE UPDATE ON uvb_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Backward-compatible schema updates for existing deployments
ALTER TABLE temp_logs ADD COLUMN IF NOT EXISTS enclosure_id UUID REFERENCES enclosures(id) ON DELETE CASCADE;
ALTER TABLE humidity_logs ADD COLUMN IF NOT EXISTS enclosure_id UUID REFERENCES enclosures(id) ON DELETE CASCADE;
ALTER TABLE uvb_logs ADD COLUMN IF NOT EXISTS enclosure_id UUID REFERENCES enclosures(id) ON DELETE CASCADE;

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE poop_logs IS 'Tracks stool/feces events for each animal';
COMMENT ON TABLE temp_logs IS 'Tracks enclosure temperature measurements';
COMMENT ON TABLE humidity_logs IS 'Tracks enclosure humidity measurements';
COMMENT ON TABLE uvb_logs IS 'Tracks UVB/UVI measurements and lamp context';
