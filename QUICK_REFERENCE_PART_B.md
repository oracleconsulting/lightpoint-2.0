# ⚡ Quick Reference: Part B Setup

## ✅ What's Done
- Created `v2-development` branch
- Added setup documentation
- Ready for infrastructure provisioning

## 📋 What You Need To Do Now

### Step 1: Create GitHub Repository (5 minutes)
```
1. Go to: https://github.com/oracleconsulting
2. Click: "New repository"
3. Name: lightpoint-v2
4. Private: YES
5. Do NOT initialize with README
6. Click: "Create repository"
7. Copy the URL (looks like):
   https://github.com/oracleconsulting/lightpoint-v2.git
```

### Step 2: Tell Me The URL
```
Just paste the repository URL in chat, like:
"GitHub repo: https://github.com/oracleconsulting/lightpoint-v2.git"
```

### Then I'll Do:
```bash
git remote add v2 <your-url>
git push v2 v2-development:main
```

---

## 🔄 After GitHub Step

### Step 3: Supabase Export (10 minutes)

**Get your v1.0 connection string:**
- Supabase Dashboard → lightpoint-production project
- Settings → Database → Connection string (URI format)

**Run in terminal:**
```bash
# Schema export
pg_dump "your_v1_connection_string" \
  --schema-only --no-owner --no-acl \
  > ~/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_schema.sql

# Data export  
pg_dump "your_v1_connection_string" \
  --data-only --no-owner --no-acl \
  --table=knowledge_base --table=precedents \
  > ~/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_essential_data.sql
```

### Step 4: Create Supabase v2 (5 minutes)
```
1. Go to: https://supabase.com/dashboard
2. Click: "New project"
3. Name: lightpoint-v2-dev
4. Password: (generate strong password, SAVE IT!)
5. Region: Same as v1.0
6. Click: "Create new project"
7. Wait 2 minutes for provisioning
```

### Step 5: Import to v2 (10 minutes)

**Get v2 connection string** (same as Step 3)

**Run in terminal:**
```bash
# Import schema
psql "your_v2_connection_string" \
  < ~/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_schema.sql

# Import data
psql "your_v2_connection_string" \
  < ~/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_essential_data.sql
```

### Step 6: Storage Buckets (10 minutes)

**In v2 Supabase Dashboard:**
- Storage → Create bucket: `complaint-documents` (private)
- Storage → Create bucket: `knowledge-base` (private)
- Copy policies from v1.0 (or I'll provide SQL)

### Step 7: Railway Deployment (15 minutes)

**Option A - Dashboard (easier):**
- Railway.app → New Project → Deploy from GitHub
- Choose: lightpoint-v2 repo
- Branch: main
- Add env vars (I'll provide list)

**Option B - CLI:**
```bash
railway init
# Follow prompts, I'll guide
```

---

## 📞 What To Tell Me

At each step, just say:

✅ **"GitHub done, URL: [paste-url]"**  
✅ **"Supabase v2 created, ready for import"**  
✅ **"Import complete, ready for Railway"**  
✅ **"Railway deployed, URL: [v2-url]"**

I'll guide you through each step!

---

## ⏱️ Total Time: ~90 minutes

- GitHub repo: 5 min
- Database export: 10 min
- Supabase v2: 5 min
- Database import: 10 min
- Storage setup: 10 min
- Railway deploy: 15 min
- Testing: 30 min
- Buffer: 5 min

---

## 🆘 If You Get Stuck

**Common issues:**

1. **pg_dump not found**: Install PostgreSQL client tools
2. **Connection timeout**: Check firewall/VPN
3. **Import errors**: Check connection string format
4. **Railway deploy fails**: Check env vars

Just tell me the error and I'll help!

---

## 📁 Files To Reference

- `PART_B_SETUP_INSTRUCTIONS.md` - Full detailed guide
- `V2_DEVELOPMENT_GUIDE.md` - v2.0 strategy overview
- `README.md` - v1.0 system documentation

---

**Current Status:** ✅ B1.1 Complete, ⏳ Waiting for GitHub repo

**Ready? Start with Step 1!** 🚀

