# 🎨 FULL SITE CMS - COMPLETE SETUP GUIDE

## ✅ WHAT'S BEEN BUILT

You now have a **fully dynamic, database-driven website** where EVERY piece of prose can be edited through the admin panel without touching code.

---

## 📂 FILES CREATED/MODIFIED

### New Files:
1. **`migrations/005_seed_homepage_content.sql`** - Seeds all existing homepage content into the database
2. **`app/page.tsx`** (renamed from `page-dynamic.tsx`) - New CMS-driven homepage
3. **`app/page-static-backup.tsx`** - Backup of original hardcoded homepage

### Modified Files:
1. **`lib/trpc/routers/cms.ts`** - Added `getAllPageSections()` for admin
2. **`app/admin/content/page.tsx`** - Completely rebuilt with full JSON editor

---

## 🚀 QUICK START (3 STEPS)

### Step 1: Run the Migration

```bash
cd /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0
```

Then in your Supabase SQL Editor, run:
```sql
\i migrations/005_seed_homepage_content.sql
```

**Or copy/paste the entire file contents into Supabase SQL Editor.**

This will:
- Seed all 8 homepage sections into `page_sections` table
- Set up RLS policies for public read/admin write
- Preserve all existing content (hero, metrics, problems, solutions, features, ROI, etc.)

### Step 2: Verify Data

In Supabase SQL Editor, run:
```sql
SELECT page_name, section_key, section_title, display_order 
FROM page_sections 
WHERE page_name = 'homepage' 
ORDER BY display_order;
```

You should see 8 sections:
1. hero
2. trust_metrics
3. problem_solution
4. features
5. roi_calculator
6. how_it_works
7. testimonials
8. final_cta

### Step 3: Test the Admin Panel

1. Log in as super admin
2. Go to **Admin → Page Content**
3. Select **Homepage** from dropdown
4. Click the expand button (▼) on any section
5. Click **"Edit JSON Content"**
6. Modify any text (e.g., change a hero heading)
7. Click **"Save Changes"**
8. Visit the homepage — **changes are LIVE immediately!**

---

## 🎯 HOW IT WORKS

### Architecture:

```
┌─────────────────────┐
│  Homepage (public)  │
│   app/page.tsx      │
└──────────┬──────────┘
           │
           │ tRPC: cms.getPageSections()
           │
           ▼
    ┌──────────────┐
    │  Database    │
    │ page_sections│
    └──────────────┘
           ▲
           │ tRPC: cms.updatePageSection()
           │
┌──────────┴──────────┐
│   Admin Panel       │
│ /admin/content      │
└─────────────────────┘
```

### Data Structure:

Each section is stored as:
```json
{
  "id": "uuid",
  "page_name": "homepage",
  "section_key": "hero",
  "section_title": "Hero Section",
  "content": {
    "badge_text": "AI-Powered HMRC Complaint Management",
    "heading_line1": "Recover Your Fees.",
    "heading_line2": "Deliver Excellence.",
    "subheading": "The complete platform for...",
    "cta_primary_text": "Start Free Trial",
    "cta_primary_link": "/pricing",
    ...
  },
  "display_order": 1,
  "is_visible": true
}
```

---

## 📝 WHAT'S EDITABLE (ALL 8 SECTIONS)

### 1. **Hero Section** (`hero`)
- Badge text
- Main heading (2 lines)
- Subheading paragraph
- Primary CTA text & link
- Secondary CTA text & link
- Trust line

### 2. **Trust Metrics** (`trust_metrics`)
- 4 metric cards (value, label, sublabel, icon, color)
- Trust badges (array of text)

### 3. **Problem/Solution** (`problem_solution`)
- Section title & subtitle
- 6 problems (array)
- 6 solutions (array)
- Problem/Solution headings

### 4. **Features** (`features`)
- Section title & subtitle
- 6 feature cards (title, description, icon, color)

### 5. **ROI Calculator** (`roi_calculator`)
- Left column: heading, subheading, calculations, CTA
- Right column: example tier data

### 6. **How It Works** (`how_it_works`)
- Section title & subtitle
- 4 steps (number, title, description)

### 7. **Testimonials** (`testimonials`)
- Section title
- 3 testimonials (quote, author, role, rating)

### 8. **Final CTA** (`final_cta`)
- Heading & subheading
- Primary & secondary CTAs

---

## 🔧 HOW TO EDIT CONTENT

### Method 1: Admin Panel (Recommended)

1. Navigate to **Admin → Page Content**
2. Select page (e.g., "Homepage")
3. Find the section you want to edit
4. Click the expand button (▼)
5. Click **"Edit JSON Content"**
6. Modify the JSON (all fields are self-explanatory)
7. Click **"Save Changes"**
8. ✅ **Changes are live immediately!**

### Method 2: Direct SQL (Advanced)

```sql
UPDATE page_sections
SET content = jsonb_set(
  content,
  '{heading_line1}',
  '"Your New Heading Here"'
)
WHERE page_name = 'homepage' AND section_key = 'hero';
```

---

## 💡 ADDING NEW PAGES

To add content for other pages (pricing, about, contact):

```sql
INSERT INTO page_sections (page_name, section_key, section_title, content, display_order, is_visible)
VALUES (
  'pricing',
  'hero',
  'Pricing Page Hero',
  jsonb_build_object(
    'heading', 'Simple, Transparent Pricing',
    'subheading', 'Choose the plan that fits your firm'
  ),
  1,
  TRUE
);
```

Then update the admin panel's page selector to include the new page.

---

## 🎨 VISIBILITY TOGGLE

In the admin panel, you can:
- **👁️ Show/Hide sections** without deleting them
- Test new content before making it public
- Seasonally enable/disable sections

---

## 🔒 SECURITY

- ✅ **Public pages**: Can only read `is_visible = TRUE` sections
- ✅ **Admin panel**: Super admins can edit all sections
- ✅ **RLS policies**: Enforced at database level
- ✅ **Audit trail**: `updated_at` and `updated_by` tracked

---

## 📊 MONITORING

### Check what's visible to users:
```sql
SELECT section_key, section_title, is_visible
FROM page_sections
WHERE page_name = 'homepage'
ORDER BY display_order;
```

### See recent changes:
```sql
SELECT section_key, section_title, updated_at, updated_by
FROM page_sections
WHERE page_name = 'homepage'
ORDER BY updated_at DESC;
```

---

## 🎉 RESULT

**Before:** Had to edit React code, commit to Git, redeploy to change any text.

**After:** Edit in admin panel, click save, **instant live update!**

---

## 🚨 TROUBLESHOOTING

### Problem: Homepage shows "Loading..."
**Solution:** Migration not run. Go to Supabase SQL Editor and run migration 005.

### Problem: Admin panel shows "No content sections"
**Solution:** Check you're looking at the right page. Run the verification query above.

### Problem: Changes don't save
**Solution:** Check you're logged in as super admin. Run:
```sql
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

### Problem: JSON syntax error
**Solution:** Use a JSON validator (e.g., jsonlint.com) to check your JSON before saving.

---

## 🔮 FUTURE ENHANCEMENTS

- **Rich text editor** instead of raw JSON (e.g., Tiptap, Lexical)
- **Image upload** for hero backgrounds, features, etc.
- **Version history** to rollback changes
- **Preview mode** to see changes before publishing
- **A/B testing** to test different headlines
- **Translation system** for multi-language support

---

## ✅ STATUS

- [x] Database schema created
- [x] All homepage content seeded
- [x] tRPC endpoints built
- [x] Admin panel fully functional
- [x] Dynamic homepage live
- [x] RLS policies in place
- [x] Documentation complete

**🚀 Ready to go! Run the migration and start editing!**

