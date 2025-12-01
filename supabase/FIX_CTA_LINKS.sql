-- ============================================================================
-- Fix CTA Button Links
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Update the CTA component's button links to point to actual pages
UPDATE blog_posts
SET structured_layout = jsonb_set(
  jsonb_set(
    structured_layout,
    '{components,30,props,primaryButton}',
    '{"text": "Join the Waitlist", "href": "/subscription/checkout"}'::jsonb
  ),
  '{components,30,props,secondaryButton}',
  '{"text": "View Pricing", "href": "/pricing"}'::jsonb
),
updated_at = now()
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Verify the update
SELECT 
  structured_layout->'components'->30->'type' as component_type,
  structured_layout->'components'->30->'props'->'primaryButton' as primary_btn,
  structured_layout->'components'->30->'props'->'secondaryButton' as secondary_btn
FROM blog_posts 
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

