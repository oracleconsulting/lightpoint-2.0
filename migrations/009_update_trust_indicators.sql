-- ============================================
-- LIGHTPOINT V2.0 - UPDATE TRUST INDICATORS
-- Migration: Update trust metrics with user-edited values
-- Date: 2024-11-22
-- ============================================

-- Update Trust Metrics Section with your edited values from admin panel
UPDATE page_sections
SET 
  content = jsonb_build_object(
    'metrics', jsonb_build_array(
      jsonb_build_object(
        'id', 'success_rate',
        'value', 96,
        'suffix', '%+',
        'label', 'Success Rate',
        'sublabel', 'Above industry avg.',
        'icon', 'Target',
        'color', 'success'
      ),
      jsonb_build_object(
        'id', 'fees_recovered',
        'value', 0.65,
        'prefix', '£',
        'suffix', 'M+',
        'decimals', 2,
        'label', 'Fees Recovered',
        'sublabel', 'For our clients',
        'icon', 'PoundSterling',
        'color', 'gold'
      ),
      jsonb_build_object(
        'id', 'avg_resolution',
        'value', 23,
        'suffix', ' days',
        'label', 'Avg. Resolution',
        'sublabel', '47d faster than standard',
        'icon', 'Clock',
        'color', 'warning',
        'badge', '-47 days'
      ),
      jsonb_build_object(
        'id', 'firms_trust',
        'value', 10,
        'suffix', '+',
        'label', 'Firms Trust Us',
        'sublabel', 'Leading practices',
        'icon', 'Users',
        'color', 'primary',
        'live_badge', '3 online'
      )
    ),
    'trust_badges', jsonb_build_array(
      '🔒 Enterprise-grade encryption',
      'GDPR-ready infrastructure',
      'SOC 2 compliant hosting',
      'Last updated 2 min ago'
    )
  ),
  updated_at = NOW()
WHERE page_name = 'homepage' 
  AND section_key = 'trust_metrics';

-- Verify the update - should show 96, 0.65, 10
SELECT 
  section_key,
  content->'metrics'->0->>'value' as success_rate_value,
  content->'metrics'->1->>'value' as fees_recovered_value,
  content->'metrics'->3->>'value' as firms_trust_value
FROM page_sections
WHERE page_name = 'homepage' 
  AND section_key = 'trust_metrics';

