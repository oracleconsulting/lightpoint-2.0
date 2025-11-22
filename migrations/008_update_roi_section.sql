-- ============================================
-- LIGHTPOINT V2.0 - UPDATE ROI SECTION
-- Migration: Update ROI calculator with accurate figures
-- Date: 2024-11-22
-- ============================================

-- Update ROI Calculator Section with correct figures
UPDATE page_sections
SET 
  content = jsonb_build_object(
    'left_column', jsonb_build_object(
      'heading', 'See Your Potential ROI',
      'subheading', 'On average, accountants using Lightpoint recover at least £700 per complaint in professional fees and ex-gratia payments.',
      'calculations', jsonb_build_array(
        jsonb_build_object('label', 'Average fee recovery per case', 'value', '£1,250'),
        jsonb_build_object('label', 'Average ex-gratia payment', 'value', '£250'),
        jsonb_build_object('label', 'Total per case', 'value', '£1,500', 'highlight', true)
      ),
      'cta_text', 'Start Recovering Fees',
      'cta_link', '/pricing'
    ),
    'right_column', jsonb_build_object(
      'heading', 'Professional Tier Example',
      'subscription_cost', '£299/month',
      'cases_per_month', '20 complaints',
      'subscription_coverage', '5 months of subscription costs',
      'note', 'Just 1 successful case covers:'
    )
  ),
  updated_at = NOW()
WHERE page_name = 'homepage' 
  AND section_key = 'roi_calculator';

-- Verify the update
SELECT 
  section_title,
  content->'left_column'->>'subheading' as left_subheading,
  content->'left_column'->'calculations'->2->>'value' as total_per_case,
  content->'right_column'->>'subscription_coverage' as subscription_coverage
FROM page_sections
WHERE page_name = 'homepage' 
  AND section_key = 'roi_calculator';

