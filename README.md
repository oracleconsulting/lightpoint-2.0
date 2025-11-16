# Lightpoint HMRC Complaints Management System

## Current Version: 1.0 (Production)

**Status:** ✅ Active Production System  
**Deployment:** Railway (auto-deploy from `main` branch)  
**Database:** Supabase PostgreSQL + Vector Search  
**AI Provider:** OpenRouter (Claude Opus 4.1, Sonnet 4.5, Haiku 4.5)

---

## Quick Start

```bash
# Install dependencies
npm install

# Create .env.local with required variables (see below)
cp .env.example .env.local

# Run development server
npm run dev

# Access at http://localhost:3004
```

---

## Key Features

### ✅ Currently Working
- **Complaint Letter Generation**: 3-stage AI pipeline (Fact Extraction → Structure → Tone)
- **Document Processing**: PDF, DOCX, Excel, images (with OCR)
- **PII Sanitization**: Automatic redaction of NINO, UTR, emails, phone numbers
- **Knowledge Base**: HMRC guidance (CHG, CRG, Charter) with vector search + reranking
- **Precedent Library**: Historical complaint templates for tone/structure matching
- **Time Tracking**: Automated billable time calculation in 12-minute segments
- **User Management**: Role-based access (Admin, Manager, Staff)
- **Practice Settings**: Firm details, charge-out rates, letterhead
- **Status Management**: Assessment → Active → Escalated → Resolved → Closed

### 🚧 In Development
- Enhanced CHG violation detection for complaint handling failures
- Professional integrity checks (honest assessment, no confirmation bias)
- Reranking integration for improved search precision

---

## Environment Variables Required

Create `.env.local` in the project root:

```bash
# Supabase (Database + Auth + Storage)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# OpenRouter (AI Provider)
OPENROUTER_API_KEY=sk-or-v1-your-key

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-your-openai-key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-app.railway.app
NODE_ENV=production
```

---

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | Next.js 14, React, TypeScript | UI framework |
| **API** | tRPC | Type-safe client-server communication |
| **Database** | Supabase (PostgreSQL + pgvector) | Data storage + vector search |
| **Auth** | Supabase Auth | User authentication |
| **Storage** | Supabase Storage | Document storage |
| **AI** | OpenRouter | LLM access (Claude, GPT-4o) |
| **Embeddings** | OpenAI `text-embedding-ada-002` | Vector search |
| **Reranking** | Cohere Rerank 3.5, Voyage Rerank 2.5 | Search precision |
| **UI** | shadcn/ui, Tailwind CSS | Component library |
| **Deployment** | Railway | Cloud platform |

---

## Project Structure

```
lightpoint-complaint-system/
├── app/                          # Next.js 14 app directory
│   ├── complaints/[id]/         # Complaint detail pages
│   ├── knowledge-base/          # KB management (admin)
│   ├── settings/                # Practice settings
│   └── api/trpc/[trpc]/         # tRPC API routes
├── components/                   # React components
│   ├── complaints/              # Complaint UI components
│   ├── documents/               # Document viewer/upload
│   ├── kb/                      # Knowledge base components
│   └── ui/                      # shadcn/ui base components
├── lib/                         # Core libraries
│   ├── openrouter/              # AI clients (3-stage pipeline)
│   ├── search/                  # Vector + hybrid search
│   ├── trpc/                    # tRPC router (1,830 lines)
│   ├── embeddings.ts            # Embedding generation
│   ├── privacy.ts               # PII sanitization
│   ├── modelConfig.ts           # AI model configuration
│   └── supabase.ts              # Supabase client
├── supabase/                    # Database migrations + SQL
│   ├── migrations/              # Schema migrations
│   └── *.sql                    # Setup/utility scripts
└── public/                      # Static assets
```

---

## Database Schema (Key Tables)

| Table | Purpose |
|-------|---------|
| `complaints` | Main complaint records |
| `complaint_documents` | Uploaded documents |
| `complaint_timeline` | Activity log |
| `time_log` | Billable time tracking |
| `knowledge_base` | HMRC guidance documents |
| `precedents` | Historical complaint templates |
| `lightpoint_users` | User profiles |
| `complaint_assignments` | User-complaint assignments |
| `management_tickets` | Internal flags/issues |
| `kb_chat_conversations` | Knowledge base chat sessions |
| `ai_prompts` | Versioned system prompts |

---

## AI Pipeline Architecture

### Stage 0: Initial Analysis
**Model:** Claude Sonnet 4.5 (1M context)  
**Purpose:** Assess complaint viability, identify violations  
**Output:** JSON with violations, timeline, success rate, compensation estimates

### Stage 1: Fact Extraction
**Model:** Claude Haiku 4.5 (200K context, fast)  
**Purpose:** Extract timeline, violations, financial facts from analysis  
**Output:** Structured fact sheet

### Stage 2: Letter Structuring  
**Model:** Claude Sonnet 4.5 (1M context)  
**Purpose:** Organize facts into professional UK complaint letter  
**Output:** Structured letter with proper sections

### Stage 3: Professional Tone
**Model:** Claude Opus 4.1 (200K context, superior language)  
**Purpose:** Enhance tone, ensure professional firmness  
**Output:** Final complaint letter

### Supporting Systems
- **Knowledge Base Search**: Multi-angle vector search + BM25 hybrid search + reranking
- **Precedent Matching**: Find similar historical complaints for tone/structure
- **PII Sanitization**: Redact sensitive data before AI processing

---

## Known Issues & Limitations

### Security
- ❌ No authentication on tRPC endpoints (relies solely on Supabase RLS)
- ❌ No rate limiting on AI endpoints (cost risk)
- ⚠️ Practice settings stored in localStorage (not database)

### Code Quality
- ❌ Monolithic tRPC router (1,830 lines in single file)
- ❌ No test coverage
- ❌ Console.log statements throughout (should use structured logging)
- ❌ Inconsistent error handling

### Performance
- ⚠️ No caching layer for vector search results
- ⚠️ Large bundle size (no code splitting on heavy components)
- ⚠️ Three-stage letter generation can timeout (5-minute limit set)

### Features
- ⚠️ Document viewer issues with some file types (scanned PDFs, large DOCx)
- ⚠️ OCR failures not surfaced to user
- ⚠️ No bulk document assessment yet
- ⚠️ RSS feed for knowledge base not implemented

---

## Deployment

### Automatic Deployment (Railway)
```bash
# Any push to main branch auto-deploys
git push origin main

# Monitor deployment at:
# https://railway.app/project/your-project-id
```

### Manual Deployment
```bash
# Build locally
npm run build

# Railway CLI
railway up
```

### Supabase Migrations
```bash
# Run migrations manually via Supabase SQL Editor
# Files in: supabase/migrations/*.sql
```

---

## Common Tasks

### Adding a New AI Prompt
1. Update `lib/openrouter/three-stage-client.ts` or `lib/openrouter/client.ts`
2. Test locally with `npm run dev`
3. Commit and push to deploy

### Adding New Knowledge Base Documents
1. Navigate to `/knowledge-base` (admin only)
2. Click "Upload Document"
3. System will extract text, generate embeddings, compare against existing
4. Approve or reject staged document

### Updating Practice Settings
1. Navigate to `/settings`
2. Update firm name, address, contact, charge-out rate
3. Click "Save Settings"
4. **Note:** Stored in localStorage, not database

### Viewing System Logs
```bash
# Railway deployment logs
railway logs

# Or via Railway dashboard
```

---

## Testing Checklist (After Changes)

- [ ] Create new complaint
- [ ] Upload documents (PDF, DOCX, image)
- [ ] Run analysis (check console for errors)
- [ ] Generate letter (3-stage pipeline)
- [ ] Verify letter quality (CHG citations, dates, firm details)
- [ ] Check time log entries (12-minute segments)
- [ ] Test knowledge base search
- [ ] Test document viewer
- [ ] Check for console errors in browser

---

## Migration to v2.0

**Status:** Planned  
**Timeline:** 3-4 weeks  
**Strategy:** Parallel development environment

### Planned v2.0 Improvements
- ✅ Proper tRPC authentication
- ✅ Split monolithic router into modules
- ✅ Comprehensive error handling
- ✅ Structured logging (Winston)
- ✅ Testing infrastructure (Vitest)
- ✅ Rate limiting
- ✅ CI/CD pipeline (GitHub Actions)
- ✅ Error monitoring (Sentry)
- ✅ Performance optimizations (caching, code splitting)

See `DUAL_ENVIRONMENT_STRATEGY.md` for migration plan.

---

## Support & Maintenance

**Primary Developer:** AI Assistant  
**Client Contact:** jhoward@rpgcc.co.uk  
**Repository:** https://github.com/oracleconsulting/lightpoint  

---

## License

Proprietary - RPGCC LLP

---

## Recent Updates

### November 16, 2025
- ✅ Added professional integrity checks (honest assessment)
- ✅ Enhanced CHG violation detection for complaint handling
- ✅ Fixed DT-Individual financial context understanding
- ✅ Added security headers
- ✅ Updated Next.js to 14.2.33 (security patches)
- ✅ Removed unused code files

### November 9-15, 2025
- Added three-stage letter generation pipeline
- Implemented reranking for search precision
- Added user management and role-based access
- Implemented time tracking and billing
- Added practice settings
- Enhanced knowledge base with CHG documents
