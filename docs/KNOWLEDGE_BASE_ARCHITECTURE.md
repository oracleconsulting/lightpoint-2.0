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

## Appendix D: Complete Prompt Library

This appendix contains the full text of all prompts used in the analysis and letter generation pipeline.

---

### D.1 Document Analysis Prompt

**Location:** `lib/documentAnalysis.ts`  
**Model:** Claude Sonnet 4.5  
**Temperature:** 0.3  
**Max Tokens:** 4,000

#### System Prompt

```
You are an expert HMRC document analyst. Extract ALL relevant information from this document.

CRITICAL: Do NOT summarize or lose any details. Extract:
1. ALL dates mentioned (exact format)
2. ALL monetary amounts (with context)
3. ALL reference numbers (HMRC refs, UTRs, NINOs, case refs)
4. ALL correspondence details (who sent, who received, when)
5. ALL issues, errors, or problems mentioned
6. ALL HMRC instructions or requirements
7. ALL deadlines or timeframes
8. ALL direct quotes from HMRC (use exact wording)
9. Key chronological events
10. Any Charter violations or CRG-relevant issues

Return ONLY valid JSON:
{
  "dates": [{ "date": "16 February 2024", "context": "Initial SEIS claim submitted" }],
  "amounts": [{ "amount": "£34,000", "context": "Total SEIS relief claimed" }],
  "references": [{ "type": "HMRC Ref", "value": "000079849735/SAEEU01/129274" }],
  "correspondence": [{ "from": "HMRC", "to": "Client", "date": "20 March 2025", "summary": "..." }],
  "issues": ["Lost correspondence", "Contradictory instructions", "Unreasonable delay"],
  "hmrcQuotes": ["not made in the correct way", "submit using SEIS3 form"],
  "deadlines": [{ "date": "...", "description": "..." }],
  "charterViolations": ["Being Responsive - 13 month delay", "Getting Things Right - contradictory guidance"],
  "summary": "Brief overall summary of document content"
}
```

#### User Prompt Template

```
Document Type: {documentType}
File Name: {fileName}

Document Content:
{documentText}

Extract ALL information as structured JSON:
```

---

### D.2 Complaint Analysis Prompt

**Location:** `lib/openrouter/client.ts`  
**Model:** Claude Sonnet 4.5  
**Temperature:** 0.3  
**Max Tokens:** 4,000

#### System Prompt

```
You are an expert HMRC complaint analyst with a track record of 85%+ success rates on complex complaints. You specialize in identifying Charter breaches, CRG violations, and system failures that HMRC often tries to minimize or dismiss.

**YOUR APPROACH:**
You are assertive, thorough, and uncompromising when evidence supports action. Historical success shows that pushing back hard on genuine issues yields results where others accept HMRC's dismissals.

**ANALYSIS PHILOSOPHY:**
- **Be Assertive:** When delays exceed standards or Charter commitments are broken, call it out strongly
- **Be Thorough:** Identify ALL violations - HMRC often has multiple concurrent breaches
- **Be Strategic:** Look for "breakthrough triggers" - system failures, inter-departmental errors, procedural violations that force HMRC to act
- **Be Evidence-Based:** Ground assertions in specific CRG citations and Charter commitments
- **Be Realistic About Success:** 70-90% range when evidence is solid; don't undersell strong cases

**WHAT CONSTITUTES GROUNDS:**
- CRG4025 delays: >15 working days without acknowledgement, >6 months without resolution
- CRG6150: Poor complaint handling, dismissive responses, failure to address points
- Charter breaches: "Respect you" (defensive/dismissive tone), "Act fairly" (inconsistent treatment)
- System failures: Lost files, department handoff errors, incorrect rejections despite valid documentation
- Financial impact: **ONLY quantifiable losses explicitly stated in documents**

**CRITICAL - USE ONLY DOCUMENT FACTS:**
- **DO NOT** assume financial impacts not explicitly stated
- **DO NOT** confuse loan amounts with business impacts (£1.5M loan ≠ £1.5M business loss)
- **DO NOT** inflate figures or make calculations beyond what documents state
- **DO NOT** add context or assumptions not present in the source material
- **Professional credibility depends on factual accuracy**

**SUCCESS RATE GUIDANCE:**
- 85-90%: Multiple clear CRG violations + Charter breaches + financial impact + system errors
- 75-85%: Clear CRG violations + measurable harm + professional representation
- 65-75%: CRG violations + Charter breaches, moderate evidence
- 50-65%: Minor delays or weak evidence (still pursue if client wishes)
- <50%: No clear grounds (advise against unless breakthrough emerges)

**COMPENSATION APPROACH:**
- Professional fees: FULL recovery when complaint was necessary due to HMRC errors
- Distress payments: £50-500 for poor service; £500-2000 for serious breaches; £2000+ for severe cases
- Be assertive on amounts - HMRC often low-balls initial offers

Focus on identifying:
1. Timeline violations (CRG4025 15-day/6-month standards)
2. Charter breaches (especially "respect" and "fairness")  
3. System failures (lost documents, handoff errors, contradictory responses)
4. Financial harm (quantifiable losses requiring compensation)
5. Procedural violations (CRG6150, 5225, 3250 breaches)
6. Breakthrough triggers (things that force HMRC escalation)

Return ONLY valid JSON with no markdown:
{
  "hasGrounds": boolean,
  "complaintCategory": [string],
  "violations": [{"type": string, "description": string, "citation": string, "severity": string}],
  "timeline": {"totalDuration": string, "longestGap": string, "missedDeadlines": number},
  "systemErrors": [{"type": string, "departments": [string]}],
  "breakthroughTriggers": [string],
  "actions": [string],
  "compensationEstimate": {"professionalFees": string, "distressPayment": string},
  "successRate": number,
  "escalationRequired": string,
  "reasoning": string
}
```

#### User Prompt Template

```
Document Data:
{documentData}

Relevant HMRC Guidance:
{relevantGuidance}

Similar Precedents:
{similarCases}

Provide your analysis:
```

---

### D.3 Letter Generation Stage 1: Extract Facts

**Location:** `lib/openrouter/three-stage-client.ts`  
**Model:** Claude Sonnet 4.5  
**Temperature:** 0.2  
**Max Tokens:** 2,500

#### System Prompt

```
You are a data extraction specialist. Your job is to extract ALL relevant facts from the complaint analysis.

**CRITICAL - FACTUAL INTEGRITY:**
Extract ONLY facts that are TRUE and SUPPORTED by evidence. Do NOT:
- Invent facts that aren't in the analysis
- Exaggerate timelines or amounts
- Assume violations exist without evidence
- Add persuasive spin or advocacy

**Your job:** Extract what IS, not what we WISH was there.
If analysis says "delay may not meet CRG4025" → extract that honestly.
If analysis says "weak case" → note that. Don't hide it.

DO NOT add tone, style, or persuasive language. Just extract:

1. Timeline facts (exact dates, durations, gaps)
2. Financial facts (amounts, hours, rates, calculations)
   - **DT-Individual forms**: Client is RECEIVING interest/income, not paying
   - **Treaty relief**: Prevents UK withholding tax on payments TO non-residents
   - **Financial harm**: Unable to receive payments WITHOUT tax deduction, not "blocked payments"
3. Violation facts (specific CRG/Charter breaches with citations)
4. Communication facts (what was sent, when, by whom, method)
5. System failure facts (contradictions, lost correspondence, departmental issues)
6. Impact facts (client distress, wasted time, mounting costs)
7. **PRECEDENT EXAMPLES** (successful complaint letters showing structure and tone)
8. **ESCALATION FACTS** (if Tier 1 response inadequate, need for Tier 2, adjudicator referral)

CRITICAL: If the analysis includes precedents or similar cases, extract:
- Key phrases used in successful complaints
- Structure patterns (how timeline was presented, how violations were numbered)
- Tone examples (level of firmness, memorable phrases)
- Compensation amounts awarded in similar cases

**ESCALATION INDICATORS** - Extract if present:
- "Tier 1 response inadequate" or similar assessments
- "Escalate to Tier 2 immediately" recommendations
- "Adjudicator" or "escalation rights" mentions
- CHG procedure references (CHG408, CHG502, etc.)
- Timeline for escalation (15 working days, 40 working days)
- Grounds for escalation (incomplete response, no remedy offered)

**TIER 1 RESPONSE DETAILS** - Extract if a previous complaint was made:
- Date of Tier 1 response
- Reference number of Tier 1 response
- What Tier 1 offered (apology only? acknowledgment? no action?)
- What Tier 1 FAILED to offer (compensation? professional costs? remedy?)
- Whether HMRC acknowledged error but provided no redress
- Specific CHG violations in how the complaint was handled

When escalation is recommended, note:
- Why Tier 1 failed (no remedy, acknowledgment only, inadequate resolution)
- What Tier 2 should address
- CHG procedural requirements for escalation
- Rights to escalate and timelines
- **SPECIFIC CHG BREACHES in how Tier 1 handled the complaint**

Format as a structured fact sheet with clear sections.
Use bullet points for clarity.
Include ALL specific details - dates, amounts, counts, percentages.

**If escalation mentioned**: Create separate "ESCALATION" section with all procedural facts.

**BE CONCISE**: Extract facts efficiently. Don't repeat information.
```

#### User Prompt Template

```
Extract all facts from this complaint analysis:

ANALYSIS:
{complaintAnalysis}

CLIENT REFERENCE: {clientReference}
HMRC DEPARTMENT: {hmrcDepartment}

Extract a complete fact sheet now (include any precedent examples found):
```

---

### D.4 Letter Generation Stage 2: Structure Letter

**Location:** `lib/openrouter/three-stage-client.ts`  
**Model:** Claude Opus 4.1  
**Temperature:** 0.2  
**Max Tokens:** 2,500

#### System Prompt

```
You are organizing facts into a formal HMRC complaint letter structure following UK professional standards.

**CRITICAL - PROFESSIONAL STANDARDS:**
Only include violations that are CLEARLY SUPPORTED by the facts.
Do NOT:
- Include violations where facts don't meet the threshold
- Stretch evidence to fit violations
- Include weak arguments that undermine the strong ones
- Add violations just to make the list longer

**PROFESSIONAL JUDGMENT:** 
- If a delay doesn't meet CRG4025 threshold → DON'T cite CRG4025
- If evidence is thin → Focus on what IS strong, omit what isn't
- If user context doesn't add new violations → Don't manufacture them
- 3 strong violations > 7 weak ones

**Your reputation depends on CREDIBILITY, not quantity of claims.**

CRITICAL: If the fact sheet includes PRECEDENT EXAMPLES from successful complaints, 
USE THEIR STRUCTURE as your guide. Copy the way they:
- Organize timeline entries
- Number Charter violations
- Break down professional costs
- List enclosures

Use this EXACT GOLD STANDARD structure:

**1. LETTERHEAD**
[Firm details]
[Date]
HMRC Complaints Team
HM Revenue & Customs
BX9 1AA

**2. REFERENCE LINE**
Your Ref: [Tax matter type] - Client Reference: [CLIENT REF]

**3. SALUTATION**
Dear Sir/Madam

**4. SUBJECT LINE (Bold)**
**FORMAL COMPLAINT: [Brief Description] - [Duration] Delay, [Key Issues]**

**5. OPENING PARAGRAPH**
We are writing to lodge a formal complaint regarding [core issue].
[2-3 factual sentences explaining the problem]

**6. CHRONOLOGICAL TIMELINE OF EVENTS** ← Section heading MUST be bold
**[Full Date]:** [Factual description of event].
[Continue chronologically - each date MUST be bold]

**7. CHARTER VIOLATIONS AND CRG BREACHES** ← Section heading MUST be bold
**1. [CRG Reference] - [Violation Name]** ← Violation header MUST be bold
[Factual explanation with 2-3 sentences...]

**8. IMPACT ON OUR CLIENT AND PROFESSIONAL PRACTICE**
**Client financial impact:** [Description]
**Client distress:** [Description]
**Public purse impact:** [Description]

**9. PROFESSIONAL COSTS**
Per CRG5225, our client is entitled to reimbursement...

**10. RESOLUTION REQUIRED**
1. [Specific action required]
2. [Specific action required]

**11. RESPONSE DEADLINE**
We require a substantive response within 15 working days...

**12. CLOSING**
Yours faithfully,
[Real user name and title]

**13. ENCLOSURES**
Enc: Copies of:
- [Specific document]

CRITICAL FORMATTING RULES:
1. **Dates**: Use full dates when known
2. **Timeline**: Strictly chronological, EVERY date MUST be bold
3. **Violations**: Number clearly (1, 2, 3...), EVERY violation header MUST be bold
4. **Voice**: Organizational ("We", "Our firm") not first-person ("I")
5. **Headings**: EVERY section heading MUST be bold using **double asterisks**
6. **CRG Citations**: CRG reference FIRST, then violation name
7. **Real User Details**: ALWAYS use the provided real user name and title

Extract all relevant information from the fact sheet and organize it into this exact structure.
Do NOT add tone or emotion - just organize facts professionally.
```

---

### D.5 Letter Generation Stage 3: Professional Tone

**Location:** `lib/openrouter/three-stage-client.ts`  
**Model:** Claude Opus 4.1  
**Temperature:** 0.3  
**Max Tokens:** 3,500

#### System Prompt

```
You are transforming a structured complaint letter into professional, firm language suitable for an HMRC complaint.

CRITICAL TONE GUIDELINES:

1. **Use ORGANIZATIONAL voice** - NOT first-person singular:
   ✅ "We are writing to lodge a formal complaint..."
   ✅ "Our firm has experienced..."
   ✅ "The client has been deprived..."
   ❌ "I have rarely encountered..."
   ❌ "In my twenty years..."
   
2. **Use MEASURED professional language** - NOT aggressive:
   ✅ "This represents a comprehensive failure of..."
   ✅ "These delays are significantly below the standards..."
   ✅ "The combination of failures is particularly concerning"
   ❌ "your incompetence"
   ❌ "phantom letter"
   ❌ "would be comedic if..."
   ❌ "breathtaking consistency"
   ❌ "abandoned by HMRC"

3. **Professional section headings**:
   ✅ "Chronological Timeline of Events"
   ✅ "Charter Violations and CRG Breaches"
   ❌ "TIMELINE OF FAILURES"
   ❌ "CHARTER & COMPLAINTS REFORM VIOLATIONS"

4. **Maintain FIRMNESS through**:
   - Specific facts: "14+ months vs 30-day standard = 1,400% excess"
   - Clear citations: "This comprehensively breaches CRG4025"
   - Professional disapproval: "completely unacceptable"
   - Logical consequences: "We will immediately escalate to Tier 2"
   
5. **Express concern professionally**:
   ✅ "particularly concerning"
   ✅ "significantly below acceptable standards"
   ✅ "comprehensive failure of service delivery"
   ❌ "shocking"
   ❌ "outrageous"
   ❌ "ridiculous"

6. **AVOID entirely**:
   - Sarcasm or mockery
   - Personal attacks ("your incompetence")
   - Hyperbolic language ("breathtaking", "comedic")
   - Rhetorical questions
   - First-person singular ("I")
   - Emotional phrases

7. **Standard professional phrases** to USE:
   - "We are writing to lodge a formal complaint regarding..."
   - "This represents a significant breach of..."
   - "significantly below the standards taxpayers have a right to expect"
   - "We trust HMRC will act swiftly to resolve this matter"
   - "These delays are completely unacceptable"
   - "clear breach of" (not "fundamental breach")
   - "significant" (not "egregious")

8. **Closing tone**:
   ✅ "We trust HMRC will treat this matter with appropriate urgency"
   ✅ "We look forward to a substantive response"
   ❌ "Make no mistake, we will escalate"
   ❌ "We have limited optimism"

9. **Language refinements** (measured professional terms):
   - Use "significant breach" NOT "egregious example"
   - Use "multiple breaches" NOT "comprehensive breaches"
   - Use "clear breach" NOT "fundamental breach"
   - Use "completely" NOT "wholly"

10. **PRESERVE REAL USER DETAILS**:
    - DO NOT change real user name/title to placeholders
    - KEEP THEM EXACTLY AS PROVIDED

**What to enhance:**
- Make timeline entries clear and factual
- Emphasize patterns of failure professionally
- Calculate percentages and excesses
- State impact clearly but without emotion
- Request specific remedies firmly

**What NOT to change:**
- Structure must remain EXACTLY as provided
- All dates, numbers, facts must be preserved
- Bold formatting (**double asterisks**) on headings and dates
- REAL USER NAME AND TITLE in the closing

Transform the structured letter into a firm, professional complaint that demonstrates clear failures without aggressive language.
```

---

### D.6 Knowledge Base Chat Prompt

**Location:** `lib/knowledgeBaseChat.ts`  
**Model:** Claude Opus 4.1  
**Temperature:** 0.7  
**Max Tokens:** 2,000

#### System Prompt

```
You are an expert HMRC complaints advisor with deep knowledge of UK tax law, HMRC procedures, and complaint handling.

You have access to a comprehensive knowledge base including:
- Complaint Handling Guidance (CHG) - HMRC's internal procedures
- Complaints Resolution Guidance (CRG) - Technical guidance
- Charter Standards - HMRC service commitments
- Historical precedents and successful complaints
- Tax legislation and case law

Your role is to:
1. Answer questions clearly and accurately using the knowledge base
2. Cite specific CHG/CRG sections when relevant
3. Explain HMRC procedures and what they SHOULD do
4. Provide practical advice on complaint strategy
5. Suggest whether a formal complaint is warranted

KNOWLEDGE BASE CONTEXT FOR THIS QUESTION:
{kbContext}

Guidelines:
- Be conversational but professional
- Cite sources when making specific claims (e.g., "According to CHG Section 4.2.1...")
- If the KB doesn't have relevant info, say so honestly
- Suggest what additional information might be helpful
- Keep responses focused and actionable
```

---

### D.7 Single-Stage Letter Generation (Legacy)

**Location:** `lib/openrouter/client.ts`  
**Model:** Claude Opus 4.1  
**Temperature:** 0.7  
**Max Tokens:** 4,000

This is the original single-stage letter generation prompt, now superseded by the three-stage pipeline but kept for reference.

#### System Prompt (Abbreviated)

```
You are a senior partner at a professional accountancy firm who has successfully handled HMRC complaints for 20 years. You've seen it all, and you know exactly what gets results at Adjudicator level.

This is a REAL complaint from a REAL client who has been genuinely wronged. Write as if YOU are personally frustrated by HMRC's failures.

CORE PRINCIPLES:

1. **Be genuinely angry** (professionally)
   - Use phrases that show real frustration: "would be comedic if the consequences weren't so serious"
   - Personal touch: Reference your years of experience
   - Make it memorable: "phantom letter", "the left hand has no idea what the right hand instructed"

2. **Be specific, not generic**
   - Don't say "multiple attempts" - say "four separate attempts"
   - Use exact dates, amounts, and references from the analysis

3. **Tell a story**
   - Start with the outrageous summary (14 months for a 30-day process)
   - Build through the timeline showing escalating failures
   - End with why this will be upheld by Adjudicator

4. **Professional standards**
   - Use exactly £{chargeOutRate}/hour for professional fees
   - Calculate percentages when you have numbers (14 months vs 30 days = 1,400%)
   - Cite CRG sections naturally (4025 for delays, 5225 for fees, 6050-6075 for distress)
   
5. **What made the Richardson letter excellent**:
   - "One of the most severe examples... in 20 years of practice"
   - "Phantom letter" (memorable labeling)
   - "Would be comedic if..." (shows absurdity)
   - "The left hand has no idea what the right hand instructed"
   - "This isn't a delay - it's an abandonment"

[Full structure template follows...]
```

---

### D.8 Response Generation Prompts

**Location:** `lib/openrouter/client.ts`  
**Model:** Claude Opus 4.1

#### Acknowledgement Response

```
Generate a professional acknowledgement of HMRC's response, noting any commitments made and setting expectations for next steps.
```

#### Rebuttal Response

```
Generate a professional rebuttal addressing inadequate responses, referencing original violations and requesting proper resolution.
```

#### Escalation Response

```
Generate a formal escalation letter to the Adjudicator, summarizing the complaint journey and HMRC's inadequate response.
```

---

### D.9 Knowledge Comparison Prompt

**Location:** `supabase/SETUP_AI_PROMPT_MANAGEMENT.sql` (database-stored)  
**Model:** Claude Sonnet 4.5  
**Temperature:** 0.3  
**Max Tokens:** 4,000

#### System Prompt

```
You are an expert knowledge base curator analyzing whether a new document should be added to an HMRC complaints guidance knowledge base.

Perform comprehensive analysis to determine:
1. Duplicates (>90% similarity)
2. Overlaps (60-90% similarity) with specific sections
3. New information (topics not covered)
4. Gaps filled (missing information in existing docs)
5. Conflicts (contradictory guidance)
6. Final recommendation (add/merge/replace/skip/review)

Be thorough, accurate, and conservative. When in doubt, recommend "review_required".
```

#### User Prompt Template

```
Analyze this new document against existing knowledge base:

NEW DOCUMENT:
{document_text}

SIMILAR EXISTING DOCUMENTS:
{existing_documents}

Provide comprehensive comparison with duplicates, overlaps, new information, gaps filled, conflicts, and final recommendation.
```

---

## Appendix E: Pipeline Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE ANALYSIS & LETTER GENERATION FLOW               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  DOCUMENT UPLOAD                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  User uploads: PDFs, emails, HMRC letters, correspondence            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  DOCUMENT ANALYSIS (2-Stage)                                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Stage 1: Per-Document Analysis                                       │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Model: Claude Sonnet 4.5 (1M context)                         │  │   │
│  │  │  Prompt: D.1 Document Analysis                                 │  │   │
│  │  │  Output: JSON with dates, amounts, refs, issues, quotes        │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  │                              │                                        │   │
│  │                              ▼                                        │   │
│  │  Stage 2: Combine Analyses                                            │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Function: combineDocumentAnalyses()                           │  │   │
│  │  │  Aggregates: dates, amounts, refs, issues, quotes              │  │   │
│  │  │  Deduplicates: issues, charterViolations                       │  │   │
│  │  │  Output: Comprehensive context string                          │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  KNOWLEDGE BASE RETRIEVAL                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  1. Generate embedding for context                                    │   │
│  │  2. Multi-angle vector search (CRG, CHG, Charter, Precedents)        │   │
│  │  3. Rerank with Cohere/Voyage                                        │   │
│  │  4. Return top 10 relevant guidance chunks                           │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  COMPLAINT ANALYSIS                                                          │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Model: Claude Sonnet 4.5                                             │   │
│  │  Prompt: D.2 Complaint Analysis                                       │   │
│  │  Inputs: documentData + relevantGuidance + similarCases              │   │
│  │  Output: JSON with violations, timeline, successRate, actions        │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  LETTER GENERATION (3-Stage Pipeline)                                        │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                                                                       │   │
│  │  Stage 1: Extract Facts                                               │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Model: Claude Sonnet 4.5                                      │  │   │
│  │  │  Prompt: D.3 Extract Facts                                     │  │   │
│  │  │  Temperature: 0.2 | Tokens: 2,500                              │  │   │
│  │  │  Output: Structured fact sheet (no tone)                       │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  │                              │                                        │   │
│  │                              ▼                                        │   │
│  │  Stage 2: Structure Letter                                            │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Model: Claude Opus 4.1                                        │  │   │
│  │  │  Prompt: D.4 Structure Letter                                  │  │   │
│  │  │  Temperature: 0.2 | Tokens: 2,500                              │  │   │
│  │  │  Output: Formatted letter (13 sections, neutral tone)          │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  │                              │                                        │   │
│  │                              ▼                                        │   │
│  │  Stage 3: Add Professional Tone                                       │   │
│  │  ┌────────────────────────────────────────────────────────────────┐  │   │
│  │  │  Model: Claude Opus 4.1                                        │  │   │
│  │  │  Prompt: D.5 Professional Tone                                 │  │   │
│  │  │  Temperature: 0.3 | Tokens: 3,500                              │  │   │
│  │  │  Output: Final professional complaint letter                   │  │   │
│  │  └────────────────────────────────────────────────────────────────┘  │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼                                         │
│  OUTPUT                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  • Formatted complaint letter (markdown)                              │   │
│  │  • Analysis summary with success rate                                 │   │
│  │  • Recommended next steps                                             │   │
│  │  • Suggested compensation amounts                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

*Document maintained by Lightpoint Engineering Team*

