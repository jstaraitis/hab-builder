-- Add morph column to enclosure_animals table
-- This field allows tracking color morphs/genetic variants (e.g., Albino, Leucistic, Melanistic)

ALTER TABLE enclosure_animals 
ADD COLUMN IF NOT EXISTS morph TEXT;

COMMENT ON COLUMN enclosure_animals.morph IS 'Color morph or genetic variant (e.g., Albino, Leucistic, Piebald)';
