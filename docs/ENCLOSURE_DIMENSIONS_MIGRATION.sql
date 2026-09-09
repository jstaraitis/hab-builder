-- Enclosure dimensions
--
-- The planner has always known how big an enclosure should be
-- (AnimalProfile.minEnclosureSize) and validateEnclosureSize has always been
-- able to check it — but only against the planner's throwaway input. The saved
-- enclosure record never stored dimensions, so nothing could tell a keeper
-- their actual tank was undersized.
--
-- Size is the single most consequential husbandry factor and the one problem
-- equipment can't fix, so Habitat Score can't be complete without it.

ALTER TABLE enclosures
ADD COLUMN IF NOT EXISTS width_inches NUMERIC,
ADD COLUMN IF NOT EXISTS depth_inches NUMERIC,
ADD COLUMN IF NOT EXISTS height_inches NUMERIC;

COMMENT ON COLUMN enclosures.width_inches IS 'Interior width in inches. Stored in inches regardless of the unit the keeper entered; the UI converts for display.';
COMMENT ON COLUMN enclosures.depth_inches IS 'Interior depth in inches.';
COMMENT ON COLUMN enclosures.height_inches IS 'Interior height in inches.';

-- Dimensions stay NULL until a keeper fills them in. Habitat Score reports the
-- size check as "not assessed" rather than guessing or failing them for it.
