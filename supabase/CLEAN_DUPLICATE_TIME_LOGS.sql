-- ============================================================================
-- CLEAN UP DUPLICATE TIME LOGS
-- ============================================================================
-- This script removes duplicate/incorrect time logs from complaint 1111
-- Run this in Supabase SQL Editor to fix the current 6-hour mess
-- ============================================================================

-- First, let's see what we have for complaint 1111
-- (Run this first to verify the complaint ID)
SELECT id, complaint_reference 
FROM complaints 
WHERE complaint_reference = '1111';

-- ============================================================================
-- STEP 1: Delete ALL automated time logs for this complaint
-- (We'll keep manual logs if any exist)
-- ============================================================================

-- Replace 'YOUR-COMPLAINT-ID' with the actual ID from the query above
DELETE FROM time_logs
WHERE complaint_id = 'YOUR-COMPLAINT-ID'
  AND automated = true;

-- ============================================================================
-- STEP 2: Verify cleanup
-- ============================================================================

SELECT 
  activity_type,
  minutes_spent,
  automated,
  created_at
FROM time_logs
WHERE complaint_id = 'YOUR-COMPLAINT-ID'
ORDER BY created_at DESC;

-- Should now be empty (or only show manual entries)

-- ============================================================================
-- STEP 3: Re-run analysis on the complaint
-- ============================================================================
-- After running this script:
-- 1. Go back to Lightpoint
-- 2. Click "Analyze Complaint" again
-- 3. Click "Generate Letter"
-- 4. Time logs will be recreated with correct values

-- Expected result after re-running:
-- - Initial Analysis: 60 minutes (3 documents)
-- - Letter Generation: ~156 minutes (3-page letter)
-- - Total: ~216 minutes (3h 36m) = £990

-- If you then refine with additional context:
-- - Old logs deleted automatically
-- - Letter Refinement: 12 minutes
-- - Initial Analysis: 60 minutes (re-run)
-- - Letter Generation: ~156 minutes (new letter)
-- - Total: ~228 minutes (3h 48m) = £1,045

-- ============================================================================
-- DONE
-- ============================================================================

