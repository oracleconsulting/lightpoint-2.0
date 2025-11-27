-- ============================================================================
-- LIGHTPOINT SUPERADMIN & PRACTICE ADMIN ROLE SETUP
-- ============================================================================
-- info@lightpoint.uk = SUPERADMIN (full product admin, knowledge base management)
-- jhoward@rpgcc = PRACTICE ADMIN (admin for RPGCC only, not superadmin)
-- ============================================================================

-- Step 1: Ensure user_roles table exists and has correct structure
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('super_admin', 'admin', 'user')),
  
  -- Permissions (super_admin has all by default)
  can_manage_tiers BOOLEAN DEFAULT FALSE,
  can_manage_users BOOLEAN DEFAULT FALSE,
  can_manage_content BOOLEAN DEFAULT FALSE,
  can_view_analytics BOOLEAN DEFAULT FALSE,
  can_manage_billing BOOLEAN DEFAULT FALSE,
  can_manage_knowledge_base BOOLEAN DEFAULT FALSE,  -- NEW: KB management permission
  
  -- Metadata
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one role per user
  UNIQUE(user_id, role)
);

-- Add can_manage_knowledge_base column if it doesn't exist
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS can_manage_knowledge_base BOOLEAN DEFAULT FALSE;

-- Step 2: Create/update is_super_admin function
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid
    AND role = 'super_admin'
    AND revoked_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create can_manage_knowledge_base function
CREATE OR REPLACE FUNCTION can_manage_knowledge_base(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Only super_admin can manage knowledge base
  RETURN is_super_admin(user_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Remove any existing super_admin role from jhoward@rpgcc (if exists)
UPDATE user_roles 
SET revoked_at = NOW(), 
    notes = 'Revoked: User is practice admin only, not superadmin'
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jhoward@rpgcc.co.uk')
AND role = 'super_admin'
AND revoked_at IS NULL;

-- Also check for james.howard@rpgcc.co.uk
UPDATE user_roles 
SET revoked_at = NOW(),
    notes = 'Revoked: User is practice admin only, not superadmin'
WHERE user_id = (SELECT id FROM auth.users WHERE email ILIKE '%howard%rpgcc%')
AND role = 'super_admin'
AND revoked_at IS NULL;

-- Step 5: Grant super_admin to info@lightpoint.uk
-- First, check if the user exists (they may need to sign up first)
DO $$
DECLARE
  lightpoint_user_id UUID;
BEGIN
  -- Try to find the user
  SELECT id INTO lightpoint_user_id 
  FROM auth.users 
  WHERE email = 'info@lightpoint.uk';
  
  IF lightpoint_user_id IS NOT NULL THEN
    -- Grant super_admin role
    INSERT INTO user_roles (
      user_id, 
      role, 
      can_manage_tiers, 
      can_manage_users, 
      can_manage_content, 
      can_view_analytics, 
      can_manage_billing,
      can_manage_knowledge_base,
      notes
    ) VALUES (
      lightpoint_user_id,
      'super_admin',
      TRUE,
      TRUE,
      TRUE,
      TRUE,
      TRUE,
      TRUE,
      'Lightpoint product superadmin - full access'
    )
    ON CONFLICT (user_id, role) 
    DO UPDATE SET 
      can_manage_tiers = TRUE,
      can_manage_users = TRUE,
      can_manage_content = TRUE,
      can_view_analytics = TRUE,
      can_manage_billing = TRUE,
      can_manage_knowledge_base = TRUE,
      revoked_at = NULL,
      updated_at = NOW(),
      notes = 'Lightpoint product superadmin - full access';
      
    RAISE NOTICE '✅ Granted super_admin to info@lightpoint.uk';
  ELSE
    RAISE NOTICE '⚠️ User info@lightpoint.uk not found - they need to sign up first';
    RAISE NOTICE 'Run this SQL again after they sign up';
  END IF;
END $$;

-- Step 6: Ensure jhoward@rpgcc is practice admin (in lightpoint_users) but NOT super_admin
-- They should have role='admin' in lightpoint_users for their organization only
DO $$
DECLARE
  rpgcc_user_id UUID;
  rpgcc_org_id UUID;
BEGIN
  -- Find the user (could be various email formats)
  SELECT id INTO rpgcc_user_id 
  FROM auth.users 
  WHERE email ILIKE '%howard%rpgcc%' OR email ILIKE 'jhoward@rpgcc%'
  LIMIT 1;
  
  IF rpgcc_user_id IS NOT NULL THEN
    -- Get or create their organization
    SELECT organization_id INTO rpgcc_org_id
    FROM lightpoint_users
    WHERE id = rpgcc_user_id;
    
    IF rpgcc_org_id IS NULL THEN
      rpgcc_org_id := gen_random_uuid();
    END IF;
    
    -- Ensure they're in lightpoint_users as practice admin
    INSERT INTO lightpoint_users (id, email, role, organization_id, full_name, is_active)
    SELECT 
      rpgcc_user_id,
      email,
      'admin',
      rpgcc_org_id,
      'James Howard',
      TRUE
    FROM auth.users WHERE id = rpgcc_user_id
    ON CONFLICT (id) 
    DO UPDATE SET 
      role = 'admin',
      is_active = TRUE,
      updated_at = NOW();
      
    RAISE NOTICE '✅ Set jhoward@rpgcc as practice admin for their organization';
    
    -- Make sure they DON'T have super_admin in user_roles
    -- (already handled above, but double-check)
    DELETE FROM user_roles 
    WHERE user_id = rpgcc_user_id 
    AND role = 'super_admin'
    AND revoked_at IS NULL;
    
  ELSE
    RAISE NOTICE '⚠️ RPGCC user not found';
  END IF;
END $$;

-- Step 7: Add RLS policy for knowledge_base management
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Super admins can manage knowledge base" ON knowledge_base;

-- Create new policy - only super_admin can INSERT/UPDATE/DELETE
CREATE POLICY "Super admins can manage knowledge base"
  ON knowledge_base
  FOR ALL
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()));

-- Step 8: Verification queries
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICATION ===';
END $$;

-- Show current super_admin users
SELECT 
  'super_admin' as role_type,
  u.email,
  ur.granted_at,
  ur.notes
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'super_admin' AND ur.revoked_at IS NULL;

-- Show practice admins
SELECT
  'practice_admin' as role_type,
  lu.email,
  lu.role,
  lu.organization_id,
  lu.full_name
FROM lightpoint_users lu
WHERE lu.role = 'admin' AND lu.is_active = TRUE;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- ✅ info@lightpoint.uk = super_admin (product-level, KB management)
-- ✅ jhoward@rpgcc = admin (practice-level for RPGCC only)
-- ✅ Knowledge base management restricted to super_admin
-- 
-- If info@lightpoint.uk hasn't signed up yet:
-- 1. Have them sign up at lightpoint.uk
-- 2. Run this SQL again to grant super_admin
-- ============================================================================

