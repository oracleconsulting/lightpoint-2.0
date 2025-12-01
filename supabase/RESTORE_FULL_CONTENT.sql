-- ============================================================================
-- Restore Missing Content to Blog Post
-- Run this in Supabase SQL Editor
-- This adds back all the missing paragraphs and details
-- ============================================================================

-- First, let's see what component index the "The Structure That Actually Works" section is at
-- Then we'll insert the missing content after it

-- Add missing opening paragraph detail (after the stats, before first textWithImage)
-- The full first paragraph was truncated

UPDATE blog_posts
SET structured_layout = jsonb_set(
  structured_layout,
  '{components,1,props,stats,0,description}',
  '"That''s roughly one complaint every six minutes, all year round"'::jsonb
)
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Now we need to insert missing paragraphs. The main missing content is:
-- 1. The detailed opening statement example under "The Structure That Works"
-- 2. "State the impact clearly" section
-- 3. "Make specific demands" section  
-- 4. "Close professionally" section
-- 5. The CIOT trials paragraph
-- 6. The consolidated claims paragraph

-- Since we can't easily insert into a JSONB array, let's rebuild the components array
-- with all the missing content included.

-- For now, let's add the missing content as additional paragraphs in key sections

-- Add the missing "State the impact" content after the timeline
-- Component index 16 is the timeline, let's add paragraphs after it

-- Actually, the cleanest approach is to add a callout with the key missing content

-- Add missing opening statement example
UPDATE blog_posts  
SET structured_layout = jsonb_insert(
  structured_layout,
  '{components,15}', -- After the numbered steps
  '{
    "type": "callout",
    "props": {
      "icon": "📝",
      "label": "Opening Statement Example",
      "text": "I write to make a formal complaint regarding HMRC''s failure to process my client''s VAT registration within published timeframes, resulting in an inability to trade and £2,400 in lost input tax recovery. This complaint evidences breaches of service standards published at [gov.uk reference] and seeks specific redress totalling £3,150.",
      "variant": "blue"
    }
  }'::jsonb
)
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Add "State the impact" section
UPDATE blog_posts  
SET structured_layout = jsonb_insert(
  structured_layout,
  '{components,18}', -- After timeline (now shifted)
  '{
    "type": "callout",
    "props": {
      "icon": "💰",
      "label": "State the Impact",
      "text": "Due to HMRC''s delay: Client cannot submit VAT returns or reclaim input tax (£2,400 accumulated). Client has lost a contract worth £15,000 due to inability to provide VAT number. Professional fees of £1,650 incurred (6 hours chasing registration).",
      "variant": "gold"
    }
  }'::jsonb
)
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Add "Make specific demands" section
UPDATE blog_posts  
SET structured_layout = jsonb_insert(
  structured_layout,
  '{components,19}',
  '{
    "type": "callout", 
    "props": {
      "icon": "✅",
      "label": "Specific Demands Example",
      "text": "To resolve this complaint: Issue VAT registration immediately, backdated to application date. Reimburse professional fees of £1,650 (breakdown attached). Provide written explanation for the delay.",
      "variant": "green"
    }
  }'::jsonb
)
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Add "Close professionally" section  
UPDATE blog_posts  
SET structured_layout = jsonb_insert(
  structured_layout,
  '{components,20}',
  '{
    "type": "callout",
    "props": {
      "icon": "⚠️", 
      "label": "Professional Close Example",
      "text": "I require acknowledgement within 48 hours and a substantive response within 15 working days per your published standards. Should this matter not resolve satisfactorily, I will escalate to Tier Two and subsequently the Adjudicator''s Office, where 41% of HMRC complaints were upheld in 2023-24.",
      "variant": "blue"
    }
  }'::jsonb
)
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Add the missing CIOT trials paragraph
UPDATE blog_posts  
SET structured_layout = jsonb_insert(
  structured_layout,
  '{components,25}', -- After the October 2024 section
  '{
    "type": "paragraph",
    "props": {
      "text": "The trials ran for 6-12 months, with CIOT gathering feedback from members'' experiences. Early indicators suggest it''s working - complaints reach independent review while issues remain current rather than after months of internal ping-pong."
    }
  }'::jsonb
)
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Add the consolidated claims paragraph
UPDATE blog_posts  
SET structured_layout = jsonb_insert(
  structured_layout,
  '{components,31}', -- After the bullet list about what to include
  '{
    "type": "paragraph",
    "props": {
      "text": "Request direct payment to your firm when the same HMRC error affects multiple clients. Rather than each client claiming separately, one consolidated claim saves everyone time."
    }
  }'::jsonb
)
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Update timestamp
UPDATE blog_posts
SET updated_at = now()
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Verify component count
SELECT 
  jsonb_array_length(structured_layout->'components') as total_components
FROM blog_posts 
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

