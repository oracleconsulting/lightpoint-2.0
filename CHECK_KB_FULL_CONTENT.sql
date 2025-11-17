-- Check ALL knowledge base content and categories
SELECT 
  category,
  COUNT(*) as count
FROM knowledge_base
GROUP BY category
ORDER BY count DESC;

-- Show all titles to see what we have
SELECT 
  id,
  title,
  category,
  LEFT(content, 100) as content_preview,
  created_at
FROM knowledge_base
ORDER BY created_at DESC;

-- Search for CRG documents specifically
SELECT 
  id,
  title,
  category
FROM knowledge_base
WHERE title ILIKE '%CRG%'
   OR content ILIKE '%CRG%'
   OR title ILIKE '%Charter%'
ORDER BY title;

-- Check if there are any documents with different categories
SELECT DISTINCT category
FROM knowledge_base
ORDER BY category;

