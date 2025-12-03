-- ============================================================================
-- Fix jhoward@rpgcc.co.uk Onboarding Status
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Set onboarding as complete for this user's organization
UPDATE organizations
SET 
  onboarding_complete = TRUE,
  onboarding_step = 'complete',
  pilot_status = 'active'
WHERE id IN (
  SELECT organization_id 
  FROM user_profiles 
  WHERE email = 'jhoward@rpgcc.co.uk'
);

-- Also update user_profiles if there's an onboarding flag there
UPDATE user_profiles
SET 
  onboarding_complete = TRUE
WHERE email = 'jhoward@rpgcc.co.uk';

-- Verify the update
SELECT 
  u.email,
  u.onboarding_complete as user_onboarding,
  o.name as org_name,
  o.onboarding_complete as org_onboarding,
  o.pilot_status
FROM user_profiles u
LEFT JOIN organizations o ON u.organization_id = o.id
WHERE u.email = 'jhoward@rpgcc.co.uk';

