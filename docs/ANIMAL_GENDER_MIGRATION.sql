-- Migration: Add gender field to enclosure_animals table
-- Run this in Supabase SQL Editor

-- Add gender column to enclosure_animals table
ALTER TABLE enclosure_animals 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'unknown'));

-- Add comment for documentation
COMMENT ON COLUMN enclosure_animals.gender IS 'Gender of the animal: male, female, or unknown';

-- Create index for potential filtering by gender
CREATE INDEX IF NOT EXISTS idx_enclosure_animals_gender ON enclosure_animals(gender) WHERE gender IS NOT NULL;
