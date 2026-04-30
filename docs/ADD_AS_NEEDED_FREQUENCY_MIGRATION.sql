-- Migration: Expand care_tasks frequency check constraint
-- Adds: 'twice-daily', 'bi-weekly', 'as-needed'
-- Keeps all original values intact
-- Run in Supabase SQL Editor

-- Step 1: Drop the existing frequency check constraint
ALTER TABLE care_tasks DROP CONSTRAINT IF EXISTS care_tasks_frequency_check;

-- Step 2: Re-add with all current values the app uses
ALTER TABLE care_tasks ADD CONSTRAINT care_tasks_frequency_check
  CHECK (frequency IN (
    'daily',
    'twice-daily',
    'every-other-day',
    'twice-weekly',
    'weekly',
    'bi-weekly',
    'monthly',
    'custom',
    'as-needed'
  ));
