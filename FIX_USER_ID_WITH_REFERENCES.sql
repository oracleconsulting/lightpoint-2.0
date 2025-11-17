-- Fix user ID mismatch by updating all foreign key references
-- This updates the old ID to the new Auth ID everywhere

BEGIN;

-- 1. Show current user
SELECT id, email, organization_id FROM lightpoint_users WHERE email = 'jhoward@rpgcc.co.uk';

-- 2. Check what tables reference this user
SELECT 
  'complaint_assignments' as table_name,
  COUNT(*) as count
FROM complaint_assignments 
WHERE assigned_by = '964ff71f-b611-494c-908c-22e42d883424';

-- 3. Update complaint_assignments to use new Auth ID
UPDATE complaint_assignments
SET assigned_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE assigned_by = '964ff71f-b611-494c-908c-22e42d883424';

-- 4. Check if there are any other references (complaints created_by, etc)
SELECT 
  'complaints' as table_name,
  COUNT(*) as count
FROM complaints 
WHERE created_by = '964ff71f-b611-494c-908c-22e42d883424';

-- 5. Update complaints created_by
UPDATE complaints
SET created_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE created_by = '964ff71f-b611-494c-908c-22e42d883424';

-- 6. Check documents
UPDATE documents
SET uploaded_by = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE uploaded_by = '964ff71f-b611-494c-908c-22e42d883424';

-- 7. Now we can safely update the user ID
UPDATE lightpoint_users
SET id = '19583c08-6993-4113-b46a-bd30e3375f54'
WHERE id = '964ff71f-b611-494c-908c-22e42d883424';

-- 8. Verify the user now has correct ID
SELECT 
  id,
  email,
  full_name,
  organization_id,
  role
FROM lightpoint_users
WHERE email = 'jhoward@rpgcc.co.uk';

COMMIT;

