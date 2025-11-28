-- ============================================================================
-- ADD REAL METRICS FIELDS TO COMPLAINTS
-- ============================================================================
-- Adds fields needed for real dashboard metrics:
-- - recovered_amount: Amount recovered from HMRC
-- - resolved_at: When complaint was resolved (may already exist)
-- - onboarding_completed: Track if user has completed onboarding
-- ============================================================================

-- Step 1: Add recovered_amount to complaints if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'complaints' AND column_name = 'recovered_amount'
  ) THEN
    ALTER TABLE complaints ADD COLUMN recovered_amount DECIMAL(12, 2) DEFAULT 0;
    COMMENT ON COLUMN complaints.recovered_amount IS 'Amount recovered from HMRC in GBP';
  END IF;
END $$;

-- Step 2: Add resolved_at to complaints if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'complaints' AND column_name = 'resolved_at'
  ) THEN
    ALTER TABLE complaints ADD COLUMN resolved_at TIMESTAMPTZ;
    COMMENT ON COLUMN complaints.resolved_at IS 'When the complaint was resolved';
  END IF;
END $$;

-- Step 3: Add onboarding fields to organizations
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE organizations ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    ALTER TABLE organizations ADD COLUMN onboarding_meeting_booked BOOLEAN DEFAULT FALSE;
    ALTER TABLE organizations ADD COLUMN onboarding_meeting_date TIMESTAMPTZ;
    COMMENT ON COLUMN organizations.onboarding_completed IS 'Whether org has completed initial onboarding';
    COMMENT ON COLUMN organizations.onboarding_meeting_booked IS 'Whether org has booked onboarding meeting';
    COMMENT ON COLUMN organizations.onboarding_meeting_date IS 'Scheduled onboarding meeting date';
  END IF;
END $$;

-- Step 4: Create function to calculate organization metrics
CREATE OR REPLACE FUNCTION get_organization_metrics(org_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
  active_count INTEGER;
  resolved_count INTEGER;
  total_count INTEGER;
  total_recovered DECIMAL;
  avg_resolution_days DECIMAL;
  prev_month_resolved INTEGER;
  prev_month_recovered DECIMAL;
  prev_avg_resolution DECIMAL;
BEGIN
  -- Active complaints (assessment, active, escalated)
  SELECT COUNT(*) INTO active_count
  FROM complaints
  WHERE organization_id = org_id
    AND status IN ('assessment', 'active', 'escalated');
  
  -- Resolved complaints
  SELECT COUNT(*) INTO resolved_count
  FROM complaints
  WHERE organization_id = org_id
    AND status IN ('resolved', 'closed');
  
  -- Total complaints
  SELECT COUNT(*) INTO total_count
  FROM complaints
  WHERE organization_id = org_id;
  
  -- Total recovered amount
  SELECT COALESCE(SUM(recovered_amount), 0) INTO total_recovered
  FROM complaints
  WHERE organization_id = org_id
    AND status IN ('resolved', 'closed');
  
  -- Average resolution time (only for resolved complaints with resolved_at)
  SELECT COALESCE(
    AVG(EXTRACT(DAY FROM (resolved_at - created_at))),
    0
  ) INTO avg_resolution_days
  FROM complaints
  WHERE organization_id = org_id
    AND status IN ('resolved', 'closed')
    AND resolved_at IS NOT NULL;
  
  -- Previous month metrics for trends
  SELECT COUNT(*) INTO prev_month_resolved
  FROM complaints
  WHERE organization_id = org_id
    AND status IN ('resolved', 'closed')
    AND resolved_at >= NOW() - INTERVAL '2 months'
    AND resolved_at < NOW() - INTERVAL '1 month';
  
  SELECT COALESCE(SUM(recovered_amount), 0) INTO prev_month_recovered
  FROM complaints
  WHERE organization_id = org_id
    AND status IN ('resolved', 'closed')
    AND resolved_at >= NOW() - INTERVAL '2 months'
    AND resolved_at < NOW() - INTERVAL '1 month';
  
  SELECT COALESCE(
    AVG(EXTRACT(DAY FROM (resolved_at - created_at))),
    0
  ) INTO prev_avg_resolution
  FROM complaints
  WHERE organization_id = org_id
    AND status IN ('resolved', 'closed')
    AND resolved_at IS NOT NULL
    AND resolved_at >= NOW() - INTERVAL '2 months'
    AND resolved_at < NOW() - INTERVAL '1 month';
  
  -- Build result JSON
  result := json_build_object(
    'activeComplaints', active_count,
    'resolvedComplaints', resolved_count,
    'totalComplaints', total_count,
    'successRate', CASE WHEN total_count > 0 THEN ROUND((resolved_count::DECIMAL / total_count) * 100, 1) ELSE 0 END,
    'totalRecovered', total_recovered,
    'avgResolutionDays', ROUND(avg_resolution_days, 0),
    'trends', json_build_object(
      'resolvedChange', resolved_count - prev_month_resolved,
      'recoveredChange', total_recovered - prev_month_recovered,
      'resolutionDaysChange', ROUND(avg_resolution_days - prev_avg_resolution, 0)
    )
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create view for quick metrics access
CREATE OR REPLACE VIEW organization_metrics_view AS
SELECT 
  o.id as organization_id,
  o.name as organization_name,
  COUNT(c.id) FILTER (WHERE c.status IN ('assessment', 'active', 'escalated')) as active_complaints,
  COUNT(c.id) FILTER (WHERE c.status IN ('resolved', 'closed')) as resolved_complaints,
  COUNT(c.id) as total_complaints,
  COALESCE(SUM(c.recovered_amount) FILTER (WHERE c.status IN ('resolved', 'closed')), 0) as total_recovered,
  COALESCE(
    AVG(EXTRACT(DAY FROM (c.resolved_at - c.created_at))) FILTER (WHERE c.resolved_at IS NOT NULL),
    0
  ) as avg_resolution_days
FROM organizations o
LEFT JOIN complaints c ON c.organization_id = o.id
GROUP BY o.id, o.name;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'complaints.recovered_amount' as field,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'recovered_amount') as exists;

SELECT 'complaints.resolved_at' as field,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'complaints' AND column_name = 'resolved_at') as exists;

SELECT 'organizations.onboarding_completed' as field,
  EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'onboarding_completed') as exists;

SELECT 'get_organization_metrics function' as item,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_organization_metrics') as exists;

-- ============================================================================
-- DONE!
-- ============================================================================
SELECT '✅ Real metrics fields added successfully!' as status;

