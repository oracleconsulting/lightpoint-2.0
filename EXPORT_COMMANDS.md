# Database Export Commands for v2.0 Setup

## Your v1.0 Connection Info
- **Project:** obcbbwwszkrcjwvzqvms
- **Region:** supabase.co
- **Port:** 5432

---

## STEP 1: Copy Your Full Connection String

From the Supabase screenshot, your connection string is:
```
postgresql://postgres:[YOUR_PASSWORD]@db.obcbbwwszkrcjwvzqvms.supabase.co:5432/postgres
```

**You need to replace `[YOUR_PASSWORD]` with your actual database password.**

**Where to find your password:**
- If you saved it when creating the project: Use that
- If you don't have it: Click "Database Settings" link in Supabase to reset it

---

## STEP 2: Run Export Commands

**Once you have the full connection string with password, run these in your terminal:**

### Export Schema (Database Structure)
```bash
pg_dump "postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.obcbbwwszkrcjwvzqvms.supabase.co:5432/postgres" \
  --schema-only \
  --no-owner \
  --no-acl \
  --schema=public \
  > ~/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_schema.sql
```

### Export Essential Data
```bash
pg_dump "postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.obcbbwwszkrcjwvzqvms.supabase.co:5432/postgres" \
  --data-only \
  --no-owner \
  --no-acl \
  --schema=public \
  --table=knowledge_base \
  --table=precedents \
  --table=organizations \
  --table=lightpoint_users \
  > ~/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_essential_data.sql
```

---

## STEP 3: Verify Export

After running the commands, check the files were created:

```bash
ls -lh ~/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_*.sql
```

You should see:
- `v2_schema.sql` (should be 50-200 KB with table structures)
- `v2_essential_data.sql` (size depends on your knowledge base)

---

## 🆘 If pg_dump Not Found

**Install PostgreSQL client tools:**

```bash
# macOS
brew install postgresql@15

# Verify installation
which pg_dump
pg_dump --version
```

---

## 🔐 Security Note

**NEVER commit these SQL files to git** - they may contain sensitive data.

The `.gitignore` should already exclude them, but verify:
```bash
cat .gitignore | grep -E "\.sql$|v2_"
```

If not listed, add to `.gitignore`:
```
v2_schema.sql
v2_essential_data.sql
*.sql.backup
```

---

## ✅ When Complete

Tell me:
- **"Export complete"** - and I'll guide you through creating Supabase v2
- **"Got error: [error message]"** - and I'll help troubleshoot
- **"Need password reset help"** - and I'll guide you through it

---

## Quick Reference

**Your v1.0 Supabase:**
- URL: https://obcbbwwszkrcjwvzqvms.supabase.co
- Connection: `postgresql://postgres:PASSWORD@db.obcbbwwszkrcjwvzqvms.supabase.co:5432/postgres`

**Export files location:**
- Schema: `~/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_schema.sql`
- Data: `~/Documents/OracleConsultingAI/lightpoint-complaint-system/v2_essential_data.sql`

---

**Ready to run the export? Just let me know if you need help with the password or pg_dump installation!** 🔐

