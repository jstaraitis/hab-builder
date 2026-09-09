-- Smart Status sensitivity preference
--
-- Smart Status penalised any animal whose feeding, weight or stool log went
-- quiet for 14 days. That window assumes a fortnightly rhythm every species
-- keeps, which plenty don't — a well-fed adult snake can go a month between
-- meals. Keepers doing nothing wrong saw most of their collection at "Watch".
--
-- 'relaxed' (30 days) is the new default. 'precise' restores the 14-day window
-- for keepers who log frequently and want the earlier signal.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS status_sensitivity TEXT NOT NULL DEFAULT 'relaxed';

ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_status_sensitivity;

ALTER TABLE profiles
ADD CONSTRAINT valid_status_sensitivity
CHECK (status_sensitivity IN ('relaxed', 'precise'));

COMMENT ON COLUMN profiles.status_sensitivity IS
  'How quickly a quiet log counts against Smart Status: relaxed = 30 days, precise = 14 days.';
