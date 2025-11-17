-- Check how many precedents are actually in the knowledge base

SELECT 
  'precedents' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embeddings,
  COUNT(CASE WHEN embedding IS NULL THEN 1 END) as without_embeddings
FROM precedents;

-- Show sample of precedents
SELECT 
  id,
  complaint_type,
  outcome,
  compensation_amount,
  created_at,
  LEFT(facts, 100) as facts_preview
FROM precedents
ORDER BY created_at DESC
LIMIT 10;

-- Check knowledge_base table too
SELECT 
  'knowledge_base' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embeddings
FROM knowledge_base;

-- Show sample
SELECT 
  id,
  title,
  category,
  created_at
FROM knowledge_base
ORDER BY created_at DESC
LIMIT 10;

