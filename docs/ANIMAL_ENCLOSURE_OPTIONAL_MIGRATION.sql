-- Migration: Make enclosure optional for animals
-- This allows animals to exist without an enclosure and be reassigned between enclosures
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing foreign key constraint with CASCADE
ALTER TABLE enclosure_animals 
DROP CONSTRAINT IF EXISTS enclosure_animals_enclosure_id_fkey;

-- Step 2: Make enclosure_id nullable
ALTER TABLE enclosure_animals 
ALTER COLUMN enclosure_id DROP NOT NULL;

-- Step 3: Add new foreign key constraint with SET NULL on delete
ALTER TABLE enclosure_animals 
ADD CONSTRAINT enclosure_animals_enclosure_id_fkey 
FOREIGN KEY (enclosure_id) 
REFERENCES enclosures(id) 
ON DELETE SET NULL;

-- Note: This change means when an enclosure is deleted, animals will remain in the system
-- with enclosure_id set to NULL, allowing them to be reassigned to different enclosures.
