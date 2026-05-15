-- System Notifications Table for Outage Alerts and Service Messages
CREATE TABLE IF NOT EXISTS system_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('outage', 'maintenance', 'info', 'warning')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  is_active BOOLEAN DEFAULT true,
  show_on_login BOOLEAN DEFAULT true,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Email Recipients Opt-Out Table
CREATE TABLE IF NOT EXISTS email_opt_out (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN ('marketing', 'outage', 'all')),
  opted_out_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, email_type)
);

-- Email Log for tracking campaigns
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_name TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  subject TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('outage', 'maintenance', 'notification', 'marketing')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'completed', 'failed'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_system_notifications_active ON system_notifications(is_active, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_system_notifications_login ON system_notifications(is_active, show_on_login);
CREATE INDEX IF NOT EXISTS idx_email_opt_out_user ON email_opt_out(user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

-- Set up Row Level Security (RLS) policies
ALTER TABLE system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_opt_out ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Allow all users to view active notifications
CREATE POLICY "Users can view active notifications"
  ON system_notifications
  FOR SELECT
  TO authenticated, anon
  USING (is_active = true AND starts_at <= NOW() AND (ends_at IS NULL OR ends_at > NOW()));

-- Allow admins to manage notifications
CREATE POLICY "Only admins can insert/update/delete notifications"
  ON system_notifications
  FOR ALL
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Users can view their own opt-out preferences
CREATE POLICY "Users can view own opt-out preferences"
  ON email_opt_out
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can manage their own opt-out preferences
CREATE POLICY "Users can manage own opt-out preferences"
  ON email_opt_out
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Only admins can view email logs
CREATE POLICY "Only admins can view email logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());
