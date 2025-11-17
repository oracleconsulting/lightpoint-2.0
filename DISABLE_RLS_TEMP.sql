-- TEMPORARY FIX: Disable problematic RLS policy on lightpoint_users
-- This allows the app to fetch user organization data without infinite recursion

-- 1. Check current RLS policies
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'lightpoint_users';

-- 2. Temporarily disable RLS on lightpoint_users
-- (Service role key should bypass this anyway, but something is wrong)
ALTER TABLE lightpoint_users DISABLE ROW LEVEL SECURITY;

-- 3. Verify RLS is disabled
SELECT 
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'lightpoint_users';

-- Note: We'll re-enable RLS with proper policies later
-- For now, this unblocks the app since we're using service_role key anyway

