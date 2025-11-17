-- COMPLETE FIX: Handle ALL foreign key references to user ID
-- This checks and updates EVERY table that might reference the user

BEGIN;

-- 1. Show current state
SELECT 'Current user:' as step;
SELECT id, email, organization_id, role FROM lightpoint_users WHERE email = 'jhoward@rpgcc.co.uk';

-- 2. Find ALL references to old user ID across all tables
SELECT 'Checking complaint_assignments (assigned_by):' as step;
SELECT COUNT(*) FROM complaint_assignments WHERE assigned_by = '964ff71f-b611-494c-908c-22e42d883424';

SELECT 'Checking complaint_assignments (assigned_to):' as step;
SELECT COUNT(*) FROM complaint_assignments WHERE assigned_to = '964ff71f-b611-494c-908c-22e42d883424';

SELECT 'Checking complaints (created_by):' as step;
SELECT COUNT(*) FROM complaints WHERE created_by = '964ff71f-b611-494c-908c-22e42d883424';

SELECT 'Checking documents (uploaded_by):' as step;
SELECT COUNT(*) FROM documents WHERE uploaded_by = '964ff71f-b611-494c-908c-22e42d883424';

-- 3. Insert NEW user with correct Auth ID
SELECT 'Creating new user with Auth ID:' as step;
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
  'jhoward+temp@rpgcc.co.uk',  -- Temporary to avoid unique constraint
  'James Howard',
  '00000000-0000-0000-0000-000000000001',
  'admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 4. Update ALL complaint_assignments references (both assigned_by AND assigned_to)
SELECT 'Updating complaint_assignments.assigned_by:' as step;
UPDATE complaint_assignments
SET assigned_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE assigned_by = '964ff71f-b611-494c-908c-22e42d883424';

SELECT 'Updating complaint_assignments.assigned_to:' as step;
UPDATE complaint_assignments
SET assigned_to = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE assigned_to = '964ff71f-b611-494c-908c-22e42d883424';

-- 5. Update complaints
SELECT 'Updating complaints.created_by:' as step;
UPDATE complaints
SET created_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE created_by = '964ff71f-b611-494c-908c-22e42d883424';

-- 6. Update documents
SELECT 'Updating documents.uploaded_by:' as step;
UPDATE documents
SET uploaded_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE uploaded_by = '964ff71f-b611-494c-908c-22e42d883424';

-- 7. Delete old user
SELECT 'Deleting old user:' as step;
DELETE FROM lightpoint_users WHERE id = '964ff71f-b611-494c-908c-22e42d883424';

-- 8. Fix email on new user
SELECT 'Fixing email:' as step;
UPDATE lightpoint_users
SET email = 'jhoward@rpgcc.co.uk'
WHERE id = '19583c08-6993-4113-b46a-bd30e3375f54';

-- 9. Final verification
SELECT 'FINAL STATE:' as step;
SELECT 
  id,
  email,
  full_name,
  organization_id,
  role,
  is_active
FROM lightpoint_users
WHERE email = 'jhoward@rpgcc.co.uk';

COMMIT;

SELECT '✅ SUCCESS! User ID migration complete.' as result;

