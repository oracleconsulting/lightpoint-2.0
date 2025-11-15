-- ============================================
-- CLEAN UP DUPLICATE TIME LOGS
-- ============================================
-- Remove duplicate time logs caused by both backend and frontend logging
-- Keep the frontend logs (better calculations) and remove backend duplicates
-- ============================================

-- 1. Show current duplicates (for verification)
SELECT 
    complaint_id,
    activity,
    duration,
    created_at,
    COUNT(*) as duplicate_count
FROM time_logs
WHERE complaint_id IN (
    SELECT complaint_id 
    FROM time_logs 
    GROUP BY complaint_id, DATE_TRUNC('minute', created_at)
    HAVING COUNT(*) > 1
)
GROUP BY complaint_id, activity, duration, created_at
ORDER BY created_at DESC;

-- 2. Delete backend duplicate analysis logs (20 minutes, 'analysis')
-- Keep frontend logs ('Initial Analysis', calculated duration)
DELETE FROM time_logs
WHERE activity = 'analysis' 
AND duration = 20
AND complaint_id IN (
    SELECT complaint_id 
    FROM time_logs 
    WHERE activity = 'Initial Analysis'
);

-- 3. Delete backend duplicate letter logs (45 minutes, 'letter_generation')
-- Keep frontend logs ('Letter Generation', calculated duration)
DELETE FROM time_logs
WHERE activity = 'letter_generation' 
AND duration = 45
AND complaint_id IN (
    SELECT complaint_id 
    FROM time_logs 
    WHERE activity = 'Letter Generation'
);

-- 4. Verify cleanup - should show no duplicates now
SELECT 
    complaint_id,
    activity,
    duration,
    created_at
FROM time_logs
WHERE complaint_id IN (
    SELECT complaint_id 
    FROM time_logs 
    GROUP BY complaint_id, DATE_TRUNC('minute', created_at)
    HAVING COUNT(*) > 1
)
ORDER BY created_at DESC;

-- 5. Show clean time log for verification
SELECT 
    complaint_id,
    activity,
    duration,
    (duration / 60.0) * 250 as value_at_250_per_hour,
    created_at
FROM time_logs
WHERE complaint_id = '82e911b9-bc60-4e24-b21c-3a7a818963a2'  -- Your current complaint
ORDER BY created_at DESC;

-- ============================================
-- EXPECTED RESULTS
-- ============================================
-- After cleanup, for your current complaint you should see:
-- - 1 "Initial Analysis" entry (108 minutes = 1h 48m)
-- - 1 "Letter Generation" entry (calculated from pages)
-- - NO "analysis" (20m) entries
-- - NO "letter_generation" (45m) entries
--
-- Total should be ~2h 30m, not 20 hours!
-- ============================================

-- 6. Summary by complaint
SELECT 
    complaint_id,
    COUNT(*) as total_logs,
    SUM(duration) as total_minutes,
    ROUND(SUM(duration) / 60.0, 2) as total_hours,
    SUM((duration / 60.0) * 250) as total_value_at_250
FROM time_logs
GROUP BY complaint_id
ORDER BY total_minutes DESC;

