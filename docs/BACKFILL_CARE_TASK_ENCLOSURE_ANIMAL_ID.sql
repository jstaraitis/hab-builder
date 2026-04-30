-- Migration: Backfill care_tasks.enclosure_animal_id from enclosure_animals
--
-- Purpose:
-- Fill older care tasks that are missing enclosure_animal_id so task completion
-- can consistently write temp/humidity logs that require animal linkage.
--
-- Safe behavior:
-- - Only updates rows where care_tasks.enclosure_animal_id IS NULL
-- - Only updates rows with a non-null care_tasks.enclosure_id
-- - Chooses one deterministic animal per enclosure (oldest active by created_at)
-- - Keeps tasks unchanged when no active animal exists for that enclosure
--
-- Run this in Supabase SQL Editor.

BEGIN;

-- Optional pre-check: how many rows are currently missing linkage?
-- SELECT COUNT(*) AS missing_links
-- FROM care_tasks
-- WHERE enclosure_animal_id IS NULL
--   AND enclosure_id IS NOT NULL;

WITH enclosure_primary_animal AS (
  SELECT DISTINCT ON (ea.enclosure_id)
    ea.enclosure_id,
    ea.id AS enclosure_animal_id
  FROM enclosure_animals ea
  WHERE ea.is_active = true
  ORDER BY ea.enclosure_id, ea.created_at ASC, ea.id ASC
)
UPDATE care_tasks ct
SET enclosure_animal_id = epa.enclosure_animal_id,
    updated_at = NOW()
FROM enclosure_primary_animal epa
WHERE ct.enclosure_animal_id IS NULL
  AND ct.enclosure_id IS NOT NULL
  AND ct.enclosure_id = epa.enclosure_id::text;

COMMIT;

-- Optional verification 1: remaining rows still missing linkage
-- SELECT COUNT(*) AS still_missing_links
-- FROM care_tasks
-- WHERE enclosure_animal_id IS NULL
--   AND enclosure_id IS NOT NULL;

-- Optional verification 2: inspect any unresolved tasks
-- SELECT id, user_id, enclosure_id, animal_id, title, type, next_due_at
-- FROM care_tasks
-- WHERE enclosure_animal_id IS NULL
--   AND enclosure_id IS NOT NULL
-- ORDER BY next_due_at ASC
-- LIMIT 100;

-- Optional verification 3: sample updated tasks
-- SELECT ct.id, ct.title, ct.type, ct.enclosure_id, ct.enclosure_animal_id, ea.name AS animal_name
-- FROM care_tasks ct
-- LEFT JOIN enclosure_animals ea ON ea.id = ct.enclosure_animal_id
-- WHERE ct.enclosure_animal_id IS NOT NULL
-- ORDER BY ct.updated_at DESC
-- LIMIT 50;
