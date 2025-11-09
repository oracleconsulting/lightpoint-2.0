# Lightpoint - HMRC Complaint Management System

A privacy-first, AI-powered HMRC complaint management system designed for accounting firms.

## 🚀 Features

- **Privacy-First Architecture**: All PII is automatically stripped before AI processing
- **Intelligent Document Analysis**: Automatically identifies Charter violations and CRG breaches
- **AI-Powered Letter Generation**: Creates professional, evidence-based complaint letters
- **Vector Search**: Finds relevant HMRC guidance and precedent cases
- **Time Tracking**: Automatic billing-ready time logs
- **Correspondence Management**: Track timelines and escalation triggers

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API routes with tRPC
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **LLM**: OpenRouter API (Claude-3 Opus)
- **Embeddings**: OpenAI text-embedding-ada-002
- **File Storage**: Supabase Storage
- **Deployment**: Railway

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- OpenRouter API key
- OpenAI API key

## 🏗️ Setup Instructions

### 1. Clone and Install

```bash
cd lightpoint-complaint-system
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key

# OpenRouter API (for Claude-3 Opus)
OPENROUTER_API_KEY=your_openrouter_api_key

# OpenAI API (for embeddings)
OPENAI_API_KEY=your_openai_api_key

# Encryption
ENCRYPTION_KEY=your_encryption_key_min_32_chars

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3004
```

### 3. Database Setup

Run the migration script in Supabase SQL Editor:

```bash
# Copy the migration file
cat supabase/migrations/001_initial_schema.sql
```

Execute the SQL in your Supabase project dashboard.

### 4. Create Storage Bucket

In Supabase Dashboard:
1. Go to Storage
2. Create a new bucket named `complaint-documents`
3. Set bucket to private
4. Add RLS policies as needed

### 5. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3004

## 📁 Project Structure

```
lightpoint-complaint-system/
├── app/
│   ├── api/
│   │   ├── documents/upload/     # Document upload endpoint
│   │   └── trpc/[trpc]/          # tRPC API routes
│   ├── dashboard/                # Main dashboard
│   ├── complaints/
│   │   ├── new/                  # Create complaint
│   │   └── [id]/                 # Complaint detail
│   ├── knowledge/                # Knowledge base
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── complaint/
│   │   ├── ComplaintWizard.tsx
│   │   ├── DocumentUploader.tsx
│   │   ├── TimelineView.tsx
│   │   └── LetterPreview.tsx
│   ├── analysis/
│   │   ├── ViolationChecker.tsx
│   │   └── PrecedentMatcher.tsx
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── supabase/
│   │   └── client.ts             # Supabase clients
│   ├── trpc/
│   │   ├── trpc.ts
│   │   ├── router.ts
│   │   └── Provider.tsx
│   ├── openrouter/
│   │   └── client.ts             # Claude integration
│   ├── privacy.ts                # PII anonymization
│   ├── embeddings.ts             # OpenAI embeddings
│   ├── vectorSearch.ts           # Vector similarity search
│   ├── documentProcessor.ts      # PDF processing
│   ├── timeTracking.ts           # Time logging
│   ├── correspondenceTracking.ts # Timeline management
│   └── utils.ts
├── types/
│   └── database.ts               # TypeScript types
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## 🔐 Privacy & GDPR Compliance

### PII Protection

All personal data is automatically anonymized before AI processing:
- UK Unique Taxpayer Reference (UTR)
- National Insurance Numbers (NINO)
- Bank account numbers and sort codes
- Email addresses and phone numbers
- Names and addresses
- UK postcodes

### Data Flow

1. **Document Upload** → Stored in Supabase Storage (encrypted)
2. **Text Extraction** → PDF parsed to text
3. **Anonymization** → PII removed using regex patterns
4. **AI Analysis** → Only anonymized data sent to OpenRouter
5. **Storage** → Only non-PII data stored in database

### Audit Trail

All data access is logged in `audit_logs` table for GDPR compliance.

## 🤖 AI Features

### Document Analysis

Uses Claude-3 Opus to:
- Identify HMRC Charter violations
- Find CRG guidance breaches
- Assess complaint validity
- Estimate success rates
- Recommend actions

### Letter Generation

Generates professional complaint letters with:
- Formal structure and tone
- Specific Charter citations
- Chronological timeline
- Required remedies
- Fee recovery statements

### Vector Search

Finds relevant information using semantic similarity:
- HMRC Charter commitments
- CRG guidance sections
- Historical precedent cases
- Similar complaint patterns

## 📊 Database Schema

### Core Tables

- `organizations` - Accounting firms
- `users` - Accountants
- `complaints` - Complaint cases
- `documents` - Uploaded files
- `knowledge_base` - HMRC guidance
- `precedents` - Past cases
- `time_logs` - Billing data
- `audit_logs` - GDPR compliance

### Vector Extensions

Uses pgvector with OpenAI embeddings (1536 dimensions) for semantic search.

## 🚢 Deployment to Railway

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login and Initialize

```bash
railway login
railway init
```

### 3. Set Environment Variables

```bash
railway variables set NEXT_PUBLIC_SUPABASE_URL=xxx
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
railway variables set SUPABASE_SERVICE_KEY=xxx
railway variables set OPENROUTER_API_KEY=xxx
railway variables set OPENAI_API_KEY=xxx
railway variables set ENCRYPTION_KEY=xxx
railway variables set NEXT_PUBLIC_APP_URL=https://your-app.railway.app
```

### 4. Deploy

```bash
railway up
```

## 🧪 Testing

To test the system:

1. Create a test complaint with anonymized client reference
2. Upload a sample HMRC letter (PDF)
3. Run analysis to identify violations
4. Generate a complaint letter
5. Review precedent matches

## 📖 Initial Data Seeding

To populate the knowledge base:

1. Import HMRC Charter commitments
2. Import CRG guidance sections
3. Import sanitized precedent cases
4. Generate embeddings for all entries

Example script (create `scripts/seed-knowledge.ts`):

```typescript
import { addToKnowledgeBase } from '@/lib/vectorSearch';

const charterCommitments = [
  {
    category: 'HMRC Charter',
    title: 'Respect You',
    content: 'We will treat you with courtesy and respect at all times...',
    source: 'HMRC Charter 2020'
  },
  // Add more...
];

async function seed() {
  for (const item of charterCommitments) {
    await addToKnowledgeBase(
      item.category,
      item.title,
      item.content,
      item.source
    );
  }
}
```

## 🔧 Configuration

### Time Estimates

Adjust time tracking estimates in `lib/timeTracking.ts`:

```typescript
export const TIME_ESTIMATES = {
  document_upload: 5,
  document_review: 15,
  analysis: 20,
  letter_generation: 45,
  letter_review: 30,
  response_drafting: 40,
  escalation_preparation: 60,
  research: 30,
  precedent_review: 20,
};
```

### Escalation Rules

Customize escalation triggers in `lib/correspondenceTracking.ts`.

## 📝 API Routes

### tRPC Procedures

- `complaints.create` - Create new complaint
- `complaints.list` - List complaints
- `complaints.getById` - Get complaint details
- `complaints.updateStatus` - Update status
- `analysis.analyzeDocument` - Run AI analysis
- `letters.generateComplaint` - Generate letter
- `letters.generateResponse` - Generate response
- `documents.list` - List documents
- `time.getComplaintTime` - Get time logs
- `knowledge.search` - Vector search

## 🛡️ Security Features

- Row Level Security (RLS) in Supabase
- Encrypted file storage
- API key protection
- GDPR-compliant audit logs
- No PII in AI processing
- Signed URLs for file access

## 📞 Support

For issues or questions, refer to:
- HMRC Charter documentation
- Complaint Resolution Guidance (CRG)
- Supabase documentation
- OpenRouter API docs

## 📄 License

Private - for internal use only

---

**Built with privacy and professionalism in mind** 🔐⚖️

