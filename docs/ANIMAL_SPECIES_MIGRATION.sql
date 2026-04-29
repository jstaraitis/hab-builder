-- Migration: Add species fields to enclosure_animals table
-- Run this in the Supabase SQL Editor before using the species selector in the Add Animal form.

ALTER TABLE enclosure_animals
ADD COLUMN IF NOT EXISTS species_id TEXT,       -- Profile ID (e.g., 'whites-tree-frog')
ADD COLUMN IF NOT EXISTS species_name TEXT;     -- Display name (e.g., "White's Tree Frog")

-- Optional: index for filtering animals by species
CREATE INDEX IF NOT EXISTS idx_enclosure_animals_species_id ON enclosure_animals(species_id);
