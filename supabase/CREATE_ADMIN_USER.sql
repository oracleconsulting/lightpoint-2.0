-- ============================================================================
-- CREATE ADMIN USER FOR JAMES HOWARD - LIGHTPOINT
-- ============================================================================
-- This creates both the Supabase Auth user AND the lightpoint_users profile
-- Run this in Supabase SQL Editor (NOT Dashboard SQL - use the Auth Admin API)
-- ============================================================================

-- IMPORTANT: You need to run this via Supabase Auth Admin API or Dashboard
-- This SQL creates the profile, but you need to create the auth user first

-- ============================================================================
-- OPTION 1: Use Supabase Dashboard (EASIEST)
-- ============================================================================
-- 1. Go to: Authentication → Users
-- 2. Click "Invite User"
-- 3. Email: james.howard@youremail.com  (UPDATE THIS!)
-- 4. Click "Send Invite"
-- 5. Check your email and set password
-- 6. Then run the SQL below to set role to admin

-- ============================================================================
-- OPTION 2: Run SQL After Creating Auth User
-- ============================================================================

-- Update existing user to admin (after you've been invited/created)
UPDATE lightpoint_users
SET 
  role = 'admin',
  full_name = 'James Howard',
  job_title = 'Managing Partner',
  is_active = true,
  updated_at = now()
WHERE email = 'james.howard@youremail.com';  -- UPDATE THIS EMAIL!

-- Verify admin user
SELECT 
  id,
  email,
  full_name,
  role,
  job_title,
  is_active,
  created_at
FROM lightpoint_users
WHERE email = 'james.howard@youremail.com';  -- UPDATE THIS EMAIL!

-- ============================================================================
-- OPTION 3: Create via Auth Admin API (if no users exist yet)
-- ============================================================================

-- If you haven't created ANY users yet, you can bootstrap using the service key
-- This requires using the Supabase REST API from your terminal:

/*
curl -X POST 'https://YOUR_PROJECT_REF.supabase.co/auth/v1/admin/users' \
  -H "apikey: YOUR_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "james.howard@youremail.com",
    "password": "your_secure_password_here",
    "email_confirm": true,
    "user_metadata": {
      "full_name": "James Howard",
      "role": "admin",
      "job_title": "Managing Partner"
    }
  }'
*/

-- Then the profile will be auto-created by the AuthContext.tsx sync function
-- But you may need to update the role:

UPDATE lightpoint_users
SET role = 'admin'
WHERE email = 'james.howard@youremail.com';

-- ============================================================================
-- QUICK START INSTRUCTIONS
-- ============================================================================

/*
FASTEST WAY TO GET STARTED:

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" → "Create new user"
3. Enter:
   - Email: james.howard@youremail.com  (YOUR EMAIL!)
   - Password: [Create a secure password]
   - Auto Confirm User: YES (check the box)
4. Click "Create User"

5. Then run this SQL:
*/

UPDATE lightpoint_users
SET 
  role = 'admin',
  full_name = 'James Howard',
  job_title = 'Managing Partner',
  is_active = true
WHERE email = 'james.howard@youremail.com';

-- If the profile doesn't exist yet, create it:
INSERT INTO lightpoint_users (
  id,
  organization_id,
  email,
  full_name,
  role,
  job_title,
  is_active
)
SELECT 
  auth.users.id,
  '00000000-0000-0000-0000-000000000001',
  'james.howard@youremail.com',
  'James Howard',
  'admin',
  'Managing Partner',
  true
FROM auth.users
WHERE auth.users.email = 'james.howard@youremail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'James Howard',
  job_title = 'Managing Partner',
  is_active = true;

/*
6. Go to: https://lightpoint-production.up.railway.app/login
7. Login with your email and password
8. ✅ You're the admin!

9. Now you can invite others:
   - Go to /users
   - Click "Add User"
   - They receive email invite
*/

-- ============================================================================
-- VERIFY YOU'RE ADMIN
-- ============================================================================

SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.job_title,
  u.is_active,
  'Admin powers: ✅' as status
FROM lightpoint_users u
WHERE u.email = 'james.howard@youremail.com'
  AND u.role = 'admin';

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- If you can't login:
-- 1. Check auth.users table has your email:
SELECT email, confirmed_at, email_confirmed_at 
FROM auth.users 
WHERE email = 'james.howard@youremail.com';

-- 2. Check profile exists:
SELECT * FROM lightpoint_users 
WHERE email = 'james.howard@youremail.com';

-- 3. If profile missing but auth user exists, create profile:
INSERT INTO lightpoint_users (
  id,
  organization_id,
  email,
  full_name,
  role,
  is_active
)
SELECT 
  id,
  '00000000-0000-0000-0000-000000000001',
  email,
  'James Howard',
  'admin',
  true
FROM auth.users
WHERE email = 'james.howard@youremail.com'
ON CONFLICT (id) DO NOTHING;
