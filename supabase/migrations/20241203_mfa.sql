-- Multi-Factor Authentication Table
-- Stores MFA settings for users

CREATE TABLE IF NOT EXISTS user_mfa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- TOTP settings
    totp_secret VARCHAR(64) NOT NULL, -- Base32 encoded secret
    
    -- Backup codes (hashed)
    backup_codes TEXT[] DEFAULT '{}',
    
    -- Status
    enabled BOOLEAN NOT NULL DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ
);

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_user_mfa_user ON user_mfa(user_id);

-- RLS Policies
ALTER TABLE user_mfa ENABLE ROW LEVEL SECURITY;

-- Users can only see their own MFA settings
CREATE POLICY "Users can view own MFA"
ON user_mfa
FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own MFA settings
CREATE POLICY "Users can update own MFA"
ON user_mfa
FOR UPDATE
USING (user_id = auth.uid());

-- Service role can manage MFA (for API operations)
CREATE POLICY "Service can manage MFA"
ON user_mfa
FOR ALL
USING (true)
WITH CHECK (true);

-- Comments
COMMENT ON TABLE user_mfa IS 'Multi-factor authentication settings for users';
COMMENT ON COLUMN user_mfa.totp_secret IS 'Base32 encoded TOTP secret (should be encrypted in production)';
COMMENT ON COLUMN user_mfa.backup_codes IS 'SHA256 hashed backup codes';
COMMENT ON COLUMN user_mfa.enabled IS 'Whether MFA is active for this user';

-- Function to check if user has MFA enabled
CREATE OR REPLACE FUNCTION has_mfa_enabled(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_mfa 
        WHERE user_id = p_user_id AND enabled = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rate limiting table for login attempts
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL, -- Email or IP
    attempt_type VARCHAR(50) NOT NULL DEFAULT 'password', -- password, mfa, backup_code
    success BOOLEAN NOT NULL DEFAULT false,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for checking recent attempts
CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier ON login_attempts(identifier, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address, created_at DESC);

-- Cleanup old login attempts (keep 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_login_attempts()
RETURNS void AS $$
BEGIN
    DELETE FROM login_attempts 
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(p_identifier VARCHAR(255))
RETURNS BOOLEAN AS $$
DECLARE
    failed_attempts INTEGER;
BEGIN
    SELECT COUNT(*) INTO failed_attempts
    FROM login_attempts
    WHERE identifier = p_identifier
    AND success = false
    AND created_at > NOW() - INTERVAL '15 minutes';
    
    RETURN failed_attempts >= 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE login_attempts IS 'Login attempt tracking for security monitoring';
COMMENT ON FUNCTION is_account_locked IS 'Check if account is locked due to failed attempts';

