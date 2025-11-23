# 🚀 AI Social Content Engine - Complete Deployment Guide

## **SYSTEM COMPLETE! ALL 3 PHASES BUILT!**

✅ **Phase 1:** Database + AI Generation  
✅ **Phase 2:** Admin UI + Approval Workflow  
✅ **Phase 3:** Publishing & Automation  

---

## **📦 WHAT YOU HAVE**

### **1. Database Schema** (Migration 019)
- `social_content_posts` - AI-generated content storage
- `social_drip_campaigns` - Pre-configured posting schedules
- `social_content_templates` - AI prompt templates
- `social_analytics_summary` - Aggregate performance metrics

### **2. AI Content Generation** (lib/ai/socialContentGenerator.ts)
- OpenAI GPT-4 Turbo integration
- Platform-specific optimization (Twitter, LinkedIn, Facebook)
- Multiple content types (announcement, quote, stat, summary, evergreen)
- Automatic hashtag generation
- Cost tracking (~£0.08 per post)

### **3. Admin UI** (app/admin/social-content/page.tsx)
- Blog post selector
- One-click AI generation (9 posts simultaneously)
- Content editing & approval workflow
- Scheduling with datetime picker
- Real-time analytics dashboard

### **4. Auto-Publishing** (supabase/functions/publish-social-content/index.ts)
- Cron-triggered every 5 minutes
- Buffer API integration (recommended)
- Direct social media APIs (Twitter, LinkedIn, Facebook)
- Automatic status updates
- Error handling & retry logic

---

## **🔧 DEPLOYMENT STEPS**

### **STEP 1: Run Database Migration** (5 min)

```bash
cd lightpoint-2.0
psql $DATABASE_URL < migrations/019_social_content_system.sql
```

**Verify:**
```sql
SELECT * FROM social_drip_campaigns WHERE is_default = true;
-- Should see "Standard Blog Launch" campaign
```

---

### **STEP 2: Set Up OpenAI API** (2 min)

1. **Get API Key:** https://platform.openai.com/api-keys

2. **Add to Environment:**
```bash
# .env.local
OPENAI_API_KEY=sk-proj-...your-key-here...
```

3. **Cost Monitoring:**
- Set up billing alerts at https://platform.openai.com/account/billing
- Each blog post costs ~£0.08 (9 variants × £0.009)
- Monthly budget recommendation: £20-50

---

### **STEP 3: Choose Publishing Method**

You have **TWO OPTIONS** for publishing posts:

#### **Option A: Buffer (Recommended - Easiest)** ⭐

**Why Buffer?**
- ✅ Single API for all 3 platforms
- ✅ No individual platform API setup
- ✅ Built-in scheduling & analytics
- ✅ £6/month (Starter plan)
- ✅ 5-minute setup

**Setup:**

1. **Sign up:** https://buffer.com/pricing
   - Choose "Starter" plan (£6/mo)

2. **Connect social accounts:**
   - Dashboard → Channels → Add Channel
   - Connect Twitter, LinkedIn, Facebook

3. **Get API credentials:**
   - Settings → Developer → Create Access Token
   - Copy your Access Token

4. **Get Profile IDs:**
   ```bash
   curl https://api.bufferapp.com/1/profiles.json?access_token=YOUR_ACCESS_TOKEN
   ```
   - Note the `id` for each platform

5. **Add to Supabase Environment:**
   ```bash
   # Supabase Dashboard → Settings → Secrets
   USE_BUFFER=true
   BUFFER_ACCESS_TOKEN=your_access_token_here
   BUFFER_PROFILE_IDS={"twitter":"abc123","linkedin":"def456","facebook":"ghi789"}
   ```

**Done!** Buffer will handle all publishing.

---

#### **Option B: Direct Social Media APIs** (More Control)

**Only choose this if you want:**
- Full control over API calls
- Custom analytics integration
- No monthly Buffer cost (but more maintenance)

##### **B1: Twitter API Setup**

1. **Apply for Developer Account:** https://developer.twitter.com/en/apply-for-access

2. **Create Project & App:**
   - Essential access (free)
   - Read & Write permissions

3. **Get Credentials:**
   - API Key & Secret
   - Bearer Token

4. **Add to Supabase:**
   ```bash
   TWITTER_BEARER_TOKEN=your_bearer_token
   ```

##### **B2: LinkedIn API Setup**

1. **Create LinkedIn App:** https://www.linkedin.com/developers/apps

2. **Request Access:**
   - Sign In with LinkedIn
   - Share on LinkedIn
   - Marketing Developer Platform (if publishing to company page)

3. **OAuth 2.0 Setup:**
   - Get Access Token via OAuth flow
   - Requires web app for authorization

4. **Add to Supabase:**
   ```bash
   LINKEDIN_ACCESS_TOKEN=your_access_token
   LINKEDIN_PERSON_URN=urn:li:person:YOUR_ID
   ```

##### **B3: Facebook API Setup**

1. **Create Facebook App:** https://developers.facebook.com/apps

2. **Add Facebook Page:**
   - Settings → Basic → Add Platform → Page

3. **Get Page Access Token:**
   - Graph API Explorer
   - Select your Page
   - Get User Access Token → Get Page Access Token

4. **Add to Supabase:**
   ```bash
   FACEBOOK_PAGE_ACCESS_TOKEN=your_page_token
   FACEBOOK_PAGE_ID=your_page_id
   ```

---

### **STEP 4: Deploy Edge Function** (5 min)

```bash
# 1. Deploy function
supabase functions deploy publish-social-content

# 2. Set environment variables in Supabase Dashboard:
# Settings → Edge Functions → publish-social-content → Secrets
# Add all your API keys/tokens

# 3. Create cron job in Supabase Dashboard:
# Database → Cron Jobs → New Job
```

**Cron Configuration:**
```sql
-- Name: Auto-Publish Social Content
-- Schedule: */5 * * * * (every 5 minutes)
-- Function: publish-social-content
-- Authorization: Service Role Key
```

**Test Immediately:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/publish-social-content \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY"
```

---

### **STEP 5: Test End-to-End** (10 min)

1. **Create test blog post** (or use existing)

2. **Go to Social Content Manager:**
   - `/admin/social-content?blogPostId=YOUR_POST_ID`

3. **Generate AI Content:**
   - Click "Generate AI Content"
   - Wait 10-15 seconds
   - Review 9 generated variants

4. **Schedule a test post:**
   - Edit a Twitter variant if desired
   - Set schedule for 5 minutes from now
   - Click "Schedule"

5. **Wait 5-10 minutes:**
   - Cron job will run
   - Check Supabase Function Logs
   - Verify post appears on Twitter

6. **Check analytics:**
   - Return to Social Content Manager
   - See "Published" status
   - Analytics will populate from platform APIs

---

## **📊 USAGE GUIDE**

### **Daily Workflow:**

1. **Publish blog post** as usual

2. **Click Share button** (📤) in blog admin list

3. **Generate AI content:**
   - One-click generation
   - 9 platform-optimized posts
   - Total cost: ~£0.08

4. **Review & edit:**
   - Edit any posts that need tweaking
   - Hashtags auto-generated
   - Character counts displayed

5. **Approve & schedule:**
   - **Option 1:** Approve for immediate publishing
   - **Option 2:** Schedule with drip campaign
   - **Option 3:** Custom schedule individual posts

6. **Track performance:**
   - Impressions, engagements, clicks
   - Platform-specific breakdowns
   - Engagement rate calculations

---

## **💰 COST BREAKDOWN**

### **Per Blog Post:**
- OpenAI API: £0.08 (9 variants)
- Buffer (optional): £0.20/post (£6/mo ÷ 30 posts)
- **Total:** £0.08-0.28 per post

### **Monthly (10 posts/month):**
- OpenAI: £0.80
- Buffer: £6.00
- **Total:** £6.80/month

### **ROI Calculation:**
Assuming each post drives 5 blog visits:
- 10 posts/month = 50 visits
- 50 visits × 2% conversion = 1 new subscriber
- 1 subscriber × £299/year = £299 revenue
- **ROI: 4,300%** 🚀

---

## **📈 DRIP CAMPAIGN SCHEDULE**

The default "Standard Blog Launch" campaign automatically schedules:

| Day | Time  | Platforms           | Type              | Goal                    |
|-----|-------|---------------------|-------------------|-------------------------|
| 0   | 09:00 | All 3               | Announcement      | Initial launch          |
| 0   | 15:00 | Twitter             | Key Quote         | Second push             |
| 3   | 10:00 | LinkedIn            | Detailed Summary  | Professional audience   |
| 7   | 11:00 | Twitter + LinkedIn  | Stat Highlight    | Re-engage               |
| 14  | 09:00 | Facebook            | Conversational    | Broader reach           |
| 30  | 10:00 | Twitter + LinkedIn  | Evergreen Reshare | Long-tail traffic       |

**Total:** 8 posts per blog article over 30 days

---

## **🔍 MONITORING & ANALYTICS**

### **Check Cron Job Status:**
```sql
-- View upcoming scheduled posts
SELECT 
  id,
  platform,
  scheduled_for,
  status,
  content
FROM social_content_posts
WHERE status = 'scheduled'
ORDER BY scheduled_for ASC;
```

### **View Edge Function Logs:**
- Supabase Dashboard → Edge Functions → publish-social-content → Logs
- Look for:
  - `✅ Published {platform} post`
  - `❌ Failed to publish`

### **Check Analytics:**
```sql
-- Campaign performance summary
SELECT 
  bp.title,
  sas.total_impressions,
  sas.total_engagements,
  sas.engagement_rate,
  sas.total_clicks
FROM social_analytics_summary sas
JOIN blog_posts bp ON bp.id = sas.blog_post_id
ORDER BY sas.total_impressions DESC;
```

---

## **🐛 TROUBLESHOOTING**

### **Posts Not Publishing:**

1. **Check cron job is active:**
   - Supabase Dashboard → Database → Cron Jobs
   - Verify schedule is correct

2. **Check environment variables:**
   - Edge Functions → publish-social-content → Secrets
   - Verify all API keys present

3. **Check function logs:**
   - Look for error messages
   - Common: "Authorization failed", "Rate limit exceeded"

4. **Verify post status:**
   ```sql
   SELECT * FROM social_content_posts WHERE status = 'failed';
   ```

5. **Manual retry:**
   - Change status back to 'scheduled'
   - Update `scheduled_for` to now
   - Wait for next cron run

---

### **AI Generation Failing:**

1. **Check OpenAI API key:**
   - Is it in `.env.local`?
   - Is it valid? (test at platform.openai.com)

2. **Check API quota:**
   - Do you have available credits?
   - Set up billing if needed

3. **Check browser console:**
   - Network errors?
   - CORS issues?

---

### **Buffer Integration Issues:**

1. **Verify Buffer token:**
   ```bash
   curl https://api.bufferapp.com/1/user.json?access_token=YOUR_TOKEN
   ```

2. **Check profile IDs:**
   ```bash
   curl https://api.bufferapp.com/1/profiles.json?access_token=YOUR_TOKEN
   ```

3. **Verify JSON format:**
   ```json
   {"twitter":"123abc","linkedin":"456def","facebook":"789ghi"}
   ```

---

## **🎯 NEXT STEPS**

### **Immediate:**
- [ ] Run migration 019
- [ ] Set up OpenAI API key
- [ ] Choose Buffer vs Direct APIs
- [ ] Deploy Edge Function
- [ ] Create cron job
- [ ] Test with one blog post

### **Week 1:**
- [ ] Generate content for 3-5 existing blog posts
- [ ] Monitor analytics
- [ ] Adjust drip campaign timings if needed

### **Month 1:**
- [ ] Review engagement rates by platform
- [ ] Identify best-performing content types
- [ ] Optimize AI prompts if needed
- [ ] Consider upgrading Buffer plan if needed

---

## **🚀 YOU'RE READY!**

Your AI Social Content Engine is **100% complete** and ready to:
- ✅ Generate 9 optimized posts per blog article
- ✅ Auto-schedule with drip campaigns
- ✅ Publish to Twitter, LinkedIn, Facebook
- ✅ Track engagement & ROI
- ✅ Save 2-3 hours per blog post

**Cost:** £6.80/month  
**Time Saved:** 20-30 hours/month  
**ROI:** Massive 🚀

---

**Questions? Issues?**
- Check Edge Function logs
- Review this guide
- Test with a single post first
- Monitor analytics dashboard

**Let's automate your social media presence!** 🤖✨

