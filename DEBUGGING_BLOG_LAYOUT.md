# 🔍 DEBUGGING: Why Your Blog Layout Isn't Showing

## The Problem
You ran the SQL to update the blog layout, but it's still showing plain text.

## Step-by-Step Debugging

### Step 1: Verify the SQL Actually Ran

Run this in Supabase SQL Editor:

```sql
SELECT 
  slug,
  title,
  structured_layout IS NOT NULL as has_layout,
  jsonb_typeof(structured_layout) as layout_type,
  structured_layout::jsonb ? 'components' as has_components_key,
  jsonb_array_length(structured_layout::jsonb -> 'components') as component_count
FROM blog_posts
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';
```

**Expected Result:**
- `has_layout`: true
- `layout_type`: object
- `has_components_key`: true
- `component_count`: 33 (or similar number)

**If any of these are wrong**, the SQL didn't work correctly.

---

### Step 2: Check What the Frontend is Seeing

Open your browser console (F12) and look for these logs:

```
🔍 [BlogPostPage] Layout Analysis:
```

This will show you:
- `hasStructuredLayout`: should be true
- `hasV2Layout`: should be true
- `hasComponentsArray`: should be true
- `componentsLength`: should be > 0

**If `hasV2Layout` is false**, the data isn't reaching the frontend correctly.

---

### Step 3: Check for Caching Issues

The issue might be caching. Try:

1. **Hard refresh the browser:**
   - Mac: `Cmd + Shift + R`
   - Windows: `Ctrl + Shift + R`

2. **Clear browser cache** completely

3. **Restart your Next.js dev server:**
   ```bash
   # Kill the server (Ctrl+C)
   # Then restart
   npm run dev
   ```

---

### Step 4: Verify the Blog Post Slug

Maybe the slug is different? Run this:

```sql
-- List all blog posts
SELECT slug, title, is_published
FROM blog_posts
ORDER BY created_at DESC;
```

**Check if your post exists** and what the actual slug is.

---

### Step 5: Check the tRPC Query

The page uses tRPC to fetch the blog post. Check if tRPC is working:

1. Open browser DevTools → Network tab
2. Filter for "trpc"
3. Refresh the page
4. Look for a request like `blog.getBySlug`
5. Click on it and check the **Response** tab

**Look for:**
- Does `structured_layout` exist in the response?
- Does it have a `components` array?
- Are there items in that array?

---

## Common Issues and Solutions

### Issue #1: SQL Didn't Update
**Symptoms:** Query returns `has_layout: false` or `component_count: null`

**Solution:** The blog post might not exist with that slug. Check all slugs:
```sql
SELECT slug, title FROM blog_posts;
```

Then run the UPDATE SQL again with the correct slug.

---

### Issue #2: tRPC Not Returning structured_layout
**Symptoms:** Frontend logs show `hasStructuredLayout: false`

**Possible causes:**
- RLS (Row Level Security) blocking the query
- The tRPC router not selecting structured_layout

**Solution:** Check the tRPC blog router:
```typescript
// Should include structured_layout in the select
.select('*, structured_layout')
```

---

### Issue #3: Data Format Wrong
**Symptoms:** `hasComponentsArray: false` even though DB has data

**Possible causes:**
- The JSON might be stored as a string instead of JSONB
- The structure might be wrong

**Solution:** Run this to check the actual format:
```sql
SELECT 
  slug,
  pg_typeof(structured_layout) as data_type,
  structured_layout::text as raw_value
FROM blog_posts
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';
```

If `data_type` is not `jsonb`, you need to cast it.

---

### Issue #4: Preview Mode Active
**Symptoms:** URL has `?preview=true`

**Impact:** Preview mode might bypass published posts

**Solution:** 
- Remove `?preview=true` from URL
- Or set `is_published = true` in the database

---

## Quick Fix: Manual JSON Check

If all else fails, let's verify the JSON structure manually:

```sql
SELECT 
  structured_layout->'components'->0 as first_component,
  structured_layout->'components'->1 as second_component,
  structured_layout->'theme' as theme
FROM blog_posts
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';
```

**Expected output:**
- `first_component`: should show `{"type": "hero", "props": {...}}`
- `second_component`: should show `{"type": "stats", "props": {...}}`
- `theme`: should show `{"mode": "light", "name": "lightpoint"}`

---

## Nuclear Option: Re-Run Everything

If nothing works, try this sequence:

```sql
-- 1. Delete the layout
UPDATE blog_posts
SET structured_layout = NULL
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- 2. Verify it's gone
SELECT slug, structured_layout FROM blog_posts 
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- 3. Re-run the full UPDATE SQL from UPDATE_BLOG_WITH_CORRECT_LAYOUT.sql

-- 4. Verify it's back
SELECT 
  slug,
  jsonb_array_length(structured_layout->'components') as count
FROM blog_posts 
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';
```

Then:
1. Stop your dev server (Ctrl+C)
2. Clear browser cache
3. Restart dev server (`npm run dev`)
4. Hard refresh browser (Cmd+Shift+R)

---

## What to Report Back

After trying these steps, tell me:

1. **What does Step 1 return?** (the SELECT query result)
2. **What do the browser console logs say?** (especially `hasV2Layout`)
3. **What does the Network tab show?** (does tRPC return structured_layout?)
4. **What does the debug banner say?** (green "V2 LAYOUT ACTIVE" or red "V1 LAYOUT"?)

This will help me identify exactly where the disconnect is!

