-- Fix: Ensure user has organization_id

-- Check if user exists and their organization
SELECT id, email, full_name, organization_id, role, is_active
FROM lightpoint_users
WHERE id = '19583c08-6993-4113-b46a-bd30e3375f54';

-- If organization_id is NULL, update it to the default organization
UPDATE lightpoint_users
SET organization_id = '00000000-0000-0000-0000-000000000001'
WHERE id = '19583c08-6993-4113-b46a-bd30e3375f54'
  AND organization_id IS NULL;

-- Verify the update
SELECT id, email, full_name, organization_id, role, is_active
FROM lightpoint_users
WHERE id = '19583c08-6993-4113-b46a-bd30e3375f54';

-- Also check if default organization exists
SELECT id, name, created_at
FROM organizations
WHERE id = '00000000-0000-0000-0000-000000000001';

-- If organization doesn't exist, create it
INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization')
ON CONFLICT (id) DO NOTHING;

