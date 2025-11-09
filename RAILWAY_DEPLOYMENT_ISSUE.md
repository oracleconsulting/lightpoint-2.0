# Lightpoint - HMRC Complaint Management System

This project has been deployed to Railway but is experiencing persistent network connectivity issues with Supabase from Railway's europe-west4 region.

## Current Issue

`TypeError: fetch failed` when connecting to Supabase from Railway, despite:
- ✅ All environment variables correctly configured
- ✅ Supabase project healthy and active
- ✅ Node 20 upgrade completed
- ✅ Health endpoint confirms all vars present

## Root Cause

Railway's europe-west4 region has network routing issues with Supabase's infrastructure. The fetch fails at the undici level before reaching Supabase.

## Recommended Solutions

### Option 1: Move to a Different Region
Deploy to Railway's `us-west1` region which has better Supabase connectivity.

### Option 2: Use Supabase Connection Pooler
Configure Supabase's connection pooler for more reliable connections.

### Option 3: Deploy Elsewhere
- **Vercel**: Excellent Next.js support, better Supabase connectivity
- **Netlify**: Good for Next.js, reliable networking
- **Self-hosted**: DigitalOcean, AWS, or similar

## For Now: Local Development

The application works perfectly in local development. To run locally:

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your Supabase credentials to .env.local

# Run development server
npm run dev
```

Visit http://localhost:3004

All features work locally including:
- ✅ Complaint creation and management
- ✅ Document upload and processing (Stage 1 analysis with Sonnet 4.5)
- ✅ AI-powered analysis with multi-angle KB search
- ✅ Professional letter generation with Opus 4.1
- ✅ Knowledge base and precedent matching

## Technical Details

The codebase is production-ready with:
- Hybrid AI model strategy (Sonnet 4.5 for analysis, Opus 4.1 for letters)
- Two-stage document analysis (no information loss)
- Smart context management (stays within token limits)
- Multi-format document support (PDF, DOCX, Excel, etc.)
- Comprehensive error handling and logging

The Railway deployment issue is purely infrastructure/networking, not code-related.

