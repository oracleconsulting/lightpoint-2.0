-- ============================================================================
-- LIGHTPOINT PILOT STATUS SYSTEM
-- ============================================================================
-- Controls access to platform features during pilot onboarding
-- 
-- Pilot Status Flow:
-- 1. pending_call    - User invited but hasn't scheduled call yet
-- 2. call_scheduled  - User has scheduled Calendly call
-- 3. pilot_active    - Admin has activated pilot during/after call
-- 4. pilot_complete  - Pilot period ended, full access granted
-- ============================================================================

-- Step 1: Add pilot_status to organizations table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS pilot_status TEXT DEFAULT 'pending_call' 
CHECK (pilot_status IN ('pending_call', 'call_scheduled', 'pilot_active', 'pilot_complete'));

-- Step 2: Add pilot tracking fields
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS pilot_call_scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pilot_activated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS pilot_activated_by UUID REFERENCES lightpoint_users(id),
ADD COLUMN IF NOT EXISTS pilot_notes TEXT,
ADD COLUMN IF NOT EXISTS calendly_event_uri TEXT;

-- Step 3: Create function to schedule pilot call
CREATE OR REPLACE FUNCTION schedule_pilot_call(
  p_organization_id UUID,
  p_calendly_event_uri TEXT DEFAULT NULL
) RETURNS JSONB AS $$
BEGIN
  UPDATE organizations
  SET 
    pilot_status = 'call_scheduled',
    pilot_call_scheduled_at = NOW(),
    calendly_event_uri = p_calendly_event_uri
  WHERE id = p_organization_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'status', 'call_scheduled'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Create function to activate pilot (admin only)
CREATE OR REPLACE FUNCTION activate_pilot(
  p_organization_id UUID,
  p_activated_by UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_is_superadmin BOOLEAN;
BEGIN
  -- Check if user is superadmin
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = p_activated_by 
    AND role = 'super_admin' 
    AND revoked_at IS NULL
  ) INTO v_is_superadmin;
  
  IF NOT v_is_superadmin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only superadmins can activate pilots'
    );
  END IF;
  
  UPDATE organizations
  SET 
    pilot_status = 'pilot_active',
    pilot_activated_at = NOW(),
    pilot_activated_by = p_activated_by,
    pilot_notes = COALESCE(p_notes, pilot_notes)
  WHERE id = p_organization_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'status', 'pilot_active',
    'activated_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create function to complete pilot
CREATE OR REPLACE FUNCTION complete_pilot(
  p_organization_id UUID,
  p_activated_by UUID
) RETURNS JSONB AS $$
DECLARE
  v_is_superadmin BOOLEAN;
BEGIN
  -- Check if user is superadmin
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = p_activated_by 
    AND role = 'super_admin' 
    AND revoked_at IS NULL
  ) INTO v_is_superadmin;
  
  IF NOT v_is_superadmin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only superadmins can complete pilots'
    );
  END IF;
  
  UPDATE organizations
  SET pilot_status = 'pilot_complete'
  WHERE id = p_organization_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'status', 'pilot_complete'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 6: Create view for pilot organizations (admin use)
CREATE OR REPLACE VIEW pilot_organizations AS
SELECT 
  o.id,
  o.name,
  o.pilot_status,
  o.pilot_call_scheduled_at,
  o.pilot_activated_at,
  o.pilot_notes,
  o.calendly_event_uri,
  o.created_at,
  COUNT(DISTINCT u.id) as user_count,
  MAX(u.email) as primary_email,
  MAX(u.full_name) as primary_contact
FROM organizations o
LEFT JOIN lightpoint_users u ON u.organization_id = o.id
WHERE o.pilot_status IN ('pending_call', 'call_scheduled', 'pilot_active')
GROUP BY o.id, o.name, o.pilot_status, o.pilot_call_scheduled_at, 
         o.pilot_activated_at, o.pilot_notes, o.calendly_event_uri, o.created_at
ORDER BY 
  CASE o.pilot_status 
    WHEN 'call_scheduled' THEN 1
    WHEN 'pending_call' THEN 2
    WHEN 'pilot_active' THEN 3
  END,
  o.pilot_call_scheduled_at DESC NULLS LAST;

-- Step 7: Set existing test organizations to pilot_complete for now
-- (This ensures the superadmin account works)
UPDATE organizations 
SET pilot_status = 'pilot_complete'
WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'; -- Lightpoint org

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'pilot_status column added' as check,
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'pilot_status'
  ) as exists;

SELECT 'activate_pilot function' as check,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'activate_pilot') as exists;

SELECT '✅ Pilot status system ready!' as status;

