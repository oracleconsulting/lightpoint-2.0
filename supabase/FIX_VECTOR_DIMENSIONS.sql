-- ============================================================================
-- FIX VECTOR DIMENSIONS FOR HNSW COMPATIBILITY
-- Uses text-embedding-3-large at 1536 dimensions (Matryoshka representation)
-- ~98% quality of full 3072 dims, HNSW compatible (max 2000 dims)
-- ============================================================================

-- Step 1: Update knowledge_base embedding column to 1536 dimensions
ALTER TABLE knowledge_base 
  ALTER COLUMN embedding TYPE vector(1536);

-- Step 2: Update precedents embedding column to 1536 dimensions  
ALTER TABLE precedents 
  ALTER COLUMN embedding TYPE vector(1536);

-- Step 3: Recreate HNSW indexes (now they'll work with 1536 dims)
DROP INDEX IF EXISTS knowledge_base_embedding_idx;
DROP INDEX IF EXISTS knowledge_base_embedding_hnsw_idx;

CREATE INDEX knowledge_base_embedding_hnsw_idx 
  ON knowledge_base 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

DROP INDEX IF EXISTS precedents_embedding_idx;
DROP INDEX IF EXISTS precedents_embedding_hnsw_idx;

CREATE INDEX precedents_embedding_hnsw_idx 
  ON precedents 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Step 4: Update the filtered search RPC function
CREATE OR REPLACE FUNCTION match_knowledge_base_filtered(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  category_filter text[] DEFAULT NULL,
  document_type_filter text[] DEFAULT NULL,
  include_superseded boolean DEFAULT FALSE
)
RETURNS TABLE (
  id uuid,
  category text,
  title text,
  content text,
  source_url text,
  section_reference text,
  manual_code text,
  breadcrumb jsonb,
  citation_format text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    kb.id,
    kb.category,
    kb.title,
    kb.content,
    kb.source_url,
    kb.section_reference,
    kb.manual_code,
    kb.breadcrumb,
    kb.citation_format,
    1 - (kb.embedding <=> query_embedding) as similarity
  FROM knowledge_base kb
  WHERE 
    1 - (kb.embedding <=> query_embedding) > match_threshold
    AND (category_filter IS NULL OR kb.category = ANY(category_filter))
    AND (document_type_filter IS NULL OR kb.document_type = ANY(document_type_filter))
    AND (
      kb.verification_status = 'verified' 
      OR kb.verification_status IS NULL
      OR (include_superseded AND kb.verification_status = 'superseded')
    )
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Step 5: Update the original match_knowledge_base function
CREATE OR REPLACE FUNCTION match_knowledge_base(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  category text,
  title text,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT 
    id,
    category,
    title,
    content,
    1 - (embedding <=> query_embedding) as similarity
  FROM knowledge_base
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Step 6: Update match_precedents function
CREATE OR REPLACE FUNCTION match_precedents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  complaint_type text,
  issue_category text,
  outcome text,
  key_arguments text[],
  effective_citations text[],
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    complaint_type,
    issue_category,
    outcome,
    key_arguments,
    effective_citations,
    1 - (embedding <=> query_embedding) as similarity
  FROM precedents
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Step 7: Grant permissions
GRANT EXECUTE ON FUNCTION match_knowledge_base_filtered TO authenticated;
GRANT EXECUTE ON FUNCTION match_knowledge_base_filtered TO service_role;
GRANT EXECUTE ON FUNCTION match_knowledge_base TO authenticated;
GRANT EXECUTE ON FUNCTION match_knowledge_base TO service_role;
GRANT EXECUTE ON FUNCTION match_precedents TO authenticated;
GRANT EXECUTE ON FUNCTION match_precedents TO service_role;

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Vector dimensions updated to 1536 (HNSW compatible)!';
  RAISE NOTICE '';
  RAISE NOTICE 'Using: text-embedding-3-large @ 1536 dimensions';
  RAISE NOTICE '  - ~98%% quality of full 3072 dimensions';
  RAISE NOTICE '  - Better than ada-002';
  RAISE NOTICE '  - HNSW index compatible (max 2000 dims)';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables updated:';
  RAISE NOTICE '  - knowledge_base.embedding -> vector(1536)';
  RAISE NOTICE '  - precedents.embedding -> vector(1536)';
  RAISE NOTICE '';
  RAISE NOTICE 'Indexes created:';
  RAISE NOTICE '  - knowledge_base_embedding_hnsw_idx';
  RAISE NOTICE '  - precedents_embedding_hnsw_idx';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions updated:';
  RAISE NOTICE '  - match_knowledge_base()';
  RAISE NOTICE '  - match_knowledge_base_filtered()';
  RAISE NOTICE '  - match_precedents()';
END $$;
