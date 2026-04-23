-- Migration: Add enclosure_id to care_logs for direct feeding log tracking
-- Purpose: Track which enclosure a feeding log belongs to without requiring a care_task
-- Date: 2026-04-23

-- Step 1: Add enclosure_id column (nullable initially)
ALTER TABLE care_logs
ADD COLUMN IF NOT EXISTS enclosure_id UUID REFERENCES enclosures(id) ON DELETE CASCADE;

-- Step 2: Create index for efficient filtering by enclosure
CREATE INDEX IF NOT EXISTS idx_care_logs_enclosure_id ON care_logs(enclosure_id);

-- Step 3: Backfill existing feeding logs with enclosure_id from their associated tasks
UPDATE care_logs
SET enclosure_id = ct.enclosure_id::UUID
FROM care_tasks ct
WHERE care_logs.task_id = ct.id
  AND care_logs.enclosure_id IS NULL
  AND care_logs.feeder_type IS NOT NULL;

-- Step 4: Verify the migration
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'care_logs' 
  AND column_name = 'enclosure_id'
ORDER BY column_name;
