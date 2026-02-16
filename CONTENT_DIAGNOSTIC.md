# Content Diagnostic Guide

## Where to Check Terminal Output

### In VS Code / Cursor:
1. **View → Terminal** (or `Ctrl+` ` on Windows/Linux, `Cmd+` ` on Mac)
2. Or click the **Terminal** tab at the bottom of the editor
3. Look for console.log output with 🔴 emojis

### In Browser DevTools:
1. Open DevTools: `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
2. Go to **Console** tab
3. Look for console.log output

### Server Terminal (Next.js dev server):
- The terminal where you ran `npm run dev`
- All `console.log` statements from API routes will appear here
- Look for logs starting with 🔴

---

## SQL Query to Check Database Content

Run this in Supabase SQL Editor to check if content is broken in the database:

```sql
-- Find the blog post "The £3,750 Recovery"
SELECT 
  id,
  title,
  slug,
  -- Check content type
  pg_typeof(content) as content_type,
  -- Show first 500 characters of content
  CASE 
    WHEN pg_typeof(content) = 'jsonb'::regtype THEN
      substring(content::text, 1, 500)
    ELSE
      substring(content::text, 1, 500)
  END as content_preview,
  -- Check if content contains the broken text
  CASE 
    WHEN content::text LIKE '%sentdebtcollectorsforit%' THEN 'BROKEN - Contains concatenated text'
    WHEN content::text LIKE '%sent debt collectors for it%' THEN 'OK - Has spaces'
    ELSE 'Unknown'
  END as content_status,
  created_at,
  updated_at
FROM blog_posts
WHERE title ILIKE '%3,750%' OR title ILIKE '%Recovery%'
ORDER BY created_at DESC
LIMIT 5;
```

### Alternative: Check all blog posts for broken content

```sql
-- Find all posts with concatenated words (no spaces between common words)
SELECT 
  id,
  title,
  slug,
  CASE 
    WHEN content::text ~ '[a-z][A-Z]' THEN 'Possible concatenation (lowercase followed by uppercase)'
    WHEN content::text LIKE '%sentdebtcollectorsforit%' THEN 'BROKEN - Known issue'
    ELSE 'OK'
  END as status,
  created_at
FROM blog_posts
WHERE content::text ~ '[a-z][A-Z]' 
   OR content::text LIKE '%sentdebtcollectorsforit%'
ORDER BY created_at DESC;
```

---

## Diagnostic Logging Added

I've added comprehensive logging at these points:

1. **BlogPostForm.tsx** (line 87): When content is loaded from database
2. **VisualTransformer.tsx** (line 134): Before calling stripHtml
3. **VisualTransformer.tsx** (line 152): After calling stripHtml
4. **app/api/blog/generate-layout-v2/route.ts** (line 25): At API entry point
5. **layoutGenerator.ts** (line 31): At generateLayout entry

All logs will show:
- Content type (string vs object)
- First 500 characters
- Whether "sentdebtcollectorsforit" is present

---

## What to Look For

### If content is broken in database:
- Logs will show "CONTENT ALREADY BROKEN IN DATABASE!"
- SQL query will show "BROKEN - Contains concatenated text"
- **Solution**: Re-enter the blog post content OR write a migration to fix it

### If content is broken by stripHtml:
- Logs will show "CONTENT BROKEN BY stripHtml!"
- Content is OK before stripHtml, broken after
- **Solution**: Fix the stripHtml function

### If content is broken at API entry:
- Logs will show "CONTENT ALREADY BROKEN AT API ENTRY POINT!"
- Content is broken before it reaches the API
- **Solution**: Check how content is passed from VisualTransformer

---

## Next Steps

1. **Check terminal** (see above)
2. **Run SQL query** in Supabase to check database
3. **Generate layout** and watch terminal for 🔴 logs
4. **Report findings**: Where does the first "BROKEN" message appear?






