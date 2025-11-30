-- ============================================================================
-- UPDATE BLOG POST WITH ENHANCED V2 LAYOUT
-- Includes all latest improvements:
-- - 22-24px body text (previously 20-21px)
-- - 42-48px headings (previously 36-42px)  
-- - DonutChart for percentage statistics
-- - TextWithImage components every 3 paragraphs
-- - Generous spacing (py-24 to py-32)
-- ============================================================================

-- Step 1: Check current blog post
SELECT 
  slug,
  title,
  author,
  LENGTH(content::text) as content_length,
  CASE 
    WHEN structured_layout IS NULL THEN 'No layout'
    WHEN structured_layout::jsonb ? 'components' THEN 'V2 layout'
    WHEN structured_layout::jsonb ? 'layout' THEN 'V1 layout'
    ELSE 'Unknown'
  END as layout_type,
  (structured_layout::jsonb -> 'components') IS NOT NULL as has_v2_components,
  jsonb_array_length(structured_layout::jsonb -> 'components') as component_count
FROM blog_posts
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Step 2: Run this SQL to apply the V2 layout
-- Copy the entire UPDATE statement and run it in Supabase SQL Editor


