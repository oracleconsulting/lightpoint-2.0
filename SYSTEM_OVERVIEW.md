# Lightpoint 2.0 - Complete System Overview
## AI-Powered HMRC Complaint Management Platform

**Built:** November 2025 - December 2025  
**Current Version:** 2.0.0  
**Status:** Production Ready, Deployed on Railway  
**Repository:** github.com/oracleconsulting/lightpoint-2.0

---

## 🎯 Platform Overview

Lightpoint is an AI-powered platform for UK accountancy practices that transforms HMRC complaint handling from a time-consuming, expertise-heavy process into an efficient, consistent, and professional workflow.

### Core Value Proposition
- **Time Savings:** Hours → Minutes for complaint letter generation
- **Quality Consistency:** 9.5/10 rated letters with proper CRG citations
- **Fee Recovery:** Track professional fees and claim from HMRC
- **Knowledge Base:** 50+ Charter/CRG documents for AI reference
- **Precedent Learning:** System learns from successful complaint outcomes

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                   │
│                  Next.js 14 (App Router, React 18)                  │
│                     TypeScript + TailwindCSS                        │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │    tRPC API Layer     │
                    │   (Type-safe RPC)     │
                    └───────────┬───────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   SUPABASE    │     │   OPENROUTER    │     │    UPSTASH      │
│ ─────────────│     │ ───────────────│     │ ───────────────│
│ • PostgreSQL  │     │ • Claude Opus   │     │ • Redis Cache   │
│ • pgvector    │     │ • Claude Sonnet │     │ • Rate Limiting │
│ • Auth        │     │ • Claude Haiku  │     │                 │
│ • Storage     │     │ • OpenAI Ada    │     │                 │
│ • Edge Funcs  │     │ • Cohere Rerank │     │                 │
└───────────────┘     └─────────────────┘     └─────────────────┘
```

---

## 📦 Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.2.33 | React framework with App Router |
| React | 18.3.1 | UI library |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 3.4.17 | Styling |
| Framer Motion | 12.x | Animations |
| Shadcn/ui | Latest | Component library |
| TanStack Query | 5.62.8 | Data fetching/caching |
| Tiptap | 3.11.0 | Rich text editor |
| Recharts | 3.5.0 | Charts & visualizations |

### Backend/API
| Technology | Version | Purpose |
|------------|---------|---------|
| tRPC | 11.0.0-rc | Type-safe API layer |
| Zod | 3.24.1 | Runtime validation |
| SuperJSON | 2.2.2 | Serialization |

### Database & Storage
| Technology | Purpose |
|------------|---------|
| Supabase PostgreSQL | Primary database |
| pgvector | Vector embeddings (1536 dimensions) |
| Supabase Auth | Authentication |
| Supabase Storage | File storage |
| Supabase Edge Functions | Serverless functions |

### AI/ML Stack
| Model | Provider | Purpose |
|-------|----------|---------|
| Claude Opus 4 | OpenRouter | Premium letter generation |
| Claude Sonnet 4 | OpenRouter | Analysis & structure |
| Claude Haiku | OpenRouter | Fast extraction |
| OpenAI Ada-002 | OpenRouter | Text embeddings |
| Cohere Rerank 3.5 | OpenRouter | Search precision |
| Gemini 2.0 Flash | OpenRouter | Image generation |

### Infrastructure
| Service | Purpose |
|---------|---------|
| Railway | Deployment platform |
| Upstash Redis | Rate limiting & caching |
| Resend | Transactional email |
| Stripe | Payments & subscriptions |
| SonarCloud | Code quality |
| GitHub Actions | CI/CD |

---

## 📁 Directory Structure

```
lightpoint-2.0/
├── app/                              # Next.js App Router
│   ├── admin/                        # Super Admin Portal
│   │   ├── analytics/               # Analytics dashboard
│   │   ├── blog/                    # Blog management (CRUD)
│   │   ├── content/                 # CMS content management
│   │   ├── cpd/                     # CPD content management
│   │   ├── customers/               # Customer management
│   │   ├── examples/                # Example letters management
│   │   ├── pilots/                  # Pilot program management
│   │   ├── seo/                     # SEO settings
│   │   ├── settings/                # Admin settings
│   │   ├── social-content/          # Social content generator
│   │   ├── tickets/                 # Support tickets
│   │   ├── tiers/                   # Subscription tiers
│   │   ├── waitlist/                # Waitlist management
│   │   └── webinars/                # Webinar management
│   │
│   ├── api/                          # API Routes
│   │   ├── admin/                   # Admin APIs
│   │   ├── blog/                    # Blog generation APIs
│   │   ├── complaints/              # Letter streaming
│   │   ├── documents/               # Upload handling
│   │   ├── invites/                 # Invitation system
│   │   ├── stripe/                  # Payment webhooks
│   │   ├── trpc/                    # tRPC endpoint
│   │   └── webhooks/                # External webhooks
│   │
│   ├── auth/                         # Authentication
│   ├── blog/                         # Public blog
│   │   ├── [slug]/                  # Individual blog posts
│   │   └── rss.xml/                 # RSS feed
│   │
│   ├── complaints/                   # Complaint Management
│   │   ├── [id]/                    # Individual complaint
│   │   └── new/                     # Create complaint
│   │
│   ├── dashboard/                    # User Dashboard
│   │   └── analytics/               # User analytics
│   │
│   ├── knowledge/                    # Knowledge Base Browser
│   ├── management/                   # Management Dashboard
│   ├── pricing/                      # Pricing page
│   ├── settings/                     # User Settings
│   │   └── ai/                      # AI model settings
│   │
│   ├── subscription/                 # Subscription flow
│   ├── users/                        # User management
│   ├── webinars/                     # Webinar pages
│   │
│   ├── llms.txt/                     # AI crawler guidance
│   ├── robots.txt/                   # Search engine robots
│   └── sitemap.xml/                  # Dynamic sitemap
│
├── components/                       # React Components
│   ├── admin/                       # Admin form components
│   │   ├── BlogPostForm.tsx
│   │   ├── CPDForm.tsx
│   │   ├── ExampleForm.tsx
│   │   └── WebinarForm.tsx
│   │
│   ├── analysis/                    # Analysis components
│   │   ├── PrecedentMatcher.tsx
│   │   ├── ReAnalysisPrompt.tsx
│   │   └── ViolationChecker.tsx
│   │
│   ├── blog/                        # Blog components (v1)
│   │   ├── gamma/                   # Gamma visual components
│   │   ├── AIImageImport.tsx
│   │   ├── AILayoutGenerator.tsx
│   │   ├── BlogEngagement.tsx       # Comments & likes
│   │   ├── BlogJsonLd.tsx           # SEO structured data
│   │   ├── DynamicGammaRenderer.tsx
│   │   ├── OneClickBlogGenerator.tsx
│   │   └── VisualTransformer.tsx
│   │
│   ├── blog-v2/                     # Blog components (v2)
│   │   ├── components/
│   │   │   ├── CalloutBox.tsx
│   │   │   ├── ComparisonCards.tsx
│   │   │   ├── DonutChart.tsx
│   │   │   ├── HeroSection.tsx
│   │   │   ├── NumberedSteps.tsx
│   │   │   ├── QuoteBlock.tsx
│   │   │   ├── StatsRow.tsx
│   │   │   ├── TextWithImage.tsx
│   │   │   ├── ThreeColumnCards.tsx
│   │   │   └── Timeline.tsx
│   │   ├── utils/
│   │   │   ├── layoutGenerator.ts
│   │   │   └── sectionDetector.ts
│   │   └── BlogRenderer.tsx
│   │
│   ├── complaint/                   # Complaint UI
│   │   ├── AssignComplaint.tsx
│   │   ├── BatchAssessment.tsx
│   │   ├── CloseComplaintDialog.tsx
│   │   ├── ComplaintWizard.tsx
│   │   ├── DocumentUploader.tsx
│   │   ├── DocumentViewer.tsx
│   │   ├── FollowUpManager.tsx
│   │   ├── FormattedLetter.tsx
│   │   ├── LetterManager.tsx
│   │   ├── LetterPreview.tsx
│   │   ├── OCRFailureCard.tsx
│   │   ├── ResponseUploader.tsx
│   │   ├── StartComplaint.tsx
│   │   ├── StatusManager.tsx
│   │   ├── TimelineView.tsx
│   │   └── TimeTracker.tsx
│   │
│   ├── dashboard/                   # Dashboard components
│   ├── kb/                          # Knowledge base UI
│   ├── letter/                      # Letter refinement
│   ├── tickets/                     # Ticket components
│   ├── time/                        # Time tracking
│   ├── timeline/                    # Interactive timeline
│   └── ui/                          # Shadcn components
│
├── contexts/                         # React Contexts
│   ├── AuthContext.tsx              # Supabase auth
│   └── UserContext.tsx              # User profile/org
│
├── hooks/                            # Custom Hooks
│   └── useLetterGenerationStream.ts # Streaming letter gen
│
├── lib/                              # Core Libraries
│   ├── ai/                          # AI utilities
│   │   └── socialContentGenerator.ts
│   │
│   ├── blog/                        # Blog utilities
│   │   ├── extractionPipeline.ts
│   │   ├── imageGeneration.ts       # NanoBanana integration
│   │   └── themes.ts
│   │
│   ├── cache/                       # Caching
│   │   └── redis.ts
│   │
│   ├── email/                       # Email service
│   │   └── service.ts               # Resend integration
│   │
│   ├── gamma/                       # Gamma API
│   │   └── client.ts
│   │
│   ├── ingestion/                   # Knowledge ingestion
│   │   ├── hmrcChunking.ts
│   │   ├── hmrcIngestionService.ts
│   │   └── hmrcManualCrawler.ts
│   │
│   ├── openrouter/                  # LLM clients
│   │   ├── client.ts                # Base client
│   │   └── three-stage-client.ts    # 3-stage pipeline
│   │
│   ├── rateLimit/                   # Rate limiting
│   │   └── middleware.ts            # Upstash integration
│   │
│   ├── search/                      # Search utilities
│   │   └── hybridSearch.ts          # Vector + BM25
│   │
│   ├── supabase/                    # Supabase client
│   │   └── client.ts
│   │
│   ├── trpc/                        # tRPC Setup
│   │   ├── router.ts                # Main router
│   │   ├── routers/                 # Sub-routers
│   │   │   ├── admin.ts
│   │   │   ├── analytics.ts
│   │   │   ├── blog.ts
│   │   │   ├── cms.ts
│   │   │   ├── cpd.ts
│   │   │   ├── examples.ts
│   │   │   ├── pilot.ts
│   │   │   ├── socialContent.ts
│   │   │   ├── subscription.ts
│   │   │   └── webinars.ts
│   │   ├── Provider.tsx
│   │   └── trpc.ts
│   │
│   ├── contextManager.ts            # LLM context budgeting
│   ├── documentAnalysis.ts          # Document analysis
│   ├── documentProcessor.ts         # OCR & extraction
│   ├── embeddings.ts                # Vector embeddings
│   ├── kbDocumentProcessor.ts       # KB processing
│   ├── knowledgeBaseChat.ts         # KB chat
│   ├── knowledgeComparison.ts       # Document comparison
│   ├── logger.ts                    # Logging utility
│   ├── modelConfig.ts               # AI model config
│   ├── outcomeAnalysis.ts           # Complaint outcomes
│   ├── practiceSettings.ts          # Practice config
│   ├── privacy.ts                   # PII protection
│   ├── sanitize.ts                  # Input sanitization
│   ├── timeCalculations.ts          # Time benchmarks
│   ├── timeTracking.ts              # Time logging
│   ├── utils.ts                     # Utilities
│   └── vectorSearch.ts              # Vector search
│
├── supabase/                         # Database
│   ├── functions/                   # Edge Functions
│   │   ├── auto-publish-posts/
│   │   └── publish-social-content/
│   └── migrations/                  # Schema migrations
│
├── public/                           # Static Assets
├── types/                            # TypeScript Types
├── scripts/                          # Utility Scripts
└── __tests__/                        # Test Suite
```

---

## 🗄️ Database Schema

### Core Tables

#### Organizations & Users
```sql
organizations
├── id: UUID (PK)
├── name: TEXT
├── pilot_status: TEXT (pilot_pending, pilot_active, pilot_complete)
├── subscription_tier: TEXT
└── created_at: TIMESTAMPTZ

user_profiles
├── id: UUID (PK, FK → auth.users)
├── organization_id: UUID (FK)
├── email: TEXT
├── full_name: TEXT
├── job_title: TEXT
├── role: TEXT (admin, user)
├── is_super_admin: BOOLEAN
├── onboarding_completed: BOOLEAN
├── onboarding_step: INTEGER
└── created_at: TIMESTAMPTZ
```

#### Complaints System
```sql
complaints
├── id: UUID (PK)
├── organization_id: UUID (FK)
├── complaint_reference: TEXT UNIQUE
├── complaint_type: TEXT
├── hmrc_department: TEXT
├── status: TEXT (assessment, active, escalated, resolved, closed)
├── complaint_context: TEXT
├── analysis: JSONB
├── timeline: JSONB[]
├── assigned_to: UUID (FK)
├── analysis_completed_at: TIMESTAMPTZ
├── created_at: TIMESTAMPTZ
└── updated_at: TIMESTAMPTZ

documents
├── id: UUID (PK)
├── complaint_id: UUID (FK)
├── filename: TEXT
├── file_path: TEXT
├── file_size: INTEGER
├── file_type: TEXT
├── document_type: TEXT (evidence, response)
├── processed_data: JSONB
├── ocr_extracted: BOOLEAN
├── embedding: VECTOR(1536)
└── created_at: TIMESTAMPTZ

generated_letters
├── id: UUID (PK)
├── complaint_id: UUID (FK)
├── letter_type: TEXT
├── letter_content: TEXT
├── locked_at: TIMESTAMPTZ
├── sent_at: TIMESTAMPTZ
├── sent_by: TEXT
├── sent_method: TEXT
├── superseded_at: TIMESTAMPTZ
├── notes: TEXT
└── created_at: TIMESTAMPTZ

time_logs
├── id: UUID (PK)
├── complaint_id: UUID (FK)
├── activity_type: TEXT
├── minutes_spent: INTEGER
├── automated: BOOLEAN
└── created_at: TIMESTAMPTZ
```

#### Knowledge Base
```sql
knowledge_base
├── id: UUID (PK)
├── category: TEXT (charter, crg, guidance, template)
├── title: TEXT
├── content: TEXT
├── full_content: TEXT
├── embedding: VECTOR(1536)
├── source: TEXT
├── metadata: JSONB
└── created_at: TIMESTAMPTZ

precedents
├── id: UUID (PK)
├── case_type: TEXT
├── outcome: TEXT (successful, partial, rejected)
├── content: TEXT
├── embedding: VECTOR(1536)
├── metadata: JSONB
├── hmrc_department: TEXT
├── complaint_category: TEXT
├── resolution_amount: DECIMAL
└── created_at: TIMESTAMPTZ
```

#### Content Management
```sql
blog_posts
├── id: UUID (PK)
├── title: TEXT
├── slug: TEXT UNIQUE
├── excerpt: TEXT
├── content: TEXT
├── structured_layout: JSONB
├── featured_image: TEXT
├── category: TEXT
├── tags: TEXT[]
├── author_id: UUID
├── status: TEXT (draft, published, archived)
├── view_count: INTEGER
├── like_count: INTEGER
├── comment_count: INTEGER
├── published_at: TIMESTAMPTZ
└── created_at: TIMESTAMPTZ

blog_comments
├── id: UUID (PK)
├── post_id: UUID (FK)
├── user_id: UUID
├── author_name: TEXT
├── author_email: TEXT
├── content: TEXT
├── parent_id: UUID (self-referential)
├── is_approved: BOOLEAN
└── created_at: TIMESTAMPTZ

blog_likes
├── id: UUID (PK)
├── post_id: UUID (FK)
├── user_id: UUID
├── anonymous_id: TEXT
└── created_at: TIMESTAMPTZ

seo_metadata
├── id: UUID (PK)
├── page_path: TEXT UNIQUE
├── meta_title: TEXT
├── meta_description: TEXT
├── meta_keywords: TEXT
├── og_image: TEXT
├── canonical_url: TEXT
└── updated_at: TIMESTAMPTZ
```

#### Support & Tickets
```sql
support_tickets
├── id: UUID (PK)
├── complaint_id: UUID (FK)
├── organization_id: UUID (FK)
├── created_by: UUID
├── ticket_type: TEXT (escalation, question, bug)
├── priority: TEXT (low, medium, high, urgent)
├── status: TEXT (open, in_progress, resolved, closed)
├── title: TEXT
├── description: TEXT
├── assigned_to: UUID
├── comments: JSONB[]
└── created_at: TIMESTAMPTZ
```

---

## 🔌 API Structure (tRPC)

### Main Router (`lib/trpc/router.ts`)

```typescript
appRouter = {
  // Core complaint management
  complaints: {
    create, list, getById, updateStatus,
    closeWithOutcome, getOutcomeStats,
    updateReference, assign, delete, addTimelineEvent
  },
  
  // AI analysis
  analysis: {
    analyzeDocument
  },
  
  // Letter generation & management
  letters: {
    generateComplaint, save, lock, markAsSent,
    list, getById, regenerate, updateContent,
    listActive, delete, bulkDelete, generateResponse
  },
  
  // Document handling
  documents: {
    list, getSignedUrl, retryOCR
  },
  
  // Time tracking
  time: {
    getComplaintTime, logActivity,
    deleteActivityByType, deleteActivity, updateActivity
  },
  
  // Knowledge base
  knowledge: {
    search, list, addPrecedent, getTimeline,
    uploadForComparison, listRssFeeds,
    approveStaged, getRssStats
  },
  
  // AI settings
  aiSettings: {
    listPrompts, getPrompt, updatePrompt,
    resetPrompt, getPromptHistory
  },
  
  // Knowledge base chat
  kbChat: {
    startConversation, sendMessage,
    getConversation, listConversations,
    deleteConversation, submitFeedback
  },
  
  // User management
  users: {
    list, create, update, toggleStatus,
    invite, checkSuperAdmin, getCurrentUser
  },
  
  // Support tickets
  tickets: {
    create, list, getByComplaint, update, addComment
  },
  
  // Management dashboard
  management: {
    getOverview
  },
  
  // Dashboard metrics
  dashboard: {
    getMetrics, getOnboardingStatus,
    bookOnboardingMeeting, completeOnboarding
  }
}
```

### Sub-Routers (`lib/trpc/routers/`)

| Router | Purpose |
|--------|---------|
| `admin.ts` | Admin platform stats & management |
| `analytics.ts` | Usage analytics |
| `blog.ts` | Public blog queries (likes, comments) |
| `cms.ts` | Content management (blog, webinars, CPD) |
| `cpd.ts` | CPD content operations |
| `examples.ts` | Example letters |
| `pilot.ts` | Pilot program management |
| `socialContent.ts` | AI social content generation |
| `subscription.ts` | Stripe subscription management |
| `webinars.ts` | Webinar operations |

---

## 🤖 AI Pipeline Architecture

### Document Processing Pipeline

```
Document Upload
      ↓
┌─────────────────────────────────────┐
│ 1. File Extraction                  │
│    • PDF → pdf-parse                │
│    • DOCX → mammoth                 │
│    • Excel → xlsx                   │
│    • Images → Claude Vision OCR     │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 2. Document Analysis (Sonnet 4)     │
│    • Extract key dates              │
│    • Identify amounts               │
│    • Map HMRC failures              │
│    • Build timeline                 │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 3. Embedding Generation (Ada-002)   │
│    • 1536 dimension vectors         │
│    • Stored in pgvector             │
└─────────────────────────────────────┘
```

### Complaint Analysis Pipeline

```
Trigger: "Analyze Complaint"
      ↓
┌─────────────────────────────────────┐
│ 1. Context Assembly                 │
│    • Retrieve document analyses     │
│    • Vector search knowledge base   │
│    • Match relevant precedents      │
│    • Budget tokens (200K max)       │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 2. Complaint Analysis (Sonnet 4)    │
│    Output:                          │
│    • hasGrounds: boolean            │
│    • violations: [{CRG, severity}]  │
│    • timeline: {duration, gaps}     │
│    • compensationEstimate           │
│    • successRate: 0-100             │
│    • escalationRequired             │
└─────────────────────────────────────┘
```

### Three-Stage Letter Generation

```
┌─────────────────────────────────────┐
│ Stage 1: Fact Extraction            │
│ Model: Claude Haiku (temp 0.2)      │
│                                     │
│ • Extract objective facts           │
│ • Timeline with specific dates      │
│ • Financial amounts                 │
│ • CRG/Charter violations            │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ Stage 2: Structure & Organization   │
│ Model: Claude Sonnet (temp 0.3)     │
│                                     │
│ • FORMAL COMPLAINT header           │
│ • TIMELINE OF FAILURES              │
│ • CHARTER & CRG VIOLATIONS          │
│ • IMPACT & COSTS (itemized)         │
│ • RESOLUTION REQUIRED               │
│ • ESCALATION WARNING                │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ Stage 3: Professional Tone          │
│ Model: Claude Opus (temp 0.7)       │
│                                     │
│ • Professional indignation          │
│ • Authentic voice                   │
│ • Precedent-matched phrasing        │
│ • 9.5/10 quality output             │
└─────────────────────────────────────┘
```

### Vector Search + Reranking

```
Query: "14-month delay in SEIS processing"
      ↓
┌─────────────────────────────────────┐
│ 1. Embedding Generation             │
│    Query → 1536-dim vector          │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 2. Multi-Angle Vector Search        │
│    • Direct topic search            │
│    • Process name search            │
│    • CRG-specific search            │
│    • Charter-specific search        │
│    • Template search                │
│    • Timeline search                │
│    → Returns 30 candidates          │
└───────────────┬─────────────────────┘
                ↓
┌─────────────────────────────────────┐
│ 3. Cross-Encoder Reranking          │
│    Model: Cohere Rerank 3.5         │
│    30 candidates → Top 10           │
│    +15-30% precision improvement    │
└─────────────────────────────────────┘
```

---

## 🎨 Feature Matrix

### Complaint Management
| Feature | Status | Description |
|---------|--------|-------------|
| Create Complaint | ✅ | Wizard-based complaint creation |
| Document Upload | ✅ | PDF, DOCX, XLS, CSV, images |
| OCR Processing | ✅ | Claude Vision for scanned docs |
| AI Analysis | ✅ | Automated violation detection |
| Re-analysis with Context | ✅ | Add context for refined analysis |
| Letter Generation | ✅ | 3-stage AI pipeline |
| Letter Management | ✅ | Save, lock, send tracking |
| Time Tracking | ✅ | Auto + manual time logging |
| Time Editing | ✅ | Adjust logged time entries |
| Follow-up Letters | ✅ | Tier 2, Adjudicator escalation |
| Response Upload | ✅ | HMRC response tracking |
| Status Workflow | ✅ | Assessment → Active → Closed |
| Complaint Assignment | ✅ | Assign to team members |
| Timeline View | ✅ | Full event chronology |
| Ticket Escalation | ✅ | Flag to management |

### Knowledge Base
| Feature | Status | Description |
|---------|--------|-------------|
| Vector Search | ✅ | pgvector + HNSW index |
| Multi-angle Search | ✅ | 6 search strategies |
| Reranking | ✅ | Cohere cross-encoder |
| Document Upload | ✅ | Bulk KB population |
| Document Comparison | ✅ | Compare new docs to KB |
| KB Chat | ✅ | Conversational KB access |
| Precedent Matching | ✅ | Find similar cases |
| Staged Documents | ✅ | Review before KB addition |

### Content Management (Admin)
| Feature | Status | Description |
|---------|--------|-------------|
| Blog Posts | ✅ | Full CRUD with rich editor |
| Blog V2 Layout | ✅ | Component-based layouts |
| SEO Management | ✅ | Meta tags, OG, canonical |
| Webinars | ✅ | Video content management |
| CPD Content | ✅ | Training materials |
| Example Letters | ✅ | Template library |
| Social Content | ✅ | AI-generated social posts |
| AI Image Generation | ✅ | NanoBanana/Gemini |

### User Management
| Feature | Status | Description |
|---------|--------|-------------|
| User Profiles | ✅ | Profile management |
| Organizations | ✅ | Multi-tenant support |
| Role-based Access | ✅ | Admin, User roles |
| Super Admin | ✅ | Platform-level admin |
| Invitations | ✅ | Email invite system |
| Pilot Program | ✅ | Onboarding workflow |

### Analytics & Reporting
| Feature | Status | Description |
|---------|--------|-------------|
| Dashboard Metrics | ✅ | Real-time stats |
| Complaint Analytics | ✅ | Success rates, timings |
| Time & Value Reports | ✅ | Billable hours tracking |
| Management Overview | ✅ | Team performance |
| Blog Analytics | ✅ | Views, engagement |

### SEO & AI Search
| Feature | Status | Description |
|---------|--------|-------------|
| Dynamic Sitemap | ✅ | Auto-updated XML |
| llms.txt | ✅ | AI crawler guidance |
| JSON-LD | ✅ | Structured data |
| Meta Generation | ✅ | Dynamic per page |
| RSS Feed | ✅ | Blog syndication |
| Canonical URLs | ✅ | Duplicate prevention |

### Infrastructure
| Feature | Status | Description |
|---------|--------|-------------|
| Rate Limiting | ✅ | Upstash Redis |
| Error Logging | ✅ | Structured logging |
| Health Checks | ✅ | /api/health endpoint |
| Stripe Integration | ✅ | Payments & webhooks |
| Email Service | ✅ | Resend integration |
| Edge Functions | ✅ | Supabase serverless |

---

## 🔐 Security

### Authentication
- Supabase Auth (email/password)
- Session management via SSR
- Protected routes via middleware
- Role-based access control

### Data Protection
- PII anonymization utilities
- Row Level Security (RLS) policies
- Encrypted at rest (Supabase)
- HTTPS only

### Rate Limiting
```typescript
// lib/rateLimit/middleware.ts
generalRateLimiter: 200 requests/minute
ipRateLimiter: 150 requests/minute
```

---

## 💰 Cost Structure

### Per-Complaint Costs
| Stage | Model | Cost/Complaint |
|-------|-------|----------------|
| Embeddings | Ada-002 | ~$0.0001 |
| Document Extraction | Sonnet 4 | ~$0.03 |
| Reranking | Cohere 3.5 | ~$0.005 |
| Analysis | Sonnet 4 | ~$0.15 |
| Letter (3-stage) | Haiku+Sonnet+Opus | ~$0.40 |
| **Total** | | **~$0.60-0.80** |

### Monthly Infrastructure
| Service | Cost |
|---------|------|
| Supabase Pro | ~$25 |
| Railway | ~$20 |
| Upstash Redis | ~$10 |
| OpenRouter (100 complaints) | ~$70 |
| **Total** | **~$125/month** |

---

## 🚀 Deployment

### Railway Configuration
```toml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
numReplicas = 1
healthcheckPath = "/api/health"
healthcheckTimeout = 300
```

### Environment Variables
```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=

# Optional
COHERE_API_KEY=           # Reranking
UPSTASH_REDIS_REST_URL=   # Rate limiting
UPSTASH_REDIS_REST_TOKEN=
STRIPE_SECRET_KEY=        # Payments
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=           # Email
ENCRYPTION_KEY=           # PII encryption
```

---

## 📈 Monitoring

### Health Endpoint
```
GET /api/health
Response: { status: "ok", timestamp: "..." }
```

### Logging
- Structured JSON logging
- Console output in development
- Railway log aggregation in production

### Quality Gates
- TypeScript strict mode
- ESLint + Prettier
- Husky pre-commit hooks
- SonarCloud integration

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `SYSTEM_OVERVIEW.md` | This document |
| `README.md` | Quick start |
| `DEPLOYMENT_GUIDE.md` | Deployment instructions |
| `THREE_STAGE_PIPELINE.md` | Letter generation details |
| `KNOWLEDGE_BASE_SYSTEM.md` | KB architecture |
| `TIME_TRACKING_GUIDE.md` | Time tracking setup |
| `TESTING_GUIDE.md` | Test methodology |
| `AI_PROMPTS_DOCUMENTATION.md` | All AI prompts |

---

**Last Updated:** December 3, 2025  
**Maintainer:** Oracle Consulting AI Team  
**Version:** 2.0.0
