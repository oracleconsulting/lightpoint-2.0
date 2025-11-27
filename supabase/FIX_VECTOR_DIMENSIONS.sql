-- ============================================================================
-- FIX VECTOR DIMENSIONS
-- Migrate from vector(1536) to vector(3072) for text-embedding-3-large
-- ============================================================================

-- IMPORTANT: This will DROP existing embeddings. They need to be regenerated.
-- Only run this if you're okay with losing existing KB embeddings.

-- Step 1: Drop the HNSW index first (if exists)
DROP INDEX IF EXISTS knowledge_base_embedding_hnsw_idx;
DROP INDEX IF EXISTS knowledge_base_embedding_idx;

-- Step 2: Alter the column to accept 3072 dimensions
-- Note: This requires dropping and recreating the column because 
-- PostgreSQL doesn't allow direct ALTER of vector dimensions

-- First, drop the old column
ALTER TABLE knowledge_base DROP COLUMN IF EXISTS embedding;

-- Then add the new column with correct dimensions
ALTER TABLE knowledge_base ADD COLUMN embedding vector(3072);

-- Step 3: Recreate the HNSW index
CREATE INDEX knowledge_base_embedding_hnsw_idx 
  ON knowledge_base 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Step 4: Update the search function to match
CREATE OR REPLACE FUNCTION match_knowledge_base(
  query_embedding vector(3072),
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
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  FROM knowledge_base
  WHERE 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Step 5: Do the same for precedents table if needed
DROP INDEX IF EXISTS precedents_embedding_hnsw_idx;
DROP INDEX IF EXISTS precedents_embedding_idx;

ALTER TABLE precedents DROP COLUMN IF EXISTS embedding;
ALTER TABLE precedents ADD COLUMN embedding vector(3072);

CREATE INDEX precedents_embedding_hnsw_idx 
  ON precedents 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Update precedents search function
CREATE OR REPLACE FUNCTION match_precedents(
  query_embedding vector(3072),
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
    1 - (precedents.embedding <=> query_embedding) as similarity
  FROM precedents
  WHERE 1 - (precedents.embedding <=> query_embedding) > match_threshold
  ORDER BY precedents.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Verification
DO $$
BEGIN
  RAISE NOTICE 'Vector dimensions updated to 3072!';
  RAISE NOTICE '';
  RAISE NOTICE 'WARNING: All existing embeddings have been dropped.';
  RAISE NOTICE 'You will need to re-embed all existing knowledge base content.';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables updated:';
  RAISE NOTICE '  - knowledge_base.embedding -> vector(3072)';
  RAISE NOTICE '  - precedents.embedding -> vector(3072)';
  RAISE NOTICE '';
  RAISE NOTICE 'Functions updated:';
  RAISE NOTICE '  - match_knowledge_base()';
  RAISE NOTICE '  - match_precedents()';
END $$;

