# 🎯 LIGHTPOINT v2.0 - SEPARATE PROJECT FOLDER

**Location:** `/Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0`

**Status:** ✅ Isolated development environment  
**Purpose:** All v2.0 changes happen HERE (not in lightpoint-complaint-system)

---

## 📁 DUAL FOLDER STRUCTURE

```
/OracleConsultingAI/
├── lightpoint-complaint-system/      ← v1.0 PRODUCTION (DON'T TOUCH)
│   ├── .env.local (v1.0 Supabase)
│   ├── git → oracleconsulting/lightpoint
│   ├── Railway → v1.0 production
│   ├── Port: 3004
│   └── Status: LIVE, serving real users
│
└── lightpoint-2.0/                    ← v2.0 DEVELOPMENT (WORK HERE) ⭐
    ├── .env.local (v2.0 Supabase)
    ├── git → oracleconsulting/lightpoint-2.0
    ├── Railway → v2.0 project
    ├── Port: 3005
    └── Status: Development, testing only
```

---

## ✅ COMPLETE ISOLATION ACHIEVED

| Resource | v1.0 Production | v2.0 Development | Isolated? |
|----------|----------------|------------------|-----------|
| **Folder** | `lightpoint-complaint-system` | `lightpoint-2.0` | ✅ YES |
| **Database** | Old Supabase | obcbbwwszkrcjwvzqvms | ✅ YES |
| **GitHub** | oracleconsulting/lightpoint | oracleconsulting/lightpoint-2.0 | ✅ YES |
| **Git Remote** | origin | origin (different repo) | ✅ YES |
| **Railway** | v1.0 project | v2.0 project | ✅ YES |
| **Port** | 3004 | 3005 | ✅ YES |
| **Node Modules** | Separate install | Separate install | ✅ YES |

**Result:** ❌ IMPOSSIBLE to accidentally modify v1.0!

---

## 🚀 WORKING WITH v2.0

### Start Development Server

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0

# First time setup (already done)
npm install

# Start development server
npm run dev
# Runs on: http://localhost:3005
```

### Make Changes

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0

# Edit files
# All changes are in v2.0 folder only
# v1.0 folder remains untouched

# Commit changes
git add .
git commit -m "feat(v2): your feature"
git push origin main
```

### Deploy to Railway

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0

# Link to v2.0 Railway project (first time only)
railway login
railway link
# Select: lightpoint-v2

# Set environment variables (first time only)
railway variables set NEXT_PUBLIC_SUPABASE_URL="https://obcbbwwszkrcjwvzqvms.supabase.co"
# ... (see RAILWAY_DEPLOY_GUIDE.md)

# Deploy
railway up
```

---

## 🛡️ v1.0 HOTFIX WORKFLOW (If Needed)

If v1.0 production needs a critical fix:

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-complaint-system

# Make minimal fix
# Edit file(s)

# Deploy
git add .
git commit -m "fix: critical production fix"
git push origin main

# Railway auto-deploys to v1.0 production
```

**Then:** Port fix to v2.0 if needed:

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0

# Apply same fix
# Or cherry-pick commit
# git cherry-pick [commit-hash]

git push origin main
```

---

## 📋 CURRENT STATUS

### v2.0 Folder Setup ✅

- [x] Folder created: `lightpoint-2.0`
- [x] Git cloned from: `oracleconsulting/lightpoint-2.0`
- [x] Dependencies installed: `npm install`
- [x] `.env.local` created with v2.0 credentials
- [x] Port configured: 3005 (avoids v1.0 conflict)

### Next Steps

- [ ] Test local dev server: `cd lightpoint-2.0 && npm run dev`
- [ ] Deploy to Railway from this folder
- [ ] Run all future v2.0 development from this folder

---

## 🎯 KEY RULE

**FROM NOW ON:**

### ✅ DO - Work in v2.0 folder
```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0
# All v2.0 work happens here
```

### ❌ DON'T - Modify v1.0 folder
```bash
# ONLY touch lightpoint-complaint-system for critical hotfixes
# Otherwise leave it alone
```

---

## 🚀 DEPLOY v2.0 NOW

### From v2.0 Folder:

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0

# Link to Railway v2.0 project
railway login
railway link
# Create/select: lightpoint-v2

# Set environment variables
railway variables set NEXT_PUBLIC_SUPABASE_URL="https://obcbbwwszkrcjwvzqvms.supabase.co"
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9iY2Jid3dzemtyY2p3dnpxdm1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMyODA1MzIsImV4cCI6MjA3ODg1NjUzMn0.3asQpbl7IWDZW9nSSBhCEJwnXnZzAsy_XqyS4-947nY"
railway variables set SUPABASE_SERVICE_KEY="<YOUR_SUPABASE_SERVICE_KEY>"
railway variables set OPENROUTER_API_KEY="<YOUR_OPENROUTER_API_KEY>"
railway variables set OPENAI_API_KEY="<YOUR_OPENAI_API_KEY>"
railway variables set NODE_ENV="production"

# Deploy
railway up
```

---

## 📊 VERIFICATION

### Check you're in the right folder:

```bash
pwd
# Expected: /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0
# NOT: lightpoint-complaint-system
```

### Check git remote:

```bash
git remote -v
# Expected: origin → lightpoint-2.0
# NOT: lightpoint or multiple remotes
```

### Check environment:

```bash
cat .env.local | grep SUPABASE_URL
# Expected: obcbbwwszkrcjwvzqvms
# NOT: old Supabase URL
```

---

## 🎉 BENEFITS OF SEPARATE FOLDERS

1. **Mental Clarity:** Different folder = different project
2. **No Accidents:** Can't accidentally modify v1.0
3. **Parallel Development:** Can run both simultaneously
4. **Clean Git History:** Each folder has its own history
5. **Different Dependencies:** Can upgrade v2.0 packages safely
6. **Port Isolation:** v1.0 on 3004, v2.0 on 3005

---

**Status:** ✅ v2.0 FOLDER READY  
**Location:** `/Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0`  
**Next:** Deploy from this folder: `cd lightpoint-2.0 && railway up`

