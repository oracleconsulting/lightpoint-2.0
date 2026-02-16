-- ============================================================================
-- APPEALS SYSTEM MIGRATION
-- Adds case classification, penalty tracking, appeal grounds, and precedents
-- Backward-compatible: existing complaints continue to work unchanged
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. EXTEND COMPLAINTS TABLE
-- ============================================================================

ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS case_type TEXT DEFAULT 'complaint'
    CHECK (case_type IN (
      'complaint', 'penalty_appeal', 'statutory_review',
      'mixed', 'tribunal_appeal'
    )),
  ADD COLUMN IF NOT EXISTS case_classification JSONB,
  ADD COLUMN IF NOT EXISTS penalty_details JSONB;

CREATE INDEX IF NOT EXISTS idx_complaints_case_type
  ON complaints(case_type);

COMMENT ON COLUMN complaints.case_type IS
  'Primary case classification: complaint, penalty_appeal, statutory_review, mixed, tribunal_appeal';
COMMENT ON COLUMN complaints.case_classification IS
  'Full classification output from AI: confidence, signals, penalty_details, routing';
COMMENT ON COLUMN complaints.penalty_details IS
  'Structured penalty info: type, amount, regime, tax_years, appeal_deadline, reasonable_excuse_grounds';

-- ============================================================================
-- 2. EXTEND GENERATED_LETTERS LETTER_TYPE
-- ============================================================================

ALTER TABLE generated_letters DROP CONSTRAINT IF EXISTS generated_letters_letter_type_check;
ALTER TABLE generated_letters DROP CONSTRAINT IF EXISTS check_letter_type;

ALTER TABLE generated_letters ADD CONSTRAINT generated_letters_letter_type_check
  CHECK (letter_type IN (
    'initial_complaint', 'tier2_escalation',
    'adjudicator_escalation', 'rebuttal', 'acknowledgement',
    'penalty_appeal',
    'penalty_appeal_follow_up',
    'statutory_review_request',
    'tribunal_appeal_notice',
    'tribunal_appeal_grounds'
  ));

-- ============================================================================
-- 3. NEW TABLE: appeal_grounds
-- ============================================================================

CREATE TABLE IF NOT EXISTS appeal_grounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  ground_type TEXT NOT NULL CHECK (ground_type IN (
    'reasonable_excuse', 'special_circumstances',
    'procedural_error', 'statutory_defence', 'proportionality'
  )),
  statute_reference TEXT NOT NULL,
  description TEXT NOT NULL,
  supporting_evidence JSONB,
  strength_assessment TEXT CHECK (strength_assessment IN (
    'strong', 'moderate', 'weak', 'untested'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appeal_grounds_complaint
  ON appeal_grounds(complaint_id);
CREATE INDEX IF NOT EXISTS idx_appeal_grounds_type
  ON appeal_grounds(ground_type);

ALTER TABLE appeal_grounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage appeal grounds for their org complaints"
  ON appeal_grounds FOR ALL USING (
    EXISTS (
      SELECT 1 FROM complaints c
      JOIN user_profiles up ON up.organization_id = c.organization_id
      WHERE c.id = appeal_grounds.complaint_id
      AND up.id = auth.uid()
    )
  );

-- ============================================================================
-- 4. NEW TABLE: penalty_assessments
-- ============================================================================

CREATE TABLE IF NOT EXISTS penalty_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  penalty_type TEXT NOT NULL CHECK (penalty_type IN (
    'late_filing', 'late_payment', 'inaccuracy',
    'failure_to_notify', 'rti_late_filing', 'vat_default_surcharge',
    'vat_error_penalty', 'cis_penalty', 'other'
  )),
  penalty_regime TEXT NOT NULL,
  penalty_amount DECIMAL(12,2),
  tax_year TEXT,
  tax_type TEXT,
  penalty_notice_date DATE,
  penalty_reference TEXT,
  appeal_deadline DATE,
  appeal_filed_date DATE,
  appeal_status TEXT DEFAULT 'pending' CHECK (appeal_status IN (
    'pending', 'filed', 'under_review', 'upheld', 'cancelled',
    'partially_cancelled', 'referred_to_tribunal'
  )),
  hmrc_review_requested BOOLEAN DEFAULT FALSE,
  hmrc_review_date DATE,
  hmrc_review_outcome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_penalty_assessments_complaint
  ON penalty_assessments(complaint_id);
CREATE INDEX IF NOT EXISTS idx_penalty_assessments_status
  ON penalty_assessments(penalty_type, appeal_status);

ALTER TABLE penalty_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage penalties for their org complaints"
  ON penalty_assessments FOR ALL USING (
    EXISTS (
      SELECT 1 FROM complaints c
      JOIN user_profiles up ON up.organization_id = c.organization_id
      WHERE c.id = penalty_assessments.complaint_id
      AND up.id = auth.uid()
    )
  );

-- ============================================================================
-- 5. NEW TABLE: appeal_precedents
-- ============================================================================

CREATE TABLE IF NOT EXISTS appeal_precedents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_name TEXT NOT NULL,
  case_reference TEXT NOT NULL,
  tribunal_level TEXT NOT NULL CHECK (tribunal_level IN ('FTT', 'UT', 'CoA', 'SC')),
  decision_date DATE,
  penalty_type TEXT,
  ground_type TEXT,
  outcome TEXT CHECK (outcome IN (
    'appeal_allowed', 'appeal_dismissed', 'partially_allowed', 'remitted'
  )),
  key_principles TEXT[],
  summary TEXT NOT NULL,
  full_text TEXT,
  citation_format TEXT,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appeal_precedents_type
  ON appeal_precedents(penalty_type, ground_type);
CREATE INDEX IF NOT EXISTS appeal_precedents_embedding_hnsw_idx
  ON appeal_precedents USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

ALTER TABLE appeal_precedents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read appeal precedents"
  ON appeal_precedents FOR SELECT USING (true);

CREATE POLICY "Admins can manage appeal precedents"
  ON appeal_precedents FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- 6. VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Appeals System Migration Complete!';
  RAISE NOTICE 'New columns: complaints.case_type, case_classification, penalty_details';
  RAISE NOTICE 'Extended: generated_letters.letter_type with appeal types';
  RAISE NOTICE 'New tables: appeal_grounds, penalty_assessments, appeal_precedents';
END $$;

COMMIT;
