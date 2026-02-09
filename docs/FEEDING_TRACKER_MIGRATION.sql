-- Migration: Enhanced Feeding Tracker
-- Adds detailed feeding log fields to care_logs table
-- Date: 2026-02-09

-- Add new columns to care_logs table for feeding tracking
ALTER TABLE care_logs
ADD COLUMN IF NOT EXISTS feeder_type TEXT,
ADD COLUMN IF NOT EXISTS quantity_offered INTEGER,
ADD COLUMN IF NOT EXISTS quantity_eaten INTEGER,
ADD COLUMN IF NOT EXISTS refusal_noted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS supplement_used TEXT;

-- Create index for feeding analysis queries
CREATE INDEX IF NOT EXISTS idx_care_logs_feeder_type ON care_logs(feeder_type) WHERE feeder_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_care_logs_refusal ON care_logs(refusal_noted) WHERE refusal_noted = TRUE;

-- Comment on new columns
COMMENT ON COLUMN care_logs.feeder_type IS 'Type of feeder used (e.g., Crickets, Dubia Roaches, Fruit Mix)';
COMMENT ON COLUMN care_logs.quantity_offered IS 'Number of feeders offered during feeding';
COMMENT ON COLUMN care_logs.quantity_eaten IS 'Number of feeders actually consumed';
COMMENT ON COLUMN care_logs.refusal_noted IS 'Whether animal refused food or showed reduced appetite';
COMMENT ON COLUMN care_logs.supplement_used IS 'Supplement/dusting used (e.g., Calcium + D3, Multivitamin)';

-- Migration verification query
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'care_logs' 
  AND column_name IN ('feeder_type', 'quantity_offered', 'quantity_eaten', 'refusal_noted', 'supplement_used')
ORDER BY column_name;
