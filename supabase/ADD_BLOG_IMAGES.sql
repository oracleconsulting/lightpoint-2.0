-- ============================================================================
-- Add High-Quality Images to Blog Post
-- Run this in Supabase SQL Editor
-- ============================================================================

-- Step 1: Find which components are textWithImage and their indices
SELECT 
  idx - 1 as component_index,
  component->>'type' as type,
  component->'props'->>'imageAlt' as image_alt
FROM blog_posts,
  jsonb_array_elements(structured_layout->'components') WITH ORDINALITY arr(component, idx)
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix'
  AND component->>'type' = 'textWithImage';

-- Step 2: Update ALL textWithImage components with appropriate images
-- These are high-quality Unsplash images matching the context

-- Image 1: "Frustrated accountant on phone with HMRC"
UPDATE blog_posts
SET structured_layout = jsonb_set(
  structured_layout,
  '{components,2,props,imageSrc}',
  '"https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&h=675&fit=crop&q=80"'::jsonb
),
updated_at = now()
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Image 2: "Fast-track complaint process illustration"  
UPDATE blog_posts
SET structured_layout = jsonb_set(
  structured_layout,
  '{components,19,props,imageSrc}',
  '"https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=675&fit=crop&q=80"'::jsonb
),
updated_at = now()
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Image 3: "Organized documentation system"
UPDATE blog_posts
SET structured_layout = jsonb_set(
  structured_layout,
  '{components,27,props,imageSrc}',
  '"https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=675&fit=crop&q=80"'::jsonb
),
updated_at = now()
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Step 3: Verify the images were added
SELECT 
  idx - 1 as component_index,
  component->'props'->>'imageAlt' as section,
  LEFT(component->'props'->>'imageSrc', 80) as image_url
FROM blog_posts,
  jsonb_array_elements(structured_layout->'components') WITH ORDINALITY arr(component, idx)
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix'
  AND component->>'type' = 'textWithImage';

