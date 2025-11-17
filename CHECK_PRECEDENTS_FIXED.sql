-- Check precedents table schema first
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'precedents'
ORDER BY ordinal_position;

-- Count precedents
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
  created_at
FROM precedents
ORDER BY created_at DESC
LIMIT 10;

-- Check knowledge_base table too
SELECT 
  'knowledge_base' as table_name,
  COUNT(*) as total_count,
  COUNT(CASE WHEN embedding IS NOT NULL THEN 1 END) as with_embeddings
FROM knowledge_base;

-- Show sample from knowledge_base
SELECT 
  id,
  title,
  category,
  created_at
FROM knowledge_base
ORDER BY created_at DESC
LIMIT 10;

