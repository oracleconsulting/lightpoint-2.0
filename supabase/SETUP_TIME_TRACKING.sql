-- ============================================================================
-- LIGHTPOINT TIME TRACKING SETUP
-- ============================================================================
-- This script creates the time_logs table and sets up Row Level Security (RLS)
-- Run this in your Supabase SQL Editor to enable automated time tracking
-- ============================================================================

-- Drop existing table if you want to start fresh (CAUTION: deletes all time logs)
-- DROP TABLE IF EXISTS time_logs CASCADE;

-- Create time_logs table
CREATE TABLE IF NOT EXISTS time_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  user_id uuid REFERENCES lightpoint_users(id),
  activity_type text NOT NULL,
  minutes_spent integer NOT NULL CHECK (minutes_spent > 0),
  automated boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_time_logs_complaint_id ON time_logs(complaint_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_id ON time_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_created_at ON time_logs(created_at);

-- Enable Row Level Security
ALTER TABLE time_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view time logs for their organization complaints" ON time_logs;
DROP POLICY IF EXISTS "Users can insert time logs for their organization complaints" ON time_logs;
DROP POLICY IF EXISTS "System can insert automated time logs" ON time_logs;

-- Create RLS Policies
-- Allow users to view time logs for complaints in their organization
CREATE POLICY "Users can view time logs for their organization complaints"
  ON time_logs FOR SELECT
  USING (
    complaint_id IN (
      SELECT c.id 
      FROM complaints c
      JOIN lightpoint_users u ON u.organization_id = c.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- Allow users to insert time logs for complaints in their organization
CREATE POLICY "Users can insert time logs for their organization complaints"
  ON time_logs FOR INSERT
  WITH CHECK (
    complaint_id IN (
      SELECT c.id 
      FROM complaints c
      JOIN lightpoint_users u ON u.organization_id = c.organization_id
      WHERE u.id = auth.uid()
    )
  );

-- Allow service role (backend) to insert automated time logs
-- This policy allows inserts without checking auth.uid() when using service role key
CREATE POLICY "System can insert automated time logs"
  ON time_logs FOR INSERT
  WITH CHECK (automated = true);

-- ============================================================================
-- STANDARD TIME ALLOCATIONS (For Reference)
-- ============================================================================
-- These are the default time allocations used by the system:
--
-- Activity                          | Duration  | Notes
-- ----------------------------------|-----------|---------------------------
-- Initial Analysis                  | 30-60 min | Scales with document count
--                                   |           | 30 min + (10 min × docs)
-- Letter Generation                 | 20 min    | Fixed duration
-- Response Review                   | 20-40 min | Scales with complexity
-- Follow-up Letter Preparation      | 20 min    | Fixed duration
-- Document Upload & Processing      | 5 min     | Per document (future)
-- Re-analysis                       | 15-30 min | With additional context
-- ============================================================================

-- Verify the table was created successfully
SELECT 
  'time_logs table created successfully' as status,
  COUNT(*) as existing_records
FROM time_logs;

-- Show table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'time_logs'
ORDER BY ordinal_position;

-- ============================================================================
-- TESTING: Insert sample time log (OPTIONAL - comment out if not needed)
-- ============================================================================
/*
-- Get the first complaint ID for testing
DO $$
DECLARE
  test_complaint_id uuid;
BEGIN
  SELECT id INTO test_complaint_id 
  FROM complaints 
  LIMIT 1;
  
  IF test_complaint_id IS NOT NULL THEN
    INSERT INTO time_logs (
      complaint_id,
      activity_type,
      minutes_spent,
      automated
    ) VALUES (
      test_complaint_id,
      'Test Activity',
      30,
      true
    );
    
    RAISE NOTICE 'Test time log inserted successfully for complaint: %', test_complaint_id;
  ELSE
    RAISE NOTICE 'No complaints found - skipping test insert';
  END IF;
END $$;
*/

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all time logs
SELECT 
  tl.id,
  tl.complaint_id,
  c.complaint_reference,
  tl.activity_type,
  tl.minutes_spent,
  tl.automated,
  tl.created_at
FROM time_logs tl
LEFT JOIN complaints c ON c.id = tl.complaint_id
ORDER BY tl.created_at DESC;

-- Summary by complaint
SELECT 
  c.complaint_reference,
  COUNT(tl.id) as activity_count,
  COALESCE(SUM(tl.minutes_spent), 0) as total_minutes,
  ROUND(COALESCE(SUM(tl.minutes_spent), 0)::numeric / 60, 2) as total_hours
FROM complaints c
LEFT JOIN time_logs tl ON tl.complaint_id = c.id
GROUP BY c.id, c.complaint_reference
ORDER BY COALESCE(SUM(tl.minutes_spent), 0) DESC;

-- ============================================================================
-- READY TO USE!
-- ============================================================================
-- After running this script:
-- 1. The time_logs table will be created
-- 2. RLS policies will be enabled
-- 3. Your app will automatically start tracking time
-- 4. You should see time entries appear in the Time & Value card
-- ============================================================================

