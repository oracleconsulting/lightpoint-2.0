# 🚀 **Quick Start: Set Up Your Database**

**Status:** Your code is deployed ✅ but the database needs setup!

---

## 📋 **What You Need to Do** (5 minutes)

### **Step 1: Open Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your Lightpoint project
3. Click on **"SQL Editor"** in the left sidebar

### **Step 2: Run Migration #1** (Create Tables)
1. Click **"New Query"**
2. Copy the ENTIRE contents of: `migrations/001_subscription_system.sql`
3. Paste into the SQL Editor
4. Click **"Run"** (or press Cmd+Enter)
5. ✅ You should see: "Success. No rows returned"

### **Step 3: Run Migration #2** (Helper Functions)
1. Click **"New Query"** again
2. Copy the ENTIRE contents of: `migrations/002_subscription_helpers.sql`
3. Paste into the SQL Editor
4. Click **"Run"**
5. ✅ You should see: "Success. No rows returned"

### **Step 4: Verify Tables Exist**
Run this query to check:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscription_tiers', 'user_subscriptions');
```

You should see:
```
subscription_tiers
user_subscriptions
```

### **Step 5: Check Initial Data**
Run this to see the 3 default tiers:

```sql
SELECT name, display_name, monthly_price, annual_price 
FROM subscription_tiers 
ORDER BY sort_order;
```

You should see:
```
starter       | Starter       | 9900  | 99000
professional  | Professional  | 29900 | 299000
enterprise    | Enterprise    | 99900 | 999000
```

---

## 🎯 **Step 6: Test Your UI**

### **Option A: Local Development**
```bash
cd lightpoint-2.0
npm run dev
```

Then visit:
- Admin UI: http://localhost:3005/admin/tiers
- Pricing Page: http://localhost:3005/pricing

### **Option B: Railway (Production)**
1. Go to your Railway dashboard
2. Click on your Lightpoint service
3. Check the **"Deployments"** tab
4. Wait for latest deployment to finish
5. Visit your production URL + `/pricing`

---

## 🔧 **If You Still Don't See Updates:**

### **Check #1: Environment Variables**
Make sure these are set in Railway:
```
DATABASE_URL=your_supabase_connection_string
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### **Check #2: Clear Browser Cache**
- **Chrome/Edge:** Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
- **Safari:** Cmd+Option+E, then Cmd+R
- Or open in **Incognito/Private mode**

### **Check #3: Check Railway Logs**
1. Go to Railway dashboard
2. Click on your service
3. Click **"Deployments"**
4. Click on the latest deployment
5. Check for any error messages

### **Check #4: Restart Railway Service**
1. Go to Railway dashboard
2. Click on your service
3. Click **"Settings"** → **"Restart"**
4. Wait 30-60 seconds
5. Try again

---

## ❗ **Common Issues & Fixes**

### **Issue: "relation 'subscription_tiers' does not exist"**
**Fix:** Run migrations in Supabase SQL Editor (Steps 2-3 above)

### **Issue: "TRPC error: Unauthorized"**
**Fix:** Make sure you're logged in with Supabase Auth

### **Issue: "Page shows but no data"**
**Fix:** Check that migration #1 ran successfully and inserted initial data

### **Issue: "Build failed on Railway"**
**Fix:** Check that all TypeScript files compiled:
```bash
cd lightpoint-2.0
npm run build
```

---

## 🎉 **What You Should See After Setup:**

### **Admin UI** (`/admin/tiers`)
- Table showing 3 tiers (Starter, Professional, Enterprise)
- Edit buttons for each tier
- Modal to edit pricing, features, display settings
- Toggle switches for feature flags

### **Pricing Page** (`/pricing`)
- Beautiful pricing cards for all 3 tiers
- Monthly/Annual toggle
- "Get Started" buttons
- Feature lists auto-generated from database

---

## 📞 **Still Not Working?**

Let me know what you see:
1. Any error messages?
2. Which URL are you trying?
3. What happens when you visit `/pricing`?
4. Did the migrations run successfully?

---

## ✅ **Quick Checklist**

- [ ] Ran migration #1 in Supabase
- [ ] Ran migration #2 in Supabase
- [ ] Verified tables exist
- [ ] Checked initial data is there
- [ ] Cleared browser cache
- [ ] Restarted Railway service (if deployed)
- [ ] Visited `/pricing` or `/admin/tiers`

---

**Once migrations are run, you should see your new tier system immediately!** 🚀

