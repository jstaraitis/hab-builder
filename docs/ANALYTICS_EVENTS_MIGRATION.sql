-- Product analytics, self-hosted on the Supabase project you already pay for.
--
-- Deliberately NOT a third-party analytics SDK: the data never leaves this
-- database, so no Privacy Policy change and no App Store privacy-label change
-- is needed. The trade-off is that you only get the questions you instrument.

CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Null for anonymous visitors. A plan generated before signup is exactly
  -- the funnel step we most need to measure, so anonymous rows are the point,
  -- not an edge case.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Stable per-browser id so an anonymous session can be joined to the signup
  -- it eventually produces.
  anonymous_id TEXT,

  event TEXT NOT NULL,
  properties JSONB NOT NULL DEFAULT '{}'::jsonb,
  platform TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_created
  ON analytics_events(event, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user
  ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_anon
  ON analytics_events(anonymous_id) WHERE anonymous_id IS NOT NULL;

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Anyone may write an event, including signed-out visitors — but a signed-in
-- client can only stamp its OWN user_id, so one user can't forge another's
-- activity.
DROP POLICY IF EXISTS "analytics_insert_own" ON analytics_events;
CREATE POLICY "analytics_insert_own" ON analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- No SELECT policy on purpose. Nobody reads this table with a user session —
-- the owner dashboard reads it through the owner-app-stats edge function,
-- which verifies ownership server-side and uses the service role. Without a
-- SELECT policy, RLS denies every client read by default.

COMMENT ON TABLE analytics_events IS
  'Product analytics funnel events. Write-only from clients; read only via the owner-app-stats edge function.';
