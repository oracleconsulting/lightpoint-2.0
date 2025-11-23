# 🚀 Social Content Engine - Zapier + Buffer Deployment Guide

## **✅ UPDATED FOR YOUR SETUP:**
- ✅ Uses your existing **OpenRouter** (no new OpenAI API needed!)
- ✅ Supports **LinkedIn + Instagram** (your Buffer accounts)
- ✅ Uses **Zapier** to connect to Buffer (as required)
- ✅ **Twitter** also supported (if you add it to Buffer)

---

## **📦 QUICK START (15 MINUTES)**

### **STEP 1: Run Database Migration** (2 min)

```bash
cd lightpoint-2.0
psql $DATABASE_URL < migrations/019_social_content_system.sql
```

**What this does:**
- Adds 4 new tables for social content
- Creates default drip campaign (30-day schedule)
- Adds Instagram support
- Sets up analytics tracking

---

### **STEP 2: Test AI Generation** (5 min)

**Good news!** You already have OpenRouter set up, so AI generation will work immediately!

1. **Go to Social Content Manager:**
   - Navigate to `/admin/blog`
   - Click the **Share button** (📤) on any published post
   - Or go directly to `/admin/social-content?blogPostId=YOUR_POST_ID`

2. **Click "Generate AI Content"**
   - Generates 9 posts (3 per platform)
   - Uses your existing OpenRouter setup
   - Takes 10-15 seconds
   - **No additional cost** beyond your normal OpenRouter usage

3. **Review the generated content**
   - Twitter: Punchy, 280 characters
   - LinkedIn: Professional, detailed
   - Instagram: Visual, emoji-rich, 10 hashtags

---

### **STEP 3: Set Up Zapier → Buffer Integration** (8 min)

Since Buffer doesn't have a direct API for scheduled posts, we use Zapier as the bridge.

#### **Option A: Zapier Webhooks (Recommended)**

1. **Create Zap in Zapier:**
   - Trigger: **Webhooks by Zapier** → Catch Hook
   - Copy the webhook URL (e.g., `https://hooks.zapier.com/hooks/catch/123456/abcdef/`)

2. **Action: Buffer**
   - Choose: **Create Update**
   - Connect your Buffer account
   - Map fields:
     - Profile: Choose from dropdown (LinkedIn or Instagram)
     - Text: `{{content}}`
     - Schedule: `{{scheduled_for}}` (optional)

3. **Test the Zap:**
   ```bash
   curl -X POST https://hooks.zapier.com/hooks/catch/YOUR_ID/YOUR_KEY/ \
     -H "Content-Type: application/json" \
     -d '{
       "content": "Test post from Lightpoint AI 🚀",
       "platform": "linkedin",
       "scheduled_for": ""
     }'
   ```

4. **Add Webhook URL to Supabase:**
   - Supabase Dashboard → Settings → Secrets
   - Add: `ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/YOUR_ID/YOUR_KEY/`

#### **Option B: RSS to Buffer (Simpler, but less control)**

If you want fully automatic posting without manual approval:

1. **Use your blog RSS feed:** `https://lightpoint.uk/blog/rss.xml`

2. **Create Zap:**
   - Trigger: **RSS by Zapier** → New Item in Feed
   - Feed URL: `https://lightpoint.uk/blog/rss.xml`
   - Action: **Buffer** → Create Update
   - Text template:
     ```
     🆕 New on the Lightpoint Blog:
     
     {{title}}
     
     {{description}}
     
     Read more: {{link}}
     
     #HMRC #TaxCompliance #Accounting
     ```

3. **Set Buffer profile:**
   - Choose LinkedIn and/or Instagram

**This posts automatically when you publish a blog, but you lose the AI-generated variants and scheduling control.**

---

### **STEP 4: Update Edge Function for Zapier** (Optional - for auto-publishing)

If you want scheduled posts to auto-publish via Zapier:

1. **Update Environment Variables:**
   ```bash
   # In Supabase Dashboard → Settings → Secrets
   USE_BUFFER=false
   USE_ZAPIER=true
   ZAPIER_WEBHOOK_URL=https://hooks.zapier.com/hooks/catch/YOUR_ID/YOUR_KEY/
   ```

2. **Deploy updated function:**
   ```bash
   supabase functions deploy publish-social-content
   ```

3. **Create cron job:**
   - Database → Cron Jobs → New Job
   - Name: Auto-Publish Social Content
   - Schedule: `*/5 * * * *` (every 5 minutes)
   - Function: `publish-social-content`

---

## **🎯 YOUR WORKFLOW**

### **Manual Posting (Recommended to start):**

1. **Publish blog post** in `/admin/blog`

2. **Click Share button** (📤)

3. **Generate AI content:**
   - Creates 9 platform-optimized posts
   - Uses your OpenRouter (no extra cost)
   - Takes 10-15 seconds

4. **Review & edit:**
   - Edit any posts you want to tweak
   - Hashtags auto-generated

5. **Copy & paste to Buffer:**
   - Option 1: Copy each post manually to Buffer
   - Option 2: Use "Approve" button (triggers Zapier webhook if set up)

6. **Schedule in Buffer:**
   - Use Buffer's scheduling interface
   - Or let Buffer's optimal timing feature decide

### **Automated Posting (Advanced):**

Once you're comfortable with the AI generation:

1. **Generate AI content** (as above)

2. **Click "Approve & Schedule"** for each post
   - Sets scheduled time
   - Triggers Zapier webhook
   - Buffer receives and schedules post

3. **Posts publish automatically**
   - Cron job checks every 5 minutes
   - Sends to Zapier → Buffer → Social media

---

## **📊 PLATFORM SUPPORT**

### **Currently in Buffer:**
✅ **LinkedIn** - Professional audience, thought leadership  
✅ **Instagram** - Visual content, broader reach

### **Easy to Add:**
- **Twitter** - Add to your Buffer account (5 min)
- **Facebook** - Add to your Buffer account (5 min)

### **Platform Stats:**

| Platform  | Character Limit | Hashtags | Best For |
|-----------|----------------|----------|----------|
| Twitter   | 280            | 2        | Quick updates, news |
| LinkedIn  | 3,000          | 5        | Professional content, long-form |
| Instagram | 2,200          | 10       | Visual stories, brand building |
| Facebook  | 2,000          | 3        | Community, engagement |

---

## **💰 COST BREAKDOWN**

### **Your Setup:**

| Item | Cost | Notes |
|------|------|-------|
| OpenRouter API | **Already paying** | No additional cost for social content |
| Zapier | **£0-20/month** | Free tier: 100 tasks/mo (enough for testing) |
| Buffer | **Already paying** | Your existing LinkedIn + Instagram setup |
| **Total Additional Cost** | **£0-20/month** | Just Zapier if you exceed free tier |

### **vs Original Estimate:**
- Original: £6.80/month (OpenAI + Buffer)
- Your setup: £0-20/month (just Zapier if needed)
- **Potentially FREE if you stay under 100 Zapier tasks/month!**

---

## **🔧 TROUBLESHOOTING**

### **AI Generation Not Working:**

**Check OpenRouter:**
```typescript
// lib/openrouter/client.ts should export generateCompletion
// This is already set up in your codebase!
```

**If you see errors:**
1. Check OpenRouter API key in `.env.local`
2. Verify you have available credits
3. Check browser console for errors

### **Zapier Webhook Not Firing:**

1. **Test webhook manually:**
   ```bash
   curl -X POST https://hooks.zapier.com/hooks/catch/YOUR_ID/YOUR_KEY/ \
     -H "Content-Type: application/json" \
     -d '{"content": "Test", "platform": "linkedin"}'
   ```

2. **Check Zapier Task History:**
   - Zapier Dashboard → Task History
   - Look for failed tasks
   - Check error messages

3. **Common issues:**
   - Buffer not connected
   - Profile not selected
   - Invalid date format

### **Posts Not Showing in Buffer:**

1. **Check Buffer profile settings:**
   - Is LinkedIn/Instagram connected?
   - Are they active?

2. **Check Zapier field mapping:**
   - Text field populated?
   - Profile ID correct?

3. **Try posting directly in Buffer:**
   - If this works, it's a Zapier config issue
   - Re-check field mappings

---

## **📈 NEXT STEPS**

### **Today:**
- [ ] Run migration 019
- [ ] Test AI generation on one blog post
- [ ] Review generated content quality

### **This Week:**
- [ ] Set up Zapier webhook
- [ ] Test manual posting to Buffer
- [ ] Generate content for 3-5 existing blog posts

### **This Month:**
- [ ] Set up automated publishing (optional)
- [ ] Monitor engagement metrics
- [ ] Adjust content templates if needed
- [ ] Add Twitter to Buffer (optional)

---

## **🎉 YOU'RE READY!**

Your social content engine now:
- ✅ Uses your existing OpenRouter (no new API costs!)
- ✅ Supports LinkedIn + Instagram (your Buffer accounts)
- ✅ Generates 9 optimized posts per blog article
- ✅ Can auto-post via Zapier (optional)
- ✅ Tracks engagement & analytics

**Total setup time:** 15 minutes  
**Additional monthly cost:** £0-20 (just Zapier if needed)  
**Time saved per blog post:** 2-3 hours  

**Start with manual posting, then automate once you're comfortable!** 🚀

