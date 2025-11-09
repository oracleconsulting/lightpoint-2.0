# Lightpoint Database Setup Guide

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**

## Step 2: Run the Migration SQL

Copy the entire contents of `supabase/migrations/001_initial_schema.sql` and paste it into the SQL Editor, then click **Run**.

Alternatively, you can copy this complete SQL:

```sql
-- Enable pgvector extension
create extension if not exists vector;

-- Organizations (multi-tenancy)
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default now()
);

-- Users
create table users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  email text unique not null,
  role text not null check (role in ('admin', 'analyst', 'viewer')),
  created_at timestamp with time zone default now()
);

-- Complaints
create table complaints (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id),
  created_by uuid references users(id),
  client_name_encrypted text,
  complaint_reference text unique not null,
  complaint_context text,
  key_dates jsonb,
  financial_impact jsonb,
  client_objective text,
  status text default 'draft',
  timeline jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Documents
create table documents (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references complaints(id),
  filename text not null,
  file_path text not null,
  sanitized_text text,
  uploaded_at timestamp with time zone default now(),
  processed_data jsonb,
  vector_id uuid
);

-- Knowledge Base (vectorized HMRC guidance)
create table knowledge_base (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  content text not null,
  source text,
  embedding vector(3072),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Precedents Library (sanitized past cases)
create table precedents (
  id uuid primary key default gen_random_uuid(),
  complaint_type text not null,
  issue_category text not null,
  outcome text,
  resolution_time_days integer,
  compensation_amount numeric,
  key_arguments text[],
  effective_citations text[],
  embedding vector(3072),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Time Logs (for billing)
create table time_logs (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references complaints(id),
  user_id uuid references users(id),
  activity text not null,
  duration_minutes integer not null,
  logged_at timestamp with time zone default now()
);

-- Audit Logs (GDPR compliance)
create table audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now()
);

-- Create indexes for vector search
create index knowledge_base_embedding_idx on knowledge_base 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

create index precedents_embedding_idx on precedents 
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Create function for vector similarity search (knowledge base)
create or replace function match_knowledge_base(
  query_embedding vector(3072),
  match_threshold float,
  match_count int
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

-- Create function for vector similarity search (precedents)
create or replace function match_precedents(
  query_embedding vector(3072),
  match_threshold float,
  match_count int
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

-- Enable Row Level Security
alter table organizations enable row level security;
alter table users enable row level security;
alter table complaints enable row level security;
alter table documents enable row level security;
alter table time_logs enable row level security;
alter table audit_logs enable row level security;

-- RLS Policies (Basic - customize based on your auth setup)
create policy "Users can view complaints in their organization"
  on complaints for select
  using (organization_id = (select organization_id from users where id = auth.uid()));

create policy "Users can insert complaints in their organization"
  on complaints for insert
  with check (organization_id = (select organization_id from users where id = auth.uid()));
```

## Step 3: Verify Setup

Run this test query in the SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('knowledge_base', 'precedents', 'complaints', 'documents');
```

You should see all 4 tables listed.

## Step 4: Process Knowledge Documents

Once the database is set up, run:

```bash
npx tsx scripts/process-knowledge-uploads.ts
```

This will upload all 81 documents (HMRC Charter, CRG guidance, precedents, and prompts) with OpenRouter embeddings!

---

## Troubleshooting

If you get errors about the `vector` extension:
1. Go to **Database** → **Extensions** in Supabase
2. Search for "vector" and enable it
3. Re-run the migration SQL

