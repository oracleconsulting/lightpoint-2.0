-- ============================================================================
-- LIGHTPOINT PILOT INVITE SYSTEM
-- ============================================================================
-- Enables Lightpoint admins to invite accounting firms to the platform
-- ============================================================================

-- Step 1: Create organization_invites table
CREATE TABLE IF NOT EXISTS organization_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Invite details
  email TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  contact_name TEXT,
  
  -- Invite metadata
  invited_by UUID REFERENCES lightpoint_users(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Subscription tier for the invite
  tier_id UUID REFERENCES subscription_tiers(id),
  tier_name TEXT DEFAULT 'pilot', -- fallback if tier_id not set
  
  -- Trial period
  trial_days INTEGER DEFAULT 30,
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  
  -- Notes from admin
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create team_invites table (for org admins to invite their team)
CREATE TABLE IF NOT EXISTS team_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Invite details
  email TEXT NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Role assignment
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  
  -- Invite metadata
  invited_by UUID REFERENCES lightpoint_users(id),
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  
  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create indexes
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON organization_invites(email);
CREATE INDEX IF NOT EXISTS idx_org_invites_token ON organization_invites(token);
CREATE INDEX IF NOT EXISTS idx_org_invites_status ON organization_invites(status);
CREATE INDEX IF NOT EXISTS idx_org_invites_invited_by ON organization_invites(invited_by);

CREATE INDEX IF NOT EXISTS idx_team_invites_email ON team_invites(email);
CREATE INDEX IF NOT EXISTS idx_team_invites_token ON team_invites(token);
CREATE INDEX IF NOT EXISTS idx_team_invites_org ON team_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_invites_status ON team_invites(status);

-- Step 4: Enable RLS
ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies for organization_invites
-- Only superadmins can manage organization invites
DROP POLICY IF EXISTS "Superadmins can view all org invites" ON organization_invites;
CREATE POLICY "Superadmins can view all org invites" ON organization_invites
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM lightpoint_users 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "Superadmins can create org invites" ON organization_invites;
CREATE POLICY "Superadmins can create org invites" ON organization_invites
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM lightpoint_users 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

DROP POLICY IF EXISTS "Superadmins can update org invites" ON organization_invites;
CREATE POLICY "Superadmins can update org invites" ON organization_invites
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM lightpoint_users 
      WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Step 6: RLS Policies for team_invites
-- Org admins can manage their org's team invites
DROP POLICY IF EXISTS "Org admins can view team invites" ON team_invites;
CREATE POLICY "Org admins can view team invites" ON team_invites
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM lightpoint_users 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Org admins can create team invites" ON team_invites;
CREATE POLICY "Org admins can create team invites" ON team_invites
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM lightpoint_users 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Org admins can update team invites" ON team_invites;
CREATE POLICY "Org admins can update team invites" ON team_invites
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM lightpoint_users 
      WHERE id = auth.uid() AND role IN ('admin', 'superadmin')
    )
  );

-- Step 7: Function to accept organization invite
CREATE OR REPLACE FUNCTION accept_organization_invite(
  p_token TEXT,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_invite organization_invites%ROWTYPE;
  v_org_id UUID;
  v_tier_id UUID;
BEGIN
  -- Get and validate invite
  SELECT * INTO v_invite 
  FROM organization_invites 
  WHERE token = p_token AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;
  
  IF v_invite.expires_at < NOW() THEN
    UPDATE organization_invites SET status = 'expired' WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', false, 'error', 'Invite has expired');
  END IF;
  
  -- Create organization
  INSERT INTO organizations (name, settings)
  VALUES (
    v_invite.organization_name,
    jsonb_build_object(
      'created_from_invite', v_invite.id,
      'trial_ends_at', NOW() + (v_invite.trial_days || ' days')::INTERVAL
    )
  )
  RETURNING id INTO v_org_id;
  
  -- Update user with organization and admin role
  UPDATE lightpoint_users
  SET 
    organization_id = v_org_id,
    role = 'admin',
    full_name = COALESCE(full_name, v_invite.contact_name)
  WHERE id = p_user_id;
  
  -- Create subscription if tier specified
  IF v_invite.tier_id IS NOT NULL THEN
    INSERT INTO user_subscriptions (
      user_id,
      organization_id,
      tier_id,
      status,
      trial_ends_at
    ) VALUES (
      p_user_id,
      v_org_id,
      v_invite.tier_id,
      'trialing',
      NOW() + (v_invite.trial_days || ' days')::INTERVAL
    );
  END IF;
  
  -- Mark invite as accepted
  UPDATE organization_invites 
  SET 
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = v_invite.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'organization_id', v_org_id,
    'organization_name', v_invite.organization_name
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Function to accept team invite
CREATE OR REPLACE FUNCTION accept_team_invite(
  p_token TEXT,
  p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_invite team_invites%ROWTYPE;
BEGIN
  -- Get and validate invite
  SELECT * INTO v_invite 
  FROM team_invites 
  WHERE token = p_token AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invite');
  END IF;
  
  IF v_invite.expires_at < NOW() THEN
    UPDATE team_invites SET status = 'expired' WHERE id = v_invite.id;
    RETURN jsonb_build_object('success', false, 'error', 'Invite has expired');
  END IF;
  
  -- Update user with organization and role
  UPDATE lightpoint_users
  SET 
    organization_id = v_invite.organization_id,
    role = v_invite.role
  WHERE id = p_user_id;
  
  -- Mark invite as accepted
  UPDATE team_invites 
  SET 
    status = 'accepted',
    accepted_at = NOW()
  WHERE id = v_invite.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'organization_id', v_invite.organization_id,
    'role', v_invite.role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: View for invite statistics
CREATE OR REPLACE VIEW invite_statistics AS
SELECT
  'organization' as invite_type,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_count,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  COUNT(*) as total_count
FROM organization_invites
UNION ALL
SELECT
  'team' as invite_type,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'accepted') as accepted_count,
  COUNT(*) FILTER (WHERE status = 'expired') as expired_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  COUNT(*) as total_count
FROM team_invites;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Organization invites table' as check,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_invites') as exists;

SELECT 'Team invites table' as check,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'team_invites') as exists;

SELECT 'Accept org invite function' as check,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'accept_organization_invite') as exists;

SELECT 'Accept team invite function' as check,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'accept_team_invite') as exists;

-- ============================================================================
-- DONE!
-- ============================================================================
SELECT '✅ Pilot invite system setup complete!' as status;
SELECT 'Tables created: organization_invites, team_invites' as tables;
SELECT 'Functions created: accept_organization_invite, accept_team_invite' as functions;
SELECT 'RLS policies applied for security' as security;

