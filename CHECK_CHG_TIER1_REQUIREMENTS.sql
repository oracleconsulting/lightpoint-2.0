-- ============================================
-- CHECK FOR CHG TIER 1 RESPONSE REQUIREMENTS
-- ============================================
-- Find CHG guidance on what Tier 1 responses MUST include
-- ============================================

-- 1. Search for CHG documents about Tier 1 response standards
SELECT 
    title,
    category,
    LEFT(content, 300) as preview,
    created_at
FROM knowledge_base
WHERE 
    (content ILIKE '%tier 1%' AND content ILIKE '%response%')
    OR (content ILIKE '%CHG%' AND content ILIKE '%remedy%')
    OR (content ILIKE '%CHG%' AND content ILIKE '%redress%')
    OR title ILIKE '%CHG%response%'
    OR title ILIKE '%CHG%tier%'
ORDER BY 
    CASE 
        WHEN title ILIKE '%CHG%' THEN 1
        WHEN content ILIKE '%tier 1%response%' THEN 2
        ELSE 3
    END,
    created_at DESC
LIMIT 20;

-- 2. Search for specific CHG sections about complaint responses
SELECT 
    title,
    category,
    LEFT(content, 300) as preview
FROM knowledge_base
WHERE 
    content ILIKE '%CHG408%'
    OR content ILIKE '%CHG502%'
    OR content ILIKE '%CHG%' AND content ILIKE '%meaningful resolution%'
    OR content ILIKE '%CHG%' AND content ILIKE '%adequate redress%'
ORDER BY title
LIMIT 10;

-- 3. Search for requirements about what complaints handlers must do
SELECT 
    title,
    LEFT(content, 400) as preview
FROM knowledge_base
WHERE 
    content ILIKE '%complaints handler%'
    AND (
        content ILIKE '%must%'
        OR content ILIKE '%should%'
        OR content ILIKE '%required%'
    )
ORDER BY title
LIMIT 15;

-- 4. Check for guidance on compensation/remedy in Tier 1
SELECT 
    title,
    LEFT(content, 300) as preview
FROM knowledge_base
WHERE 
    (content ILIKE '%compensation%' OR content ILIKE '%remedy%')
    AND content ILIKE '%tier 1%'
LIMIT 10;

