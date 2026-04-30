-- =====================================================
-- Enclosure Experience Tracking Migration
-- =====================================================
-- Adds:
-- 1) Baseline enclosure configuration fields
-- 2) enclosure_snapshots table (periodic state checks)
-- 3) enclosure_events table (timeline events and interventions)
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
-- 1) Baseline enclosure configuration fields
-- =====================================================
ALTER TABLE enclosures
ADD COLUMN IF NOT EXISTS substrate_depth_inches NUMERIC(5,2) CHECK (substrate_depth_inches >= 0),
ADD COLUMN IF NOT EXISTS drainage_layer_depth_inches NUMERIC(5,2) CHECK (drainage_layer_depth_inches >= 0),
ADD COLUMN IF NOT EXISTS bioactive_started_on DATE,
ADD COLUMN IF NOT EXISTS uvb_bulb_installed_on DATE,
ADD COLUMN IF NOT EXISTS uvb_replace_due_on DATE,
ADD COLUMN IF NOT EXISTS misting_system_type TEXT,
ADD COLUMN IF NOT EXISTS lighting_schedule_hours NUMERIC(4,2) CHECK (lighting_schedule_hours >= 0 AND lighting_schedule_hours <= 24),
ADD COLUMN IF NOT EXISTS baseline_day_temp_target NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS baseline_night_temp_target NUMERIC(6,2),
ADD COLUMN IF NOT EXISTS baseline_humidity_min_target INTEGER CHECK (baseline_humidity_min_target >= 0 AND baseline_humidity_min_target <= 100),
ADD COLUMN IF NOT EXISTS baseline_humidity_max_target INTEGER CHECK (baseline_humidity_max_target >= 0 AND baseline_humidity_max_target <= 100);

COMMENT ON COLUMN enclosures.substrate_depth_inches IS 'Nominal substrate depth in inches';
COMMENT ON COLUMN enclosures.drainage_layer_depth_inches IS 'Drainage layer depth in inches (bioactive setups)';
COMMENT ON COLUMN enclosures.bioactive_started_on IS 'Date bioactive cycle was started';
COMMENT ON COLUMN enclosures.uvb_bulb_installed_on IS 'Date current UVB bulb was installed';
COMMENT ON COLUMN enclosures.uvb_replace_due_on IS 'Planned UVB bulb replacement date';
COMMENT ON COLUMN enclosures.misting_system_type IS 'Misting approach, e.g. hand-mist, auto-mister, fogger';
COMMENT ON COLUMN enclosures.lighting_schedule_hours IS 'Daily lighting duration in hours';
COMMENT ON COLUMN enclosures.baseline_day_temp_target IS 'Typical daytime target temperature';
COMMENT ON COLUMN enclosures.baseline_night_temp_target IS 'Typical nighttime target temperature';
COMMENT ON COLUMN enclosures.baseline_humidity_min_target IS 'Target minimum humidity percentage';
COMMENT ON COLUMN enclosures.baseline_humidity_max_target IS 'Target maximum humidity percentage';

-- =====================================================
-- 2) Enclosure snapshots (periodic checks)
-- =====================================================
CREATE TABLE IF NOT EXISTS enclosure_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enclosure_id UUID NOT NULL REFERENCES enclosures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  day_warm_temp NUMERIC(6,2),
  day_cool_temp NUMERIC(6,2),
  night_temp NUMERIC(6,2),

  humidity_min INTEGER CHECK (humidity_min >= 0 AND humidity_min <= 100),
  humidity_max INTEGER CHECK (humidity_max >= 0 AND humidity_max <= 100),

  substrate_moisture_score INTEGER CHECK (substrate_moisture_score BETWEEN 1 AND 5),
  substrate_compaction_score INTEGER CHECK (substrate_compaction_score BETWEEN 1 AND 5),
  mold_severity TEXT CHECK (mold_severity IN ('none', 'light', 'moderate', 'heavy')),
  cleanup_crew_activity_score INTEGER CHECK (cleanup_crew_activity_score BETWEEN 1 AND 5),
  plant_health_score INTEGER CHECK (plant_health_score BETWEEN 1 AND 5),

  notes TEXT,
  photo_urls TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enclosure_snapshots_enclosure_id ON enclosure_snapshots(enclosure_id);
CREATE INDEX IF NOT EXISTS idx_enclosure_snapshots_user_id ON enclosure_snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_enclosure_snapshots_recorded_at ON enclosure_snapshots(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_enclosure_snapshots_enclosure_recorded_at ON enclosure_snapshots(enclosure_id, recorded_at DESC);

ALTER TABLE enclosure_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enclosure snapshots"
  ON enclosure_snapshots FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enclosure snapshots"
  ON enclosure_snapshots FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enclosure snapshots"
  ON enclosure_snapshots FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enclosure snapshots"
  ON enclosure_snapshots FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trigger_update_enclosure_snapshots_updated_at ON enclosure_snapshots;
CREATE TRIGGER trigger_update_enclosure_snapshots_updated_at
  BEFORE UPDATE ON enclosure_snapshots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3) Enclosure events (timeline and interventions)
-- =====================================================
CREATE TABLE IF NOT EXISTS enclosure_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  enclosure_id UUID NOT NULL REFERENCES enclosures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  event_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'substrate_installed',
    'substrate_top_off',
    'substrate_partial_change',
    'substrate_full_change',
    'mold_bloom_started',
    'mold_bloom_resolved',
    'cleanup_crew_added',
    'cleanup_crew_restocked',
    'plant_added',
    'plant_pruned',
    'plant_replaced',
    'equipment_probe_moved',
    'uvb_bulb_replaced',
    'mister_nozzle_cleaned',
    'humidity_crash_incident',
    'pest_detected',
    'pest_resolved',
    'custom'
  )),
  severity TEXT CHECK (severity IN ('info', 'watch', 'caution', 'critical')),
  quantity_value NUMERIC(10,2),
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  photo_urls TEXT[] DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enclosure_events_enclosure_id ON enclosure_events(enclosure_id);
CREATE INDEX IF NOT EXISTS idx_enclosure_events_user_id ON enclosure_events(user_id);
CREATE INDEX IF NOT EXISTS idx_enclosure_events_event_date ON enclosure_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_enclosure_events_enclosure_event_date ON enclosure_events(enclosure_id, event_date DESC);
CREATE INDEX IF NOT EXISTS idx_enclosure_events_event_type ON enclosure_events(event_type);

ALTER TABLE enclosure_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own enclosure events"
  ON enclosure_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own enclosure events"
  ON enclosure_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own enclosure events"
  ON enclosure_events FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own enclosure events"
  ON enclosure_events FOR DELETE
  USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS trigger_update_enclosure_events_updated_at ON enclosure_events;
CREATE TRIGGER trigger_update_enclosure_events_updated_at
  BEFORE UPDATE ON enclosure_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE enclosure_snapshots IS 'Periodic enclosure check-ins for environment and ecosystem health';
COMMENT ON TABLE enclosure_events IS 'Enclosure lifecycle timeline events and interventions';
