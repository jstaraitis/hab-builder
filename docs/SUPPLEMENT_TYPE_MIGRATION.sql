-- Add supplement_type column to care_tasks table
-- This allows feeding type tasks to have a pre-set supplement type that will be auto-filled when completing the task
-- Migration for feature: "Supplement Type on Feeding Tasks"

ALTER TABLE care_tasks
ADD COLUMN supplement_type TEXT;

-- Add index for any future queries on supplement_type
CREATE INDEX idx_care_tasks_supplement_type ON care_tasks(supplement_type);

-- Add comment documenting the column
COMMENT ON COLUMN care_tasks.supplement_type IS 'Pre-set supplement type for feeding tasks. Options: "Calcium (no D3)", "Calcium + D3", "Multivitamin", "Calcium + Multivitamin", or NULL for none. Will be auto-filled in FeedingLogModal when completing a feeding task.';
