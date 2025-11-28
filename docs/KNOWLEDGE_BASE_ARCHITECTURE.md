# Lightpoint Knowledge Base Architecture

**Last Updated:** November 2024  
**Version:** 1.0  
**Status:** Production

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Vector Database Configuration](#3-vector-database-configuration)
4. [Content Structure](#4-content-structure)
5. [Embedding Pipeline](#5-embedding-pipeline)
6. [Search & Retrieval](#6-search--retrieval)
7. [AI Analysis Pipeline](#7-ai-analysis-pipeline)
8. [Prompt Library](#8-prompt-library)
9. [Performance Benchmarks](#9-performance-benchmarks)
10. [Improvement Roadmap](#10-improvement-roadmap)

---

## 1. Executive Summary

### Current State (November 2024)

| Metric | Value | Status |
|--------|-------|--------|
| **Total Documents** | 446 | ✅ Good corpus |
| **Embedding Coverage** | 100% | ✅ Complete |
| **Categories** | 9 | ✅ Comprehensive |
| **Avg Content Length** | 5,412 chars | ✅ Substantial |
| **Vector Dimensions** | 1,536 | ✅ HNSW compatible |
| **Index Type** | HNSW | ✅ Fast recall |

### Key Technologies

- **Database:** Supabase (PostgreSQL + pgvector)
- **Embedding Model:** OpenAI `text-embedding-3-large` @ 1536 dimensions
- **Vector Index:** HNSW (Hierarchical Navigable Small World)
- **Search:** Cosine similarity with optional reranking
- **LLM Stack:** Claude Sonnet 4.5 (analysis) + Claude Opus 4.1 (generation)

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LIGHTPOINT KNOWLEDGE SYSTEM                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   SOURCES    │    │  INGESTION   │    │   STORAGE    │                   │
│  ├──────────────┤    ├──────────────┤    ├──────────────┤                   │
│  │ • CHG Manual │───▶│ • Chunking   │───▶│ • Supabase   │                   │
│  │ • CRG Manual │    │ • Embedding  │    │ • pgvector   │                   │
│  │ • Charter    │    │ • Metadata   │    │ • HNSW Index │                   │
│  │ • Precedents │    │ • Validation │    │              │                   │
│  │ • LLM Prompts│    └──────────────┘    └──────────────┘                   │
│  └──────────────┘                               │                            │
│                                                 ▼                            │
│                              ┌──────────────────────────────────┐            │
│                              │         RETRIEVAL LAYER          │            │
│                              ├──────────────────────────────────┤            │
│                              │ • Vector similarity search       │            │
│                              │ • Multi-angle query expansion    │            │
│                              │ • Category-filtered search       │            │
│                              │ • Cohere/Voyage reranking        │            │
│                              │ • Redis caching                  │            │
│                              └──────────────────────────────────┘            │
│                                                 │                            │
│                                                 ▼                            │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         AI PROCESSING PIPELINE                        │   │
│  ├──────────────────────────────────────────────────────────────────────┤   │
│  │                                                                       │   │
│  │  DOCUMENT ANALYSIS          LETTER GENERATION                        │   │
│  │  ┌─────────────────┐        ┌─────────────────┐                      │   │
│  │  │ Stage 1: Parse  │        │ Stage 1: Facts  │ ← Sonnet 4.5         │   │
│  │  │ (Sonnet 4.5)    │        │ (Extract data)  │                      │   │
│  │  └────────┬────────┘        └────────┬────────┘                      │   │
│  │           ▼                          ▼                               │   │
│  │  ┌─────────────────┐        ┌─────────────────┐                      │   │
│  │  │ Stage 2: Combine│        │ Stage 2: Struct │ ← Opus 4.1           │   │
│  │  │ (Aggregate)     │        │ (Letter format) │                      │   │
│  │  └────────┬────────┘        └────────┬────────┘                      │   │
│  │           ▼                          ▼                               │   │
│  │  ┌─────────────────┐        ┌─────────────────┐                      │   │
│  │  │ Analysis Output │        │ Stage 3: Tone   │ ← Opus 4.1           │   │
│  │  │ + KB Context    │        │ (Professional)  │                      │   │
│  │  └─────────────────┘        └─────────────────┘                      │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Vector Database Configuration

### Schema Definition

```sql
-- Knowledge Base Table
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT,
  embedding VECTOR(1536),  -- HNSW compatible
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Precedents Table
CREATE TABLE precedents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_type TEXT,
  issue_category TEXT,
  outcome TEXT,
  resolution_time_days INTEGER,
  compensation_amount DECIMAL,
  key_arguments TEXT[],
  effective_citations TEXT[],
  embedding VECTOR(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Index Configuration

```sql
-- HNSW indexes for fast approximate nearest neighbor search
CREATE INDEX knowledge_base_embedding_hnsw_idx 
  ON knowledge_base 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE INDEX precedents_embedding_hnsw_idx 
  ON precedents 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

### Why 1,536 Dimensions (Not 3,072)?

| Factor | 3,072 dims | 1,536 dims |
|--------|------------|------------|
| **Quality** | 100% | ~98% (Matryoshka) |
| **HNSW Compatible** | ❌ No (max 2,000) | ✅ Yes |
| **Storage** | 2x larger | 1x |
| **Search Speed** | Slower | Faster |
| **Index Support** | IVFFlat only | HNSW supported |

**Decision:** Use 1,536 dimensions with `text-embedding-3-large` (Matryoshka representation) for HNSW compatibility while retaining ~98% of full quality.

---

## 4. Content Structure

### Category Distribution (Current)

| Category | Documents | Avg Length | Purpose |
|----------|-----------|------------|---------|
| **CRG** | 174 | 2,990 chars | Complaints Resolution Guidance |
| **CHG** | 64 | 3,204 chars | Complaint Handling Guidance |
| **SAM** | 62 | 1,139 chars | Self Assessment Manual |
| **Precedents** | 60 | 21,893 chars | Successful complaint examples |
| **CH** | 30 | 481 chars | Compliance Handbook (penalties) |
| **HMRC Charter** | 21 | 7,239 chars | Taxpayer rights & standards |
| **DMBM** | 16 | 246 chars | Debt Management |
| **ARTG** | 13 | 448 chars | Appeals & Tribunal |
| **LLM Prompts** | 6 | 21,339 chars | System prompts (internal) |

### Content Types

1. **HMRC Manuals** - Official guidance (CRG, CHG, CH, SAM, DMBM, ARTG)
2. **Charter Standards** - Service commitments HMRC must meet
3. **Precedents** - Historical successful complaints with outcomes
4. **LLM Prompts** - Internal system prompts for AI operations

---

## 5. Embedding Pipeline

### Configuration

```typescript
// lib/config/embeddingConfig.ts

export const EMBEDDING_CONFIG = {
  primary: {
    model: 'text-embedding-3-large',
    provider: 'openai',
    dimensions: 1536,  // Reduced from 3072 for HNSW
    maxTokens: 8191,
    maxChars: 30000,
    costPer1M: 0.13,
    notes: 'Best quality at HNSW-compatible dimensions',
  },
  
  small: {
    model: 'text-embedding-3-small',
    provider: 'openai',
    dimensions: 1536,
    costPer1M: 0.02,
    notes: '6.5x cheaper, ~90% quality',
  },
  
  legal: {
    model: 'voyage-law-2',
    provider: 'voyage',
    dimensions: 1024,
    costPer1M: 0.12,
    notes: 'Legal-tuned (future use)',
  },
};
```

### Embedding Flow

```
Document → Truncate (30K chars) → OpenRouter API → text-embedding-3-large
                                        ↓
                               1536-dim vector
                                        ↓
                               Supabase INSERT
                                        ↓
                               HNSW index update
```

### Batch Processing

```typescript
// Batch embedding for large ingestion jobs
async function generateEmbeddingsBatch(
  texts: string[],
  batchSize: number = 100
): Promise<number[][]> {
  // Process in batches with 100ms delay between
  // Rate limiting to avoid API throttling
}
```

---

## 6. Search & Retrieval

### Search Functions

#### 1. Basic Vector Search

```sql
CREATE FUNCTION match_knowledge_base(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
) RETURNS TABLE (...) AS $$
  SELECT id, category, title, content, source,
         1 - (embedding <=> query_embedding) as similarity
  FROM knowledge_base
  WHERE 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
```

#### 2. Category-Filtered Search

```sql
CREATE FUNCTION match_knowledge_base_filtered(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  category_filter text[],
  document_type_filter text[],
  include_superseded boolean
) RETURNS TABLE (...);
```

#### 3. Multi-Angle Search (TypeScript)

```typescript
// lib/vectorSearch.ts

async function searchKnowledgeBaseMultiAngle(
  queryText: string,
  threshold: number = 0.75,
  matchCount: number = 10
) {
  // 1. Generate multiple query variations
  const queries = generateSearchQueries(queryText);
  
  // 2. Execute all searches in parallel
  const results = await Promise.all(
    queries.map(q => searchKnowledgeBase(q, threshold, matchCount * 3))
  );
  
  // 3. Deduplicate and merge
  const combined = deduplicateResults(results.flat());
  
  // 4. Rerank with Cohere/Voyage
  if (USE_RERANKING && combined.length > matchCount) {
    return await cohereRerank(queryText, combined, matchCount);
  }
  
  return combined.slice(0, matchCount);
}
```

### Query Expansion

```typescript
// Automatic query expansion based on content
const CATEGORY_KEYWORDS = {
  'DMBM': ['payment', 'debt', 'allocation', 'arrears', 'repayment'],
  'ARTG': ['appeal', 'tribunal', 'review', 'dispute', 'adjudicator'],
  'CH': ['penalty', 'compliance', 'reasonable excuse'],
  'SAM': ['self assessment', 'tax return', 'filing'],
  'EM': ['enquiry', 'investigation', 'check'],
  'CRG': ['complaint', 'reimbursement', 'compensation'],
  'Charter': ['charter', 'taxpayer rights', 'being responsive'],
  'CHG': ['complaint handling', 'tier 1', 'tier 2', 'escalation'],
};
```

### Caching (Redis)

```typescript
// 50% faster on cache hits
async function getCachedKnowledgeSearch(
  query: string,
  threshold: number,
  matchCount: number
): Promise<SearchResult[] | null>;

async function cacheKnowledgeSearch(
  query: string,
  threshold: number,
  matchCount: number,
  results: SearchResult[]
): Promise<void>;
```

---

## 7. AI Analysis Pipeline

### Document Analysis (2-Stage)

#### Stage 1: Individual Document Analysis

**Model:** Claude Sonnet 4.5 (1M context)  
**Temperature:** 0.3  
**Max Tokens:** 4,000

```typescript
// Extract structured data from each document
interface DocumentAnalysis {
  dates: Array<{ date: string; context: string }>;
  amounts: Array<{ amount: string; context: string }>;
  references: Array<{ type: string; value: string }>;
  correspondence: Array<{ from: string; to: string; date: string; summary: string }>;
  issues: string[];
  hmrcQuotes: string[];
  deadlines: Array<{ date: string; description: string }>;
  charterViolations: string[];
  summary: string;
}
```

#### Stage 2: Combined Analysis

```typescript
// Aggregate all document analyses
function combineDocumentAnalyses(
  analyses: DocumentAnalysis[],
  complaintContext: string
): string {
  // Merge: dates, amounts, references, correspondence
  // Deduplicate: issues, charterViolations
  // Build comprehensive context string
}
```

### Letter Generation (3-Stage)

#### Stage 1: Extract Facts

**Model:** Claude Sonnet 4.5  
**Temperature:** 0.2  
**Max Tokens:** 2,500 (optimized from 3,000)

**Purpose:** Extract pure factual data without tone

#### Stage 2: Structure Letter

**Model:** Claude Opus 4.1  
**Temperature:** 0.2  
**Max Tokens:** 2,500 (optimized from 3,000)

**Purpose:** Organize facts into professional letter structure

#### Stage 3: Add Professional Tone

**Model:** Claude Opus 4.1  
**Temperature:** 0.3  
**Max Tokens:** 3,500 (optimized from 4,000)

**Purpose:** Transform into firm but professional language

### Cost & Performance

| Metric | Before Optimization | After Optimization |
|--------|--------------------|--------------------|
| **Total Tokens** | 10,000 | 8,500 |
| **Cost per Letter** | ~$0.93 | ~$0.80 (-15%) |
| **Generation Time** | ~270-360s | ~242-332s (-28s) |
| **Quality** | 100% | 100% (maintained) |

---

## 8. Prompt Library

### Stored in Database

All prompts are versioned and stored in `ai_prompts` table:

```sql
CREATE TABLE ai_prompts (
  id UUID PRIMARY KEY,
  prompt_key TEXT UNIQUE,       -- 'analysis_main', 'letter_stage_1_facts', etc.
  prompt_name TEXT,
  prompt_category TEXT,         -- 'analysis', 'letter_generation', 'knowledge_comparison'
  system_prompt TEXT,
  user_prompt_template TEXT,
  model_name TEXT,
  temperature FLOAT,
  max_tokens INTEGER,
  version INTEGER,
  is_custom BOOLEAN,
  -- Version history tracked in ai_prompt_history
);
```

### Current Prompts

| Key | Name | Model | Category |
|-----|------|-------|----------|
| `analysis_main` | Main Complaint Analysis | Sonnet 4.5 | analysis |
| `letter_stage_1_facts` | Extract Facts | Haiku 4.5 | letter_generation |
| `letter_stage_2_structure` | Structure Letter | Sonnet 4.5 | letter_generation |
| `letter_stage_3_tone` | Professional Tone | Opus 4.1 | letter_generation |
| `knowledge_comparison` | KB Document Comparison | Sonnet 4.5 | knowledge_comparison |

### Prompt Version Control

```sql
-- Automatic history on update
CREATE TRIGGER trigger_save_prompt_history
  BEFORE UPDATE ON ai_prompts
  FOR EACH ROW
  EXECUTE FUNCTION save_prompt_history();
```

---

## 9. Performance Benchmarks

### Current Metrics (Baseline - November 2024)

#### Embedding Performance

| Metric | Value |
|--------|-------|
| Single embedding | ~200-400ms |
| Batch (100 docs) | ~2-3s |
| Cost per 1M tokens | $0.13 |

#### Search Performance

| Metric | Value |
|--------|-------|
| Vector search (uncached) | ~100-200ms |
| Vector search (cached) | ~5-20ms |
| Multi-angle search | ~300-500ms |
| With reranking | ~500-800ms |

#### Analysis Performance

| Stage | Time | Tokens |
|-------|------|--------|
| Document parse | ~10-15s | 4,000 |
| Combined analysis | N/A | N/A |
| Letter Stage 1 | ~40-60s | 2,500 |
| Letter Stage 2 | ~50-70s | 2,500 |
| Letter Stage 3 | ~60-90s | 3,500 |
| **Total Letter** | ~150-220s | 8,500 |

### Quality Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Embedding coverage | 100% | ✅ 100% |
| Search relevance (top-5) | >80% | TBD |
| Letter accuracy | >95% | TBD |
| CHG citation accuracy | >90% | TBD |

---

## 10. Improvement Roadmap

### Phase 1: Measurement (Q4 2024)

- [ ] Implement search relevance scoring
- [ ] Add letter quality metrics
- [ ] Create benchmark test suite
- [ ] Track query patterns

### Phase 2: Content Expansion (Q1 2025)

- [ ] Add more DMBM content (currently 16 docs, 246 avg chars)
- [ ] Add more ARTG content (currently 13 docs, 448 avg chars)
- [ ] Add more CH content (currently 30 docs, 481 avg chars)
- [ ] Expand precedent library

### Phase 3: Search Enhancement (Q1 2025)

- [ ] Implement hybrid search (vector + keyword)
- [ ] Add query understanding layer
- [ ] Improve category routing
- [ ] Add semantic chunking

### Phase 4: Model Optimization (Q2 2025)

- [ ] Evaluate voyage-law-2 for legal content
- [ ] Test smaller models for cost reduction
- [ ] Implement model routing based on task
- [ ] Add streaming for faster UX

### Phase 5: Advanced Features (Q2 2025)

- [ ] Multi-document reasoning
- [ ] Citation verification
- [ ] Automated quality scoring
- [ ] A/B testing framework for prompts

---

## Appendix A: SQL Health Check Queries

```sql
-- Document counts
SELECT 
  'Total Documents' as metric, COUNT(*) as value
FROM knowledge_base
UNION ALL
SELECT 'With Embeddings', COUNT(*) FROM knowledge_base WHERE embedding IS NOT NULL
UNION ALL
SELECT 'Missing Embeddings', COUNT(*) FROM knowledge_base WHERE embedding IS NULL;

-- Category distribution
SELECT 
  COALESCE(category, 'Uncategorized') as category,
  COUNT(*) as documents,
  ROUND(AVG(LENGTH(content))) as avg_content_length
FROM knowledge_base
GROUP BY category
ORDER BY documents DESC;

-- Embedding dimensions check
SELECT 
  vector_dims(embedding) as dimensions,
  COUNT(*) as document_count
FROM knowledge_base
WHERE embedding IS NOT NULL
GROUP BY vector_dims(embedding);

-- Search functions check
SELECT routine_name, 'EXISTS' as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('match_knowledge_base', 'match_knowledge_base_filtered', 'match_precedents');
```

---

## Appendix B: File Locations

| Component | Path |
|-----------|------|
| Embedding config | `lib/config/embeddingConfig.ts` |
| Embedding functions | `lib/embeddings.ts` |
| Vector search | `lib/vectorSearch.ts` |
| Context manager | `lib/contextManager.ts` |
| Document analysis | `lib/documentAnalysis.ts` |
| Letter generation | `lib/openrouter/three-stage-client.ts` |
| KB chat | `lib/knowledgeBaseChat.ts` |
| Schema migrations | `supabase/migrations/` |
| Health check SQL | `supabase/KNOWLEDGE_BASE_HEALTH_CHECK.sql` |
| Test suite | `scripts/test-knowledge-base.ts` |

---

## Appendix C: Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENROUTER_API_KEY=xxx

# Optional (for reranking)
COHERE_API_KEY=xxx
VOYAGE_API_KEY=xxx

# Optional (for caching)
REDIS_URL=redis://xxx
```

---

*Document maintained by Lightpoint Engineering Team*

