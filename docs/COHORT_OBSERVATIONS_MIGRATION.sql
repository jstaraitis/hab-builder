-- Migration: Cohort observations (growth benchmarking foundation)
-- Purpose: Accumulate anonymised weight-at-age observations so that, once
--          enough keepers are contributing, the app can show growth percentiles
--          for a species — the reptile equivalent of a paediatric growth chart,
--          which does not currently exist for most exotics.
-- Date: 2026-09-10
--
-- WHY A SEPARATE TABLE
-- The data needed for cohort statistics already exists across weight_logs and
-- enclosure_animals, and could in principle be aggregated by joining them. That
-- was rejected deliberately:
--
--   1. Privacy. Aggregating live user tables means the cohort endpoint holds a
--      handle on everyone's animals. This table carries no names, no notes, no
--      photos and no enclosure — only species, sex, age in days, and weight.
--      There is nothing in a row that identifies a keeper or an animal.
--   2. Consent is revocable. A keeper who opts out has their observations
--      deleted from here without touching their own records, which stay intact
--      and private in weight_logs.
--   3. Correctness. Cohort curves must be reproducible over time. Deriving them
--      live means a keeper correcting a typo silently rewrites history for
--      everyone.
--
-- WHAT IS DELIBERATELY NOT STORED
--   - user_id. Never. Not even hashed.
--   - Exact timestamps. `observed_on` is a DATE, because a precise time of day
--     across a small population starts to be a fingerprint.
--   - Animal name, morph, notes, location.
--
-- `animal_key` is a random per-animal UUID that lives on enclosure_animals. It
-- exists so repeated weigh-ins of one animal can be down-weighted rather than
-- letting a single diligent keeper dominate a species curve. It is not the
-- animal's real id and cannot be resolved back to one without the owner's row.

-- ---------------------------------------------------------------------------
-- Step 1: Per-animal pseudonym
-- ---------------------------------------------------------------------------

ALTER TABLE enclosure_animals
ADD COLUMN IF NOT EXISTS cohort_key UUID DEFAULT gen_random_uuid();

-- Backfill any rows created before the column existed.
UPDATE enclosure_animals
SET cohort_key = gen_random_uuid()
WHERE cohort_key IS NULL;

COMMENT ON COLUMN enclosure_animals.cohort_key IS
  'Random pseudonym used to group this animal''s anonymised cohort observations. Not derived from the animal id; safe to publish in aggregate.';

-- ---------------------------------------------------------------------------
-- Step 2: Contribution consent
-- ---------------------------------------------------------------------------
-- Defaults to TRUE. The stored data is non-identifying (species, sex, age,
-- weight), and a benchmark is only useful if most keepers contribute. The
-- setting is surfaced in the profile screen with plain-language copy, and
-- turning it off deletes prior contributions rather than merely stopping new
-- ones. If you would rather ship this opt-in, change the default to FALSE here
-- — nothing in the application code assumes either default.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS contributes_cohort_data BOOLEAN NOT NULL DEFAULT TRUE;

COMMENT ON COLUMN profiles.contributes_cohort_data IS
  'Whether this keeper''s anonymised weight-at-age observations feed species growth benchmarks. Turning it off deletes existing contributions.';

-- ---------------------------------------------------------------------------
-- Step 3: The observations
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS cohort_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  species_id TEXT NOT NULL,
  sex TEXT,                       -- 'male' | 'female' | 'unknown'
  age_days INTEGER NOT NULL CHECK (age_days >= 0 AND age_days <= 36500),
  weight_grams NUMERIC NOT NULL CHECK (weight_grams > 0 AND weight_grams < 500000),
  observed_on DATE NOT NULL,

  animal_key UUID NOT NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One observation per animal per day. A keeper who weighs twice in an
  -- afternoon should not count twice.
  UNIQUE (animal_key, observed_on)
);

-- The cohort query is always "this species, ordered by age".
CREATE INDEX IF NOT EXISTS idx_cohort_species_age
  ON cohort_observations(species_id, age_days);

-- Supports deleting a keeper's contributions when they opt out.
CREATE INDEX IF NOT EXISTS idx_cohort_animal_key
  ON cohort_observations(animal_key);

-- ---------------------------------------------------------------------------
-- Step 4: Row level security
-- ---------------------------------------------------------------------------

ALTER TABLE cohort_observations ENABLE ROW LEVEL SECURITY;

-- Insert is allowed for signed-in users. There is no user_id to forge and no
-- way to read the table back, so the worst a bad actor achieves is polluting
-- their own species curve — which the percentile maths already resists, and
-- which the CHECK constraints bound.
CREATE POLICY "cohort_insert_authenticated" ON cohort_observations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Deliberately NO SELECT policy. Individual observations are never readable by
-- clients, only aggregates via the `cohort-stats` edge function, which runs
-- with the service role and refuses to return a bucket below the minimum
-- sample size. Same pattern as analytics_events.

-- Deliberately NO UPDATE policy — observations are immutable once written.

-- Deletion is handled server-side on opt-out, via the service role.

-- ---------------------------------------------------------------------------
-- Step 5: Verify
-- ---------------------------------------------------------------------------

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cohort_observations'
ORDER BY ordinal_position;

-- How close is each species to being reportable? Percentiles need enough
-- DISTINCT ANIMALS, not enough rows — one keeper weighing weekly for a year is
-- 52 rows and still a sample size of one.
SELECT
  species_id,
  COUNT(DISTINCT animal_key) AS animals,
  COUNT(*)                   AS observations,
  MIN(age_days)              AS youngest_age_days,
  MAX(age_days)              AS oldest_age_days
FROM cohort_observations
GROUP BY species_id
ORDER BY animals DESC;
