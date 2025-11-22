-- ============================================
-- LIGHTPOINT V2.0 - UPDATE ALL CTAs TO WAITLIST
-- Migration: Redirect all CTAs to /subscription/checkout (waitlist)
-- Date: 2024-11-22
-- ============================================

-- Update Hero Section CTAs
UPDATE page_sections
SET 
  content = jsonb_set(
    jsonb_set(
      content,
      '{cta_primary_link}',
      '"/subscription/checkout"'
    ),
    '{cta_secondary_text}',
    '"Join Waitlist"'
  ),
  content = jsonb_set(
    content,
    '{cta_secondary_link}',
    '"/subscription/checkout"'
  ),
  updated_at = NOW()
WHERE page_name = 'homepage' 
  AND section_key = 'hero';

-- Update ROI Calculator CTA
UPDATE page_sections
SET 
  content = jsonb_set(
    jsonb_set(
      content,
      '{left_column, cta_link}',
      '"/subscription/checkout"'
    ),
    '{left_column, cta_text}',
    '"Join Waitlist"'
  ),
  updated_at = NOW()
WHERE page_name = 'homepage' 
  AND section_key = 'roi_calculator';

-- Update Final CTA Section
UPDATE page_sections
SET 
  content = jsonb_set(
    jsonb_set(
      content,
      '{cta_primary_link}',
      '"/subscription/checkout"'
    ),
    '{cta_secondary_link}',
    '"/subscription/checkout"'
  ),
  updated_at = NOW()
WHERE page_name = 'homepage' 
  AND section_key = 'final_cta';

-- Verify all updates
SELECT 
  section_key,
  content->'cta_primary_link' as primary_link,
  content->'cta_secondary_link' as secondary_link,
  content->'cta_secondary_text' as secondary_text
FROM page_sections
WHERE page_name = 'homepage' 
  AND section_key IN ('hero', 'final_cta');

SELECT 
  section_key,
  content->'left_column'->'cta_link' as roi_link,
  content->'left_column'->'cta_text' as roi_text
FROM page_sections
WHERE page_name = 'homepage' 
  AND section_key = 'roi_calculator';

