-- Background Job Queue Table
-- For processing long-running tasks asynchronously

CREATE TABLE IF NOT EXISTS job_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Job definition
    type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}',
    
    -- Status tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Priority (higher = more urgent)
    priority INTEGER NOT NULL DEFAULT 5,
    
    -- Retry handling
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    
    -- Results
    result JSONB,
    error TEXT,
    
    -- Scheduling
    scheduled_for TIMESTAMPTZ DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- Indexes for efficient job processing
CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_priority ON job_queue(priority DESC, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled ON job_queue(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON job_queue(type);

-- Composite index for dequeue query
CREATE INDEX IF NOT EXISTS idx_job_queue_dequeue ON job_queue(status, scheduled_for, priority DESC, created_at ASC);

-- RLS Policies
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

-- Service role has full access
CREATE POLICY "Service role can manage job queue"
ON job_queue
FOR ALL
USING (true)
WITH CHECK (true);

-- Comments
COMMENT ON TABLE job_queue IS 'Background job queue for async processing';
COMMENT ON COLUMN job_queue.type IS 'Job type: document_ocr, letter_generation, embedding_generation, etc.';
COMMENT ON COLUMN job_queue.priority IS 'Higher priority jobs are processed first (default: 5)';
COMMENT ON COLUMN job_queue.scheduled_for IS 'When the job should be processed (for delayed jobs)';

-- API Keys Table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Organization
    organization_id UUID NOT NULL REFERENCES organizations(id),
    
    -- Key details
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(64) NOT NULL UNIQUE, -- SHA256 hash
    key_prefix VARCHAR(8) NOT NULL, -- First 8 chars for identification
    
    -- Permissions
    scopes TEXT[] NOT NULL DEFAULT ARRAY['read', 'write'],
    
    -- Status
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    
    -- Revocation
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES auth.users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_org ON api_keys(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = true;

-- RLS Policies
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Admins can manage their org's API keys
CREATE POLICY "Admins can manage org API keys"
ON api_keys
FOR ALL
USING (
    organization_id IN (
        SELECT organization_id FROM lightpoint_users 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
)
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM lightpoint_users 
        WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
);

-- Comments
COMMENT ON TABLE api_keys IS 'API keys for programmatic access';
COMMENT ON COLUMN api_keys.key_hash IS 'SHA256 hash of the API key (actual key never stored)';
COMMENT ON COLUMN api_keys.scopes IS 'Permissions granted to this key';

