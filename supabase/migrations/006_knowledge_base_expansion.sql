-- ============================================================================
-- KNOWLEDGE BASE EXPANSION MIGRATION
-- Adds verification fields, new categories, HNSW index, and category filtering
-- 
-- Run this migration to prepare for HMRC manual, case law, and legislation ingestion
-- ============================================================================

-- ============================================================================
-- 1. ADD VERIFICATION AND SOURCE FIELDS
-- ============================================================================

-- Add verification and source tracking fields
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS source_verified_at TIMESTAMPTZ;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified';
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS section_reference TEXT;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS manual_code TEXT;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS parent_section TEXT;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS breadcrumb JSONB;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS effective_from DATE;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS superseded_at DATE;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS last_checked_at TIMESTAMPTZ;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS citation_format TEXT;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS document_type TEXT;

-- Add constraint for verification status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_verification_status'
  ) THEN
    ALTER TABLE knowledge_base ADD CONSTRAINT check_verification_status 
      CHECK (verification_status IN ('verified', 'pending', 'outdated', 'superseded', 'archived'));
  END IF;
END $$;

-- Add constraint for document type  
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_document_type'
  ) THEN
    ALTER TABLE knowledge_base ADD CONSTRAINT check_document_type
      CHECK (document_type IN ('guidance', 'manual', 'legislation', 'case_law', 'charter', 'precedent'));
  END IF;
END $$;

-- ============================================================================
-- 2. UPDATE CATEGORY CONSTRAINT
-- ============================================================================

-- Drop existing category constraint if present
ALTER TABLE knowledge_base DROP CONSTRAINT IF EXISTS check_category;

-- Add new category constraint with expanded categories
-- Note: Only add if you want to enforce categories, otherwise comment this out
-- ALTER TABLE knowledge_base ADD CONSTRAINT check_category 
--   CHECK (category IN (
--     -- Existing
--     'CRG', 'Charter', 'CHG', 'Tax_Law', 'Precedent',
--     -- HMRC Manuals (new)
--     'DMBM',           -- Debt Management and Banking
--     'ARTG',           -- Appeals Reviews and Tribunals Guidance
--     'SAM',            -- Self Assessment Manual
--     'CH',             -- Compliance Handbook
--     'EM',             -- Enquiry Manual
--     'PAYE',           -- PAYE Manual
--     'VAT',            -- VAT Manuals (various)
--     'HMRC_Manual',    -- Catch-all for other manuals
--     -- Legal sources (new)
--     'Legislation',
--     'CaseLaw',
--     'Tribunal_FTT',
--     'Tribunal_UT'
--   ));

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

-- Create partial index for active verified content only
CREATE INDEX IF NOT EXISTS idx_kb_verified_content 
  ON knowledge_base(category, created_at DESC) 
  WHERE verification_status = 'verified';

-- Create index on section_reference for hierarchical lookups
CREATE INDEX IF NOT EXISTS idx_kb_section_reference 
  ON knowledge_base(manual_code, section_reference);

-- Create index on source_url for deduplication checks
CREATE INDEX IF NOT EXISTS idx_kb_source_url 
  ON knowledge_base(source_url) 
  WHERE source_url IS NOT NULL;

-- Create index for document_type filtering
CREATE INDEX IF NOT EXISTS idx_kb_document_type 
  ON knowledge_base(document_type)
  WHERE document_type IS NOT NULL;

-- Create index for last_checked_at (for staleness detection)
CREATE INDEX IF NOT EXISTS idx_kb_last_checked 
  ON knowledge_base(last_checked_at)
  WHERE last_checked_at IS NOT NULL;

-- ============================================================================
-- 4. UPGRADE TO HNSW INDEX (Better recall at scale)
-- ============================================================================

-- Drop existing IVFFlat index on knowledge_base
DROP INDEX IF EXISTS knowledge_base_embedding_idx;

-- Create HNSW index for better recall
-- m = 16: connections per node (higher = better recall, more memory)
-- ef_construction = 64: build-time search depth (higher = better index quality)
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_hnsw_idx 
  ON knowledge_base 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Also upgrade precedents table index
DROP INDEX IF EXISTS precedents_embedding_idx;

CREATE INDEX IF NOT EXISTS precedents_embedding_hnsw_idx 
  ON precedents 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- ============================================================================
-- 5. CREATE CATEGORY-FILTERED SEARCH FUNCTION
-- ============================================================================

-- Enhanced RPC function with category filtering and verification status
CREATE OR REPLACE FUNCTION match_knowledge_base_filtered(
  query_embedding vector(3072),
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
    -- Similarity threshold
    1 - (kb.embedding <=> query_embedding) > match_threshold
    -- Category filter (if provided)
    AND (category_filter IS NULL OR kb.category = ANY(category_filter))
    -- Document type filter (if provided)
    AND (document_type_filter IS NULL OR kb.document_type = ANY(document_type_filter))
    -- Verification status filter
    AND (
      kb.verification_status = 'verified' 
      OR kb.verification_status IS NULL
      OR (include_superseded AND kb.verification_status = 'superseded')
    )
  ORDER BY kb.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION match_knowledge_base_filtered TO authenticated;
GRANT EXECUTE ON FUNCTION match_knowledge_base_filtered TO service_role;

-- ============================================================================
-- 6. CREATE INGESTION TRACKING TABLE
-- ============================================================================

-- Track ingestion runs for each source
CREATE TABLE IF NOT EXISTS knowledge_ingestion_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type TEXT NOT NULL,           -- 'hmrc_manual', 'tribunal', 'legislation'
  source_identifier TEXT NOT NULL,     -- 'DMBM', 'ARTG', etc.
  ingestion_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ingestion_completed_at TIMESTAMPTZ,
  sections_found INTEGER,
  sections_added INTEGER,
  sections_updated INTEGER,
  sections_unchanged INTEGER,
  errors JSONB DEFAULT '[]',
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_log_source 
  ON knowledge_ingestion_log(source_type, source_identifier, created_at DESC);

-- Enable RLS on ingestion log
ALTER TABLE knowledge_ingestion_log ENABLE ROW LEVEL SECURITY;

-- Admin/Manager access only (drop first to avoid errors on re-run)
DROP POLICY IF EXISTS "Admin/Manager can manage ingestion log" ON knowledge_ingestion_log;
CREATE POLICY "Admin/Manager can manage ingestion log" ON knowledge_ingestion_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lightpoint_users
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- ============================================================================
-- 7. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN knowledge_base.source_url IS 'Original source URL for verification';
COMMENT ON COLUMN knowledge_base.source_verified_at IS 'When the source was last verified as accurate';
COMMENT ON COLUMN knowledge_base.verification_status IS 'Current verification status: verified, pending, outdated, superseded, archived';
COMMENT ON COLUMN knowledge_base.section_reference IS 'HMRC manual section reference (e.g., DMBM210105)';
COMMENT ON COLUMN knowledge_base.manual_code IS 'HMRC manual code (e.g., DMBM, ARTG, SAM)';
COMMENT ON COLUMN knowledge_base.parent_section IS 'Parent section reference for hierarchy';
COMMENT ON COLUMN knowledge_base.breadcrumb IS 'Navigation breadcrumb as JSON array';
COMMENT ON COLUMN knowledge_base.effective_from IS 'Date this guidance became effective';
COMMENT ON COLUMN knowledge_base.superseded_at IS 'Date this guidance was superseded (if applicable)';
COMMENT ON COLUMN knowledge_base.last_checked_at IS 'When this content was last verified against source';
COMMENT ON COLUMN knowledge_base.citation_format IS 'Formatted citation for referencing (e.g., DMBM210105)';
COMMENT ON COLUMN knowledge_base.document_type IS 'Type of document: guidance, manual, legislation, case_law, charter, precedent';

COMMENT ON TABLE knowledge_ingestion_log IS 'Tracks automated ingestion runs for HMRC manuals, case law, and legislation';

-- ============================================================================
-- 8. VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Knowledge Base Expansion Migration Complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'New columns added to knowledge_base:';
  RAISE NOTICE '  - source_url, source_verified_at, verification_status';
  RAISE NOTICE '  - section_reference, manual_code, parent_section, breadcrumb';
  RAISE NOTICE '  - effective_from, superseded_at, last_checked_at';
  RAISE NOTICE '  - citation_format, document_type';
  RAISE NOTICE '';
  RAISE NOTICE 'New indexes created:';
  RAISE NOTICE '  - idx_kb_verified_content (partial index for verified content)';
  RAISE NOTICE '  - idx_kb_section_reference (for hierarchical lookups)';
  RAISE NOTICE '  - idx_kb_source_url (for deduplication)';
  RAISE NOTICE '  - knowledge_base_embedding_hnsw_idx (HNSW for better recall)';
  RAISE NOTICE '  - precedents_embedding_hnsw_idx (HNSW for better recall)';
  RAISE NOTICE '';
  RAISE NOTICE 'New function created:';
  RAISE NOTICE '  - match_knowledge_base_filtered (category-aware search)';
  RAISE NOTICE '';
  RAISE NOTICE 'New table created:';
  RAISE NOTICE '  - knowledge_ingestion_log (tracks ingestion runs)';
END $$;

