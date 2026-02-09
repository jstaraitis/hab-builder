-- Fix notification_enabled boolean not updating to false
-- This migration ensures the notification columns exist and can properly accept false values

-- Add notification columns if they don't exist (safe idempotent operation)
ALTER TABLE care_tasks 
ADD COLUMN IF NOT EXISTS notification_enabled BOOLEAN DEFAULT true;

ALTER TABLE care_tasks 
ADD COLUMN IF NOT EXISTS notification_minutes_before INTEGER DEFAULT 15;

-- Important: Ensure no NOT NULLconstraint that would prevent updates
ALTER TABLE care_tasks 
ALTER COLUMN notification_enabled DROP NOT NULL;

ALTER TABLE care_tasks 
ALTER COLUMN notification_minutes_before DROP NOT NULL;

-- Verify the columns can accept all valid values
-- Test: Update a task to false (this should work after migration)
-- UPDATE care_tasks SET notification_enabled = false WHERE id = 'some-id';

-- Add index for faster queries on notification-enabled tasks
CREATE INDEX IF NOT EXISTS idx_care_tasks_notifications 
ON care_tasks(notification_enabled, next_due_at) 
WHERE notification_enabled = true AND is_active = true;
