-- ============================================================================
-- KNOWLEDGE BASE HEALTH CHECK
-- Run this in Supabase SQL Editor for a quick overview
-- ============================================================================

-- 1. DOCUMENT COUNTS
SELECT '📚 DOCUMENT COUNTS' as section;

SELECT 
  'Total Documents' as metric,
  COUNT(*) as value
FROM knowledge_base
UNION ALL
SELECT 
  'With Embeddings' as metric,
  COUNT(*) as value
FROM knowledge_base WHERE embedding IS NOT NULL
UNION ALL
SELECT 
  'Missing Embeddings' as metric,
  COUNT(*) as value
FROM knowledge_base WHERE embedding IS NULL;

-- 2. CATEGORY DISTRIBUTION
SELECT '📁 CATEGORY DISTRIBUTION' as section;

SELECT 
  COALESCE(category, 'Uncategorized') as category,
  COUNT(*) as document_count,
  COUNT(*) FILTER (WHERE embedding IS NOT NULL) as with_embeddings,
  ROUND(100.0 * COUNT(*) FILTER (WHERE embedding IS NOT NULL) / NULLIF(COUNT(*), 0), 1) as embedding_pct
FROM knowledge_base
GROUP BY category
ORDER BY document_count DESC;

-- 3. EMBEDDING DIMENSIONS CHECK
SELECT '🔢 EMBEDDING DIMENSIONS' as section;

SELECT 
  array_length(embedding, 1) as dimensions,
  COUNT(*) as document_count
FROM knowledge_base
WHERE embedding IS NOT NULL
GROUP BY array_length(embedding, 1)
ORDER BY document_count DESC;

-- 4. DOCUMENTS MISSING EMBEDDINGS
SELECT '⚠️ DOCUMENTS MISSING EMBEDDINGS' as section;

SELECT 
  id,
  category,
  LEFT(title, 60) as title_preview,
  created_at
FROM knowledge_base
WHERE embedding IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- 5. PRECEDENTS CHECK
SELECT '📖 PRECEDENTS' as section;

SELECT 
  'Total Precedents' as metric,
  COUNT(*) as value
FROM precedents
UNION ALL
SELECT 
  'With Embeddings' as metric,
  COUNT(*) as value
FROM precedents WHERE embedding IS NOT NULL
UNION ALL
SELECT 
  'Missing Embeddings' as metric,
  COUNT(*) as value
FROM precedents WHERE embedding IS NULL;

-- 6. RECENT ADDITIONS (Last 7 days)
SELECT '🆕 RECENT ADDITIONS (7 days)' as section;

SELECT 
  category,
  COUNT(*) as added_count,
  MAX(created_at) as latest
FROM knowledge_base
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY category
ORDER BY added_count DESC;

-- 7. SEARCH FUNCTION TEST
SELECT '🔍 SEARCH FUNCTION TEST' as section;

-- Test if the RPC functions exist
SELECT 
  routine_name as function_name,
  'EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('match_knowledge_base', 'match_knowledge_base_filtered', 'match_precedents')
ORDER BY routine_name;

-- 8. STORAGE SIZE
SELECT '💾 STORAGE ESTIMATE' as section;

SELECT 
  'knowledge_base' as table_name,
  pg_size_pretty(pg_total_relation_size('knowledge_base')) as total_size
UNION ALL
SELECT 
  'precedents' as table_name,
  pg_size_pretty(pg_total_relation_size('precedents')) as total_size;

-- 9. CONTENT QUALITY CHECK (sample)
SELECT '📝 CONTENT QUALITY SAMPLE' as section;

SELECT 
  category,
  LEFT(title, 40) as title,
  LENGTH(content) as content_length,
  CASE 
    WHEN LENGTH(content) < 100 THEN '⚠️ Very short'
    WHEN LENGTH(content) < 500 THEN '📄 Short'
    WHEN LENGTH(content) < 2000 THEN '📝 Medium'
    ELSE '📚 Long'
  END as content_size
FROM knowledge_base
WHERE embedding IS NOT NULL
ORDER BY RANDOM()
LIMIT 10;

-- 10. SUMMARY
SELECT '📊 SUMMARY' as section;

WITH stats AS (
  SELECT 
    COUNT(*) as total_docs,
    COUNT(*) FILTER (WHERE embedding IS NOT NULL) as embedded_docs,
    COUNT(DISTINCT category) as categories,
    AVG(LENGTH(content)) as avg_content_length
  FROM knowledge_base
)
SELECT 
  total_docs as "Total Documents",
  embedded_docs as "Embedded Documents",
  ROUND(100.0 * embedded_docs / NULLIF(total_docs, 0), 1) as "Embedding Coverage %",
  categories as "Categories",
  ROUND(avg_content_length) as "Avg Content Length"
FROM stats;

