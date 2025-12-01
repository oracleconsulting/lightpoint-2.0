-- ============================================================================
-- Add Real Images to Blog Post
-- Run this in Supabase SQL Editor
-- ============================================================================

-- First, let's see which indices have textWithImage components
SELECT 
  idx - 1 as component_index,
  component->>'type' as type,
  component->'props'->>'imageAlt' as image_alt
FROM blog_posts,
  jsonb_array_elements(structured_layout->'components') WITH ORDINALITY arr(component, idx)
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix'
  AND component->>'type' = 'textWithImage';

-- Based on the layout in APPLY_V2_LAYOUT.sql, the textWithImage components are at:
-- Index 2: "Frustrated accountant on phone with HMRC"
-- Index 19: "Fast-track complaint process illustration"  
-- Index 27: "Organized documentation system"

-- Update all three textWithImage components with images
UPDATE blog_posts
SET structured_layout = jsonb_set(
  jsonb_set(
    jsonb_set(
      structured_layout,
      '{components,2,props,imageSrc}',
      '"https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=675&fit=crop&q=80"'::jsonb
    ),
    '{components,19,props,imageSrc}',
    '"https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=675&fit=crop&q=80"'::jsonb
  ),
  '{components,27,props,imageSrc}',
  '"https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&h=675&fit=crop&q=80"'::jsonb
),
updated_at = now()
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Verify the images were added
SELECT 
  component->'props'->>'imageAlt' as section,
  component->'props'->>'imageSrc' as image_url
FROM blog_posts,
  jsonb_array_elements(structured_layout->'components') WITH ORDINALITY arr(component, idx)
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix'
  AND component->>'type' = 'textWithImage';

