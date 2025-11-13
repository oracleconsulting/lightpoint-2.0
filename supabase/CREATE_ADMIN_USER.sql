-- ============================================================================
-- CREATE ADMIN USER FOR JAMES HOWARD - LIGHTPOINT
-- ============================================================================
-- Email: jhoward@rpgcc.co.uk
-- Role: Admin (Director)
-- ============================================================================

-- ============================================================================
-- STEP 1: CREATE AUTH USER IN SUPABASE DASHBOARD (SET PASSWORD HERE)
-- ============================================================================

/*
GO TO: Supabase Dashboard → Authentication → Users
CLICK: "Add User" → "Create new user"

ENTER:
  Email: jhoward@rpgcc.co.uk
  Password: [TYPE YOUR SECURE PASSWORD HERE - you choose it!]
  ✅ CHECK: "Auto Confirm User" (so you don't need email verification)

CLICK: "Create User"

The password is set when you create the user in the dashboard!
You'll use this email + password to login at /login
*/

-- ============================================================================
-- STEP 2: RUN THIS SQL TO MAKE YOU ADMIN
-- ============================================================================

-- Update your role to admin
UPDATE lightpoint_users
SET 
  role = 'admin',
  full_name = 'James Howard',
  job_title = 'Director',
  is_active = true
WHERE email = 'jhoward@rpgcc.co.uk';

-- If profile doesn't exist yet, create it
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
  'jhoward@rpgcc.co.uk',
  'James Howard',
  'admin',
  'Director',
  true
FROM auth.users
WHERE auth.users.email = 'jhoward@rpgcc.co.uk'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'James Howard',
  job_title = 'Director',
  is_active = true;

-- ============================================================================
-- STEP 3: VERIFY YOU'RE ADMIN
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
WHERE u.email = 'jhoward@rpgcc.co.uk'
  AND u.role = 'admin';

-- ============================================================================
-- STEP 4: LOGIN
-- ============================================================================

/*
GO TO: https://lightpoint-production.up.railway.app/login

ENTER:
  Email: jhoward@rpgcc.co.uk
  Password: [the password you set in Step 1]

CLICK: "Sign In"

✅ You're now admin!
*/

-- ============================================================================
-- PASSWORD RESET (if you forget your password)
-- ============================================================================

/*
OPTION 1: Use the "Forgot password?" link on login page
  - Enter: jhoward@rpgcc.co.uk
  - Check your email
  - Click reset link
  - Set new password

OPTION 2: Reset via Supabase Dashboard
  - Go to: Authentication → Users
  - Find: jhoward@rpgcc.co.uk
  - Click: "..." menu → "Send password recovery email"
  - Check your email
  - Click reset link
  - Set new password

OPTION 3: Manually set new password in dashboard
  - Go to: Authentication → Users
  - Find: jhoward@rpgcc.co.uk
  - Click: "..." menu → "Reset password"
  - Enter new password
  - Click "Update user"
*/

-- ============================================================================
-- ALTERNATIVE: USE INVITE SYSTEM (if you prefer email invite)
-- ============================================================================

/*
If you want to receive an email invite instead:

1. Have someone else create their admin account first
2. They go to /users
3. Click "Add User"
4. Enter:
   - Email: jhoward@rpgcc.co.uk
   - Name: James Howard
   - Role: Admin
   - Job Title: Director
5. Click "Send Invite"
6. Check your email for invite
7. Click link in email
8. SET YOUR PASSWORD (this is where you choose it!)
9. ✅ You're logged in
*/

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Check if auth user exists:
SELECT 
  email, 
  confirmed_at, 
  email_confirmed_at,
  created_at
FROM auth.users 
WHERE email = 'jhoward@rpgcc.co.uk';

-- Check if profile exists:
SELECT 
  id,
  email,
  full_name,
  role,
  job_title,
  is_active,
  created_at
FROM lightpoint_users 
WHERE email = 'jhoward@rpgcc.co.uk';

-- If auth user exists but profile missing, create profile:
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
  id,
  '00000000-0000-0000-0000-000000000001',
  email,
  'James Howard',
  'admin',
  'Director',
  true
FROM auth.users
WHERE email = 'jhoward@rpgcc.co.uk'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'James Howard',
  job_title = 'Director',
  is_active = true;

-- ============================================================================
-- SUMMARY
-- ============================================================================

/*
PASSWORD IS SET IN SUPABASE DASHBOARD WHEN YOU CREATE THE USER!

Steps:
1. Dashboard → Authentication → Users → "Add User"
2. Enter email: jhoward@rpgcc.co.uk
3. Enter password: [YOU CHOOSE IT - make it secure!]
4. ✅ Auto Confirm User
5. Click "Create User"
6. Run the SQL above to set role to admin
7. Go to /login
8. Login with jhoward@rpgcc.co.uk + your password
9. ✅ Done!

PASSWORD TIPS:
- At least 8 characters
- Mix of upper/lower case
- Include numbers
- Include special characters (!@#$%^&*)
- Don't use common words
- Example: "Lightpoint2024!Secure"
*/
