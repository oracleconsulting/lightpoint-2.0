# tRPC Authentication Migration Guide

## ✅ Completed Steps

1. **Created auth context** in `lib/trpc/trpc.ts`
   - Added `Context` interface with `user`, `userId`, `organizationId`
   - Implemented `createContext()` to fetch Supabase session
   - Created `protectedProcedure` middleware
   - Created `adminProcedure` middleware for admin-only ops

2. **Updated tRPC handler** in `app/api/trpc/[trpc]/route.ts`
   - Now uses `createContext` instead of empty object
   - Auth context available to all procedures

3. **Started router migration** in `lib/trpc/router.ts`
   - Updated `complaints.create` to `protectedProcedure` with org validation
   - Updated `complaints.list` to `protectedProcedure` with forced org filtering
   - Updated `complaints.getById` to `protectedProcedure`

## 🔄 Migration Strategy

Since the router is 1830 lines, we'll use a **phased rollout**:

### Phase 1: Critical Data Endpoints (STARTED ✅)
✅ `complaints.create` - Prevent unauthorized complaint creation
✅ `complaints.list` - Enforce organization isolation
✅ `complaints.getById` - Check ownership before showing

### Phase 2: Mutation Endpoints (NEXT)
These endpoints modify data and are HIGH priority:
- [ ] `complaints.updateStatus`
- [ ] `complaints.updateReference`
- [ ] `complaints.assign`
- [ ] `complaints.delete`
- [ ] `complaints.addTimelineEvent`
- [ ] `analysis.analyzeDocument`
- [ ] `letters.generateComplaint`
- [ ] `letters.save`
- [ ] `letters.lock`
- [ ] `letters.markAsSent`
- [ ] `documents.retryOCR`
- [ ] `time.logActivity`
- [ ] `time.deleteActivity`
- [ ] `knowledge.addPrecedent`
- [ ] `knowledge.approveStaged`
- [ ] `knowledge.uploadForComparison`

### Phase 3: Query Endpoints (MEDIUM priority)
These read data but need auth:
- [ ] `documents.list`
- [ ] `documents.getSignedUrl`
- [ ] `letters.list`
- [ ] `letters.getById`
- [ ] `time.getComplaintTime`
- [ ] `knowledge.search`
- [ ] `knowledge.list`

### Phase 4: Admin Endpoints (Use `adminProcedure`)
These need elevated permissions:
- [ ] `users.create`
- [ ] `users.update`
- [ ] `users.toggleStatus`
- [ ] `users.invite`
- [ ] `tickets.create`
- [ ] `tickets.update`
- [ ] `aiSettings.updatePrompt`
- [ ] `aiSettings.resetPrompt`

### Phase 5: Public Endpoints (Keep `publicProcedure`)
These are intentionally public:
- [ ] `aiSettings.listPrompts` (read-only, can be public)
- [ ] `aiSettings.getPrompt` (read-only, can be public)
- [ ] `knowledge.getTimeline` (read-only, returns empty if function missing)

## 🛠️ How to Apply Each Change

For each procedure, follow this pattern:

### Before:
```typescript
someEndpoint: publicProcedure
  .input(z.object({ ... }))
  .mutation(async ({ input }) => {
    // No auth check
    const { data } = await supabase.from('table').insert(input);
    return data;
  })
```

### After (Protected):
```typescript
someEndpoint: protectedProcedure
  .input(z.object({ ... }))
  .mutation(async ({ input, ctx }) => {
    // Auth automatically checked by middleware
    // Add organization validation if needed
    if (input.organizationId && input.organizationId !== ctx.organizationId) {
      throw new Error('Unauthorized: Cannot access different organization');
    }
    
    const { data } = await supabase.from('table').insert({
      ...input,
      created_by: ctx.userId, // Use authenticated user ID
      organization_id: ctx.organizationId, // Use authenticated org ID
    });
    return data;
  })
```

### After (Admin):
```typescript
someEndpoint: adminProcedure
  .input(z.object({ ... }))
  .mutation(async ({ input, ctx }) => {
    // Both auth and admin role checked
    const { data } = await supabase.from('table').insert(input);
    return data;
  })
```

## 🧪 Testing Strategy

After each phase:

1. **Check TypeScript compilation**
   ```bash
   cd lightpoint-2.0
   npm run type-check
   ```

2. **Test locally**
   ```bash
   npm run dev
   ```
   - Try creating a complaint (should work when logged in)
   - Try accessing API without login (should fail with 401)

3. **Check browser console for errors**
   - Look for tRPC errors
   - Verify auth context is passed correctly

4. **Deploy and test production**
   ```bash
   git add -A
   git commit -m "feat: add tRPC authentication for [phase name]"
   git push origin main
   ```

## ⚠️ Breaking Changes

**Impact:** Frontend may break if it expects organization_id from input

**Fix:** Update frontend components to NOT pass `organizationId` manually:

### Before:
```typescript
const mutation = trpc.complaints.list.useQuery({
  organizationId: userOrg, // ❌ Remove this
  status: 'active',
});
```

### After:
```typescript
const mutation = trpc.complaints.list.useQuery({
  status: 'active', // ✅ Org ID comes from auth context
});
```

## 📊 Progress Tracking

- **Phase 1:** 3/3 ✅ (complaints CRUD)
- **Phase 2:** 0/16 ⏳ (mutations)
- **Phase 3:** 0/8 ⏳ (queries)
- **Phase 4:** 0/8 ⏳ (admin)
- **Phase 5:** 0/3 ⏳ (public)

**Total:** 3/38 (8% complete)

## 🚀 Next Actions

1. Continue updating router.ts procedures one by one
2. Run type-check after each change
3. Test locally before committing
4. Deploy to Railway when Phase 1 complete
5. Monitor for errors on live site

## 📝 Notes

- Don't rush - auth is critical
- Test each change before moving to next
- Keep backup of working version
- Monitor Railway logs for auth failures

