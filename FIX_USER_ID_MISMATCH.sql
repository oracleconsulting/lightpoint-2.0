-- Fix ID mismatch between Supabase Auth and lightpoint_users table
-- Auth ID:  19583c08-6993-4113-b46a-bd30e3375f54
-- DB ID:    964ff71f-b611-494c-908c-22e42d883424

-- OPTION 1: Delete the old user record and create a new one with correct ID
-- (Safer if there are foreign key constraints)

BEGIN;

-- 1. Save the old user data
SELECT * FROM lightpoint_users WHERE email = 'jhoward@rpgcc.co.uk';

-- 2. Delete the old user record
DELETE FROM lightpoint_users WHERE email = 'jhoward@rpgcc.co.uk';

-- 3. Insert new user with correct Auth ID
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
  '19583c08-6993-4113-b46a-bd30e3375f54',  -- Correct Auth ID
  'jhoward@rpgcc.co.uk',
  'James Howard',
  '00000000-0000-0000-0000-000000000001',
  'admin',
  true,
  NOW(),
  NOW()
);

-- 4. Verify the new user
SELECT 
  id,
  email,
  full_name,
  organization_id,
  role
FROM lightpoint_users
WHERE email = 'jhoward@rpgcc.co.uk';

COMMIT;

