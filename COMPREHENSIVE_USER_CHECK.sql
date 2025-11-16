-- Comprehensive check of user and organization data

-- 1. Check if user exists and has organization_id
SELECT 
  id,
  email,
  full_name,
  organization_id,
  role,
  is_active,
  created_at,
  updated_at
FROM lightpoint_users
WHERE email = 'jhoward@rpgcc.co.uk'
   OR id = '19583c08-6993-4113-b46a-bd30e3375f54';

-- 2. Check if default organization exists
SELECT 
  id,
  name,
  created_at
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3. If organization doesn't exist, create it
INSERT INTO organizations (id, name, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Organization',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE
SET updated_at = NOW();

-- 4. Force update the user's organization (bypassing any constraints)
UPDATE lightpoint_users
SET 
  organization_id = '00000000-0000-0000-0000-000000000001',
  updated_at = NOW()
WHERE id = '19583c08-6993-4113-b46a-bd30e3375f54';

-- 5. Verify the update worked
SELECT 
  id,
  email,
  full_name,
  organization_id,
  role,
  is_active,
  updated_at
FROM lightpoint_users
WHERE id = '19583c08-6993-4113-b46a-bd30e3375f54';

-- 6. Check RLS policies on lightpoint_users table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'lightpoint_users';

-- 7. Check if there are any complaints for this organization
SELECT 
  id,
  complaint_reference,
  status,
  organization_id,
  created_by,
  created_at
FROM complaints
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC
LIMIT 5;

