-- ============================================
-- LIGHTPOINT V2.0 - DELETE DUPLICATE TRUST INDICATORS
-- Migration: Remove unused trust_indicators section
-- Date: 2024-11-22
-- ============================================

-- Delete the duplicate trust_indicators section (we use trust_metrics instead)
DELETE FROM page_sections
WHERE page_name = 'homepage' 
  AND section_key = 'trust_indicators';

-- Verify deletion
SELECT 
  section_key,
  section_title
FROM page_sections
WHERE page_name = 'homepage' 
  AND section_key LIKE '%trust%';

-- Should only show 'trust_metrics' now

