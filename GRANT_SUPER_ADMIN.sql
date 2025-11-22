-- Grant yourself super admin access
-- Run this in Supabase SQL Editor with your actual email

-- Step 1: Find your user ID (replace with your email)
SELECT id, email FROM auth.users WHERE email = 'james.howard@youremail.com';

-- Step 2: Grant super_admin role (replace USER_ID with the ID from step 1)
INSERT INTO user_roles (user_id, role, granted_by)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with your actual user ID
  'super_admin',
  'YOUR_USER_ID_HERE'   -- Same ID
)
ON CONFLICT (user_id, role) 
DO UPDATE SET granted_at = NOW();

-- Step 3: Verify it worked
SELECT ur.*, u.email 
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'super_admin';

-- Quick one-liner (replace email):
-- INSERT INTO user_roles (user_id, role, granted_by)
-- SELECT id, 'super_admin', id FROM auth.users WHERE email = 'your@email.com'
-- ON CONFLICT (user_id, role) DO UPDATE SET granted_at = NOW();

