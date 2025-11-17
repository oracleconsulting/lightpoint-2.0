-- CREATE USER RECORD IN lightpoint_users table
-- This user exists in Supabase Auth but not in our lightpoint_users table

-- 1. First, ensure the default organization exists
INSERT INTO organizations (id, name, created_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Organization',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create the user record in lightpoint_users
INSERT INTO lightpoint_users (
  id,
  email,
  full_name,
  organization_id,
  role,
  is_active,
  created_at,
  updated_at
)
VALUES (
  '19583c08-6993-4113-b46a-bd30e3375f54',
  'jhoward@rpgcc.co.uk',
  'James Howard',
  '00000000-0000-0000-0000-000000000001',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  organization_id = '00000000-0000-0000-0000-000000000001',
  updated_at = NOW();

-- 3. Verify the user was created
SELECT 
  id,
  email,
  full_name,
  organization_id,
  role,
  is_active
FROM lightpoint_users
WHERE id = '19583c08-6993-4113-b46a-bd30e3375f54';

-- 4. Verify complaints exist for this organization
SELECT 
  id,
  complaint_reference,
  status,
  organization_id,
  created_by
FROM complaints
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC
LIMIT 5;

