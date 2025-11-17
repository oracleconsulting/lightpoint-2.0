-- Check how many items in each category
SELECT 
  category,
  COUNT(*) as count,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embeddings
FROM knowledge_base
GROUP BY category
ORDER BY count DESC;

-- Check specifically the "Precedents" category
SELECT 
  id,
  title,
  LEFT(content, 200) as preview,
  embedding IS NOT NULL as has_embedding
FROM knowledge_base
WHERE category = 'Precedents'
ORDER BY created_at DESC
LIMIT 20;

-- Check the single precedent in precedents table
SELECT *
FROM precedents
LIMIT 5;

-- Check CRG documents
SELECT 
  title,
  LENGTH(content) as content_length,
  embedding IS NOT NULL as has_embedding
FROM knowledge_base
WHERE category = 'CRG'
ORDER BY title
LIMIT 10;

