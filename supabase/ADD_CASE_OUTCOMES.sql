-- ============================================================================
-- CASE OUTCOMES & LEARNING SYSTEM
-- ============================================================================
-- Tracks complaint outcomes and automatically generates learnings
-- for the precedent database when cases are closed
-- ============================================================================

-- Step 1: Create case_outcomes table to track results
CREATE TABLE IF NOT EXISTS case_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to complaint (but we don't expose client data)
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Outcome classification
  outcome_type TEXT NOT NULL CHECK (outcome_type IN (
    'successful_full',        -- HMRC fully upheld complaint
    'successful_partial',     -- HMRC partially upheld
    'unsuccessful',           -- HMRC rejected complaint
    'withdrawn',              -- Client withdrew
    'escalated_adjudicator',  -- Went to Adjudicator
    'escalated_tribunal',     -- Went to Tribunal
    'settled'                 -- Settled before formal decision
  )),
  
  -- Success metrics
  is_successful BOOLEAN GENERATED ALWAYS AS (
    outcome_type IN ('successful_full', 'successful_partial', 'settled')
  ) STORED,
  
  -- Financial outcomes (anonymized - just amounts, no client details)
  compensation_received NUMERIC DEFAULT 0,
  tax_position_corrected NUMERIC DEFAULT 0,
  penalties_cancelled NUMERIC DEFAULT 0,
  interest_refunded NUMERIC DEFAULT 0,
  
  -- Case characteristics (for learning)
  complaint_type TEXT,
  hmrc_department TEXT,
  issue_categories TEXT[] DEFAULT '{}',
  
  -- What worked / what didn't (AI-extracted, sanitized)
  effective_arguments TEXT[] DEFAULT '{}',
  ineffective_arguments TEXT[] DEFAULT '{}',
  key_citations TEXT[] DEFAULT '{}',
  hmrc_weak_points TEXT[] DEFAULT '{}',
  
  -- Timeline metrics
  days_to_resolution INTEGER,
  letter_iterations INTEGER DEFAULT 1,
  escalation_count INTEGER DEFAULT 0,
  
  -- HMRC response patterns (for future letters)
  hmrc_initial_response TEXT,      -- Sanitized summary
  hmrc_objections TEXT[] DEFAULT '{}',
  successful_rebuttals TEXT[] DEFAULT '{}',
  
  -- Quality scores (how well did our letter work?)
  letter_quality_score NUMERIC CHECK (letter_quality_score >= 0 AND letter_quality_score <= 10),
  argument_strength_score NUMERIC CHECK (argument_strength_score >= 0 AND argument_strength_score <= 10),
  evidence_quality_score NUMERIC CHECK (evidence_quality_score >= 0 AND evidence_quality_score <= 10),
  
  -- Learnings (AI-generated summary)
  key_learnings TEXT,
  recommendations_for_similar TEXT,
  
  -- For embedding in precedent search
  embedding vector(1536),
  
  -- Processing status
  learning_extracted BOOLEAN DEFAULT FALSE,
  added_to_precedents BOOLEAN DEFAULT FALSE,
  precedent_id UUID REFERENCES precedents(id),
  
  -- Timestamps
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  analyzed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX IF NOT EXISTS idx_case_outcomes_complaint ON case_outcomes(complaint_id);
CREATE INDEX IF NOT EXISTS idx_case_outcomes_org ON case_outcomes(organization_id);
CREATE INDEX IF NOT EXISTS idx_case_outcomes_type ON case_outcomes(complaint_type);
CREATE INDEX IF NOT EXISTS idx_case_outcomes_success ON case_outcomes(is_successful);
CREATE INDEX IF NOT EXISTS idx_case_outcomes_department ON case_outcomes(hmrc_department);
CREATE INDEX IF NOT EXISTS idx_case_outcomes_pending ON case_outcomes(learning_extracted) WHERE NOT learning_extracted;

-- Step 3: Create HNSW index for vector search
CREATE INDEX IF NOT EXISTS case_outcomes_embedding_hnsw_idx ON case_outcomes 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Step 4: Enable RLS
ALTER TABLE case_outcomes ENABLE ROW LEVEL SECURITY;

-- Step 5: RLS Policies - Only superadmins can see all, orgs can see aggregates
DROP POLICY IF EXISTS "Superadmins can view all outcomes" ON case_outcomes;
CREATE POLICY "Superadmins can view all outcomes" ON case_outcomes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role = 'super_admin' 
      AND revoked_at IS NULL
    )
  );

-- Organizations can only see their own outcomes
DROP POLICY IF EXISTS "Orgs can view own outcomes" ON case_outcomes;
CREATE POLICY "Orgs can view own outcomes" ON case_outcomes
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM lightpoint_users WHERE id = auth.uid()
    )
  );

-- Step 6: Aggregate stats view (safe to share, no PII)
CREATE OR REPLACE VIEW outcome_statistics AS
SELECT
  complaint_type,
  hmrc_department,
  COUNT(*) as total_cases,
  COUNT(*) FILTER (WHERE is_successful) as successful_cases,
  ROUND(100.0 * COUNT(*) FILTER (WHERE is_successful) / NULLIF(COUNT(*), 0), 1) as success_rate,
  ROUND(AVG(days_to_resolution), 0) as avg_resolution_days,
  ROUND(AVG(compensation_received), 2) as avg_compensation,
  ROUND(AVG(letter_quality_score), 1) as avg_letter_quality,
  COUNT(*) FILTER (WHERE outcome_type = 'escalated_adjudicator') as escalated_count
FROM case_outcomes
GROUP BY complaint_type, hmrc_department;

-- Step 7: Function to record an outcome when complaint is closed
CREATE OR REPLACE FUNCTION record_complaint_outcome(
  p_complaint_id UUID,
  p_outcome_type TEXT,
  p_compensation NUMERIC DEFAULT 0,
  p_tax_corrected NUMERIC DEFAULT 0,
  p_penalties_cancelled NUMERIC DEFAULT 0,
  p_interest_refunded NUMERIC DEFAULT 0,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_complaint RECORD;
  v_outcome_id UUID;
  v_days INTEGER;
BEGIN
  -- Get complaint details
  SELECT 
    c.id, c.organization_id, c.complaint_type, c.hmrc_department,
    c.created_at, c.metadata,
    (SELECT COUNT(*) FROM documents WHERE complaint_id = c.id AND document_type = 'complaint_draft') as letter_count
  INTO v_complaint
  FROM complaints c
  WHERE c.id = p_complaint_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Complaint not found';
  END IF;
  
  -- Calculate days to resolution
  v_days := EXTRACT(DAY FROM (NOW() - v_complaint.created_at));
  
  -- Insert outcome record
  INSERT INTO case_outcomes (
    complaint_id,
    organization_id,
    outcome_type,
    compensation_received,
    tax_position_corrected,
    penalties_cancelled,
    interest_refunded,
    complaint_type,
    hmrc_department,
    days_to_resolution,
    letter_iterations,
    closed_at
  ) VALUES (
    p_complaint_id,
    v_complaint.organization_id,
    p_outcome_type,
    p_compensation,
    p_tax_corrected,
    p_penalties_cancelled,
    p_interest_refunded,
    v_complaint.complaint_type,
    v_complaint.hmrc_department,
    v_days,
    v_complaint.letter_count,
    NOW()
  )
  RETURNING id INTO v_outcome_id;
  
  RETURN v_outcome_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 8: Function to match similar outcomes for learning
CREATE OR REPLACE FUNCTION match_case_outcomes(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  complaint_type TEXT,
  hmrc_department TEXT,
  outcome_type TEXT,
  is_successful BOOLEAN,
  effective_arguments TEXT[],
  key_citations TEXT[],
  key_learnings TEXT,
  similarity FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    complaint_type,
    hmrc_department,
    outcome_type,
    is_successful,
    effective_arguments,
    key_citations,
    key_learnings,
    1 - (case_outcomes.embedding <=> query_embedding) as similarity
  FROM case_outcomes
  WHERE 
    learning_extracted = true
    AND 1 - (case_outcomes.embedding <=> query_embedding) > match_threshold
  ORDER BY case_outcomes.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Step 9: View for pending analysis
CREATE OR REPLACE VIEW pending_outcome_analysis AS
SELECT 
  co.id,
  co.complaint_id,
  co.organization_id,
  co.outcome_type,
  co.is_successful,
  co.complaint_type,
  co.hmrc_department,
  co.closed_at,
  c.generated_letter,
  c.analysis_result,
  c.metadata
FROM case_outcomes co
JOIN complaints c ON c.id = co.complaint_id
WHERE co.learning_extracted = false
ORDER BY co.closed_at ASC;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
SELECT 'case_outcomes table' as check,
  EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'case_outcomes') as exists;

SELECT 'record_complaint_outcome function' as check,
  EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'record_complaint_outcome') as exists;

SELECT '✅ Case outcomes system ready!' as status;

