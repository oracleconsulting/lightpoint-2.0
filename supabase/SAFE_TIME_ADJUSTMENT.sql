-- ============================================================================
-- SAFE TIME LOG ADJUSTMENT - NO DATA LOSS
-- ============================================================================
-- This script manually adjusts time values WITHOUT deleting your letter
-- Run this in Supabase SQL Editor
-- ============================================================================

-- STEP 1: Get your complaint ID
SELECT id, complaint_reference 
FROM complaints 
WHERE complaint_reference = '1111';

-- Copy the ID from above, then use it below
-- Replace 'YOUR-COMPLAINT-ID' with the actual UUID

-- ============================================================================
-- STEP 2: See current time logs
-- ============================================================================
SELECT 
  id,
  activity_type,
  minutes_spent,
  created_at,
  automated
FROM time_logs
WHERE complaint_id = 'YOUR-COMPLAINT-ID'
ORDER BY created_at;

-- ============================================================================
-- STEP 3: Manual time adjustment (choose ONE option below)
-- ============================================================================

-- OPTION A: Keep only the FIRST occurrence of each activity type
-- This keeps your earliest logs and removes duplicates

-- Delete duplicate "analysis" entries (keep oldest)
DELETE FROM time_logs
WHERE complaint_id = 'YOUR-COMPLAINT-ID'
  AND activity_type = 'analysis'
  AND id NOT IN (
    SELECT id FROM time_logs
    WHERE complaint_id = 'YOUR-COMPLAINT-ID'
      AND activity_type = 'analysis'
    ORDER BY created_at ASC
    LIMIT 1
  );

-- Delete duplicate "Initial Analysis" entries (keep oldest)
DELETE FROM time_logs
WHERE complaint_id = 'YOUR-COMPLAINT-ID'
  AND activity_type = 'Initial Analysis'
  AND id NOT IN (
    SELECT id FROM time_logs
    WHERE complaint_id = 'YOUR-COMPLAINT-ID'
      AND activity_type = 'Initial Analysis'
    ORDER BY created_at ASC
    LIMIT 1
  );

-- Delete duplicate "letter_generation" entries (keep oldest)
DELETE FROM time_logs
WHERE complaint_id = 'YOUR-COMPLAINT-ID'
  AND activity_type = 'letter_generation'
  AND id NOT IN (
    SELECT id FROM time_logs
    WHERE complaint_id = 'YOUR-COMPLAINT-ID'
      AND activity_type = 'letter_generation'
    ORDER BY created_at ASC
    LIMIT 1
  );

-- Delete duplicate "Letter Generation" entries (keep oldest)
DELETE FROM time_logs
WHERE complaint_id = 'YOUR-COMPLAINT-ID'
  AND activity_type = 'Letter Generation'
  AND id NOT IN (
    SELECT id FROM time_logs
    WHERE complaint_id = 'YOUR-COMPLAINT-ID'
      AND activity_type = 'Letter Generation'
    ORDER BY created_at ASC
    LIMIT 1
  );

-- ============================================================================
-- STEP 4: Update remaining logs to 12-minute increments
-- ============================================================================

-- Fix "analysis" 20m → 24m (nearest 12-min increment)
UPDATE time_logs
SET minutes_spent = 24
WHERE complaint_id = 'YOUR-COMPLAINT-ID'
  AND activity_type = 'analysis'
  AND minutes_spent = 20;

-- Fix "letter_generation" 45m → 48m (nearest 12-min increment)
UPDATE time_logs
SET minutes_spent = 48
WHERE complaint_id = 'YOUR-COMPLAINT-ID'
  AND activity_type = 'letter_generation'
  AND minutes_spent = 45;

-- Fix "Letter Generation" 84m (1h 24m) is already correct (7 units)
-- No change needed

-- ============================================================================
-- STEP 5: Verify final result
-- ============================================================================
SELECT 
  activity_type,
  minutes_spent,
  created_at,
  ROUND(minutes_spent::numeric / 60, 2) || ' hours' as hours,
  ROUND((minutes_spent::numeric / 60) * 275, 2) || ' £' as value_at_275
FROM time_logs
WHERE complaint_id = 'YOUR-COMPLAINT-ID'
ORDER BY created_at;

-- ============================================================================
-- Expected Final Result:
-- ============================================================================
-- Initial Analysis: 60m (1h) = £275.00
-- Letter Generation: 84m (1h 24m) = £385.00
-- Letter Refinement: 12m = £55.00 (if exists)
-- Total: ~156m (2h 36m) = £715.00
--
-- If you refined twice:
-- Total: ~168m (2h 48m) = £770.00
--
-- Much better than 5h 58m (£1,640)!
-- ============================================================================

