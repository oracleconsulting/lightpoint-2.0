-- ============================================================================
-- LIGHTPOINT TIME TRACKING - ULTRA SIMPLE VERSION
-- ============================================================================
-- Just creates the table. No fancy checks. Just works.
-- ============================================================================

-- Create time_logs table
CREATE TABLE IF NOT EXISTS time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id uuid,
  activity_type text NOT NULL,
  minutes_spent integer NOT NULL CHECK (minutes_spent > 0),
  automated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_time_logs_complaint_id ON time_logs(complaint_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_created_at ON time_logs(created_at);

-- Enable RLS
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Drop old policies
DROP POLICY IF EXISTS "time_logs_select" ON time_logs;
DROP POLICY IF EXISTS "time_logs_insert" ON time_logs;

-- Create simple policies
CREATE POLICY "time_logs_select"
  ON time_logs FOR SELECT
  USING (true);

CREATE POLICY "time_logs_insert"
  ON time_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- DONE! Table created.
-- ============================================================================
-- Refresh your Lightpoint app and re-analyze a complaint
-- Time tracking will start working automatically
-- ============================================================================

