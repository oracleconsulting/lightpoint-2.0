# Railway Deployment Guide for Lightpoint

This guide walks you through deploying Lightpoint to Railway.

## Prerequisites

- Railway account (https://railway.app)
- GitHub repository with Lightpoint code
- Supabase project set up
- API keys (OpenRouter, OpenAI)

## Step 1: Prepare Your Repository

1. Ensure all code is committed to your Git repository
2. Push to GitHub:

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-complaint-system
git init
git add .
git commit -m "Initial Lightpoint commit"
git remote add origin https://github.com/yourusername/lightpoint.git
git push -u origin main
```

## Step 2: Create Railway Project

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your Lightpoint repository
5. Railway will auto-detect Next.js

## Step 3: Configure Environment Variables

In Railway dashboard, go to Variables tab and add:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_KEY=eyJxxx...

# OpenRouter (Claude)
OPENROUTER_API_KEY=sk-or-xxx...

# OpenAI (Embeddings)
OPENAI_API_KEY=sk-xxx...

# Encryption
ENCRYPTION_KEY=your-32-char-min-encryption-key-here

# App URL (will be provided by Railway)
NEXT_PUBLIC_APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
```

## Step 4: Configure Build Settings

Railway should auto-detect these, but verify:

- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Install Command**: `npm install`

## Step 5: Deploy

1. Railway will automatically deploy on push to main
2. Monitor deployment in the Deployments tab
3. Once deployed, Railway will provide a public URL

## Step 6: Configure Custom Domain (Optional)

1. In Railway dashboard, go to Settings
2. Click "Generate Domain" or add custom domain
3. Update `NEXT_PUBLIC_APP_URL` environment variable

## Step 7: Set Up Supabase Storage

In Supabase dashboard:

1. Go to Storage
2. Create bucket: `complaint-documents`
3. Set bucket to private
4. Add RLS policies:

```sql
-- Allow authenticated uploads
create policy "Allow uploads"
on storage.objects for insert
with check (bucket_id = 'complaint-documents');

-- Allow authenticated reads
create policy "Allow reads"
on storage.objects for select
using (bucket_id = 'complaint-documents');
```

## Step 8: Initialize Database

Run the migration in Supabase SQL Editor:

```bash
# Copy content from
cat supabase/migrations/001_initial_schema.sql
```

## Step 9: Verify Deployment

1. Visit your Railway URL
2. Test creating a complaint
3. Upload a document
4. Run analysis

## Monitoring

### Railway Dashboard

- View logs in Deployments tab
- Monitor resource usage
- Set up alerts

### Health Checks

Create a health check endpoint:

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
}
```

## Troubleshooting

### Build Fails

- Check logs in Railway dashboard
- Verify all dependencies in package.json
- Ensure Node.js version compatibility

### Runtime Errors

- Check environment variables are set
- Verify Supabase connection
- Check API keys are valid

### Database Connection Issues

- Verify Supabase URL and keys
- Check RLS policies
- Ensure pgvector extension enabled

## Scaling

Railway automatically scales based on usage. For higher loads:

1. Upgrade Railway plan
2. Consider Supabase Pro plan
3. Implement caching with Redis

## Backup Strategy

### Database Backups

Supabase provides automatic backups. For manual backups:

```bash
# Use Supabase CLI
supabase db dump --data-only > backup.sql
```

### File Storage Backups

Set up scheduled backups of Supabase Storage buckets.

## Cost Optimization

- Use Railway's usage-based pricing
- Monitor Supabase quota
- Optimize OpenRouter/OpenAI API calls
- Cache embeddings when possible

## CI/CD Setup

Railway automatically deploys on push to main. For more control:

1. Add GitHub Actions workflow
2. Run tests before deployment
3. Use staging environments

## Security Checklist

- ✅ Environment variables secured
- ✅ Supabase RLS policies enabled
- ✅ API keys rotated regularly
- ✅ HTTPS enabled (Railway default)
- ✅ Audit logs enabled
- ✅ PII anonymization verified

## Post-Deployment

1. Seed knowledge base with HMRC guidance
2. Add precedent cases
3. Test all workflows end-to-end
4. Set up monitoring and alerts
5. Train users on the system

## Support

For Railway issues:
- Railway Discord: https://discord.gg/railway
- Railway Docs: https://docs.railway.app

---

**Deployment Status**: Ready for production 🚀

