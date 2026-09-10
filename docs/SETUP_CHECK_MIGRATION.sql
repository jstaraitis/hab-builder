-- Migration: Setup Check answers
-- Purpose: Store the placement and configuration measurements behind the Setup
--          Check, so the result can be revisited, re-run after a rebuild, and
--          fed into Habitat Score.
-- Date: 2026-09-10
--
-- These live on `enclosures` rather than in a separate answers table because
-- they describe the enclosure itself, not an event. There is one current answer
-- per enclosure — "where is the probe right now" — and keeping it on the row
-- means every existing read of an enclosure gets it for free.
--
-- All columns are nullable on purpose. A blank answer means "not told", and the
-- engine skips that rule rather than assuming a default. Defaulting any of
-- these would silently turn an unanswered question into a passed check, which
-- is the failure mode this whole feature exists to avoid.

ALTER TABLE enclosures
  ADD COLUMN IF NOT EXISTS uvb_distance_inches NUMERIC,
  ADD COLUMN IF NOT EXISTS uvb_over_mesh BOOLEAN,
  ADD COLUMN IF NOT EXISTS basking_to_cool_inches NUMERIC,
  ADD COLUMN IF NOT EXISTS hides_warm_side INTEGER,
  ADD COLUMN IF NOT EXISTS hides_cool_side INTEGER,
  ADD COLUMN IF NOT EXISTS water_position TEXT,
  ADD COLUMN IF NOT EXISTS probe_location TEXT,
  ADD COLUMN IF NOT EXISTS heat_source TEXT,
  ADD COLUMN IF NOT EXISTS heat_on_thermostat BOOLEAN,
  -- When the check was last completed. Drives the "re-check after changes"
  -- prompt: a setup checked eighteen months and one rebuild ago is stale.
  ADD COLUMN IF NOT EXISTS setup_checked_at TIMESTAMPTZ;

-- Bounds rather than defaults. These reject nonsense without inventing values.
ALTER TABLE enclosures
  DROP CONSTRAINT IF EXISTS enclosures_uvb_distance_sane;
ALTER TABLE enclosures
  ADD CONSTRAINT enclosures_uvb_distance_sane
  CHECK (uvb_distance_inches IS NULL OR (uvb_distance_inches > 0 AND uvb_distance_inches < 120));

ALTER TABLE enclosures
  DROP CONSTRAINT IF EXISTS enclosures_hides_sane;
ALTER TABLE enclosures
  ADD CONSTRAINT enclosures_hides_sane
  CHECK (
    (hides_warm_side IS NULL OR (hides_warm_side >= 0 AND hides_warm_side <= 50)) AND
    (hides_cool_side IS NULL OR (hides_cool_side >= 0 AND hides_cool_side <= 50))
  );

COMMENT ON COLUMN enclosures.uvb_distance_inches IS
  'Inches from the UVB lamp to the basking surface. NULL means not answered — the UVB distance rule is skipped, not passed.';
COMMENT ON COLUMN enclosures.probe_location IS
  'Where the thermostat probe sits: basking-surface | ambient-warm | cool-end | none | unknown.';
COMMENT ON COLUMN enclosures.water_position IS
  'Where the water dish sits: warm-end | middle | cool-end | none.';
COMMENT ON COLUMN enclosures.heat_source IS
  'overhead-bulb | ceramic-emitter | deep-heat-projector | heat-mat | radiant-panel | none.';
COMMENT ON COLUMN enclosures.setup_checked_at IS
  'When the Setup Check was last completed for this enclosure.';

-- Verify
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'enclosures'
  AND column_name IN (
    'uvb_distance_inches', 'uvb_over_mesh', 'basking_to_cool_inches',
    'hides_warm_side', 'hides_cool_side', 'water_position',
    'probe_location', 'heat_source', 'heat_on_thermostat', 'setup_checked_at'
  )
ORDER BY column_name;
