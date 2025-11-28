-- FIX: Platform Statistics NULL Value Error
-- Issue: When deleting the last complaint, jsonb_object_agg returns NULL
-- which violates the NOT NULL constraint on metric_value

-- ============================================================================
-- UPDATED TRIGGER FUNCTION WITH NULL HANDLING
-- ============================================================================

CREATE OR REPLACE FUNCTION update_platform_statistics()
RETURNS TRIGGER AS $$
BEGIN
  -- Total complaints
  UPDATE platform_statistics
  SET metric_value = jsonb_build_object('value', (SELECT COUNT(*) FROM complaint_analytics)),
      last_updated = NOW()
  WHERE metric_name = 'total_complaints';
  
  -- Successful complaints
  UPDATE platform_statistics
  SET metric_value = jsonb_build_object('value', (SELECT COUNT(*) FROM complaint_analytics WHERE is_successful = TRUE)),
      last_updated = NOW()
  WHERE metric_name = 'successful_complaints';
  
  -- Total fees recovered
  UPDATE platform_statistics
  SET metric_value = jsonb_build_object('value', (SELECT COALESCE(SUM(fees_recovered), 0) FROM complaint_analytics)),
      last_updated = NOW()
  WHERE metric_name = 'total_fees_recovered';
  
  -- Total ex-gratia
  UPDATE platform_statistics
  SET metric_value = jsonb_build_object('value', (SELECT COALESCE(SUM(ex_gratia_amount), 0) FROM complaint_analytics)),
      last_updated = NOW()
  WHERE metric_name = 'total_ex_gratia';
  
  -- Success rate
  UPDATE platform_statistics
  SET metric_value = jsonb_build_object('value', 
    CASE 
      WHEN (SELECT COUNT(*) FROM complaint_analytics WHERE status IN ('successful', 'unsuccessful')) > 0 THEN
        ROUND((SELECT COUNT(*)::DECIMAL FROM complaint_analytics WHERE is_successful = TRUE) / 
              (SELECT COUNT(*)::DECIMAL FROM complaint_analytics WHERE status IN ('successful', 'unsuccessful')) * 100, 1)
      ELSE 0
    END
  ),
      last_updated = NOW()
  WHERE metric_name = 'success_rate';
  
  -- Average fee recovery
  UPDATE platform_statistics
  SET metric_value = jsonb_build_object('value', 
    COALESCE((SELECT AVG(fees_recovered) FROM complaint_analytics WHERE is_successful = TRUE), 0)
  ),
      last_updated = NOW()
  WHERE metric_name = 'avg_fee_recovery';
  
  -- Average duration
  UPDATE platform_statistics
  SET metric_value = jsonb_build_object('value', 
    COALESCE((SELECT AVG(duration_days) FROM complaint_analytics WHERE duration_days IS NOT NULL), 0)
  ),
      last_updated = NOW()
  WHERE metric_name = 'avg_duration_days';
  
  -- Complaints by type (FIX: Handle empty result with COALESCE)
  UPDATE platform_statistics
  SET metric_value = COALESCE(
    (
      SELECT jsonb_object_agg(complaint_type, count)
      FROM (
        SELECT COALESCE(complaint_type, 'other') as complaint_type, COUNT(*) as count
        FROM complaint_analytics
        GROUP BY complaint_type
      ) subq
    ),
    '{"paye": 0, "vat": 0, "sa": 0, "ct": 0, "other": 0}'::jsonb
  ),
      last_updated = NOW()
  WHERE metric_name = 'complaints_by_type';
  
  -- Complaints by client type (FIX: Handle empty result with COALESCE)
  UPDATE platform_statistics
  SET metric_value = COALESCE(
    (
      SELECT jsonb_object_agg(client_type, count)
      FROM (
        SELECT COALESCE(client_type, 'other') as client_type, COUNT(*) as count
        FROM complaint_analytics
        GROUP BY client_type
      ) subq
    ),
    '{"sole_trader": 0, "partnership": 0, "ltd_company": 0, "llp": 0, "charity": 0, "other": 0}'::jsonb
  ),
      last_updated = NOW()
  WHERE metric_name = 'complaints_by_client_type';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the fix
SELECT 'Function updated successfully' as status;

