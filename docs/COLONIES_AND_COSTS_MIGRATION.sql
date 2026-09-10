-- Migration: Feeder colonies and cost tracking
-- Purpose: Support the two features together — a colony's cost-per-feeder is an
--          input to cost-of-keeping, so splitting them into separate migrations
--          would mean running two to make either useful.
-- Date: 2026-09-10
--
-- Everything here is additive and nullable. A keeper who never records a price
-- gets the same app they had; the cost engine reports which categories are
-- unrecorded rather than showing them as zero spend.

-- ---------------------------------------------------------------------------
-- Part 1: Costs on existing records
-- ---------------------------------------------------------------------------
-- Vet costs and animal acquisition prices already exist. What is missing is the
-- ongoing spend, which is where most of the money actually goes.

ALTER TABLE inventory_items
  ADD COLUMN IF NOT EXISTS unit_cost NUMERIC,
  -- Wattage and runtime turn an equipment row into an electricity estimate.
  -- Heat is usually the largest recurring cost and the one keepers never
  -- attribute to the animal, because it arrives inside a household bill.
  ADD COLUMN IF NOT EXISTS watts NUMERIC,
  ADD COLUMN IF NOT EXISTS hours_per_day NUMERIC,
  -- A thermostatted device is off much of the time. Without this the estimate
  -- assumes continuous draw and roughly doubles.
  ADD COLUMN IF NOT EXISTS duty_cycle NUMERIC;

ALTER TABLE inventory_items
  DROP CONSTRAINT IF EXISTS inventory_power_sane;
ALTER TABLE inventory_items
  ADD CONSTRAINT inventory_power_sane CHECK (
    (unit_cost IS NULL OR unit_cost >= 0) AND
    (watts IS NULL OR (watts >= 0 AND watts <= 5000)) AND
    (hours_per_day IS NULL OR (hours_per_day >= 0 AND hours_per_day <= 24)) AND
    (duty_cycle IS NULL OR (duty_cycle > 0 AND duty_cycle <= 1))
  );

COMMENT ON COLUMN inventory_items.duty_cycle IS
  'Fraction of running hours the device actually draws power, 0-1. Thermostatted heat sources cycle; NULL means the app assumes a conservative default.';

-- Electricity rate is a property of the household, not of one enclosure.
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS electricity_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS currency_code TEXT;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_electricity_rate_sane;
ALTER TABLE profiles
  ADD CONSTRAINT profiles_electricity_rate_sane
  CHECK (electricity_rate IS NULL OR (electricity_rate >= 0 AND electricity_rate < 10));

-- ---------------------------------------------------------------------------
-- Part 2: Feeder colonies
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS feeder_colonies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  species TEXT NOT NULL,          -- dubia | crickets | mealworms | superworms | bsfl | other
  started_on DATE NOT NULL,

  -- The keeper's most recent estimate, not a running count. Nobody counts a
  -- roach colony exactly, and pretending otherwise would make the sustainability
  -- maths look more precise than it is.
  breeding_females INTEGER,
  breeding_males INTEGER,
  counted_on DATE,

  setup_cost NUMERIC,

  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT colony_counts_sane CHECK (
    (breeding_females IS NULL OR (breeding_females >= 0 AND breeding_females <= 1000000)) AND
    (breeding_males IS NULL OR (breeding_males >= 0 AND breeding_males <= 1000000))
  ),
  CONSTRAINT colony_setup_cost_sane CHECK (setup_cost IS NULL OR setup_cost >= 0)
);

CREATE INDEX IF NOT EXISTS idx_feeder_colonies_user ON feeder_colonies(user_id) WHERE is_active;

CREATE TABLE IF NOT EXISTS colony_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colony_id UUID NOT NULL REFERENCES feeder_colonies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  event_date DATE NOT NULL,
  -- harvest | purchase | loss | count
  kind TEXT NOT NULL,
  -- Negative when removing, positive when adding. Stored signed so a harvest
  -- and a purchase are the same column rather than two that must agree.
  count_change INTEGER NOT NULL,
  cost NUMERIC,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT colony_event_kind_known
    CHECK (kind IN ('harvest', 'purchase', 'loss', 'count')),
  CONSTRAINT colony_event_cost_sane CHECK (cost IS NULL OR cost >= 0)
);

-- The sustainability query is always "this colony, in date order".
CREATE INDEX IF NOT EXISTS idx_colony_events_colony
  ON colony_events(colony_id, event_date DESC);

-- ---------------------------------------------------------------------------
-- Part 3: Row level security
-- ---------------------------------------------------------------------------
-- Colonies are ordinary private user data, unlike cohort_observations — so
-- these get the full owner-only policy set rather than insert-only.

ALTER TABLE feeder_colonies ENABLE ROW LEVEL SECURITY;
ALTER TABLE colony_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "colonies_own" ON feeder_colonies;
CREATE POLICY "colonies_own" ON feeder_colonies
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "colony_events_own" ON colony_events;
CREATE POLICY "colony_events_own" ON colony_events
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Part 4: Verify
-- ---------------------------------------------------------------------------

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('feeder_colonies', 'colony_events')
ORDER BY table_name, ordinal_position;

SELECT column_name
FROM information_schema.columns
WHERE table_name = 'inventory_items'
  AND column_name IN ('unit_cost', 'watts', 'hours_per_day', 'duty_cycle')
ORDER BY column_name;

-- Both policies should report as permissive and owner-scoped.
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('feeder_colonies', 'colony_events');
