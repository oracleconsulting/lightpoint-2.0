-- ============================================================================
-- COMPLETE LIGHTPOINT DATABASE SETUP
-- Run this ONCE in your Supabase SQL Editor to set up everything
-- ============================================================================

-- ============================================================================
-- 1. ENABLE EXTENSIONS
-- ============================================================================

create extension if not exists vector;
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 2. CREATE CORE TABLES
-- ============================================================================

-- Organizations (multi-tenancy)
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default now()
);

-- Users
create table if not exists lightpoint_users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  email text unique not null,
  role text not null check (role in ('admin', 'analyst', 'viewer')),
  created_at timestamp with time zone default now()
);

-- Complaints
create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  created_by uuid references lightpoint_users(id),
  client_name_encrypted text,
  complaint_reference text unique not null,
  complaint_type text,
  hmrc_department text,
  complaint_context text,
  key_dates jsonb,
  financial_impact jsonb,
  client_objective text,
  status text default 'draft',
  timeline jsonb default '[]'::jsonb,
  archived boolean default false,
  archived_at timestamp with time zone,
  archive_reason text,
  final_outcome text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Documents (with vectorization)
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references complaints(id) on delete cascade,
  filename text not null,
  file_path text not null,
  document_type text,
  uploaded_by uuid references lightpoint_users(id),
  document_date date,
  description text,
  sanitized_text text,
  uploaded_at timestamp with time zone default now(),
  processed_data jsonb,
  embedding vector(1536),
  vector_id uuid
);

-- Knowledge Base
create table if not exists knowledge_base (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  content text not null,
  source text,
  embedding vector(1536),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Precedents
create table if not exists precedents (
  id uuid primary key default gen_random_uuid(),
  complaint_type text not null,
  issue_category text not null,
  outcome text,
  resolution_time_days integer,
  compensation_amount numeric,
  key_arguments text[],
  effective_citations text[],
  embedding vector(1536),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Document Analysis
create table if not exists document_analysis (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  complaint_id uuid references complaints(id) on delete cascade,
  analysis_type text not null check (analysis_type in (
    'charter_violation',
    'timeline_extraction',
    'financial_impact',
    'key_dates',
    'precedent_match'
  )),
  analysis_result jsonb not null,
  confidence_score float check (confidence_score >= 0 and confidence_score <= 1),
  analyzed_at timestamp with time zone default now(),
  analyzed_by text
);

-- Time Logs
create table if not exists time_logs (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references complaints(id),
  user_id uuid references lightpoint_users(id),
  activity_type text not null,
  minutes_spent integer not null,
  automated boolean default false,
  created_at timestamp with time zone default now()
);

-- Audit Logs
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references lightpoint_users(id),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- ============================================================================
-- 3. CREATE INDEXES
-- ============================================================================

-- Vector search indexes
drop index if exists knowledge_base_embedding_idx;
create index knowledge_base_embedding_idx on knowledge_base 
using hnsw (embedding vector_cosine_ops);

drop index if exists precedents_embedding_idx;
create index precedents_embedding_idx on precedents 
using hnsw (embedding vector_cosine_ops);

drop index if exists documents_embedding_idx;
create index documents_embedding_idx on documents 
using hnsw (embedding vector_cosine_ops)
where embedding is not null;

-- Performance indexes
create index if not exists complaints_org_idx on complaints(organization_id);
create index if not exists complaints_status_idx on complaints(status);
create index if not exists complaints_active_idx on complaints (organization_id, status) 
where archived = false;
create index if not exists complaints_archived_idx on complaints (organization_id, archived_at) 
where archived = true;
create index if not exists complaints_type_idx on complaints(complaint_type);
create index if not exists complaints_department_idx on complaints(hmrc_department);

create index if not exists documents_complaint_idx on documents(complaint_id);
create index if not exists document_analysis_document_idx on document_analysis(document_id);
create index if not exists document_analysis_complaint_idx on document_analysis(complaint_id);

-- ============================================================================
-- 4. CREATE VECTOR SEARCH FUNCTIONS
-- ============================================================================

-- Search knowledge base
create or replace function match_knowledge_base(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 10
)
returns table (
  id uuid,
  category text,
  title text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    category,
    title,
    content,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  from knowledge_base
  where 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  order by knowledge_base.embedding <=> query_embedding
  limit match_count;
$$;

-- Search precedents
create or replace function match_precedents(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 10
)
returns table (
  id uuid,
  complaint_type text,
  issue_category text,
  outcome text,
  key_arguments text[],
  effective_citations text[],
  similarity float
)
language sql stable
as $$
  select
    id,
    complaint_type,
    issue_category,
    outcome,
    key_arguments,
    effective_citations,
    1 - (precedents.embedding <=> query_embedding) as similarity
  from precedents
  where 1 - (precedents.embedding <=> query_embedding) > match_threshold
  order by precedents.embedding <=> query_embedding
  limit match_count;
$$;

-- Search documents within complaint
create or replace function match_complaint_documents(
  p_complaint_id uuid,
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 10
)
returns table (
  id uuid,
  filename text,
  document_type text,
  sanitized_text text,
  document_date date,
  similarity float
)
language sql stable
as $$
  select
    d.id,
    d.filename,
    d.document_type,
    d.sanitized_text,
    d.document_date,
    1 - (d.embedding <=> query_embedding) as similarity
  from documents d
  where 
    d.complaint_id = p_complaint_id
    and d.embedding is not null
    and 1 - (d.embedding <=> query_embedding) > match_threshold
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

-- ============================================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- ============================================================================

alter table organizations enable row level security;
alter table lightpoint_users enable row level security;
alter table complaints enable row level security;
alter table documents enable row level security;
alter table document_analysis enable row level security;
alter table time_logs enable row level security;
alter table audit_logs enable row level security;

-- ============================================================================
-- 6. CREATE RLS POLICIES
-- ============================================================================

-- Organizations
drop policy if exists "Users can view their own organization" on organizations;
create policy "Users can view their own organization"
  on organizations for select
  using (id = (select organization_id from lightpoint_users where id = auth.uid()));

-- Complaints
drop policy if exists "Users can view complaints in their organization" on complaints;
drop policy if exists "Users can insert complaints in their organization" on complaints;
drop policy if exists "Users can update complaints in their organization" on complaints;

create policy "Users can view complaints in their organization"
  on complaints for select
  using (organization_id = (select organization_id from lightpoint_users where id = auth.uid()));

create policy "Users can insert complaints in their organization"
  on complaints for insert
  with check (organization_id = (select organization_id from lightpoint_users where id = auth.uid()));

create policy "Users can update complaints in their organization"
  on complaints for update
  using (organization_id = (select organization_id from lightpoint_users where id = auth.uid()));

-- Documents  
drop policy if exists "Users can view documents in their organization" on documents;
drop policy if exists "Users can insert documents in their organization" on documents;
drop policy if exists "Users can update documents in their organization" on documents;

create policy "Users can view documents in their organization"
  on documents for select
  using (
    complaint_id in (
      select c.id from complaints c
      where c.organization_id = (select organization_id from lightpoint_users where id = auth.uid())
    )
  );

create policy "Users can insert documents in their organization"
  on documents for insert
  with check (
    complaint_id in (
      select c.id from complaints c
      where c.organization_id = (select organization_id from lightpoint_users where id = auth.uid())
    )
  );

create policy "Users can update documents in their organization"
  on documents for update
  using (
    complaint_id in (
      select c.id from complaints c
      where c.organization_id = (select organization_id from lightpoint_users where id = auth.uid())
    )
  );

-- Document Analysis
drop policy if exists "Users can view analysis in their organization" on document_analysis;
create policy "Users can view analysis in their organization"
  on document_analysis for select
  using (
    complaint_id in (
      select c.id from complaints c
      where c.organization_id = (select organization_id from lightpoint_users where id = auth.uid())
    )
  );

-- ============================================================================
-- 7. INSERT TEST DATA (OPTIONAL - FOR DEVELOPMENT)
-- ============================================================================

-- Create test organization
insert into organizations (id, name) 
values ('00000000-0000-0000-0000-000000000001', 'Test Organization')
on conflict do nothing;

-- Create test user
insert into lightpoint_users (id, organization_id, email, role)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  'admin'
) on conflict do nothing;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================

-- Verify setup
select 'Setup complete! Tables created:' as status;

select 
  table_name,
  (select count(*) from information_schema.columns 
   where table_name = t.table_name) as column_count
from information_schema.tables t
where table_schema = 'public'
  and table_type = 'BASE TABLE'
order by table_name;

