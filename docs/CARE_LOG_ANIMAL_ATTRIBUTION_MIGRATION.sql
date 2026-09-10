-- Migration: Per-animal attribution for care logs
-- Purpose: Let a feeding (or any care log) belong to a specific animal rather
--          than only to an enclosure, so health history is correct in shared
--          enclosures.
-- Date: 2026-09-10
--
-- BACKGROUND
-- The application already writes care_logs.enclosure_animal_id from
-- careTaskService.completeTask, but no migration in this repo ever created the
-- column. It exists in production because it was added ad hoc. This migration
-- makes that state reproducible, adds the index the new queries need, and
-- backfills historical rows.
--
-- Safe to run whether or not the column already exists — every statement is
-- idempotent, and the backfill only ever fills NULLs.

-- ---------------------------------------------------------------------------
-- Step 1: The column and its index
-- ---------------------------------------------------------------------------

ALTER TABLE care_logs
ADD COLUMN IF NOT EXISTS enclosure_animal_id UUID REFERENCES enclosure_animals(id) ON DELETE SET NULL;

-- ON DELETE SET NULL rather than CASCADE on purpose: removing an animal record
-- must not delete the husbandry history of the enclosure it lived in.

CREATE INDEX IF NOT EXISTS idx_care_logs_enclosure_animal_id
  ON care_logs(enclosure_animal_id)
  WHERE enclosure_animal_id IS NOT NULL;

-- Supports the per-animal feeding history query specifically.
CREATE INDEX IF NOT EXISTS idx_care_logs_animal_feeding
  ON care_logs(enclosure_animal_id, completed_at DESC)
  WHERE enclosure_animal_id IS NOT NULL AND feeder_type IS NOT NULL;

COMMENT ON COLUMN care_logs.enclosure_animal_id IS
  'The specific animal this log describes. NULL means the log is enclosure-level: either it predates attribution, or the enclosure houses several animals and the entry was not attributed to one of them.';

-- ---------------------------------------------------------------------------
-- Step 2: Backfill from the task that produced the log
-- ---------------------------------------------------------------------------
-- Most precise source available. A task already carrying an animal reference
-- tells us exactly who the log was for, with no inference at all.

UPDATE care_logs cl
SET enclosure_animal_id = ct.enclosure_animal_id
FROM care_tasks ct
WHERE cl.task_id = ct.id
  AND cl.enclosure_animal_id IS NULL
  AND ct.enclosure_animal_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Step 3: Backfill enclosures that have only ever held one animal
-- ---------------------------------------------------------------------------
-- The inference here is narrow and deliberate: COUNT(*) = 1 counts every
-- animal record ever attached to the enclosure, active or not. An enclosure
-- that once held animal A and now holds animal B is therefore skipped, because
-- attributing A's feeding history to B would be worse than leaving it
-- unattributed — it would put fabricated history in front of a vet.
--
-- Where exactly one animal has ever lived in an enclosure, every feeding in
-- that enclosure was for that animal. The animal record's created_at is a data
-- entry artifact, not a biological fact, so logs predating it are still
-- attributed.

WITH sole_animal AS (
  SELECT
    enclosure_id,
    (array_agg(id ORDER BY created_at))[1] AS animal_id
  FROM enclosure_animals
  WHERE enclosure_id IS NOT NULL
  GROUP BY enclosure_id
  HAVING COUNT(*) = 1
)
UPDATE care_logs cl
SET enclosure_animal_id = sa.animal_id
FROM sole_animal sa
WHERE cl.enclosure_id = sa.enclosure_id
  AND cl.enclosure_animal_id IS NULL;

-- ---------------------------------------------------------------------------
-- Step 3b (NOT RUN BY DEFAULT): multi-animal enclosures
-- ---------------------------------------------------------------------------
-- Deliberately left unattributed. There is no honest way to decide which of
-- three geckos ate the crickets, and guessing would silently corrupt the
-- health record. The application reports these as group-level entries instead.

-- ---------------------------------------------------------------------------
-- Step 3c: Duplicate feeding logs — READ THIS BEFORE RUNNING ANYTHING BELOW
-- ---------------------------------------------------------------------------
-- Until this release, completing a feeding task inserted TWO rows into
-- care_logs: one from careTaskService.completeTask (carrying the animal
-- reference) and a second, identical one from feedingLogService.createLog
-- (carrying NULL). The application code no longer does this, but the rows it
-- already created are still there.
--
-- The effect on every feeding statistic is a straight doubling. It also
-- doubles apparent refusal streaks, which is the number the health report
-- escalates on — so a clean animal can read as urgent.
--
-- The DELETE below is destructive and is NOT part of the migration. Run 3c-i
-- first, read the numbers, and only then decide.

-- 3c-i. PREVIEW: how many duplicate groups exist and how many rows would go.
SELECT
  COUNT(*)                                  AS duplicate_groups,
  COALESCE(SUM(row_count) - COUNT(*), 0)    AS rows_that_would_be_deleted
FROM (
  SELECT task_id, completed_at, COUNT(*) AS row_count
  FROM care_logs
  WHERE task_id IS NOT NULL
    AND feeder_type IS NOT NULL
  GROUP BY task_id, completed_at
  HAVING COUNT(*) > 1
) dupes;

-- 3c-ii. PREVIEW: eyeball the actual rows before deleting any of them.
-- SELECT id, task_id, enclosure_id, enclosure_animal_id, completed_at,
--        feeder_type, quantity_eaten, refusal_noted
-- FROM care_logs
-- WHERE (task_id, completed_at) IN (
--   SELECT task_id, completed_at
--   FROM care_logs
--   WHERE task_id IS NOT NULL AND feeder_type IS NOT NULL
--   GROUP BY task_id, completed_at
--   HAVING COUNT(*) > 1
-- )
-- ORDER BY task_id, completed_at, enclosure_animal_id NULLS LAST;

-- 3c-iii. DESTRUCTIVE — uncomment only after reviewing the previews.
-- Keeps one row per (task_id, completed_at), preferring the row that carries
-- an animal reference, then the oldest id, so the surviving row is always the
-- more complete of the pair. Take a backup first.
--
-- DELETE FROM care_logs
-- WHERE id IN (
--   SELECT id FROM (
--     SELECT id,
--            ROW_NUMBER() OVER (
--              PARTITION BY task_id, completed_at
--              ORDER BY (enclosure_animal_id IS NULL), id
--            ) AS rn
--     FROM care_logs
--     WHERE task_id IS NOT NULL
--       AND feeder_type IS NOT NULL
--   ) ranked
--   WHERE rn > 1
-- );

-- ---------------------------------------------------------------------------
-- Step 4: Verify
-- ---------------------------------------------------------------------------

-- 4a. Column and indexes exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'care_logs'
  AND column_name = 'enclosure_animal_id';

-- 4b. How much of the feeding history is now attributed, and how much is
--     genuinely group-level. A high unattributed count is expected only if
--     several enclosures house multiple animals.
SELECT
  COUNT(*) FILTER (WHERE enclosure_animal_id IS NOT NULL) AS attributed,
  COUNT(*) FILTER (WHERE enclosure_animal_id IS NULL)     AS unattributed,
  COUNT(*)                                                AS total_feeding_logs
FROM care_logs
WHERE feeder_type IS NOT NULL;

-- 4c. Which enclosures still hold unattributed feeding logs, and why.
SELECT
  e.name AS enclosure,
  COUNT(DISTINCT ea.id)  AS animals_ever_in_enclosure,
  COUNT(cl.id)           AS unattributed_feeding_logs
FROM care_logs cl
JOIN enclosures e ON e.id = cl.enclosure_id
LEFT JOIN enclosure_animals ea ON ea.enclosure_id = e.id
WHERE cl.enclosure_animal_id IS NULL
  AND cl.feeder_type IS NOT NULL
GROUP BY e.id, e.name
ORDER BY unattributed_feeding_logs DESC;
