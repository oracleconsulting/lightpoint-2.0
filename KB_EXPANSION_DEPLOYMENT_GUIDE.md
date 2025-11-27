# Knowledge Base Expansion - Deployment Guide

## Overview

This implementation expands Lightpoint's knowledge base to support HMRC internal manuals, with infrastructure ready for tribunal case law and legislation.

## What Was Implemented

### 1. Database Schema Updates

**File:** `supabase/migrations/006_knowledge_base_expansion.sql`

- Added verification fields: `source_url`, `source_verified_at`, `verification_status`
- Added hierarchy fields: `section_reference`, `manual_code`, `parent_section`, `breadcrumb`
- Added metadata fields: `effective_from`, `superseded_at`, `last_checked_at`, `citation_format`, `document_type`
- Upgraded vector index from IVFFlat to **HNSW** (better recall at scale)
- Created `match_knowledge_base_filtered` RPC function for category-filtered search
- Created `knowledge_ingestion_log` table for audit trail

### 2. Embedding Configuration

**File:** `lib/config/embeddingConfig.ts`

- Configured **text-embedding-3-large** (3072 dimensions) as primary model
- Aligns with schema expectation of VECTOR(3072)
- Includes cost-efficient and legal-tuned alternatives

### 3. Updated Embeddings Module

**File:** `lib/embeddings.ts`

- Switched to text-embedding-3-large (3072 dimensions)
- Added batch embedding with rate limiting
- Support for multiple providers (OpenAI via OpenRouter, Voyage)

### 4. HMRC Manual Ingestion Pipeline

**Files:**
- `lib/ingestion/types.ts` - Type definitions and manual configs
- `lib/ingestion/hmrcManualCrawler.ts` - GOV.UK crawler with rate limiting
- `lib/ingestion/hmrcChunking.ts` - Section-aware chunking
- `lib/ingestion/hmrcIngestionService.ts` - Orchestration service
- `lib/ingestion/index.ts` - Module exports

**Features:**
- Crawls HMRC manuals from GOV.UK
- Preserves section hierarchy in chunks
- Includes contextual embedding text (breadcrumbs, manual code)
- Incremental updates (only changed content re-embedded)
- Full audit trail via ingestion log

### 5. Admin API Route

**File:** `app/api/admin/ingest-hmrc-manuals/route.ts`

Endpoints:
- `POST /api/admin/ingest-hmrc-manuals` - Trigger ingestion
- `GET /api/admin/ingest-hmrc-manuals` - Get status and available manuals

### 6. Enhanced Vector Search

**File:** `lib/vectorSearch.ts`

- Added `searchKnowledgeBaseFiltered()` for category filtering
- Added `searchKnowledgeBaseSmart()` for auto-routing based on query content
- Added `searchKnowledgeBaseMultiAngleFiltered()` for comprehensive search
- Smart category detection based on keywords

### 7. Test Script

**File:** `scripts/test-ingestion.ts`

Tests ingestion and search functionality.

---

## Deployment Steps

### Step 1: Apply Database Migration

Run in Supabase SQL Editor or via migration:

```sql
-- Navigate to Supabase dashboard > SQL Editor
-- Paste contents of: supabase/migrations/006_knowledge_base_expansion.sql
-- Click "Run"
```

**Important:** The migration is non-destructive. It adds columns and indexes without modifying existing data.

### Step 2: Install Dependencies

```bash
cd lightpoint-2.0
npm install cheerio  # For HTML parsing (if not already installed)
```

### Step 3: Environment Variables

Ensure these are set in `.env.local` or Railway/Vercel:

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENROUTER_API_KEY=your_openrouter_key

# Optional (for legal-tuned embeddings)
VOYAGE_API_KEY=your_voyage_key

# Optional (for admin API authentication)
ADMIN_API_KEY=your_custom_admin_key
```

### Step 4: Deploy Application

```bash
# Standard deployment
git add .
git commit -m "feat: Knowledge base expansion with HMRC manual ingestion"
git push origin main
```

### Step 5: Run Initial Ingestion

After deployment, trigger HMRC manual ingestion:

```bash
# Ingest single manual (recommended to start)
curl -X POST https://your-app.com/api/admin/ingest-hmrc-manuals \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"manualCode": "DMBM"}'

# Ingest all manuals (will take 30-60 minutes)
curl -X POST https://your-app.com/api/admin/ingest-hmrc-manuals \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

### Step 6: Verify

Check ingestion status:

```bash
curl https://your-app.com/api/admin/ingest-hmrc-manuals \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

Test search:

```bash
# In the application, test a query like:
# "payment allocation oldest debt first"
# Should return DMBM sections
```

---

## HMRC Manuals Available

| Code | Name | Priority |
|------|------|----------|
| DMBM | Debt Management and Banking Manual | 1 (Highest) |
| ARTG | Appeals Reviews and Tribunals Guidance | 1 |
| CH | Compliance Handbook | 2 |
| SAM | Self Assessment Manual | 2 |
| EM | Enquiry Manual | 2 |
| PAYE | PAYE Manual | 3 |

---

## How Category Routing Works

The smart search automatically routes queries to relevant categories:

| Query Keywords | Categories Searched |
|----------------|---------------------|
| payment, debt, allocation | DMBM + CRG + Charter |
| penalty, reasonable excuse | CH + CRG + Charter |
| appeal, tribunal, review | ARTG + CRG + Charter |
| delay, delayed | CRG + Charter |
| tier 1, tier 2, escalation | CHG + CRG + Charter |

If no specific keywords detected, all categories are searched.

---

## Monitoring

### Ingestion Logs

Check `knowledge_ingestion_log` table for:
- Ingestion run times
- Sections added/updated/unchanged
- Error counts

### Cache Performance

Redis caching is automatic. Monitor cache hit rates in logs:
```
✅ Using cached knowledge base results
```

### Vector Search Performance

HNSW index provides O(log n) search performance. Monitor for:
- Search latency > 2 seconds (may need index tuning)
- Low similarity scores (may need threshold adjustment)

---

## Troubleshooting

### "match_knowledge_base_filtered is not a function"

The migration hasn't been run. Apply `006_knowledge_base_expansion.sql`.

### Ingestion fails with rate limiting

GOV.UK may rate limit aggressive crawling. The crawler uses 250ms delays between requests. If issues persist, increase `RATE_LIMIT_MS` in `hmrcManualCrawler.ts`.

### Embedding dimension mismatch

If you see errors about vector dimensions, ensure:
1. `006_knowledge_base_expansion.sql` has been run (updates RPC functions)
2. No cached embeddings from old model (clear Redis cache)

### Low search relevance

1. Check embeddings are using text-embedding-3-large (3072 dims)
2. Verify content is being indexed (check `knowledge_base` table)
3. Consider lowering threshold from 0.7 to 0.6

---

## Future Enhancements

### Ready for Implementation

The types and infrastructure are in place for:

1. **Tribunal Case Law** (`TribunalConfig`, `TribunalCase` types)
   - FTT/UT decisions from BAILII
   - Key principles extraction

2. **Legislation** (`LegislationConfig`, `LegislationSection` types)
   - Finance Acts, TMA 1970, VATA 1994
   - Section-level ingestion

### Recommended Next Steps

1. Run full ingestion of priority 1 manuals (DMBM, ARTG)
2. Monitor search quality with real complaints
3. Add tribunal case law ingestion
4. Set up scheduled re-ingestion (monthly)

---

## Files Changed/Created

### New Files
- `lib/config/embeddingConfig.ts`
- `lib/ingestion/types.ts`
- `lib/ingestion/hmrcManualCrawler.ts`
- `lib/ingestion/hmrcChunking.ts`
- `lib/ingestion/hmrcIngestionService.ts`
- `lib/ingestion/index.ts`
- `app/api/admin/ingest-hmrc-manuals/route.ts`
- `scripts/test-ingestion.ts`
- `supabase/migrations/006_knowledge_base_expansion.sql`

### Modified Files
- `lib/embeddings.ts` - Updated to use text-embedding-3-large
- `lib/vectorSearch.ts` - Added category filtering and smart routing

---

*Last Updated: November 2025*

