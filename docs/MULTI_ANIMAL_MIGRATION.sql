-- Migration: Add support for multiple animals per enclosure
-- Run this in Supabase SQL Editor after ENCLOSURE_FIELDS_MIGRATION.sql

-- Step 1: Create enclosure_animals table
CREATE TABLE IF NOT EXISTS enclosure_animals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enclosure_id UUID NOT NULL REFERENCES enclosures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT, -- e.g., "Kermit", "Lily" - can be null for unnamed animals
  animal_number INTEGER, -- Optional numbering: "Frog #1", "Frog #2"
  birthday DATE, -- Individual animal's birthday/hatch date
  notes TEXT, -- Notes about this specific animal
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Add animal reference to care_tasks table
ALTER TABLE care_tasks 
ADD COLUMN IF NOT EXISTS enclosure_animal_id UUID REFERENCES enclosure_animals(id) ON DELETE SET NULL;

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enclosure_animals_enclosure_id ON enclosure_animals(enclosure_id);
CREATE INDEX IF NOT EXISTS idx_enclosure_animals_user_id ON enclosure_animals(user_id);
CREATE INDEX IF NOT EXISTS idx_care_tasks_enclosure_animal_id ON care_tasks(enclosure_animal_id);

-- Step 4: Add RLS policies for enclosure_animals
ALTER TABLE enclosure_animals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own animals"
  ON enclosure_animals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own animals"
  ON enclosure_animals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own animals"
  ON enclosure_animals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own animals"
  ON enclosure_animals FOR DELETE
  USING (auth.uid() = user_id);

-- Step 5: Add comments for documentation
COMMENT ON TABLE enclosure_animals IS 'Individual animals within an enclosure';
COMMENT ON COLUMN enclosure_animals.name IS 'Optional name for the animal (e.g., "Kermit")';
COMMENT ON COLUMN enclosure_animals.animal_number IS 'Optional number for tracking unnamed animals (e.g., #1, #2)';
COMMENT ON COLUMN enclosure_animals.birthday IS 'Birthday or acquisition date for age tracking';
COMMENT ON COLUMN care_tasks.enclosure_animal_id IS 'If set, task is for specific animal. If NULL, task is for whole enclosure';

-- Step 6: Migrate existing enclosure birthdays to enclosure_animals
-- This will create one animal per enclosure that has a birthday set
INSERT INTO enclosure_animals (enclosure_id, user_id, birthday, name, is_active, created_at, updated_at)
SELECT 
  id as enclosure_id,
  user_id,
  animal_birthday as birthday,
  NULL as name, -- Leave name empty, user can fill it in later
  is_active,
  created_at,
  updated_at
FROM enclosures
WHERE animal_birthday IS NOT NULL;

-- Step 7: (Optional) Remove animal_birthday from enclosures table after migration
-- Uncomment this line after verifying migration was successful:
-- ALTER TABLE enclosures DROP COLUMN IF EXISTS animal_birthday;

-- Step 8: Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_enclosure_animals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_enclosure_animals_timestamp
  BEFORE UPDATE ON enclosure_animals
  FOR EACH ROW
  EXECUTE FUNCTION update_enclosure_animals_updated_at();
