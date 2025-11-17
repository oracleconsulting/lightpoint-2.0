-- Find the user by email and update their organization_id

-- 1. Find ALL users with this email (should be just one)
SELECT 
  id,
  email,
  full_name,
  organization_id,
  role,
  is_active,
  created_at
FROM lightpoint_users
WHERE email = 'jhoward@rpgcc.co.uk';

-- 2. Update ALL users with this email to have the correct organization
UPDATE lightpoint_users
SET organization_id = '00000000-0000-0000-0000-000000000001',
    updated_at = NOW()
WHERE email = 'jhoward@rpgcc.co.uk';

-- 3. Verify the update worked
SELECT 
  id,
  email,
  full_name,
  organization_id,
  role,
  is_active
FROM lightpoint_users
WHERE email = 'jhoward@rpgcc.co.uk';

-- 4. Show complaints for this organization
SELECT 
  id,
  complaint_reference,
  status,
  organization_id
FROM complaints
WHERE organization_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC
LIMIT 5;

