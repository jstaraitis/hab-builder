-- Add subscription-related columns to profiles table
-- Run this in Supabase SQL Editor
-- Note: is_premium field should already exist from MOBILE_NAV_ORDER_MIGRATION.sql

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;

-- subscription_cancel_at should already exist from SUBSCRIPTION_CANCELLATION_MIGRATION.sql

-- Add check constraint for valid subscription statuses
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS valid_subscription_status;

ALTER TABLE profiles
ADD CONSTRAINT valid_subscription_status 
CHECK (subscription_status IN ('active', 'trialing', 'canceled', 'past_due', 'incomplete', 'incomplete_expired', 'unpaid', 'free'));

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);
CREATE INDEX IF NOT EXISTS idx_profiles_is_premium ON profiles(is_premium);

-- Add comments for documentation
COMMENT ON COLUMN profiles.subscription_status IS 'Stripe subscription status (active, trialing, canceled, etc.)';
COMMENT ON COLUMN profiles.subscription_id IS 'Stripe subscription ID';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID';
COMMENT ON COLUMN profiles.is_premium IS 'Whether user has premium access (true for active/trialing subscriptions)';
COMMENT ON COLUMN profiles.trial_end IS 'When the trial period ends';
COMMENT ON COLUMN profiles.subscription_cancel_at IS 'When the subscription is scheduled to cancel';
