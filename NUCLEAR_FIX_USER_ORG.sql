-- NUCLEAR OPTION: Disable RLS temporarily to update the user
-- Run these commands ONE AT A TIME in Supabase SQL Editor

-- 1. First, check current state
SELECT id, email, organization_id FROM lightpoint_users WHERE id = '19583c08-6993-4113-b46a-bd30e3375f54';

-- 2. Temporarily disable RLS on lightpoint_users (AS SUPERUSER)
ALTER TABLE lightpoint_users DISABLE ROW LEVEL SECURITY;

-- 3. Force update the user's organization
UPDATE lightpoint_users
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE id = '19583c08-6993-4113-b46a-bd30e3375f54';

-- 4. Verify it worked
SELECT id, email, organization_id FROM lightpoint_users WHERE id = '19583c08-6993-4113-b46a-bd30e3375f54';

-- 5. Re-enable RLS
ALTER TABLE lightpoint_users ENABLE ROW LEVEL SECURITY;

-- 6. Final verification
SELECT id, email, organization_id FROM lightpoint_users WHERE id = '19583c08-6993-4113-b46a-bd30e3375f54';

