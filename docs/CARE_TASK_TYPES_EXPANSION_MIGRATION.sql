-- =====================================================
-- Care Task Type Expansion Migration
-- =====================================================
-- Expands the care_tasks.type check constraint to support
-- environment and bioactive task types used by analytics.
--
-- Run this in Supabase SQL Editor.
-- =====================================================

-- Optional: inspect current check constraints on care_tasks
-- SELECT conname, pg_get_constraintdef(c.oid)
-- FROM pg_constraint c
-- JOIN pg_class t ON c.conrelid = t.oid
-- WHERE t.relname = 'care_tasks' AND c.contype = 'c';

-- Drop old type check if present (name seen in runtime error)
ALTER TABLE care_tasks
DROP CONSTRAINT IF EXISTS care_tasks_type_check;

-- Recreate with expanded allowed values
ALTER TABLE care_tasks
ADD CONSTRAINT care_tasks_type_check CHECK (
  type IN (
    'feeding',
    'misting',
    'water-change',
    'temperature-check',
    'humidity-check',
    'uvb-check',
    'spot-clean',
    'deep-clean',
    'health-check',
    'supplement',
    'maintenance',
    'substrate-check',
    'mold-check',
    'cleanup-crew-check',
    'plant-care',
    'pest-check',
    'gut-load',
    'custom'
  )
);

-- Optional verification
-- SELECT DISTINCT type FROM care_tasks ORDER BY type;
-- INSERT INTO care_tasks (
--   id, user_id, animal_id, title, type, frequency, next_due_at, is_active
-- ) VALUES (
--   gen_random_uuid(), auth.uid(), 'basic-care', 'Schema test',
--   'temperature-check', 'daily', NOW() + interval '1 day', true
-- );
