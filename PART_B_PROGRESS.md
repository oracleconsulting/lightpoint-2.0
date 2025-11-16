# Part B Progress Tracker

## ✅ Completed Steps

### B1: Repository Setup - COMPLETE
- ✅ Created `v2-development` branch locally
- ✅ Created GitHub repository: `lightpoint-2.0`
- ✅ Added remote: `https://github.com/oracleconsulting/lightpoint-2.0.git`
- ✅ Pushed v2-development to v2 repo as main branch
- ✅ Setup documentation created

**Repository Structure:**
- **v1.0 Production:** `oracleconsulting/lightpoint` (main branch)
- **v2.0 Development:** `oracleconsulting/lightpoint-2.0` (main branch)

---

## ⏳ Next: B2 - Supabase Project Duplication

### B2.1: Export v1.0 Database

**YOU NEED TO:**

1. **Get v1.0 Supabase Connection String:**
   - Go to: https://supabase.com/dashboard
   - Open your production Lightpoint project
   - Click: Settings → Database
   - Copy: "Connection string" (choose URI format)
   - It looks like: `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`

2. **Run these commands in your terminal:**

```bash
# Export schema (structure only)
pg_dump "YOUR_V1_CONNECTION_STRING_HERE" \
  --schema-only \
  --no-owner \
  --no-acl \
  > ~/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_schema.sql

# Export essential data (knowledge base, precedents, users)
pg_dump "YOUR_V1_CONNECTION_STRING_HERE" \
  --data-only \
  --no-owner \
  --no-acl \
  --table=knowledge_base \
  --table=precedents \
  --table=organizations \
  --table=lightpoint_users \
  > ~/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_essential_data.sql
```

**Note:** Replace `YOUR_V1_CONNECTION_STRING_HERE` with your actual connection string.

**What this does:**
- Exports all table structures (complaints, documents, time_log, etc.)
- Exports critical data (knowledge base docs, precedent templates, user accounts)
- Does NOT export actual complaints/documents (fresh start for dev)

---

### B2.2: Create Supabase v2.0 Project

**After export completes:**

1. **Create new Supabase project:**
   - Go to: https://supabase.com/dashboard
   - Click: "New project"
   - **Name:** `lightpoint-v2-dev`
   - **Database password:** Generate a strong one, **SAVE IT!**
   - **Region:** Choose same as v1.0 (check v1.0 project settings)
   - Click: "Create new project"
   
2. **Wait ~2 minutes** for provisioning

3. **Get v2.0 connection string** (same process as B2.1)

---

### B2.3: Import to v2.0

**Run these commands:**

```bash
# Import schema
psql "YOUR_V2_CONNECTION_STRING_HERE" \
  < ~/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_schema.sql

# Import essential data
psql "YOUR_V2_CONNECTION_STRING_HERE" \
  < ~/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_essential_data.sql
```

---

### B2.4: Setup Storage Buckets

**In v2.0 Supabase Dashboard:**

1. Go to: **Storage**
2. Create buckets:
   - `complaint-documents` (private)
   - `knowledge-base` (private)

3. **Set policies** (I'll provide SQL when you reach this step)

---

## 📞 Tell Me When You're Ready

**Option 1 - Need help with pg_dump/psql:**
Say: "Need help with database tools"

**Option 2 - Export complete:**
Say: "Database exported, files created"

**Option 3 - Need the export commands again:**
Say: "Show me export commands"

**Option 4 - Ready for Supabase v2 creation:**
Say: "Ready to create Supabase v2"

**Option 5 - Import complete:**
Say: "Import done, ready for storage setup"

---

## 🛠️ Troubleshooting

### pg_dump command not found?

**macOS:**
```bash
# Install PostgreSQL client tools
brew install postgresql
```

**Check installation:**
```bash
which pg_dump
pg_dump --version
```

### Connection timeout?
- Check if you're on VPN (might block database connections)
- Verify connection string format (should start with `postgresql://`)
- Check Supabase project isn't paused

### Import errors?
- Make sure schema imports before data
- Check connection string is for correct project
- Verify database password is correct

---

## ⏱️ Time Remaining

| Task | Time | Status |
|------|------|--------|
| B1: GitHub setup | 5 min | ✅ DONE |
| B2.1: Export v1 DB | 10 min | ⏳ NEXT |
| B2.2: Create Supabase v2 | 5 min | ⏳ After export |
| B2.3: Import to v2 | 10 min | ⏳ After creation |
| B2.4: Storage buckets | 10 min | ⏳ After import |
| B3: Railway deploy | 15 min | ⏳ After storage |
| B4: Verification | 30 min | ⏳ Final |
| **Total** | **85 min** | **~5 min done** |

---

**Current status:** ✅ GitHub complete, ⏳ Waiting for database export

Let me know when you're ready to proceed! 🚀

