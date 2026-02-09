-- Add subscription_cancel_at field to profiles table
-- This tracks when a subscription is scheduled to be cancelled

ALTER TABLE profiles
ADD COLUMN subscription_cancel_at TIMESTAMPTZ;

-- Add comment for documentation
COMMENT ON COLUMN profiles.subscription_cancel_at IS 'Timestamp when the subscription will be cancelled (if cancellation is pending)';
