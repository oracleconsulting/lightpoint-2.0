-- Analytics & Reporting System for Lightpoint Platform
-- Tracks complaint patterns, success rates, and financial metrics

-- ============================================================================
-- ANALYTICS TABLES
-- ============================================================================

-- Complaint Analytics (aggregated stats per complaint)
CREATE TABLE IF NOT EXISTS complaint_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Complaint Classification
  complaint_type TEXT, -- 'paye', 'vat', 'sa', 'ct', 'other'
  client_type TEXT, -- 'sole_trader', 'partnership', 'ltd_company', 'llp', 'charity', 'other'
  hmrc_department TEXT,
  
  -- Outcome Metrics
  status TEXT, -- 'active', 'successful', 'unsuccessful', 'withdrawn', 'escalated'
  resolution_date TIMESTAMPTZ,
  duration_days INTEGER,
  
  -- Financial Metrics
  fees_recovered DECIMAL(10,2) DEFAULT 0,
  ex_gratia_amount DECIMAL(10,2) DEFAULT 0,
  total_compensation DECIMAL(10,2) DEFAULT 0,
  professional_costs DECIMAL(10,2) DEFAULT 0,
  
  -- Success Indicators
  is_successful BOOLEAN DEFAULT FALSE,
  escalation_level INTEGER DEFAULT 1, -- 1=Tier1, 2=Tier2, 3=Adjudicator
  charter_breaches JSONB DEFAULT '[]'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for fast querying
  CONSTRAINT valid_complaint_type CHECK (complaint_type IN ('paye', 'vat', 'sa', 'ct', 'cis', 'other')),
  CONSTRAINT valid_client_type CHECK (client_type IN ('sole_trader', 'partnership', 'ltd_company', 'llp', 'charity', 'other')),
  CONSTRAINT valid_status CHECK (status IN ('active', 'successful', 'unsuccessful', 'withdrawn', 'escalated'))
);

CREATE INDEX idx_complaint_analytics_org ON complaint_analytics(organization_id);
CREATE INDEX idx_complaint_analytics_type ON complaint_analytics(complaint_type);
CREATE INDEX idx_complaint_analytics_client_type ON complaint_analytics(client_type);
CREATE INDEX idx_complaint_analytics_status ON complaint_analytics(status);
CREATE INDEX idx_complaint_analytics_success ON complaint_analytics(is_successful);
CREATE INDEX idx_complaint_analytics_created ON complaint_analytics(created_at DESC);

-- ============================================================================
-- PLATFORM-WIDE STATISTICS (Pre-aggregated for performance)
-- ============================================================================

CREATE TABLE IF NOT EXISTS platform_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT UNIQUE NOT NULL,
  metric_value JSONB NOT NULL,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_metric_name CHECK (metric_name IN (
    'total_complaints',
    'successful_complaints',
    'total_fees_recovered',
    'total_ex_gratia',
    'success_rate',
    'avg_fee_recovery',
    'avg_duration_days',
    'complaints_by_type',
    'complaints_by_client_type',
    'monthly_trend'
  ))
);

-- Seed initial metrics
INSERT INTO platform_statistics (metric_name, metric_value) VALUES
  ('total_complaints', '{"value": 0}'::jsonb),
  ('successful_complaints', '{"value": 0}'::jsonb),
  ('total_fees_recovered', '{"value": 0}'::jsonb),
  ('total_ex_gratia', '{"value": 0}'::jsonb),
  ('success_rate', '{"value": 0}'::jsonb),
  ('avg_fee_recovery', '{"value": 0}'::jsonb),
  ('avg_duration_days', '{"value": 0}'::jsonb),
  ('complaints_by_type', '{"paye": 0, "vat": 0, "sa": 0, "ct": 0, "other": 0}'::jsonb),
  ('complaints_by_client_type', '{"sole_trader": 0, "partnership": 0, "ltd_company": 0, "llp": 0, "charity": 0, "other": 0}'::jsonb),
  ('monthly_trend', '{"last_12_months": []}'::jsonb)
ON CONFLICT (metric_name) DO NOTHING;

-- ============================================================================
-- FUNCTIONS FOR REAL-TIME ANALYTICS
-- ============================================================================

-- Update platform statistics (called by trigger)
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
  
  -- Complaints by type
  UPDATE platform_statistics
  SET metric_value = (
    SELECT jsonb_object_agg(complaint_type, count)
    FROM (
      SELECT COALESCE(complaint_type, 'other') as complaint_type, COUNT(*) as count
      FROM complaint_analytics
      GROUP BY complaint_type
    ) subq
  ),
      last_updated = NOW()
  WHERE metric_name = 'complaints_by_type';
  
  -- Complaints by client type
  UPDATE platform_statistics
  SET metric_value = (
    SELECT jsonb_object_agg(client_type, count)
    FROM (
      SELECT COALESCE(client_type, 'other') as client_type, COUNT(*) as count
      FROM complaint_analytics
      GROUP BY client_type
    ) subq
  ),
      last_updated = NOW()
  WHERE metric_name = 'complaints_by_client_type';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update stats on insert/update
CREATE TRIGGER trigger_update_platform_statistics
AFTER INSERT OR UPDATE OR DELETE ON complaint_analytics
FOR EACH STATEMENT
EXECUTE FUNCTION update_platform_statistics();

-- ============================================================================
-- RPC FUNCTIONS FOR QUERYING ANALYTICS
-- ============================================================================

-- Get platform-wide statistics (public)
CREATE OR REPLACE FUNCTION get_platform_statistics()
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_object_agg(metric_name, metric_value)
  INTO stats
  FROM platform_statistics;
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get organization-specific analytics
CREATE OR REPLACE FUNCTION get_organization_analytics(org_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_complaints', COUNT(*),
    'successful_complaints', COUNT(*) FILTER (WHERE is_successful = TRUE),
    'total_fees_recovered', COALESCE(SUM(fees_recovered), 0),
    'total_ex_gratia', COALESCE(SUM(ex_gratia_amount), 0),
    'success_rate', 
      CASE 
        WHEN COUNT(*) FILTER (WHERE status IN ('successful', 'unsuccessful')) > 0 THEN
          ROUND(COUNT(*) FILTER (WHERE is_successful = TRUE)::DECIMAL / 
                COUNT(*) FILTER (WHERE status IN ('successful', 'unsuccessful'))::DECIMAL * 100, 1)
        ELSE 0
      END,
    'avg_fee_recovery', COALESCE(AVG(fees_recovered) FILTER (WHERE is_successful = TRUE), 0),
    'complaints_by_type', (
      SELECT jsonb_object_agg(complaint_type, count)
      FROM (
        SELECT COALESCE(complaint_type, 'other') as complaint_type, COUNT(*) as count
        FROM complaint_analytics
        WHERE organization_id = org_id
        GROUP BY complaint_type
      ) subq
    ),
    'complaints_by_client_type', (
      SELECT jsonb_object_agg(client_type, count)
      FROM (
        SELECT COALESCE(client_type, 'other') as client_type, COUNT(*) as count
        FROM complaint_analytics
        WHERE organization_id = org_id
        GROUP BY client_type
      ) subq
    )
  )
  INTO result
  FROM complaint_analytics
  WHERE organization_id = org_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE complaint_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_statistics ENABLE ROW LEVEL SECURITY;

-- Users can view their organization's analytics
CREATE POLICY "Users can view their organization analytics"
  ON complaint_analytics FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM lightpoint_users WHERE id = auth.uid()
    )
  );

-- Admins can manage all analytics
CREATE POLICY "Admins can manage analytics"
  ON complaint_analytics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- Platform statistics are publicly readable
CREATE POLICY "Platform statistics are public"
  ON platform_statistics FOR SELECT
  TO public
  USING (true);

-- Only admins can update platform statistics
CREATE POLICY "Only admins update platform stats"
  ON platform_statistics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

-- ============================================================================
-- HELPER VIEW FOR EASY QUERYING
-- ============================================================================

CREATE OR REPLACE VIEW complaint_analytics_summary AS
SELECT 
  ca.*,
  o.name as organization_name,
  c.complaint_reference,
  c.status as current_status
FROM complaint_analytics ca
LEFT JOIN organizations o ON ca.organization_id = o.id
LEFT JOIN complaints c ON ca.complaint_id = c.id;

-- Grant access
GRANT SELECT ON complaint_analytics_summary TO authenticated;

COMMENT ON TABLE complaint_analytics IS 'Tracks detailed analytics for each complaint including success metrics and financial outcomes';
COMMENT ON TABLE platform_statistics IS 'Pre-aggregated platform-wide statistics for fast homepage display';
COMMENT ON FUNCTION get_platform_statistics() IS 'Returns all platform statistics as a single JSONB object (public)';
COMMENT ON FUNCTION get_organization_analytics(UUID) IS 'Returns analytics for a specific organization';

