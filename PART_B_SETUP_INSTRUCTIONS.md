# Part B Setup Guide - Step by Step

## Current Progress
- ✅ B1.1 - Created v2-development branch
- ⏳ B1.2 - Create GitHub repository for v2
- ⏳ B2 - Duplicate Supabase project
- ⏳ B3 - Deploy to Railway
- ⏳ B4 - Verification testing

---

## B1.2: Create New GitHub Repository

### Manual Steps (You Need To Do This)

1. **Go to GitHub**: https://github.com/oracleconsulting
2. **Click "New repository"**
3. **Repository name:** `lightpoint-v2`
4. **Description:** `Lightpoint v2.0 Development - Major Refactoring Branch`
5. **Private repository:** ✅ Yes
6. **DO NOT initialize with README** (we already have one)
7. **Click "Create repository"**

8. **Copy the repository URL** (should be like):
   ```
   https://github.com/oracleconsulting/lightpoint-v2.git
   ```

### Once You Have The URL

**Tell me the repository URL and I'll continue with:**
```bash
git remote add v2 <your-url>
git push v2 v2-development:main
```

---

## B2: Duplicate Supabase Project

### B2.1: Export Current Database

**I need you to:**

1. **Get v1.0 Supabase connection string**:
   - Go to Supabase Dashboard → Your v1.0 project
   - Settings → Database → Connection string
   - Choose "URI" format
   - Copy the full connection string (will be like):
     ```
     postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
     ```

2. **Run these commands in your terminal** (replace with your connection string):

```bash
# Export schema only
pg_dump "your_connection_string_here" \
  --schema-only \
  --no-owner \
  --no-acl \
  > /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_schema.sql

# Export essential data (knowledge base, precedents, settings)
pg_dump "your_connection_string_here" \
  --data-only \
  --no-owner \
  --no-acl \
  --table=knowledge_base \
  --table=precedents \
  --table=organizations \
  --table=lightpoint_users \
  > /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_essential_data.sql
```

**Note:** We're NOT exporting actual complaints/documents (dev environment starts fresh for testing).

### B2.2: Create New Supabase Project

1. **Go to Supabase**: https://supabase.com/dashboard
2. **Click "New project"**
3. **Project name:** `lightpoint-v2-dev`
4. **Database password:** (generate a strong one, save it!)
5. **Region:** Choose same as v1.0 (probably `eu-west-1` or `us-east-1`)
6. **Pricing plan:** Same as v1.0
7. **Click "Create new project"**
8. **Wait ~2 minutes** for provisioning

### B2.3: Import Schema and Data

1. **Get v2.0 connection string** (same process as B2.1)
2. **Run these commands**:

```bash
# Import schema
psql "your_v2_connection_string_here" < /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_schema.sql

# Import essential data
psql "your_v2_connection_string_here" < /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_essential_data.sql
```

### B2.4: Replicate Storage Buckets

**In v2.0 Supabase Dashboard:**

1. Go to **Storage** → Create these buckets:
   - `complaint-documents` (private)
   - `knowledge-base` (private)
   
2. For each bucket, go to **Policies** and add:

```sql
-- Policy: Users can manage their org's files
CREATE POLICY "Users can upload documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'complaint-documents' AND
  auth.uid() IN (
    SELECT id FROM lightpoint_users 
    WHERE organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
  )
);

CREATE POLICY "Users can read their org's documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'complaint-documents' AND
  auth.uid() IN (
    SELECT id FROM lightpoint_users
    WHERE organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
  )
);

-- Repeat similar policies for 'knowledge-base' bucket
```

---

## B3: Update v2.0 Environment Variables

**In your project, create `.env.v2.local`:**

```bash
# === V2.0 DEVELOPMENT ENVIRONMENT ===

# New Supabase v2.0 credentials
NEXT_PUBLIC_SUPABASE_URL=https://[your-v2-project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-v2-anon-key]
SUPABASE_SERVICE_KEY=[your-v2-service-key]

# Same AI keys (can reuse from v1.0)
OPENROUTER_API_KEY=[same-as-v1]
OPENAI_API_KEY=[same-as-v1]

# New app URL (will update after Railway deployment)
NEXT_PUBLIC_APP_URL=https://lightpoint-v2.up.railway.app

# Development flag
NODE_ENV=development
```

**To use v2.0 locally:**
```bash
# Temporarily rename for local dev
mv .env.local .env.v1.local
mv .env.v2.local .env.local

# Run v2.0 dev server
npm run dev

# When done, switch back
mv .env.local .env.v2.local
mv .env.v1.local .env.local
```

---

## B4: Railway v2.0 Deployment

### Option 1: Using Railway Dashboard (Easier)

1. **Go to Railway**: https://railway.app/dashboard
2. **Click "New Project"**
3. **Choose "Deploy from GitHub repo"**
4. **Connect your `lightpoint-v2` repository**
5. **Choose branch:** `main` (this is v2-development pushed to v2 repo)
6. **Add environment variables** (copy from `.env.v2.local`)
7. **Deploy**

### Option 2: Using Railway CLI

```bash
# If Railway CLI not installed
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init

# Choose "Empty Project"
# Name: lightpoint-v2

# Link to GitHub repo (if created in Option 1)
railway link [project-id]

# Add environment variables
railway variables set NEXT_PUBLIC_SUPABASE_URL=https://...
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=...
railway variables set SUPABASE_SERVICE_KEY=...
railway variables set OPENROUTER_API_KEY=...
railway variables set OPENAI_API_KEY=...

# Deploy
railway up
```

---

## B5: Verification Checklist

Once v2.0 is deployed, test these features:

### Critical Path Testing

- [ ] **Access v2.0 URL** - Site loads without errors
- [ ] **Sign in** - Authentication works
- [ ] **Create complaint** - Can create new complaint
- [ ] **Upload document** - Can upload PDF/DOCX
- [ ] **Run analysis** - AI analysis completes
- [ ] **Generate letter** - 3-stage pipeline works
- [ ] **View letter** - Letter displays correctly
- [ ] **Check time log** - Time tracking works
- [ ] **Search knowledge base** - Vector search works
- [ ] **No console errors** - Browser console clean

### Database Verification

```bash
# Check if tables exist in v2.0
psql "v2_connection_string" -c "\dt"

# Check if knowledge base imported
psql "v2_connection_string" -c "SELECT COUNT(*) FROM knowledge_base;"

# Check if precedents imported
psql "v2_connection_string" -c "SELECT COUNT(*) FROM precedents;"
```

---

## What You Need To Provide

To continue, I need:

1. ✅ **GitHub v2 repository URL** (after you create it)
2. ✅ **v1.0 Supabase connection string** (for export)
3. ✅ **v2.0 Supabase project details** (after creation):
   - Project URL
   - Anon key
   - Service key
4. ✅ **Railway v2.0 deployment URL** (after deployment)

---

## Timeline Estimate

| Task | Time | Who |
|------|------|-----|
| Create GitHub repo | 5 min | You |
| Export v1.0 database | 10 min | You (I'll provide commands) |
| Create Supabase v2.0 | 5 min | You |
| Import to v2.0 | 10 min | You (I'll provide commands) |
| Configure storage | 10 min | You |
| Deploy to Railway | 15 min | You (I'll guide) |
| Verification testing | 30 min | Both |
| **Total** | **~90 minutes** | |

---

## Current Status

✅ **B1.1 Complete** - v2-development branch created  
⏳ **B1.2 Waiting** - Need GitHub repository URL from you

**Ready to continue? Let me know when you've:**
1. Created the GitHub repository
2. Have the repository URL

Then tell me and I'll continue with the next steps!

