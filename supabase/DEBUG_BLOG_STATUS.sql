-- ============================================================================
-- DEBUG: Check Blog Post Status
-- Run this to see what's happening with your blog post
-- ============================================================================

-- 1. Check if the blog post exists
SELECT 
  id,
  slug,
  title,
  author,
  is_published,
  LENGTH(content::text) as content_length,
  structured_layout IS NOT NULL as has_layout,
  CASE 
    WHEN structured_layout IS NULL THEN 'No layout'
    WHEN structured_layout::jsonb ? 'components' THEN 'Has components array (V2)'
    WHEN structured_layout::jsonb ? 'layout' THEN 'Has layout array (V1)'
    ELSE 'Unknown format'
  END as layout_detection,
  created_at,
  updated_at
FROM blog_posts
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- 2. If it exists, check the components
SELECT 
  slug,
  jsonb_array_length(structured_layout::jsonb -> 'components') as component_count,
  (structured_layout::jsonb -> 'components' -> 0 ->> 'type') as first_component,
  (structured_layout::jsonb -> 'components' -> 1 ->> 'type') as second_component,
  (structured_layout::jsonb -> 'theme' ->> 'name') as theme_name
FROM blog_posts 
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix'
  AND structured_layout IS NOT NULL;

-- 3. List all blog posts to see what exists
SELECT 
  slug,
  title,
  is_published,
  CASE 
    WHEN structured_layout IS NULL THEN 'No layout'
    WHEN structured_layout::jsonb ? 'components' THEN 'V2'
    WHEN structured_layout::jsonb ? 'layout' THEN 'V1'
    ELSE 'Unknown'
  END as layout_type
FROM blog_posts
ORDER BY created_at DESC
LIMIT 10;

