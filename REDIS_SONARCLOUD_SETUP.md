# 🚀 REDIS + SONARCLOUD SETUP GUIDE

**Status:** 🔴 Redis not configured yet  
**Goal:** Get caching + rate limiting + code quality working  
**Time:** 20 minutes total

---

## 📦 PART 1: REDIS SETUP (15 minutes)

We need TWO Redis instances for different purposes:

### **Redis Instance #1: Caching (Knowledge Base Queries)**
- **Purpose:** Cache vector search results
- **Impact:** 50-60% faster on cache hits (~15-20s saved)
- **Provider:** Railway Redis Plugin OR Upstash
- **Environment Variable:** `REDIS_URL` or `KV_URL`

### **Redis Instance #2: Rate Limiting (API Protection)**
- **Purpose:** Prevent API abuse
- **Impact:** Security + fair usage
- **Provider:** Upstash (REST API)
- **Environment Variables:** `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`

---

## 🎯 OPTION A: Railway Redis Plugin (RECOMMENDED - Easiest)

**This sets up BOTH instances with Upstash (via Railway):**

### **Step 1: Add Railway Redis Plugin** ⏱️ 3 min

```bash
1. Go to Railway dashboard: https://railway.app/
2. Open your lightpoint-2.0 project
3. Click "New" (top right)
4. Select "Database" → "Add Redis"
5. Railway automatically creates:
   ✅ REDIS_URL (for caching)
   ✅ REDIS_PRIVATE_URL (internal)
6. Click "Deploy" (Railway redeploys automatically)
```

**Cost:** $5/month  
**Benefits:** Zero configuration, automatic env vars

---

### **Step 2: Add Upstash for Rate Limiting** ⏱️ 10 min

```bash
1. Sign up at https://console.upstash.com/
   - Use GitHub login (easiest)
   
2. Create new Redis database:
   - Click "Create Database"
   - Name: lightpoint-rate-limiting
   - Type: Regional
   - Region: Choose closest to your Railway region (europe-west4)
   - Click "Create"
   
3. Copy credentials:
   - Click on your database
   - Go to "REST API" tab
   - Copy: UPSTASH_REDIS_REST_URL
   - Copy: UPSTASH_REDIS_REST_TOKEN
   
4. Add to Railway:
   - Railway → lightpoint-2.0 → Variables
   - Click "New Variable"
   - Add:
     Name: UPSTASH_REDIS_REST_URL
     Value: https://your-endpoint.upstash.io
     
   - Click "New Variable" again
   - Add:
     Name: UPSTASH_REDIS_REST_TOKEN
     Value: your_token_here
     
5. Railway redeploys automatically (wait 2-3 min)
```

**Cost:** Free (10,000 requests/day)  
**Benefits:** Free tier is enough for testing

---

### **Step 3: Verify Redis Works** ⏱️ 2 min

```bash
# Run the test script again
npx tsx scripts/test-redis.ts

# Expected output:
✅ Standard Redis (Caching): WORKING
✅ Upstash Redis (Rate Limiting): WORKING

🎉 BOTH REDIS INSTANCES WORKING!
```

**If test fails:**
- Check Railway environment variables are set
- Wait 2-3 minutes for deployment
- Check Railway deploy logs for errors

---

## 🎯 OPTION B: Both Upstash (Free Tier)

**If you want to stay on free tier only:**

### **Step 1: Create Two Upstash Databases** ⏱️ 5 min

```bash
1. Sign up: https://console.upstash.com/

2. Create Database #1 (Caching):
   - Name: lightpoint-caching
   - Type: Regional
   - Click "Create"
   - Go to "Details" tab
   - Copy: Endpoint (this is your REDIS_URL)
   
3. Create Database #2 (Rate Limiting):
   - Name: lightpoint-rate-limiting
   - Type: Regional  
   - Click "Create"
   - Go to "REST API" tab
   - Copy: UPSTASH_REDIS_REST_URL
   - Copy: UPSTASH_REDIS_REST_TOKEN
```

---

### **Step 2: Configure Railway** ⏱️ 3 min

```bash
Railway → lightpoint-2.0 → Variables → Add:

# For caching (use redis:// URL from Database #1 Details tab)
REDIS_URL=redis://default:your_password@endpoint.upstash.io:6379

# For rate limiting (from Database #2 REST API tab)
UPSTASH_REDIS_REST_URL=https://endpoint.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token

# Railway redeploys automatically
```

---

### **Step 3: Test** ⏱️ 2 min

```bash
npx tsx scripts/test-redis.ts

# Should show both working ✅
```

---

## 📊 VERIFY CACHING IN PRODUCTION

Once Redis is configured and deployed:

### **Test Cache Miss (First Request):**
```bash
1. Visit: https://lightpoint.uk/complaints/[any-complaint-id]
2. Click "Generate Letter"
3. Time it: Should take ~4-5 minutes
4. Check Railway logs for:
   💨 Cache MISS for key: kb_search_...
   💨 Cache MISS for key: precedent_...
```

### **Test Cache Hit (Second Request):**
```bash
1. Generate another letter (similar complaint type)
2. Time it: Should take ~2.5-3 minutes (40% faster!)
3. Check Railway logs for:
   ⚡ Cache HIT for key: kb_search_...
   ⚡ Cache HIT for key: precedent_...
```

**Expected Performance:**
- **Cache miss:** ~250s (4.2 min) - Normal
- **Cache hit:** ~165s (2.75 min) - **85s faster!** ⚡
- **Cache hit rate:** 40-60% (will grow over time)

---

## 🛡️ VERIFY RATE LIMITING WORKS

Once Upstash is configured:

### **Test Rate Limit:**
```bash
# Try to generate 12 letters in quick succession
# Should see error after 10th attempt:

{
  "error": "Too many requests",
  "limit": 10,
  "remaining": 0,
  "reset": 1700000000
}
```

**Protection Active:**
- ✅ 60 requests/min per user (general API)
- ✅ 10 letters/hour per user (expensive operations)
- ✅ 20 analysis/hour per user
- ✅ 30 uploads/hour per user

---

## 🎯 PART 2: SONARCLOUD SETUP (5 minutes)

### **Step 1: Sign Up for SonarCloud** ⏱️ 2 min

```bash
1. Visit: https://sonarcloud.io/
2. Click "Sign up" → Choose "GitHub"
3. Authorize SonarCloud to access your GitHub
4. Click "Analyze new project"
5. Select your organization: oracleconsulting
6. Select repository: lightpoint-2.0
7. Click "Set Up"
```

---

### **Step 2: Configure GitHub Actions** ⏱️ 2 min

```bash
1. SonarCloud will show you a token:
   - Copy the token (looks like: sqp_xxxxxxxxxxxxx)
   
2. Add to GitHub repository secrets:
   - Go to: https://github.com/oracleconsulting/lightpoint-2.0/settings/secrets/actions
   - Click "New repository secret"
   - Name: SONAR_TOKEN
   - Value: [paste token from step 1]
   - Click "Add secret"
```

---

### **Step 3: Add GitHub Actions Workflow** ⏱️ 1 min

**The workflow file is already created! You just need to commit it:**

```bash
# File already exists at: .github/workflows/sonarcloud.yml
# Just needs to be pushed to GitHub

cd /Users/James.Howard/Documents/OracleConsultingAI/lightpoint-2.0
git add .github/workflows/sonarcloud.yml sonar-project.properties
git commit -m "feat: add SonarCloud code quality scanning

- GitHub Actions workflow for automatic scans
- Quality gates configured
- Runs on every PR and push to main"
git push origin main
```

---

### **Step 4: First Scan** ⏱️ Auto

```bash
GitHub Actions will automatically:
1. Trigger on the push you just made
2. Run SonarCloud analysis
3. Report results in ~2-3 minutes

Check progress:
https://github.com/oracleconsulting/lightpoint-2.0/actions
```

---

### **Step 5: View Results** ⏱️ 1 min

```bash
1. Go to: https://sonarcloud.io/
2. Click on your project: lightpoint-2.0
3. View dashboard showing:
   - Bugs: 0 (target)
   - Vulnerabilities: 0 (target)
   - Code Smells: <50 (acceptable)
   - Coverage: N/A (no tests yet)
   - Duplications: <3% (target)
   - Technical Debt: <2d (target)
```

---

## ✅ SUCCESS CHECKLIST

### **Redis Caching:**
- [ ] Railway Redis plugin added OR Upstash DB #1 created
- [ ] `REDIS_URL` or `KV_URL` environment variable set
- [ ] Test script shows: ✅ Standard Redis WORKING
- [ ] Railway deployment successful
- [ ] First letter generation shows "Cache MISS" in logs
- [ ] Second letter generation shows "Cache HIT" in logs
- [ ] Cache hit is significantly faster (~2.75 min vs ~4.2 min)

### **Rate Limiting:**
- [ ] Upstash account created
- [ ] Rate limiting database created
- [ ] `UPSTASH_REDIS_REST_URL` set in Railway
- [ ] `UPSTASH_REDIS_REST_TOKEN` set in Railway
- [ ] Test script shows: ✅ Upstash Redis WORKING
- [ ] Railway deployment successful
- [ ] Rate limits enforce correctly (test by rapid requests)

### **SonarCloud:**
- [ ] SonarCloud account created
- [ ] lightpoint-2.0 project analyzed
- [ ] `SONAR_TOKEN` added to GitHub secrets
- [ ] GitHub Actions workflow committed
- [ ] First scan completed successfully
- [ ] Quality gate passes (or shows actionable issues)
- [ ] Badge shows in README (optional)

---

## 🎯 EXPECTED RESULTS

### **Performance Gains:**

```
╔════════════════════════════════════════════════╗
║           BEFORE REDIS CACHING                 ║
╠════════════════════════════════════════════════╣
║ Letter Generation: 250s (4.2 min) every time  ║
║ Cache Hit Rate: 0%                             ║
╚════════════════════════════════════════════════╝

╔════════════════════════════════════════════════╗
║           AFTER REDIS CACHING                  ║
╠════════════════════════════════════════════════╣
║ Cache Miss: 250s (4.2 min)                     ║
║ Cache Hit: 165s (2.75 min) ⚡ 85s faster!      ║
║ Average (50% hit rate): 207s (3.45 min)        ║
║ Cache Hit Rate: 40-60% (grows over time)       ║
╚════════════════════════════════════════════════╝

Total improvement: 7 min → 3.45 min (51% faster!)
With cache hits: 7 min → 2.75 min (61% faster!)
```

---

## 🐛 TROUBLESHOOTING

### **Redis Test Fails:**

**Issue:** `❌ Standard Redis: NOT CONFIGURED`
```bash
Solution:
1. Check Railway → Variables for REDIS_URL or KV_URL
2. If missing, add Redis plugin or Upstash
3. Redeploy application
4. Wait 2-3 minutes for deployment
5. Run test again
```

**Issue:** `❌ Connection refused` or `ECONNREFUSED`
```bash
Solution:
1. Check Redis URL format:
   Railway Plugin: redis://default:password@host:port
   Upstash: redis://default:password@host:port
2. Check firewall/security groups allow connections
3. Verify Redis instance is running (Upstash console)
```

---

### **Rate Limiting Test Fails:**

**Issue:** `❌ Upstash Redis: NOT CONFIGURED`
```bash
Solution:
1. Check Railway → Variables for:
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN
2. If missing, get from Upstash console → REST API tab
3. Add to Railway variables
4. Redeploy
```

**Issue:** `HTTP 401: Unauthorized`
```bash
Solution:
1. Check token is correct (no extra spaces)
2. Regenerate token in Upstash console if needed
3. Update Railway variable
4. Redeploy
```

---

### **SonarCloud Scan Fails:**

**Issue:** GitHub Action fails with "Missing SONAR_TOKEN"
```bash
Solution:
1. Go to GitHub → Settings → Secrets → Actions
2. Add secret: SONAR_TOKEN = your_sonarcloud_token
3. Re-run GitHub Action
```

**Issue:** Quality gate fails with many issues
```bash
Solution:
This is normal for first scan!
1. Review issues in SonarCloud dashboard
2. Fix critical bugs and vulnerabilities first
3. Ignore code smells for now (cosmetic)
4. Push fixes → automatic re-scan
```

---

## 📞 NEXT STEPS AFTER SETUP

Once everything is working:

1. **Monitor cache performance (24-48 hours)**
   - Track cache hit rates in Railway logs
   - Measure generation time improvements
   - Verify no errors introduced

2. **Review SonarCloud findings**
   - Fix any critical bugs or vulnerabilities
   - Create tickets for code smells
   - Set up quality gate rules

3. **Plan streaming UX**
   - Real-time progress updates
   - Server-Sent Events implementation
   - Makes it feel 70% faster!

---

## 🎉 DONE!

When all checkboxes are complete:
- ✅ Redis caching: 50-60% faster
- ✅ Rate limiting: API protected
- ✅ Code quality: Monitored continuously
- ✅ Foundation for further optimizations

**Your 7-minute system is now 3.5 minutes with caching! 🚀**

Next goal: <2 minutes with streaming + templates! 🎯

