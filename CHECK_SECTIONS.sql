-- ============================================
-- CHECK WHAT SECTIONS EXIST IN DATABASE
-- ============================================

-- List all homepage sections
SELECT 
  section_key,
  section_title,
  display_order,
  is_visible,
  updated_at
FROM page_sections
WHERE page_name = 'homepage'
ORDER BY display_order;

-- Check trust_metrics content specifically
SELECT 
  section_key,
  jsonb_pretty(content) as content
FROM page_sections
WHERE page_name = 'homepage' 
  AND section_key = 'trust_metrics';

-- Check if there's a trust_indicators section (what you edited)
SELECT 
  section_key,
  jsonb_pretty(content) as content
FROM page_sections
WHERE page_name = 'homepage' 
  AND section_key LIKE '%trust%' OR section_key LIKE '%indicator%';

