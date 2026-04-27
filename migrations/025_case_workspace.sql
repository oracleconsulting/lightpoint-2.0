-- ============================================================================
-- CASE WORKSPACE FOUNDATION
-- Conversational case workspace tables for complex HMRC dispute cases.
-- ============================================================================

BEGIN;

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  case_reference TEXT NOT NULL,
  title TEXT NOT NULL,
  client_name TEXT,
  hmrc_reference TEXT,
  hmrc_department TEXT,
  case_type TEXT DEFAULT 'complex_dispute',
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'active', 'on_hold', 'closed')),
  tier INTEGER NOT NULL DEFAULT 3 CHECK (tier IN (1, 2, 3)),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  summary TEXT,
  outcome TEXT,
  closed_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, case_reference)
);

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS case_reference TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS client_name TEXT,
  ADD COLUMN IF NOT EXISTS hmrc_reference TEXT,
  ADD COLUMN IF NOT EXISTS hmrc_department TEXT,
  ADD COLUMN IF NOT EXISTS case_type TEXT DEFAULT 'complex_dispute',
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS tier INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS summary TEXT,
  ADD COLUMN IF NOT EXISTS outcome TEXT,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_cases_org_status
  ON cases(organization_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_cases_org_tier
  ON cases(organization_id, tier, updated_at DESC);

CREATE TABLE IF NOT EXISTS case_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  event_date DATE NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'note',
  title TEXT NOT NULL,
  description TEXT,
  source TEXT DEFAULT 'manual',
  deadline_status TEXT
    CHECK (deadline_status IN ('live', 'passed', 'met', 'extended')),
  statutory_authority TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE case_events
  ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS event_date DATE,
  ADD COLUMN IF NOT EXISTS event_type TEXT NOT NULL DEFAULT 'note',
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS deadline_status TEXT,
  ADD COLUMN IF NOT EXISTS statutory_authority TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

ALTER TABLE case_events DROP CONSTRAINT IF EXISTS case_events_event_type_check;
ALTER TABLE case_events ADD CONSTRAINT case_events_event_type_check
  CHECK (event_type IN (
    'note',
    'deadline',
    'document_date',
    'complaint_timeline',
    'complaint_imported',
    'complaint_context',
    'context_provided',
    'letter_generated',
    'letter_sent',
    'manual_activity',
    'hmrc_response',
    'document_uploaded',
    'decision',
    'research',
    'other'
  ));

ALTER TABLE case_events DROP CONSTRAINT IF EXISTS case_events_source_check;
ALTER TABLE case_events ADD CONSTRAINT case_events_source_check
  CHECK (source IN (
    'manual',
    'ai',
    'document_intake',
    'complaint_import',
    'system'
  ));

CREATE INDEX IF NOT EXISTS idx_case_events_case_date
  ON case_events(case_id, event_date ASC);
CREATE INDEX IF NOT EXISTS idx_case_events_deadline
  ON case_events(case_id, deadline_status)
  WHERE deadline_status IS NOT NULL;

CREATE TABLE IF NOT EXISTS case_parties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'other',
  organisation TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Safe rerun support: earlier failed/manual versions of this table may exist
-- without the Phase 1 columns. CREATE TABLE IF NOT EXISTS will not add them.
ALTER TABLE case_parties
  ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS organisation TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_case_parties_case_role
  ON case_parties(case_id, role);

CREATE TABLE IF NOT EXISTS case_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  document_name TEXT,
  storage_path TEXT NOT NULL,
  mime_type TEXT,
  file_size BIGINT,
  document_type TEXT,
  extraction_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (extraction_status IN ('pending', 'processing', 'complete', 'failed')),
  extracted_text TEXT,
  extracted_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  embedding VECTOR(3072),
  uploaded_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE case_documents
  ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS file_name TEXT,
  ADD COLUMN IF NOT EXISTS document_name TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS document_type TEXT,
  ADD COLUMN IF NOT EXISTS extraction_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS extracted_text TEXT,
  ADD COLUMN IF NOT EXISTS extracted_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS embedding VECTOR(3072),
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE case_documents
SET document_name = COALESCE(document_name, file_name, 'Imported document')
WHERE document_name IS NULL;

UPDATE case_documents
SET file_name = COALESCE(file_name, document_name, 'Imported document')
WHERE file_name IS NULL;

ALTER TABLE case_documents DROP CONSTRAINT IF EXISTS case_documents_document_type_check;
ALTER TABLE case_documents ADD CONSTRAINT case_documents_document_type_check
  CHECK (
    document_type IS NULL OR document_type IN (
      'hmrc_letter',
      'complaint_draft',
      'response',
      'evidence',
      'final_outcome',
      'complaint_analysis',
      'SA316_s8_notice',
      'schedule_36_notice',
      'penalty_notice',
      'closure_notice',
      'hmrc_response',
      'agent_letter',
      'bank_statement',
      'schedule',
      'other'
    )
  );

CREATE INDEX IF NOT EXISTS idx_case_documents_case
  ON case_documents(case_id, uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_documents_embedding
  ON case_documents USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

CREATE TABLE IF NOT EXISTS case_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  proposition TEXT,
  citation TEXT,
  source_url TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unverified'
    CHECK (verification_status IN ('unverified', 'pending', 'verified', 'manual_check_required', 'failed')),
  verification_notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE case_research
  ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS proposition TEXT,
  ADD COLUMN IF NOT EXISTS citation TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_case_research_case_status
  ON case_research(case_id, verification_status);

CREATE TABLE IF NOT EXISTS case_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  decision_text TEXT NOT NULL,
  reasoning TEXT,
  alternatives_considered TEXT,
  supersedes_decision_id UUID REFERENCES case_decisions(id) ON DELETE SET NULL,
  superseded_at TIMESTAMPTZ,
  created_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE case_decisions
  ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS decision_text TEXT,
  ADD COLUMN IF NOT EXISTS reasoning TEXT,
  ADD COLUMN IF NOT EXISTS alternatives_considered TEXT,
  ADD COLUMN IF NOT EXISTS supersedes_decision_id UUID REFERENCES case_decisions(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS superseded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_case_decisions_case_active
  ON case_decisions(case_id, created_at DESC)
  WHERE superseded_at IS NULL;

CREATE TABLE IF NOT EXISTS case_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  structured_outputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  token_usage JSONB,
  created_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE case_messages
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS structured_outputs JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS model TEXT,
  ADD COLUMN IF NOT EXISTS token_usage JSONB,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_case_messages_case_created
  ON case_messages(case_id, created_at ASC);

CREATE TABLE IF NOT EXISTS case_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  anomaly_type TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium'
    CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  acknowledged_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE case_anomalies
  ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS anomaly_type TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS acknowledged_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_case_anomalies_case_ack
  ON case_anomalies(case_id, acknowledged, severity);

CREATE TABLE IF NOT EXISTS case_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  output_type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'verified', 'exported', 'blocked')),
  citations_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE case_outputs
  ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS output_type TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS citations_used JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES lightpoint_users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_case_outputs_case
  ON case_outputs(case_id, created_at DESC);

CREATE TABLE IF NOT EXISTS case_complaint_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL DEFAULT 'related',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(case_id, complaint_id)
);

ALTER TABLE case_complaint_links
  ADD COLUMN IF NOT EXISTS case_id UUID REFERENCES cases(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS complaint_id UUID REFERENCES complaints(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS link_type TEXT NOT NULL DEFAULT 'related',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS citation_verification_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  citation TEXT NOT NULL UNIQUE,
  claimed_case_name TEXT,
  verification_status TEXT NOT NULL
    CHECK (verification_status IN ('verified', 'manual_check_required', 'failed')),
  source_url TEXT,
  fetched_case_name TEXT,
  fetched_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  verification_notes TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days')
);

ALTER TABLE citation_verification_cache
  ADD COLUMN IF NOT EXISTS citation TEXT,
  ADD COLUMN IF NOT EXISTS claimed_case_name TEXT,
  ADD COLUMN IF NOT EXISTS verification_status TEXT,
  ADD COLUMN IF NOT EXISTS source_url TEXT,
  ADD COLUMN IF NOT EXISTS fetched_case_name TEXT,
  ADD COLUMN IF NOT EXISTS fetched_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days');

CREATE INDEX IF NOT EXISTS idx_citation_cache_expires
  ON citation_verification_cache(citation, expires_at);

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'cases',
    'case_events',
    'case_parties',
    'case_documents',
    'case_research',
    'case_decisions',
    'case_outputs'
  ]
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS set_%I_updated_at ON %I', table_name, table_name);
    EXECUTE format(
      'CREATE TRIGGER set_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION touch_updated_at()',
      table_name,
      table_name
    );
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION case_org_id(case_id_param UUID)
RETURNS UUID AS $$
  SELECT organization_id FROM cases WHERE id = case_id_param;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_case_workspace(case_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  workspace JSONB;
BEGIN
  SELECT jsonb_build_object(
    'case', to_jsonb(c),
    'events', COALESCE((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.event_date ASC, e.created_at ASC) FROM case_events e WHERE e.case_id = c.id), '[]'::jsonb),
    'parties', COALESCE((SELECT jsonb_agg(to_jsonb(p) ORDER BY p.role ASC, p.created_at ASC) FROM case_parties p WHERE p.case_id = c.id), '[]'::jsonb),
    'documents', COALESCE((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.uploaded_at DESC) FROM case_documents d WHERE d.case_id = c.id), '[]'::jsonb),
    'research', COALESCE((SELECT jsonb_agg(to_jsonb(r) ORDER BY r.created_at DESC) FROM case_research r WHERE r.case_id = c.id), '[]'::jsonb),
    'decisions', COALESCE((SELECT jsonb_agg(to_jsonb(dec) ORDER BY dec.created_at DESC) FROM case_decisions dec WHERE dec.case_id = c.id AND dec.superseded_at IS NULL), '[]'::jsonb),
    'anomalies', COALESCE((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.created_at DESC) FROM case_anomalies a WHERE a.case_id = c.id AND a.acknowledged = FALSE), '[]'::jsonb),
    'outputs', COALESCE((SELECT jsonb_agg(to_jsonb(o) ORDER BY o.created_at DESC) FROM case_outputs o WHERE o.case_id = c.id), '[]'::jsonb)
  )
  INTO workspace
  FROM cases c
  WHERE c.id = case_id_param;

  RETURN workspace;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Required when rerunning after a partially-created function with a different
-- OUT row type or vector dimension. CREATE OR REPLACE cannot change OUT params.
DROP FUNCTION IF EXISTS match_case_documents(vector, uuid, double precision, integer);

CREATE OR REPLACE FUNCTION match_case_documents(
  query_embedding VECTOR(3072),
  case_id_filter UUID,
  match_threshold FLOAT DEFAULT 0.75,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  case_id UUID,
  file_name TEXT,
  extracted_text TEXT,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.case_id,
    d.file_name,
    d.extracted_text,
    1 - (d.embedding <=> query_embedding) AS similarity
  FROM case_documents d
  WHERE d.case_id = case_id_filter
    AND d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

INSERT INTO storage.buckets (id, name, public)
VALUES ('case-documents', 'case-documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Users can read case document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload case document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update case document files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete case document files" ON storage.objects;

CREATE POLICY "Users can read case document files"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'case-documents'
    AND EXISTS (
      SELECT 1 FROM cases c
      JOIN lightpoint_users lu ON lu.organization_id = c.organization_id
      WHERE c.id = ((storage.foldername(name))[1])::uuid
        AND lu.id = auth.uid()
    )
  );

CREATE POLICY "Users can upload case document files"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'case-documents'
    AND EXISTS (
      SELECT 1 FROM cases c
      JOIN lightpoint_users lu ON lu.organization_id = c.organization_id
      WHERE c.id = ((storage.foldername(name))[1])::uuid
        AND lu.id = auth.uid()
    )
  );

CREATE POLICY "Users can update case document files"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'case-documents'
    AND EXISTS (
      SELECT 1 FROM cases c
      JOIN lightpoint_users lu ON lu.organization_id = c.organization_id
      WHERE c.id = ((storage.foldername(name))[1])::uuid
        AND lu.id = auth.uid()
    )
  );

CREATE POLICY "Users can delete case document files"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'case-documents'
    AND EXISTS (
      SELECT 1 FROM cases c
      JOIN lightpoint_users lu ON lu.organization_id = c.organization_id
      WHERE c.id = ((storage.foldername(name))[1])::uuid
        AND lu.id = auth.uid()
    )
  );

ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_research ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_complaint_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE citation_verification_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their org cases" ON cases;
DROP POLICY IF EXISTS "Users can manage case events for their org" ON case_events;
DROP POLICY IF EXISTS "Users can manage case parties for their org" ON case_parties;
DROP POLICY IF EXISTS "Users can manage case documents for their org" ON case_documents;
DROP POLICY IF EXISTS "Users can manage case research for their org" ON case_research;
DROP POLICY IF EXISTS "Users can manage case decisions for their org" ON case_decisions;
DROP POLICY IF EXISTS "Users can manage case messages for their org" ON case_messages;
DROP POLICY IF EXISTS "Users can manage case anomalies for their org" ON case_anomalies;
DROP POLICY IF EXISTS "Users can manage case outputs for their org" ON case_outputs;
DROP POLICY IF EXISTS "Users can manage complaint links for their org" ON case_complaint_links;
DROP POLICY IF EXISTS "Users can read citation verification cache" ON citation_verification_cache;

CREATE POLICY "Users can manage their org cases"
  ON cases FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lightpoint_users lu
      WHERE lu.id = auth.uid()
        AND lu.organization_id = cases.organization_id
    )
  );

CREATE POLICY "Users can manage case events for their org"
  ON case_events FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cases c
      JOIN lightpoint_users lu ON lu.organization_id = c.organization_id
      WHERE c.id = case_events.case_id
        AND lu.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage case parties for their org"
  ON case_parties FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cases c
      JOIN lightpoint_users lu ON lu.organization_id = c.organization_id
      WHERE c.id = case_parties.case_id
        AND lu.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage case documents for their org"
  ON case_documents FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cases c
      JOIN lightpoint_users lu ON lu.organization_id = c.organization_id
      WHERE c.id = case_documents.case_id
        AND lu.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage case research for their org"
  ON case_research FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cases c
      JOIN lightpoint_users lu ON lu.organization_id = c.organization_id
      WHERE c.id = case_research.case_id
        AND lu.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage case decisions for their org"
  ON case_decisions FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cases c
      JOIN lightpoint_users lu ON lu.organization_id = c.organization_id
      WHERE c.id = case_decisions.case_id
        AND lu.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage case messages for their org"
  ON case_messages FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cases c
      JOIN lightpoint_users lu ON lu.organization_id = c.organization_id
      WHERE c.id = case_messages.case_id
        AND lu.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage case anomalies for their org"
  ON case_anomalies FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cases c
      JOIN lightpoint_users lu ON lu.organization_id = c.organization_id
      WHERE c.id = case_anomalies.case_id
        AND lu.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage case outputs for their org"
  ON case_outputs FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cases c
      JOIN lightpoint_users lu ON lu.organization_id = c.organization_id
      WHERE c.id = case_outputs.case_id
        AND lu.id = auth.uid()
    )
  );

CREATE POLICY "Users can manage complaint links for their org"
  ON case_complaint_links FOR ALL USING (
    EXISTS (
      SELECT 1 FROM cases c
      JOIN lightpoint_users lu ON lu.organization_id = c.organization_id
      WHERE c.id = case_complaint_links.case_id
        AND lu.id = auth.uid()
    )
  );

CREATE POLICY "Users can read citation verification cache"
  ON citation_verification_cache FOR SELECT USING (true);

COMMIT;
