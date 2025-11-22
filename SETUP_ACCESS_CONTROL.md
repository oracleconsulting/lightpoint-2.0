# 🚀 QUICK SETUP GUIDE - Access Control & Homepage

**Status:** Code Deployed ✅  
**Time to Complete:** 10 minutes

---

## 📋 What You Need to Do Now

### **Step 1: Run Database Migration** (5 mins)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your Lightpoint project
   - Click **"SQL Editor"** in left sidebar

2. **Run Migration #3**
   - Click **"New Query"**
   - Copy the ENTIRE contents of: `migrations/003_rbac_and_admin_system.sql`
   - Paste into SQL Editor
   - Click **"Run"** (or Cmd+Enter)
   - ✅ Should see: "Success. No rows returned"

3. **Verify Tables Created**
   Run this to check:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('user_roles', 'admin_activity_log', 'content_posts', 'user_profiles');
   ```
   
   You should see:
   - `user_roles`
   - `admin_activity_log`
   - `content_posts`
   - `user_profiles`

---

### **Step 2: Grant Yourself Super Admin** (2 mins)

1. **Find Your User ID**
   ```sql
   SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';
   ```
   Copy your `id` (it's a UUID like `123e4567-e89b-12d3-a456-426614174000`)

2. **Grant Super Admin Role**
   ```sql
   INSERT INTO user_roles (
     user_id,
     role,
     can_manage_tiers,
     can_manage_users,
     can_manage_content,
     can_view_analytics,
     can_manage_billing
   ) VALUES (
     'YOUR_USER_ID_HERE',  -- ⚠️ Replace with your actual ID from step 1
     'super_admin',
     TRUE,
     TRUE,
     TRUE,
     TRUE,
     TRUE
   );
   ```

3. **Verify Super Admin Granted**
   ```sql
   SELECT 
     u.email,
     ur.role,
     ur.can_manage_tiers,
     ur.can_manage_users
   FROM user_roles ur
   JOIN auth.users u ON ur.user_id = u.id
   WHERE u.email = 'your-email@example.com';
   ```
   
   Should show your email with `super_admin` role!

---

### **Step 3: Test Your New Access** (3 mins)

1. **Visit New Homepage**
   - Production: `https://your-domain.com/`
   - Local: `http://localhost:3005/`
   - Should see beautiful new landing page with:
     - Hero section
     - Trust indicators
     - Features
     - Pricing CTA

2. **Visit Admin Tiers Page**
   - Production: `https://your-domain.com/admin/tiers`
   - Local: `http://localhost:3005/admin/tiers`
   - Should see tier management UI (you're super admin!)

3. **Visit User Dashboard**
   - Production: `https://your-domain.com/user/dashboard`
   - Local: `http://localhost:3005/user/dashboard`
   - Should see dashboard with:
     - Quota display
     - Feature cards
     - Trial banner (if on trial)

---

## ✅ Success Checklist

- [ ] Ran migration 003 successfully
- [ ] Verified 4 new tables exist
- [ ] Found your user ID
- [ ] Granted yourself super_admin role
- [ ] Verified role granted
- [ ] Homepage loads (/)
- [ ] Admin tiers page accessible (/admin/tiers)
- [ ] User dashboard loads (/user/dashboard)
- [ ] No console errors in browser

---

## 🎯 What You Should See

### **Homepage (/):**
- SEO-optimized landing page
- "Start Free Trial" CTAs
- Trust indicators (95%+ success rate)
- Feature showcases
- Testimonials
- Pricing preview

### **Admin Tiers (/admin/tiers):**
- Table with 3 tiers
- Edit buttons
- "New Tier" button
- All features editable

### **User Dashboard (/user/dashboard):**
- Current tier badge
- Complaints quota progress bar
- Feature cards (some locked based on tier)
- Upgrade CTAs

---

## 🔐 Your New Powers (Super Admin)

As **super_admin**, you can:
- ✅ Access `/admin/tiers` (manage subscriptions)
- ✅ Create/edit/delete tiers
- ✅ View all user subscriptions
- ✅ Manage content (when UI is built)
- ✅ View analytics (when built)
- ✅ All features regardless of tier

Regular users **CANNOT**:
- ❌ Access `/admin/*` routes
- ❌ See other users' data
- ❌ Edit tiers
- ❌ View system analytics

---

## 🐛 Troubleshooting

### **Issue: "relation 'user_roles' does not exist"**
**Fix:** Migration didn't run. Go back to Step 1.

### **Issue: "Cannot access /admin/tiers"**
**Fix:** You didn't grant yourself super_admin. Go to Step 2.

### **Issue: "Homepage shows old dashboard"**
**Fix:** 
1. Hard refresh browser (Cmd+Shift+R)
2. Clear cache
3. Try incognito/private mode

### **Issue: "TypeScript errors on build"**
**Fix:** Pull latest code:
```bash
cd lightpoint-2.0
git pull origin main
npm install
```

### **Issue: "User dashboard shows 'Loading...' forever"**
**Fix:** 
1. Check you have an active subscription
2. Run query to check:
```sql
SELECT * FROM user_subscriptions WHERE user_id = 'YOUR_USER_ID';
```
3. If no subscription, you need to create one (or we can add a test subscription)

---

## 🎉 What's Next?

Once setup is complete, you can:

1. **Test the System**
   - Create a test user account
   - See what they see (no admin access)
   - Test feature locking

2. **Customize Content**
   - Edit tier descriptions in `/admin/tiers`
   - Adjust pricing if needed
   - Toggle features per tier

3. **Build More Features**
   - Blog UI (content system is ready)
   - CPD library
   - Webinar management
   - Implement Stripe

4. **Go Live!**
   - Share homepage URL
   - Start getting signups
   - Convert to paid subscriptions

---

## 📞 Need Help?

If you're stuck:
1. Check browser console for errors
2. Check Supabase logs (Database → Logs)
3. Check Railway logs (if deployed)
4. Let me know what error you're seeing!

---

**Ready to test!** 🚀

Just run:
1. Migration 003 in Supabase
2. Grant yourself super_admin
3. Visit the 3 URLs

**Total time: ~10 minutes**

