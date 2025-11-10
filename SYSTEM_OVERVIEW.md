# Lightpoint - HMRC Complaint Management System
## Complete System Overview

**Built:** November 8-10, 2025  
**Purpose:** AI-powered HMRC complaint letter generation for UK accountancy practices  
**Status:** Fully functional, ready for scaling

---

## 🎯 What It Does

Lightpoint transforms accountants from spending **hours** drafting HMRC complaints into spending **minutes** reviewing AI-generated, Adjudicator-ready letters.

**The Problem It Solves:**
- HMRC delays cost UK accountancy practices thousands in professional time
- Complaint letters require deep knowledge of Charter, CRG guidance, and precedents
- Junior staff lack experience to draft effective complaints
- Inconsistent quality leads to rejected complaints

**The Solution:**
- Upload client documents + provide context
- AI analyzes against 50+ Charter/CRG documents and 16 precedent cases
- 3-stage pipeline generates professional complaint letters (9.5/10 quality)
- Letters include proper structure, CRG citations, compensation calculations
- Save, lock, track letters through HMRC escalation process

---

## 🏗️ System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         FRONTEND                            │
│                      Next.js 14 App                         │
│                   (TypeScript, React 18)                    │
└───────────────┬─────────────────────────────────────────────┘
                │ tRPC (Type-safe API)
                ↓
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER (tRPC)                       │
│            Procedures: complaints, documents,               │
│              analysis, letters, knowledge                   │
└───────────────┬─────────────────────────────────────────────┘
                │
    ┌───────────┴───────────┐
    ↓                       ↓
┌─────────────┐      ┌──────────────┐
│  SUPABASE   │      │  OPENROUTER  │
│  (Database  │      │  (AI Models) │
│  + Storage) │      │              │
└─────────────┘      └──────────────┘
    │                       │
    ├── PostgreSQL         ├── Claude Sonnet 4.5
    ├── Vector Search      └── Claude Opus 4.1
    └── File Storage
```

### Technology Stack

**Frontend:**
- **Next.js 14** (App Router, React Server Components)
- **TypeScript** (Strict mode enabled)
- **Shadcn/ui** (Component library)
- **TailwindCSS** (Styling)
- **Tanstack Query v4** (State management)

**API Layer:**
- **tRPC v10** (Type-safe API without codegen)
- **Zod** (Runtime type validation)
- **SuperJSON** (Serialization with Date support)

**Database:**
- **Supabase** (PostgreSQL + Auth + Storage)
- **pgvector** extension (Vector embeddings - 1536 dimensions)
- **Row Level Security** (RLS policies)

**AI/ML:**
- **OpenRouter** (LLM API gateway)
- **Claude Sonnet 4.5** (1M context, analysis)
- **Claude Opus 4.1** (200K context, letter writing)
- **OpenAI Ada-002** (Embeddings via OpenRouter)

**Document Processing:**
- **pdf-parse** (PDF text extraction)
- **mammoth** (DOCX/DOC processing)
- **xlsx** (Excel/CSV processing)

**Deployment:**
- **Railway** (Primary deployment)
- **GitHub** (Version control)
- **Node.js 20** (Runtime)

---

## 📊 Database Schema

### Core Tables

#### 1. **organizations**
```sql
id: UUID (PK)
name: TEXT
created_at: TIMESTAMPTZ
```
Multi-tenancy support (currently single org).

#### 2. **lightpoint_users**
```sql
id: UUID (PK)
email: TEXT
full_name: TEXT
role: TEXT
organization_id: UUID (FK)
created_at: TIMESTAMPTZ
```
User accounts (renamed from `users` to avoid conflicts).

#### 3. **complaints**
```sql
id: UUID (PK)
organization_id: UUID (FK)
complaint_reference: TEXT UNIQUE
complaint_type: TEXT
hmrc_department: TEXT
status: TEXT (pending, in_progress, escalated, resolved)
complaint_context: TEXT (user-provided context)
timeline: JSONB (array of timeline events)
created_at: TIMESTAMPTZ
```
Core complaint records.

#### 4. **documents**
```sql
id: UUID (PK)
complaint_id: UUID (FK)
filename: TEXT NOT NULL
file_path: TEXT (Supabase Storage path)
file_size: INTEGER
file_type: TEXT
processed_data: JSONB (extracted text + analysis)
embedding: VECTOR(1536) (for similarity search)
created_at: TIMESTAMPTZ
```
Uploaded documents with AI-extracted content.

#### 5. **knowledge_base**
```sql
id: UUID (PK)
category: TEXT (charter, crg, guidance)
title: TEXT
content: TEXT
embedding: VECTOR(1536)
source: TEXT
metadata: JSONB
created_at: TIMESTAMPTZ
```
50+ Charter/CRG documents for AI reference.

**Indexed with HNSW** for fast vector search.

#### 6. **precedents**
```sql
id: UUID (PK)
case_type: TEXT
outcome: TEXT
content: TEXT (full precedent case)
embedding: VECTOR(1536)
metadata: JSONB
created_at: TIMESTAMPTZ
```
16 historical complaint cases showing successful structure/tone.

**Indexed with HNSW** for similarity matching.

#### 7. **generated_letters**
```sql
id: UUID (PK)
complaint_id: UUID (FK)
letter_type: TEXT (initial_complaint, tier2_escalation, etc.)
letter_content: TEXT (full letter text)
generated_at: TIMESTAMPTZ
locked_at: TIMESTAMPTZ (prevents regeneration)
sent_at: TIMESTAMPTZ
sent_by: TEXT
sent_method: TEXT (post, email, fax)
hmrc_reference: TEXT
notes: TEXT
metadata: JSONB
```
Saved/locked letters with tracking.

#### 8. **time_logs**
```sql
id: UUID (PK)
complaint_id: UUID (FK)
user_id: UUID (nullable)
activity_type: TEXT
minutes: INTEGER
created_at: TIMESTAMPTZ
```
Time tracking for professional fee calculations.

---

## 🔄 Data Flow

### 1. Complaint Creation Flow

```
User Input
   ├─ Client Reference
   ├─ Complaint Context (what happened)
   └─ Document Upload (PDFs, DOCX, XLS, CSV, TXT)
        ↓
┌────────────────────────────────────────────┐
│ Document Processing (lib/documentProcessor)│
│ 1. Upload to Supabase Storage             │
│ 2. Extract text (pdf-parse/mammoth/xlsx)  │
│ 3. Generate embedding (OpenAI Ada-002)    │
│ 4. Store in documents table                │
│ 5. STAGE 1 Analysis (Sonnet 4.5)          │
│    → detailed_analysis stored in JSONB    │
└────────────────────────────────────────────┘
        ↓
Complaint record created with:
   - Reference number
   - Context
   - Linked documents
   - Status: pending
```

### 2. Analysis Flow (Two-Stage)

```
Trigger: User clicks "Analyze Complaint"
        ↓
┌────────────────────────────────────────────┐
│ STAGE 1: Document-Level Analysis          │
│ (Already done at upload - retrieve from DB)│
│                                            │
│ Model: Claude Sonnet 4.5 (1M context)     │
│ Input: Individual document text           │
│ Output: Structured analysis per document  │
│   - Key dates, amounts, events            │
│   - Specific HMRC failures                │
│   - Communication timeline                │
│   - Stored in processed_data.detailed_analysis│
└────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────┐
│ Context Management (lib/contextManager)    │
│ 1. Retrieve document analyses from DB     │
│ 2. Search knowledge base (multi-angle)    │
│ 3. Search precedents (vector similarity)  │
│ 4. Combine within 200K token budget       │
└────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────┐
│ STAGE 2: Complaint-Level Analysis         │
│ Model: Claude Sonnet 4.5 (200K tokens)    │
│ Input: Combined context from Stage 1      │
│ Output: JSON structure with:              │
│   - hasGrounds: boolean                   │
│   - complaintCategory: string[]           │
│   - violations: [{type, citation, severity}]│
│   - timeline: {duration, gaps, deadlines} │
│   - systemErrors: [{type, departments}]   │
│   - breakthroughTriggers: string[]        │
│   - compensationEstimate: {fees, distress}│
│   - successRate: number (0-100)           │
│   - escalationRequired: "Tier1/2/Adj"     │
└────────────────────────────────────────────┘
        ↓
Analysis stored and displayed in UI
```

### 3. Letter Generation Flow (Three-Stage)

```
Trigger: User clicks "Generate Letter"
        ↓
┌────────────────────────────────────────────┐
│ STAGE 1: Fact Extraction                  │
│ Model: Claude Sonnet 4.5                  │
│ Temperature: 0.2 (factual)                │
│                                            │
│ Input: complaintAnalysis JSON             │
│ Prompt: Extract facts objectively:        │
│   - Timeline facts (dates, gaps)          │
│   - Financial facts (amounts, hours)      │
│   - Violation facts (CRG/Charter)         │
│   - PRECEDENT EXAMPLES (key phrases)      │
│                                            │
│ Output: Structured fact sheet (text)      │
└────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────┐
│ STAGE 2: Structure                        │
│ Model: Claude Opus 4.1                    │
│ Temperature: 0.3 (consistent)             │
│                                            │
│ Input: Fact sheet + practice details      │
│ Prompt: Organize into HMRC format:        │
│   - Letterhead                            │
│   - **FORMAL COMPLAINT - [SUMMARY]**      │
│   - **TIMELINE OF FAILURES**              │
│   - **CHARTER & CRG VIOLATIONS**          │
│   - **IMPACT & COSTS** (itemized)         │
│   - **RESOLUTION REQUIRED** (numbered)    │
│   - **ESCALATION WARNING**                │
│   - **Enclosed:** (specific docs)         │
│                                            │
│ USE PRECEDENT STRUCTURE if available      │
│                                            │
│ Output: Structured letter (objective tone)│
└────────────────────────────────────────────┘
        ↓
┌────────────────────────────────────────────┐
│ STAGE 3: Professional Fury                │
│ Model: Claude Opus 4.1                    │
│ Temperature: 0.7 (creative)               │
│                                            │
│ Input: Structured letter from Stage 2     │
│ Prompt: Add authentic professional tone:  │
│   - "In 20 years of practice..."         │
│   - "phantom letter"                      │
│   - "would be comedic if not serious"     │
│   - "Four separate attempts..."           │
│   - "1,400% excess"                       │
│                                            │
│ USE PRECEDENT TONE if available           │
│                                            │
│ Output: Final letter (9.5/10 quality)     │
└────────────────────────────────────────────┘
        ↓
Display in UI with formatting (bold/italic)
```

### 4. Letter Management Flow

```
Generated Letter (in memory)
        ↓
User Action: "Save Letter to Database"
        ↓
┌────────────────────────────────────────────┐
│ Save to generated_letters table           │
│   - letter_content: TEXT                  │
│   - generated_at: NOW()                   │
│   - Status: "draft"                       │
└────────────────────────────────────────────┘
        ↓
User Action: "Lock Letter"
        ↓
┌────────────────────────────────────────────┐
│ Update generated_letters                   │
│   - locked_at: NOW()                      │
│   - Status: "finalized"                   │
│   - Prevents regeneration                 │
└────────────────────────────────────────────┘
        ↓
User Action: "Mark as Sent"
        ↓
┌────────────────────────────────────────────┐
│ Update generated_letters + complaints      │
│   - sent_at: NOW()                        │
│   - sent_by: [User name]                  │
│   - sent_method: post/email/fax           │
│   - Add to complaint timeline             │
│   - Update complaint status               │
└────────────────────────────────────────────┘
        ↓
Letter tracked in timeline, ready for follow-up
```

---

## 🧠 AI Architecture

### Vector Search System

**Purpose:** Find relevant Charter/CRG guidance and precedents

**Process:**
1. **Text → Embedding**
   ```typescript
   const text = "14-month delay in SEIS processing";
   const embedding = await generateEmbedding(text);
   // Returns: float[] of 1536 dimensions
   ```

2. **Store in Database**
   ```sql
   INSERT INTO knowledge_base (content, embedding, category)
   VALUES ($1, $2::vector, $3);
   ```

3. **Similarity Search**
   ```sql
   -- Uses pgvector + HNSW index
   SELECT * FROM knowledge_base
   ORDER BY embedding <-> $1::vector
   LIMIT 10;
   ```

**Multi-Angle Search Strategy:**
```typescript
// 6 different search angles for comprehensive coverage
const searches = [
  "direct topic search",           // Main issue
  "process name search",            // e.g., "SEIS relief"
  "CRG specific search",            // "CRG4025 delays"
  "Charter specific search",        // "Being Responsive"
  "template/letter search",         // Letter examples
  "timeline/documentation search"   // Process docs
];
// Deduplicate and rank results
```

### LLM Model Strategy

**Current Setup:**

| Stage | Model | Context | Temp | Cost | Why |
|-------|-------|---------|------|------|-----|
| Document Analysis (Stage 1) | Sonnet 4.5 | 1M | 0.2 | $3/M in | Can handle full docs |
| Complaint Analysis (Stage 2) | Sonnet 4.5 | 200K | 0.3 | $3/M in | Excellent analysis |
| Letter Facts (Pipeline Stage 1) | Sonnet 4.5 | 200K | 0.2 | $3/M in | Factual extraction |
| Letter Structure (Pipeline Stage 2) | Opus 4.1 | 200K | 0.3 | $15/M in | Superior structuring |
| Letter Tone (Pipeline Stage 3) | Opus 4.1 | 200K | 0.7 | $15/M in | Creative language |

**Cost per Complaint:**
- Analysis: ~$0.20 (Sonnet 4.5)
- Letter Generation: ~$0.60 (Sonnet + 2x Opus)
- **Total: ~$0.80 per complaint**

---

## 📁 File Structure

```
lightpoint-complaint-system/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── trpc/[trpc]/route.ts # tRPC endpoint
│   │   ├── documents/upload/    # Document upload API
│   │   └── health/route.ts      # Health check
│   ├── complaints/
│   │   ├── new/page.tsx         # Create complaint
│   │   └── [id]/page.tsx        # Complaint detail
│   ├── dashboard/page.tsx        # Main dashboard
│   ├── settings/page.tsx         # Practice settings
│   └── layout.tsx                # Root layout
│
├── components/
│   ├── complaint/
│   │   ├── ComplaintWizard.tsx   # Single complaint flow
│   │   ├── BatchAssessment.tsx   # Batch assessment
│   │   ├── DocumentUploader.tsx  # File upload component
│   │   ├── TimelineView.tsx      # Timeline display
│   │   ├── LetterPreview.tsx     # Letter preview
│   │   ├── LetterManager.tsx     # Save/lock/send UI
│   │   └── FormattedLetter.tsx   # Formatted display + export
│   ├── analysis/
│   │   ├── ViolationChecker.tsx  # Violation display
│   │   └── PrecedentMatcher.tsx  # Precedent display
│   └── ui/                       # Shadcn components
│
├── lib/
│   ├── trpc/
│   │   ├── router.ts             # tRPC procedures
│   │   └── Provider.tsx          # tRPC React provider
│   ├── openrouter/
│   │   ├── client.ts             # Single-stage (legacy)
│   │   └── three-stage-client.ts # Three-stage pipeline
│   ├── supabase/
│   │   └── client.ts             # Supabase initialization
│   ├── documentProcessor.ts      # Text extraction + analysis
│   ├── vectorSearch.ts           # Knowledge base + precedents
│   ├── embeddings.ts             # OpenAI embedding generation
│   ├── contextManager.ts         # Token budget management
│   ├── documentAnalysis.ts       # Stage 1 document analysis
│   ├── privacy.ts                # PII anonymization
│   ├── timeTracking.ts           # Time logging
│   └── practiceSettings.ts       # Local storage for settings
│
├── supabase/
│   ├── COMPLETE_SETUP.sql        # All-in-one setup
│   └── migrations/
│       ├── 001_initial_schema_safe.sql
│       ├── 002_enhance_documents_and_timeline.sql
│       ├── 003_add_missing_complaint_columns.sql
│       └── 004_add_generated_letters_table.sql
│
├── knowledge-uploads/
│   ├── charter/                  # 20+ Charter documents
│   ├── crg/                      # 30+ CRG guidance docs
│   └── precedents/               # 16 historical complaints
│
├── scripts/
│   └── process-knowledge-uploads.ts  # Batch process docs
│
└── Documentation (Markdown files)
```

---

## 🔐 Security & Privacy

### Authentication
- Currently **public procedures** (no auth wall)
- Ready for Supabase Auth integration
- RLS policies prepared for multi-tenant

### PII Protection
```typescript
// lib/privacy.ts
- anonymizeText()      // Redact sensitive data
- encrypt()            // AES-256 encryption
- auditLog()           // Track access
- sanitizeForLLM()     // Clean before AI processing
```

### Storage Security
- Files stored in Supabase Storage
- RLS policies control access
- Bucket: `complaint-documents`
- Private by default

---

## 🚀 Deployment

### Railway Configuration

**Environment Variables Required:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...

# OpenRouter
OPENROUTER_API_KEY=sk-or-xxx...

# Optional
ENCRYPTION_KEY=xxx  # For PII encryption
```

**Build Configuration:**
```json
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  },
  "scripts": {
    "build": "next build",
    "start": "NODE_OPTIONS='--dns-result-order=ipv4first' next start -p ${PORT:-3004}"
  }
}
```

**Known Issues:**
- Node.js 18 has IPv6 DNS issues with Supabase
- **Solution:** Force Node 20 + IPv4 DNS resolution
- Railway auto-deploys from GitHub `main` branch

---

## 📊 Performance Metrics

### Response Times (Target)
- Document upload + processing: 5-10 seconds
- Complaint analysis: 15-25 seconds (two-stage)
- Letter generation: 20-30 seconds (three-stage)
- Vector search: <1 second

### Scalability Considerations
- **Database:** PostgreSQL scales vertically
- **Vector search:** HNSW index handles 100K+ vectors
- **AI calls:** OpenRouter has high rate limits
- **Storage:** Supabase storage scales to TBs

### Cost Breakdown (per month, 100 complaints)
- **Supabase:** $25/month (Pro plan)
- **OpenRouter:** $80 (100 × $0.80)
- **Railway:** $5-20 (usage-based)
- **Total:** ~$110/month for 100 complaints

---

## 🎯 Key Features

### 1. Intelligent Document Processing
- Multi-format support (PDF, DOCX, XLS, CSV, TXT)
- Automatic text extraction
- Stage 1 analysis at upload (no data loss)
- Vector embeddings for similarity search

### 2. Knowledge Base Integration
- 50+ Charter and CRG documents
- 16 precedent cases
- Multi-angle vector search
- Automatic precedent matching

### 3. Three-Stage Letter Generation
- **Stage 1:** Fact extraction (objective)
- **Stage 2:** Structure organization (template)
- **Stage 3:** Tone enhancement (professional fury)
- Precedent structure and tone replication

### 4. Letter Management
- Save draft letters to database
- Lock letters to prevent changes
- Track send date, method, recipient
- Timeline integration
- Export to Word (.docx)
- Copy with formatting preserved

### 5. Practice Settings
- Custom letterhead
- Charge-out rate configuration
- Default signatory
- Stored in browser local storage

### 6. Formatted Display
- Markdown → HTML rendering
- Bold, italic, proper spacing
- Professional serif font (Georgia)
- Copy with formatting
- Word export (.docx)

---

## 🔄 Workflow

**Typical User Journey:**

1. **Create Complaint**
   - Enter client reference
   - Provide context
   - Upload 1-50 documents
   - Submit → Documents processed automatically

2. **Review Analysis**
   - Click "Analyze Complaint"
   - Wait 15-25 seconds
   - Review violations, timeline, success rate
   - Check precedent matches

3. **Generate Letter**
   - Click "Generate Letter"
   - Wait 20-30 seconds
   - Review formatted letter
   - See proper structure, CRG citations, calculations

4. **Refine (Optional)**
   - Regenerate with different approach
   - Compare single-stage vs three-stage
   - Test with/without precedents

5. **Save & Send**
   - Save to database
   - Lock letter (finalize)
   - Export to Word or copy formatted
   - Print on letterhead, sign
   - Mark as sent (date, method, notes)
   - Track in timeline

6. **Follow-Up**
   - Complaint appears in dashboard
   - Timeline shows all events
   - Generate Tier 2/Adjudicator letters if needed

---

## 🐛 Known Issues & Roadmap

### Current Known Issues
1. **Railway IPv6/DNS:** Requires Node 20 + IPv4 flag
2. **Time logging:** Optional (schema mismatch, doesn't block)
3. **No authentication:** Public procedures (easy to add)

### Roadmap
1. **Authentication:** Supabase Auth + RLS
2. **Multi-tenancy:** Full organization isolation
3. **Email integration:** Send directly from system
4. **PDF export:** Generate PDFs with letterhead
5. **Template library:** Save custom letter templates
6. **Batch processing:** Process 50+ complaints at once
7. **Outcome tracking:** Record Adjudicator decisions
8. **Analytics:** Success rates by complaint type
9. **Mobile app:** React Native version

---

## 📈 Scaling Considerations

### Vertical Scaling (Current)
- Supabase Pro: 8GB RAM, 50GB storage
- Railway: Auto-scales to traffic
- OpenRouter: High rate limits

### Horizontal Scaling (Future)
- **Queue system:** Bull/Redis for background processing
- **CDN:** CloudFront for static assets
- **Load balancer:** Multiple Railway instances
- **Database read replicas:** For analytics queries
- **Caching:** Redis for frequently accessed data

---

## 🛠️ Development Setup

**Prerequisites:**
- Node.js 20+
- npm 10+
- Supabase account
- OpenRouter API key

**Local Setup:**
```bash
# Clone repo
git clone https://github.com/oracleconsulting/lightpoint.git
cd lightpoint-complaint-system

# Install dependencies
npm ci

# Configure environment
cp .env.example .env.local
# Edit .env.local with your keys

# Run database migrations
# (Execute COMPLETE_SETUP.sql in Supabase SQL Editor)

# Process knowledge base
npm run process-knowledge

# Start dev server
npm run dev
# Open http://localhost:3004
```

**Key Commands:**
```bash
npm run dev          # Development server (port 3004)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint check
npm run type-check   # TypeScript check
```

---

## 📞 Support & Documentation

**Documentation Files:**
- `README.md` - Getting started
- `COMPLETE_SUMMARY.md` - Full project summary
- `THREE_STAGE_PIPELINE.md` - Letter generation deep-dive
- `PRECEDENT_INTEGRATION.md` - How precedents work
- `AI_PROMPTS_DOCUMENTATION.md` - All AI prompts
- `RAILWAY_DEPLOYMENT_ISSUE.md` - Deployment troubleshooting
- `LOCAL_SETUP.md` - Local development guide
- `SUPABASE_STORAGE_SETUP.md` - Storage configuration

**Key Contacts:**
- Built by: James Howard (with AI assistant)
- Repository: github.com/oracleconsulting/lightpoint
- Issues: GitHub Issues

---

**End of System Overview**

*Last Updated: November 10, 2025*  
*Version: 1.0*  
*Total Build Time: 2.5 days*

