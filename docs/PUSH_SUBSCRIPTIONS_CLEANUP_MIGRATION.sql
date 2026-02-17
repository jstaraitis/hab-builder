-- Push Subscriptions Cleanup Migration
-- This migration helps clean up orphaned push subscriptions that may have accumulated
-- when users reinstalled the PWA and got new subscription endpoints

-- First, let's identify users with multiple subscriptions (potential issue)
-- Run this to see if you have any users with multiple subscriptions:
SELECT 
  user_id, 
  COUNT(*) as subscription_count,
  MAX(updated_at) as most_recent_update
FROM push_subscriptions
GROUP BY user_id
HAVING COUNT(*) > 1
ORDER BY subscription_count DESC;

-- To clean up: keep only the most recent subscription for each user
-- This creates a temporary table with the subscriptions we want to keep
CREATE TEMP TABLE subscriptions_to_keep AS
SELECT DISTINCT ON (user_id) id
FROM push_subscriptions
ORDER BY user_id, updated_at DESC;

-- Delete all subscriptions except the ones we want to keep
-- UNCOMMENT THE FOLLOWING LINE TO EXECUTE THE CLEANUP:
-- DELETE FROM push_subscriptions WHERE id NOT IN (SELECT id FROM subscriptions_to_keep);

-- After cleanup, verify there are no users with multiple subscriptions:
SELECT 
  user_id, 
  COUNT(*) as subscription_count
FROM push_subscriptions
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Optional: Add a check to see total number of subscriptions before and after
SELECT COUNT(*) as total_subscriptions FROM push_subscriptions;

-- Clean up temp table
DROP TABLE IF EXISTS subscriptions_to_keep;

-- Note: The application code now handles this automatically:
-- 1. On subscribe(), it deletes all old subscriptions before creating a new one
-- 2. On app startup, it validates the subscription and cleans up if there's a mismatch
-- 3. This ensures users only have one valid subscription at a time
