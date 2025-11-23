-- Quick check: Does homepage content exist in production?
SELECT 
  section_key, 
  section_title, 
  is_visible,
  created_at
FROM page_sections
WHERE page_name = 'homepage'
ORDER BY display_order;

-- If the above query returns 0 rows, you need to run 005_seed_homepage_content.sql

