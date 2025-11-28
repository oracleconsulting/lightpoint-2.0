-- ============================================================================
-- RESET ONBOARDING STATUS FOR TESTING
-- ============================================================================
-- Run this to reset onboarding flags so the banner shows again
-- ============================================================================

-- Reset all organizations' onboarding status
UPDATE organizations
SET 
  onboarding_completed = FALSE,
  onboarding_meeting_booked = FALSE,
  onboarding_meeting_date = NULL
WHERE onboarding_completed IS NOT NULL 
   OR onboarding_meeting_booked IS NOT NULL;

-- If the columns don't exist yet, add them first
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE organizations ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
    ALTER TABLE organizations ADD COLUMN onboarding_meeting_booked BOOLEAN DEFAULT FALSE;
    ALTER TABLE organizations ADD COLUMN onboarding_meeting_date TIMESTAMPTZ;
  END IF;
END $$;

-- Now set all to FALSE
UPDATE organizations
SET 
  onboarding_completed = FALSE,
  onboarding_meeting_booked = FALSE,
  onboarding_meeting_date = NULL;

-- Verify
SELECT 
  id,
  name,
  onboarding_completed,
  onboarding_meeting_booked,
  onboarding_meeting_date
FROM organizations;

SELECT '✅ Onboarding status reset for all organizations!' as status;

