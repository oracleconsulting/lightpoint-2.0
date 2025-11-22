# 🔧 CMS UPDATES NOT SHOWING - TROUBLESHOOTING

## **Problem:**
You edited content in the Admin → Page Content panel, but changes aren't appearing on the live site.

---

## **Solution 1: Run Migration 008** ✅

The ROI section had hardcoded old values in the migration. Run this to update:

**Go to Supabase SQL Editor** and run:

```sql
-- Copy/paste entire contents of:
-- migrations/008_update_roi_section.sql
```

This will update the ROI section with your correct figures:
- £1,250 average fee recovery
- £250 average ex-gratia
- £1,500 total per case
- 5 months subscription coverage

---

## **Solution 2: Clear Browser Cache** 🗑️

Your browser might be caching the old page. Try:

1. **Hard Refresh:**
   - **Mac**: `Cmd + Shift + R`
   - **Windows**: `Ctrl + Shift + R`

2. **Or Open Incognito/Private Window**

---

## **Solution 3: Force Railway Redeploy** 🚀

If the changes still don't show:

1. Go to your Railway dashboard
2. Click your Lightpoint project
3. Click **"Redeploy"** button
4. Wait 2-3 minutes for build to complete

---

## **Solution 4: Check Your Edits Were Saved** ✅

1. Go to **Supabase SQL Editor**
2. Run this query:

```sql
SELECT 
  section_key,
  section_title,
  content->'left_column'->>'subheading' as subheading,
  updated_at
FROM page_sections
WHERE page_name = 'homepage'
ORDER BY display_order;
```

3. Check if your edits are in the database
4. If they're there but not showing on site → Cache issue
5. If they're NOT there → Admin panel save failed

---

## **Solution 5: Verify Admin Panel Save** 💾

When you click "Save Changes" in the admin panel, you should see:
- ✅ Green "Saved!" notification
- ✅ Timestamp updates

If you DON'T see this:
1. Check browser console for errors (F12)
2. Check if you're logged in as super admin
3. Try saving again

---

## **How CMS Updates Work:**

```
┌─────────────────┐
│  Admin Panel    │ You edit JSON
└────────┬────────┘
         │ Click "Save"
         ▼
┌─────────────────┐
│  tRPC API       │ Sends to database
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase DB    │ Stores in page_sections
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Homepage       │ Fetches on each load
└─────────────────┘
```

**Key Points:**
- Changes are **immediate** in the database
- Homepage fetches **fresh data** on each load
- **BUT** Next.js might cache the page in production
- **Solution**: Hard refresh or redeploy

---

## **Quick Test:**

1. Open **Admin → Page Content**
2. Select **Homepage**
3. Expand **"ROI Calculator Section"**
4. Check if your edits are there
5. If YES → Cache issue (hard refresh)
6. If NO → Edits didn't save (check console)

---

## **Expected ROI Values (After Migration 008):**

```json
{
  "left_column": {
    "heading": "See Your Potential ROI",
    "subheading": "On average, accountants using Lightpoint recover at least £700 per complaint in professional fees and ex-gratia payments.",
    "calculations": [
      {"label": "Average fee recovery per case", "value": "£1,250"},
      {"label": "Average ex-gratia payment", "value": "£250"},
      {"label": "Total per case", "value": "£1,500", "highlight": true}
    ]
  },
  "right_column": {
    "heading": "Professional Tier Example",
    "subscription_cost": "£299/month",
    "subscription_coverage": "5 months of subscription costs"
  }
}
```

---

## **Still Not Working?**

Check:
1. ✅ Migration 008 ran successfully
2. ✅ Railway redeployed
3. ✅ Hard refresh (Cmd+Shift+R)
4. ✅ Check Supabase database has correct values
5. ✅ Check browser console for errors

If all else fails, let me know and I'll investigate further!

---

**TL;DR:**
1. Run migration 008 in Supabase
2. Hard refresh your browser (Cmd+Shift+R)
3. Should see updated ROI immediately!

