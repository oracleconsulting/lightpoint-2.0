-- SOC 2 Compliant Audit Logging Table
-- Immutable audit trail for all significant actions
-- Retention: 7 years (configurable)

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event classification
    category VARCHAR(50) NOT NULL CHECK (category IN ('auth', 'data', 'access', 'admin', 'security')),
    action VARCHAR(100) NOT NULL,
    
    -- Actor information
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    
    -- Resource information
    resource_type VARCHAR(100),
    resource_id VARCHAR(255),
    
    -- Event details (JSON for flexibility)
    details JSONB DEFAULT '{}',
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    
    -- Outcome
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    
    -- Timestamps (immutable)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Composite index for dashboard queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_org_date ON audit_logs(organization_id, created_at DESC);

-- RLS Policies
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read audit logs for their organization
CREATE POLICY "Admins can read org audit logs"
ON audit_logs
FOR SELECT
USING (
    organization_id IN (
        SELECT organization_id FROM user_profiles 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
);

-- Super admins can read all audit logs
CREATE POLICY "Super admins can read all audit logs"
ON audit_logs
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE id = auth.uid() AND is_super_admin = true
    )
);

-- Service role can insert (API writes)
CREATE POLICY "Service role can insert audit logs"
ON audit_logs
FOR INSERT
WITH CHECK (true);

-- NO UPDATE or DELETE policies - audit logs are immutable
-- This is critical for SOC 2 compliance

-- Comment for documentation
COMMENT ON TABLE audit_logs IS 'SOC 2 compliant audit trail. Logs are immutable and retained for 7 years.';
COMMENT ON COLUMN audit_logs.category IS 'Event category: auth, data, access, admin, security';
COMMENT ON COLUMN audit_logs.action IS 'Specific action performed';
COMMENT ON COLUMN audit_logs.details IS 'Additional context as JSON';
COMMENT ON COLUMN audit_logs.success IS 'Whether the action succeeded';

