-- Weight Tracking Migration
-- Run this in Supabase SQL Editor after care_tasks tables are set up

-- Weight Logs Table
CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  enclosure_animal_id UUID NOT NULL, -- References enclosure_animals table
  weight_grams DECIMAL(10, 2) NOT NULL CHECK (weight_grams > 0),
  measurement_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  photo_url TEXT, -- Optional: Store in Supabase Storage (premium feature)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_weight_logs_user_id ON weight_logs(user_id);
CREATE INDEX idx_weight_logs_animal_id ON weight_logs(enclosure_animal_id);
CREATE INDEX idx_weight_logs_date ON weight_logs(measurement_date DESC);
CREATE INDEX idx_weight_logs_animal_date ON weight_logs(enclosure_animal_id, measurement_date DESC);

-- Row Level Security (RLS)
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own weight logs
CREATE POLICY "Users can view their own weight logs"
  ON weight_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own weight logs
CREATE POLICY "Users can create their own weight logs"
  ON weight_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own weight logs
CREATE POLICY "Users can update their own weight logs"
  ON weight_logs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own weight logs
CREATE POLICY "Users can delete their own weight logs"
  ON weight_logs
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_weight_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before UPDATE
CREATE TRIGGER trigger_update_weight_logs_updated_at
  BEFORE UPDATE ON weight_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_weight_logs_updated_at();

-- Comments for documentation
COMMENT ON TABLE weight_logs IS 'Tracks weight measurements for animals over time';
COMMENT ON COLUMN weight_logs.weight_grams IS 'Weight in grams - stored in single unit for consistency';
COMMENT ON COLUMN weight_logs.measurement_date IS 'Date/time when weight was measured';
COMMENT ON COLUMN weight_logs.photo_url IS 'Optional photo URL (Supabase Storage path) - premium feature';
