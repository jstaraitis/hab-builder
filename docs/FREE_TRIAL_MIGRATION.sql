-- Free Trial Support
-- Run this in the Supabase SQL Editor BEFORE deploying the updated
-- create-checkout-session and stripe_webhook edge functions.
--
-- Note: subscription_status, trial_end, and the 'trialing' status constraint
-- already exist from SUBSCRIPTION_FIELDS_MIGRATION.sql. The only thing missing
-- is a way to stop one person from claiming the trial over and over by
-- cancelling and re-subscribing.

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS has_used_trial BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN profiles.has_used_trial IS
  'True once the user has started a free trial. Checked at checkout so each user gets at most one trial.';

-- Backfill: anyone who has already subscribed (current premium members, or
-- anyone who has ever reached Stripe checkout) is not eligible for a trial.
-- This protects the existing paying members from being offered a trial they
-- would have to cancel into.
UPDATE profiles
SET has_used_trial = TRUE
WHERE is_premium = TRUE
   OR stripe_customer_id IS NOT NULL
   OR subscription_status IN ('active', 'trialing', 'canceled', 'past_due', 'unpaid');

-- Partial index: checkout only ever queries for the eligible (FALSE) case.
CREATE INDEX IF NOT EXISTS idx_profiles_trial_eligible
  ON profiles(id) WHERE has_used_trial = FALSE;
