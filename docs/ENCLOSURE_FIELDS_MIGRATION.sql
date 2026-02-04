-- Migration: Add animal_birthday and substrate_type to enclosures table
-- This adds support for tracking animal birthday/hatch date (for automatic age calculation) and substrate type

-- Add animal_birthday column (date)
ALTER TABLE enclosures 
ADD COLUMN IF NOT EXISTS animal_birthday DATE;

-- Add substrate_type column (text, with constraint for valid values)
ALTER TABLE enclosures 
ADD COLUMN IF NOT EXISTS substrate_type TEXT CHECK (
  substrate_type IS NULL OR 
  substrate_type IN ('bioactive', 'soil', 'paper', 'sand', 'reptile-carpet', 'tile', 'other')
);

-- Add comments for documentation
COMMENT ON COLUMN enclosures.animal_birthday IS 'Birthday or acquisition date of the animal for automatic age calculation';
COMMENT ON COLUMN enclosures.substrate_type IS 'Type of substrate used: bioactive, soil, paper, sand, reptile-carpet, tile, or other';

-- Optional: Create indexes if you plan to filter by these fields frequently
-- CREATE INDEX IF NOT EXISTS idx_enclosures_substrate_type ON enclosures(substrate_type);
