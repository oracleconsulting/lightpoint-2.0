# Regenerate Blog V2 Layout - Quick Guide

## Problem

Your blog post is showing plain text instead of the beautiful V2 layout with:
- Large readable typography (22-24px)
- Donut charts for percentage stats
- Image breaks every 3 paragraphs
- Magazine-quality spacing

## Solution

The V2 layout system is ready, but you need to **generate and save the layout** for your blog post.

---

## Option 1: Run the TypeScript Script (RECOMMENDED)

This script automatically:
1. Fetches your blog post content from the database
2. Generates the V2 layout using pattern detection
3. Saves it back to the database

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0

# Make sure your environment variables are set
# Check .env.local has:
# - NEXT_PUBLIC_SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)

# Run the script
npx ts-node scripts/regenerate-blog-v2-layout.ts why-hmrc-complaints-fail-how-to-fix
```

### Expected Output

```
🚀 Regenerating V2 layout for: why-hmrc-complaints-fail-how-to-fix

📄 Fetching blog post...
✅ Found post: The 92,000 Question: Why Your HMRC Complaint Fails (And How to Fix It)
   Content length: 5234 chars

📝 Extracted text content: 5234 chars

🔧 Generating V2 layout...
✅ Generated layout with 45 components
   Component types: hero, stats, paragraph, sectionHeading, donutChart, textWithImage, timeline, numberedSteps, cta

💾 Updating database...
✅ Successfully updated blog post with V2 layout!

🎉 Done! Visit the blog post to see the changes:
   http://localhost:3000/blog/why-hmrc-complaints-fail-how-to-fix
```

---

## Option 2: Use the SQL File (MANUAL)

If the TypeScript script doesn't work, you can manually update the database:

1. Open Supabase SQL Editor
2. Go to `/Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0/supabase/UPDATE_BLOG_WITH_CORRECT_LAYOUT.sql`
3. Run the entire SQL file

**Note:** This uses a pre-generated layout. The TypeScript script is better because it generates fresh layout from your current content.

---

## Option 3: Use the API Directly

You can also call the API endpoint:

```bash
curl -X POST http://localhost:3000/api/blog/generate-layout-v2 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "The 92,000 Question: Why Your HMRC Complaint Fails (And How to Fix It)",
    "content": "... your blog content here ...",
    "excerpt": "Last year, 92,000 people complained about HMRC...",
    "author": "James Howard ACA, CTA",
    "includeHero": true,
    "includeCTA": true
  }'
```

Then manually update the database with the returned layout.

---

## After Running

1. **Check the blog post:**
   http://localhost:3000/blog/why-hmrc-complaints-fail-how-to-fix

2. **Look for the green banner:**
   If you see "✅ V2 LAYOUT ACTIVE", it's working!

3. **Verify the improvements:**
   - ✅ Body text is 22-24px (large and readable)
   - ✅ Headings are 42-48px (impactful)
   - ✅ DonutCharts appear for percentage stats
   - ✅ Image placeholders every 3 paragraphs
   - ✅ Generous spacing between sections

4. **If it's still not working:**
   - Check browser console for errors
   - Verify the database update succeeded
   - Make sure your dev server is running
   - Try hard refresh (Cmd+Shift+R on Mac)

---

## Troubleshooting

### Script fails with "Missing Supabase credentials"

Add these to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Script succeeds but blog still looks plain

1. **Hard refresh the browser** (Cmd+Shift+R)
2. **Check the database** - Does the `structured_layout` column have data with a `components` array?
3. **Check the page detection** - Look at the debug banner. Does it say "V2 LAYOUT ACTIVE"?

### Layout generates but looks wrong

The layout generator uses pattern detection. If your content has unusual formatting, it might not detect sections correctly. You can:
1. Check the console logs to see what components were detected
2. Adjust the content formatting for better detection
3. Or manually edit the generated layout JSON in the database

---

## What This Does Under the Hood

The script uses the same pattern detection system you improved:

1. **Pattern Detection** (`sectionDetector.ts`):
   - Detects headings, stats, percentages, timelines, etc.
   - Smart enough to find "98% internal resolution" → DonutChart
   - Breaks long text into paragraphs → Every 3rd becomes TextWithImage

2. **Layout Generation** (`layoutGenerator.ts`):
   - Converts detected patterns into V2 components
   - Adds hero at the top, CTA at the bottom
   - Applies your improved typography (22-24px body, 42-48px headings)

3. **Database Update**:
   - Saves the layout JSON to `structured_layout` column
   - The page.tsx detects it has a V2 layout and renders it beautifully

---

## Next Steps

Once the layout is generated:

1. **Test different sections** - Scroll through and verify all components render correctly
2. **Check responsiveness** - Test on mobile/tablet sizes
3. **Add real images** - Replace placeholders in TextWithImage components
4. **Fine-tune** - Adjust any component props in the database if needed

The beautiful typography, spacing, and visual elements are all ready to go!

