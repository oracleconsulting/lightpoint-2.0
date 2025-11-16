# 🔐 STORAGE & AUTH SETUP - COMPLETE GUIDE

## 📦 PART 1: Storage Buckets (5 Minutes)

### Step 1: Run SQL in Supabase

1. Go to your Supabase project: https://supabase.com/dashboard/project/obcbbwwszkrcjwvzqvms
2. Click **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the entire contents of `SETUP_STORAGE_BUCKETS.sql`
5. Click **Run** (or press Cmd/Ctrl + Enter)

### Expected Output:
```
✅ Storage buckets created successfully!

📦 Buckets:
   - complaint-documents (10MB limit, private)
   - knowledge-base (10MB limit, private)

🔒 RLS Policies:
   - Upload, Select, Update, Delete enabled for authenticated users

🎯 Next Steps:
   1. Test document upload on lightpoint.uk
   2. Verify files appear in Supabase Storage UI
   3. Check that OCR extraction runs successfully

🚀 Storage is now ready for production use!
```

### Step 2: Verify in Supabase UI

1. Go to **Storage** in left sidebar
2. You should see two new buckets:
   - `complaint-documents`
   - `knowledge-base`
3. Click each bucket → **Policies** tab
4. Verify you see 4 policies for each bucket (INSERT, SELECT, UPDATE, DELETE)

### Step 3: Test Document Upload

1. Go to https://lightpoint.uk
2. Create a new complaint
3. Try uploading a PDF document
4. Should work now! ✅

---

## 🔐 PART 2: tRPC Authentication (In Progress)

### What's Been Done ✅

1. **Created Auth Context** (`lib/trpc/trpc.ts`)
   - Added `Context` type with `user`, `userId`, `organizationId`
   - Implemented `createContext()` to fetch Supabase session
   - Created `protectedProcedure` middleware (requires auth)
   - Created `adminProcedure` middleware (requires admin role)

2. **Updated tRPC Handler** (`app/api/trpc/[trpc]/route.ts`)
   - Now uses `createContext` instead of empty object
   - All requests now have auth context available

3. **Started Router Migration** (`lib/trpc/router.ts`)
   - ✅ `complaints.create` - Protected with org validation
   - ✅ `complaints.list` - Protected with forced org filtering
   - ✅ `complaints.getById` - Protected
   - ⏳ 35 more endpoints to migrate (see `AUTH_MIGRATION_PROGRESS.md`)

### What's Remaining ⏳

**Phase 2: Mutations** (16 endpoints)
- Update all `complaints.*` mutations to `protectedProcedure`
- Update all `analysis.*` mutations to `protectedProcedure`
- Update all `letters.*` mutations to `protectedProcedure`
- Update all `documents.*` mutations to `protectedProcedure`
- Update all `time.*` mutations to `protectedProcedure`
- Update all `knowledge.*` mutations to `protectedProcedure`

**Phase 3: Queries** (8 endpoints)
- Update all read-only endpoints to `protectedProcedure`

**Phase 4: Admin Endpoints** (8 endpoints)
- Update `users.*` to `adminProcedure`
- Update `tickets.*` to `adminProcedure`
- Update `aiSettings.*` (update operations) to `adminProcedure`

**Phase 5: Public Endpoints** (3 endpoints)
- Keep some endpoints as `publicProcedure` (read-only, non-sensitive)

### Why Phased Approach?

1. **Safety:** Test each phase before moving to next
2. **Verification:** Easier to identify which change broke something
3. **Minimal Downtime:** Can deploy incrementally
4. **Testing:** Can verify auth works correctly at each stage

### How Long Will This Take?

- **Automated Replacement:** ~30 minutes (careful find-replace)
- **Testing Each Phase:** ~15 minutes per phase
- **Total Estimate:** ~2-3 hours for complete migration

---

## 🚀 IMMEDIATE NEXT STEPS

### Option 1: Storage Only (Quickest - 5 mins)
```bash
# Just run the SQL in Supabase
# Test document upload on lightpoint.uk
# Done! ✅
```

### Option 2: Storage + Complete Auth Migration (2-3 hours)
```bash
# 1. Run storage SQL in Supabase (5 mins)
# 2. Complete router.ts migration (30-60 mins)
# 3. Test locally (15 mins)
# 4. Deploy to Railway (5 mins)
# 5. Test on production (15 mins)
# 6. Monitor for issues (30 mins)
```

### Option 3: Storage + Minimal Auth (30 mins)
```bash
# 1. Run storage SQL in Supabase (5 mins)
# 2. Keep current partial auth (already done)
# 3. Deploy what we have (5 mins)
# 4. Complete auth migration later (when time permits)
```

---

## 📋 What I Recommend

**Approach: Option 3 (Storage + Minimal Auth)**

**Reasoning:**
1. Storage is **required** for document uploads (blocking feature)
2. Current auth setup is **functional** (middleware protects pages, 3 endpoints protected)
3. Complete auth migration is **important but not urgent** (can do in next session)
4. Lets us test complaint analysis fixes immediately

**Action Plan:**
1. ✅ Run `SETUP_STORAGE_BUCKETS.sql` in Supabase (you do this)
2. ✅ Commit and deploy current auth changes:
   ```bash
   cd lightpoint-2.0
   git add -A
   git commit -m "feat: add storage buckets + partial tRPC auth (phase 1)"
   git push origin main
   ```
3. ✅ Test on https://lightpoint.uk:
   - Document upload (storage test)
   - Complaint analysis (verify both fixes work)
   - Complaint list (verify org filtering works)
4. ⏳ Complete auth migration in next session (use `AUTH_MIGRATION_PROGRESS.md` as guide)

---

## 🎯 Files You Need

**For Storage Setup:**
- `SETUP_STORAGE_BUCKETS.sql` - Run this in Supabase SQL Editor

**For Auth Migration (Reference):**
- `AUTH_MIGRATION_PROGRESS.md` - Progress tracker and guide
- `lib/trpc/trpc.ts` - Auth context and middleware (✅ complete)
- `lib/trpc/router.ts` - Router migration (8% complete, 3/38 endpoints)
- `app/api/trpc/[trpc]/route.ts` - Handler update (✅ complete)

**For Understanding:**
- `DEPLOYMENT_SUCCESS_AND_FIXES.md` - What's been fixed so far
- `UPGRADE_PLAN.md` - Full 3-4 week roadmap

---

## ✅ Success Criteria

**Storage:**
- [ ] SQL runs without errors in Supabase
- [ ] Two buckets visible in Storage UI
- [ ] 8 policies created (4 per bucket)
- [ ] Document upload works on lightpoint.uk

**Auth (Partial):**
- [ ] No TypeScript errors (already verified ✅)
- [ ] Complaint list shows only user's org complaints
- [ ] Creating complaint enforces org ownership
- [ ] Pages still accessible when logged in

**Overall System:**
- [ ] Login/logout works
- [ ] Complaint analysis completes successfully
- [ ] Knowledge base search works
- [ ] No console errors

---

## 🆘 Troubleshooting

### Storage SQL Fails
**Error:** "relation storage.buckets already has ..."
**Fix:** Buckets already exist, skip to Step 2

### Document Upload Still Fails
**Check:**
1. Buckets exist in Supabase Storage UI
2. Policies are attached to each bucket
3. Railway environment has correct `SUPABASE_SERVICE_KEY`
4. Check Railway logs for upload error details

### Auth Breaks Frontend
**Error:** "Cannot read property 'organizationId' of undefined"
**Fix:** Frontend component needs updating to not pass org ID
**Temporary Fix:** Keep `publicProcedure` for that endpoint until frontend updated

---

## 📞 Ready to Deploy?

When ready:
```bash
cd lightpoint-2.0
git status  # Check what's changed
git add -A
git commit -m "feat: add storage buckets + tRPC auth phase 1

- Created complaint-documents and knowledge-base buckets
- Added RLS policies for authenticated access
- Implemented tRPC auth context with Supabase session
- Protected complaints.create, complaints.list, complaints.getById
- Enforced organization-level isolation"
git push origin main
```

Railway will automatically deploy (2-3 minutes).

---

**Last Updated:** November 16, 2025  
**Status:** Storage SQL ready, Auth Phase 1 complete, ready to deploy

