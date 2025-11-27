-- ============================================================================
-- FIX: Set up info@lightpoint.uk as superadmin with proper organization
-- ============================================================================

-- Step 1: Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Insert Lightpoint organization (delete first to avoid conflicts)
DELETE FROM organizations WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
INSERT INTO organizations (id, name, created_at)
VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'Lightpoint',
  NOW()
);

-- Step 3: Add info@lightpoint.uk to lightpoint_users
-- First delete any existing record to avoid conflicts
DELETE FROM lightpoint_users WHERE email = 'info@lightpoint.uk';

INSERT INTO lightpoint_users (id, email, organization_id, role, full_name, is_active)
SELECT 
  id,
  email,
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'admin',
  'Lightpoint Admin',
  TRUE
FROM auth.users 
WHERE email = 'info@lightpoint.uk';

-- Step 4: Grant super_admin role in user_roles
-- First delete any existing to avoid conflicts
DELETE FROM user_roles 
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'info@lightpoint.uk');

INSERT INTO user_roles (
  user_id, 
  role, 
  can_manage_tiers, 
  can_manage_users, 
  can_manage_content, 
  can_view_analytics, 
  can_manage_billing,
  notes
)
SELECT 
  id,
  'super_admin',
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  TRUE,
  'Lightpoint product superadmin - full access'
FROM auth.users 
WHERE email = 'info@lightpoint.uk';

-- Step 5: Verify
SELECT 
  'auth.users' as source,
  u.id,
  u.email
FROM auth.users u
WHERE u.email = 'info@lightpoint.uk';

SELECT 
  'lightpoint_users' as source,
  lu.id,
  lu.email,
  lu.organization_id,
  lu.role,
  lu.full_name
FROM lightpoint_users lu
WHERE lu.email = 'info@lightpoint.uk';

SELECT 
  'user_roles' as source,
  ur.user_id,
  ur.role,
  ur.revoked_at
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'info@lightpoint.uk';

-- Done!
SELECT '✅ info@lightpoint.uk is now set up as superadmin!' as status;
