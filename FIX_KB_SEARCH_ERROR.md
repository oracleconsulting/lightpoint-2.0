# 🔧 LIGHTPOINT V2.0 - FIX KNOWLEDGE BASE SEARCH ERROR

**Error:** "Analysis failed: Failed to search knowledge base"  
**Status:** ✅ SOLUTION IDENTIFIED  
**Priority:** 🚨 CRITICAL - Blocks complaint analysis

---

## 🎯 ROOT CAUSE

The error is thrown from `lib/vectorSearch.ts:173` when the Supabase `match_knowledge_base` function fails.

**Most likely cause:** The vector search function wasn't created in the v2.0 Supabase database.

---

## ✅ SOLUTION: Run This SQL in Supabase

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Select project: **obcbbwwszkrcjwvzqvms**
3. Click "SQL Editor"

### Step 2: Create Vector Search Functions

Run this complete SQL:

```sql
-- ============================================
-- LIGHTPOINT V2.0 - FIX VECTOR SEARCH
-- ============================================

-- Drop existing functions if they exist (in case of updates)
DROP FUNCTION IF EXISTS match_knowledge_base(vector(1536), float, int);
DROP FUNCTION IF EXISTS match_precedents(vector(1536), float, int);
DROP FUNCTION IF EXISTS match_complaint_documents(uuid, vector(1536), float, int);

-- ============================================
-- 1. Knowledge Base Search Function
-- ============================================
CREATE OR REPLACE FUNCTION match_knowledge_base(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  category text,
  title text,
  content text,
  source text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    category,
    title,
    content,
    source,
    metadata,
    1 - (knowledge_base.embedding <=> query_embedding) as similarity
  FROM knowledge_base
  WHERE 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_base.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================
-- 2. Precedents Search Function
-- ============================================
CREATE OR REPLACE FUNCTION match_precedents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  complaint_type text,
  issue_category text,
  outcome text,
  resolution_time_days integer,
  compensation_amount numeric,
  key_arguments text[],
  effective_citations text[],
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    id,
    complaint_type,
    issue_category,
    outcome,
    resolution_time_days,
    compensation_amount,
    key_arguments,
    effective_citations,
    metadata,
    1 - (precedents.embedding <=> query_embedding) as similarity
  FROM precedents
  WHERE 1 - (precedents.embedding <=> query_embedding) > match_threshold
  ORDER BY precedents.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================
-- 3. Document Search Function (within complaint)
-- ============================================
CREATE OR REPLACE FUNCTION match_complaint_documents(
  p_complaint_id uuid,
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  filename text,
  document_type text,
  sanitized_text text,
  document_date date,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    d.id,
    d.filename,
    d.document_type,
    d.sanitized_text,
    d.document_date,
    1 - (d.embedding <=> query_embedding) as similarity
  FROM documents d
  WHERE 
    d.complaint_id = p_complaint_id
    AND d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- ============================================
-- 4. Verify Functions Created
-- ============================================
SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE 'match_%'
ORDER BY routine_name;

-- Should show:
-- match_complaint_documents | FUNCTION
-- match_knowledge_base      | FUNCTION  
-- match_precedents          | FUNCTION

-- ============================================
-- 5. Verify Data Exists
-- ============================================
SELECT 
  'knowledge_base' as table_name,
  COUNT(*) as rows,
  COUNT(embedding) as with_embeddings
FROM knowledge_base
UNION ALL
SELECT 
  'precedents',
  COUNT(*),
  COUNT(embedding)
FROM precedents;

-- Should show:
-- knowledge_base | 310+ | 310+
-- precedents     | 1+   | 1+

-- ============================================
-- ✅ ALL DONE!
-- ============================================
```

### Step 3: Verify Fix Worked

After running the SQL:

1. **In Supabase Dashboard:**
   - Database → Functions
   - Should see: `match_knowledge_base`, `match_precedents`, `match_complaint_documents`

2. **Test on lightpoint.uk:**
   - Go to a complaint
   - Click "Analyze" (analyzing status)
   - Should now complete without error
   - Charter & CRG Violations should populate

---

## 🔍 DIAGNOSTIC: If Still Failing

### Check 1: pgvector Extension

```sql
-- Verify pgvector is installed
SELECT * FROM pg_extension WHERE extname = 'vector';
-- If empty, install it:
CREATE EXTENSION IF NOT EXISTS vector;
```

### Check 2: Embeddings Exist

```sql
-- Check if knowledge base has embeddings
SELECT 
  COUNT(*) as total_rows,
  COUNT(embedding) as rows_with_embeddings,
  COUNT(*) - COUNT(embedding) as missing_embeddings
FROM knowledge_base;
```

If missing_embeddings > 0, you need to regenerate embeddings (separate process).

### Check 3: Function Permissions

```sql
-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_knowledge_base TO authenticated;
GRANT EXECUTE ON FUNCTION match_precedents TO authenticated;
GRANT EXECUTE ON FUNCTION match_complaint_documents TO authenticated;

GRANT EXECUTE ON FUNCTION match_knowledge_base TO anon;
GRANT EXECUTE ON FUNCTION match_precedents TO anon;
GRANT EXECUTE ON FUNCTION match_complaint_documents TO anon;
```

---

## 🎯 EXPECTED RESULT

After running the SQL:

**Before:**
```
lightpoint.uk says: Analysis failed: Failed to search knowledge base
```

**After:**
```
✅ Analysis completes successfully
✅ Charter & CRG Violations populate
✅ Recommended Actions show
✅ Letter generation works
```

---

## 📋 VERIFICATION CHECKLIST

- [ ] SQL functions created in Supabase
- [ ] Functions visible in Database → Functions
- [ ] `knowledge_base` table has 310+ rows with embeddings
- [ ] Test complaint analysis on lightpoint.uk
- [ ] Analysis completes without errors
- [ ] Violations section populates
- [ ] Can generate complaint letter

---

## 🔄 IF EMBEDDINGS ARE MISSING

If the knowledge base has rows but no embeddings:

```sql
-- Check embedding status
SELECT 
  category,
  COUNT(*) as docs,
  COUNT(embedding) as with_embeddings
FROM knowledge_base
GROUP BY category;
```

If embeddings are missing, you'll need to run the embedding generation script (which requires OpenAI API calls).

---

## ⚡ QUICK FIX SCRIPT

Copy this entire block into Supabase SQL Editor and click "Run":

```sql
-- QUICK FIX: Create all vector search functions
CREATE OR REPLACE FUNCTION match_knowledge_base(query_embedding vector(1536), match_threshold float DEFAULT 0.7, match_count int DEFAULT 10) RETURNS TABLE (id uuid, category text, title text, content text, source text, metadata jsonb, similarity float) LANGUAGE sql STABLE AS $$ SELECT id, category, title, content, source, metadata, 1 - (knowledge_base.embedding <=> query_embedding) as similarity FROM knowledge_base WHERE 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold ORDER BY knowledge_base.embedding <=> query_embedding LIMIT match_count; $$;

CREATE OR REPLACE FUNCTION match_precedents(query_embedding vector(1536), match_threshold float DEFAULT 0.7, match_count int DEFAULT 10) RETURNS TABLE (id uuid, complaint_type text, issue_category text, outcome text, resolution_time_days integer, compensation_amount numeric, key_arguments text[], effective_citations text[], metadata jsonb, similarity float) LANGUAGE sql STABLE AS $$ SELECT id, complaint_type, issue_category, outcome, resolution_time_days, compensation_amount, key_arguments, effective_citations, metadata, 1 - (precedents.embedding <=> query_embedding) as similarity FROM precedents WHERE 1 - (precedents.embedding <=> query_embedding) > match_threshold ORDER BY precedents.embedding <=> query_embedding LIMIT match_count; $$;

SELECT 'Functions created!' as status;
```

---

**Status:** 🔧 Ready to fix  
**Time:** 5 minutes  
**Impact:** 🚨 Critical - unblocks all complaint analysis

