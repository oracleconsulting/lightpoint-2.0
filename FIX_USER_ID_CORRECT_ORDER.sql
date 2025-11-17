-- Fix user ID mismatch - CORRECT ORDER
-- Step 1: Create new user with Auth ID
-- Step 2: Update all foreign key references  
-- Step 3: Delete old user

BEGIN;

-- 1. Show current state
SELECT id, email, organization_id, role FROM lightpoint_users WHERE email = 'jhoward@rpgcc.co.uk';

-- 2. Insert NEW user with correct Auth ID (alongside old user temporarily)
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
  '19583c08-6993-4113-b46a-bd30e3375f54',  -- New Auth ID
  'jhoward+new@rpgcc.co.uk',  -- Temporary different email to avoid unique constraint
  'James Howard',
  '00000000-0000-0000-0000-000000000001',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 3. Now update complaint_assignments to reference new user
UPDATE complaint_assignments
SET assigned_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE assigned_by = '964ff71f-b611-494c-908c-22e42d883424';

-- 4. Update complaints created_by
UPDATE complaints
SET created_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE created_by = '964ff71f-b611-494c-908c-22e42d883424';

-- 5. Update documents uploaded_by
UPDATE documents
SET uploaded_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE uploaded_by = '964ff71f-b611-494c-908c-22e42d883424';

-- 6. Delete the old user record
DELETE FROM lightpoint_users WHERE id = '964ff71f-b611-494c-908c-22e42d883424';

-- 7. Fix the email on the new user to be correct
UPDATE lightpoint_users
SET email = 'jhoward@rpgcc.co.uk'
WHERE id = '19583c08-6993-4113-b46a-bd30e3375f54';

-- 8. Verify final state
SELECT 
  id,
  email,
  full_name,
  organization_id,
  role
FROM lightpoint_users
WHERE email = 'jhoward@rpgcc.co.uk';

COMMIT;

