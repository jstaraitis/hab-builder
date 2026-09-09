-- UVB bulb lifecycle: store which kind of bulb is installed.
--
-- uvb_bulb_installed_on and uvb_replace_due_on already exist. What was missing
-- is the bulb TYPE, without which we can't know the lifespan — a T5 HO lasts
-- 12 months while a compact coil lasts 6, so a single global interval is wrong
-- by 2x in one direction or the other for most users.

ALTER TABLE enclosures
ADD COLUMN IF NOT EXISTS uvb_bulb_type TEXT;

ALTER TABLE enclosures
DROP CONSTRAINT IF EXISTS valid_uvb_bulb_type;

ALTER TABLE enclosures
ADD CONSTRAINT valid_uvb_bulb_type
CHECK (uvb_bulb_type IS NULL OR uvb_bulb_type IN (
  'compact', 't8', 't5-ho', 'mercury-vapor', 'metal-halide', 'unknown'
));

COMMENT ON COLUMN enclosures.uvb_bulb_type IS
  'UVB bulb technology, which determines replacement interval. NULL means not yet recorded; the app treats that as ''unknown'' and assumes the shortest (6 month) lifespan.';

-- Existing enclosures that already have a bulb date but no type: mark them
-- 'unknown' so they get conservative 6-month tracking instead of being skipped.
UPDATE enclosures
SET uvb_bulb_type = 'unknown'
WHERE uvb_bulb_installed_on IS NOT NULL
  AND uvb_bulb_type IS NULL;
