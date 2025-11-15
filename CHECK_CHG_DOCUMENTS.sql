-- ============================================
-- CHECK IF CHG DOCUMENTS ARE IN KNOWLEDGE BASE
-- ============================================
-- This will show if your CHG uploads were successful
-- ============================================

-- 1. Check for CHG documents specifically
SELECT 
    id,
    title,
    category,
    source,
    LENGTH(content) as content_length,
    created_at,
    metadata
FROM knowledge_base 
WHERE 
    title ILIKE '%CHG%' 
    OR content ILIKE '%Complaint%Handling%Guidance%'
    OR category = 'CHG'
ORDER BY created_at DESC
LIMIT 50;

-- 2. Check total document count by category
SELECT 
    category,
    COUNT(*) as document_count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM knowledge_base
GROUP BY category
ORDER BY document_count DESC;

-- 3. Check recent uploads (last 7 days)
SELECT 
    title,
    category,
    source,
    created_at,
    LENGTH(content) as content_length,
    metadata->>'filename' as original_filename
FROM knowledge_base
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 4. Check if embeddings exist (NULL embeddings = broken)
SELECT 
    COUNT(*) as total_documents,
    COUNT(embedding) as documents_with_embeddings,
    COUNT(*) - COUNT(embedding) as documents_missing_embeddings
FROM knowledge_base;

-- 5. Sample CHG content (first 200 chars of each doc)
SELECT 
    title,
    LEFT(content, 200) as content_preview,
    category,
    created_at
FROM knowledge_base
WHERE title ILIKE '%CHG%' OR category = 'CHG'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- EXPECTED RESULTS
-- ============================================
-- If CHG documents uploaded successfully:
-- - Query 1: Should show 60+ CHG-related documents
-- - Query 2: Should show 'CHG' category with high count
-- - Query 3: Should show recent uploads if done today/yesterday
-- - Query 4: All documents should have embeddings
-- - Query 5: Should show actual CHG content

-- If NO results in Query 1:
-- CHG documents were NOT uploaded to knowledge_base table
-- They may be in staging or failed during upload

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- Check staging table for pending uploads
SELECT 
    filename,
    file_type,
    LENGTH(extracted_text) as text_length,
    comparison_result,
    created_at
FROM knowledge_base_staging
WHERE filename ILIKE '%CHG%'
ORDER BY created_at DESC;

-- Check knowledge base updates log
SELECT 
    action,
    title,
    category,
    change_summary,
    user_name,
    created_at
FROM knowledge_base_updates
WHERE title ILIKE '%CHG%'
ORDER BY created_at DESC
LIMIT 20;

