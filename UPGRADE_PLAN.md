# 🚀 LIGHTPOINT V2.0 - COMPREHENSIVE UPGRADE PLAN

**Project:** Lightpoint v2.0 → Production-Ready Application  
**Timeline:** 3-4 weeks  
**Status:** 🎯 Ready to begin systematic improvements

---

## 🎯 IMMEDIATE FIXES (Week 1 - Days 1-2)

### Day 1: Critical Functionality

**Priority 1: Fix Knowledge Base Search** 🚨 BLOCKER
- [ ] Run SQL to create vector search functions
- [ ] Verify 310 KB documents have embeddings
- [ ] Test complaint analysis works
- [ ] File: `FIX_KB_SEARCH_ERROR.md`
- **Time:** 30 minutes
- **Impact:** Unblocks all features

**Priority 2: Create Storage Buckets**
- [ ] Create `complaint-documents` bucket
- [ ] Create `knowledge-base` bucket
- [ ] Add RLS policies for both
- [ ] Test document upload
- **Time:** 20 minutes
- **Impact:** Enables document uploads

**Priority 3: Verify All Features**
- [ ] Test login/logout
- [ ] Test complaint creation
- [ ] Test document upload
- [ ] Test letter generation
- [ ] Test knowledge base search
- **Time:** 30 minutes
- **Impact:** Confidence in v2.0

---

## 🔒 SECURITY HARDENING (Week 1 - Days 3-5)

### Day 3: Authentication & Authorization

**Task 1: Implement tRPC Authentication**
- [ ] Create `lib/trpc/auth.ts` with protected procedures
- [ ] Replace all `publicProcedure` with `protectedProcedure`
- [ ] Add user context to all mutations
- [ ] Test auth flow works
- **Files:** `lib/trpc/auth.ts`, `lib/trpc/router.ts`
- **Time:** 3-4 hours
- **Impact:** 🚨 CRITICAL - Prevents unauthorized API access

**Task 2: Add API Rate Limiting**
- [ ] Install rate limiting package
- [ ] Create `lib/rateLimiter.ts`
- [ ] Add middleware to tRPC
- [ ] Configure limits per endpoint
- [ ] Test rate limiting works
- **Time:** 2-3 hours
- **Impact:** Prevents API abuse

**Task 3: Security Headers & CORS**
- [ ] Verify security headers in `next.config.js`
- [ ] Configure CORS properly
- [ ] Add CSP headers
- [ ] Test with security scanner
- **Time:** 1 hour
- **Impact:** Prevents XSS, clickjacking

### Day 4-5: Code Organization

**Task 4: Split Monolithic Router**
- [ ] Create `lib/trpc/routers/` directory
- [ ] Split into: complaints, documents, analysis, letters, knowledge, users, settings
- [ ] Update imports across codebase
- [ ] Test all endpoints still work
- **Time:** 4-6 hours
- **Impact:** Maintainability, code quality

**Task 5: Implement Error Handling**
- [ ] Create custom error classes in `lib/errors.ts`
- [ ] Create Supabase query wrapper
- [ ] Replace all try-catch blocks
- [ ] Add proper error types
- **Time:** 3-4 hours
- **Impact:** Better debugging, user experience

---

## 🧪 TESTING INFRASTRUCTURE (Week 2)

### Day 6-7: Test Setup

**Task 6: Install & Configure Vitest**
- [ ] Install Vitest and testing libraries
- [ ] Create `vitest.config.ts`
- [ ] Set up test environment
- [ ] Create test utilities
- **Time:** 2-3 hours

**Task 7: Critical Path Tests**
- [ ] PII sanitization tests (GDPR compliance)
- [ ] Vector search tests
- [ ] Time calculation tests
- [ ] Letter generation tests
- [ ] Document processing tests
- **Time:** 6-8 hours
- **Target:** 60%+ coverage on critical paths

### Day 8-9: Integration Tests

**Task 8: Database Integration Tests**
- [ ] RLS policy tests
- [ ] Vector search function tests
- [ ] CRUD operation tests
- [ ] Cascade deletion tests
- **Time:** 4-6 hours

**Task 9: API Integration Tests**
- [ ] tRPC endpoint tests
- [ ] Authentication tests
- [ ] Rate limiting tests
- [ ] Error handling tests
- **Time:** 4-6 hours

---

## 📊 CODE QUALITY & CI/CD (Week 2-3)

### Day 10: SonarQube Integration

**Task 10: Configure SonarQube**
- [ ] Add `sonar-project.properties`
- [ ] Configure quality gates
- [ ] Set coverage thresholds
- [ ] Add SonarQube to CI/CD
- **Time:** 2-3 hours

**Example `sonar-project.properties`:**
```properties
sonar.projectKey=lightpoint-v2
sonar.projectName=Lightpoint v2.0
sonar.projectVersion=2.0.0
sonar.sources=app,components,lib
sonar.tests=tests
sonar.exclusions=node_modules/**,**/*.test.ts,**/*.spec.ts
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.javascript.lcov.reportPaths=coverage/lcov.info
```

### Day 11: GitHub Actions CI/CD

**Task 11: Create CI/CD Pipeline**

Create `.github/workflows/ci.yml`:
```yaml
name: Lightpoint v2.0 CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:coverage
      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}

  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm audit --production
      - name: Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}

  build:
    needs: [lint-and-type-check, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

  deploy:
    needs: [build]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: "lightpoint-v2"
```

### Day 12: Structured Logging

**Task 12: Replace console.log with Winston**
- [ ] Install Winston
- [ ] Create `lib/logger.ts`
- [ ] Replace all console.log calls
- [ ] Add log levels
- [ ] Configure for production
- **Time:** 3-4 hours
- **Files to update:** 50+ files

---

## ⚡ PERFORMANCE OPTIMIZATION (Week 3)

### Day 13-14: Code Splitting & Caching

**Task 13: Implement Code Splitting**
- [ ] Install `@next/bundle-analyzer`
- [ ] Analyze bundle size
- [ ] Add dynamic imports for heavy components
- [ ] Optimize chunk loading
- **Time:** 4-6 hours
- **Impact:** Faster page loads

**Task 14: Implement Caching Layer**
- [ ] Install LRU cache
- [ ] Create `lib/cache.ts`
- [ ] Cache vector search results
- [ ] Cache AI responses
- [ ] Add cache invalidation
- **Time:** 3-4 hours
- **Impact:** Faster repeat searches

### Day 15: Database Optimization

**Task 15: Query Optimization**
- [ ] Add missing indexes
- [ ] Optimize N+1 queries
- [ ] Add query result caching
- [ ] Optimize RLS policies
- **Time:** 4-6 hours
- **Impact:** Faster database queries

**Task 16: AI Pipeline Optimization**
- [ ] Parallelize independent AI calls
- [ ] Implement streaming responses
- [ ] Add prompt caching
- [ ] Optimize token usage
- **Time:** 4-6 hours
- **Impact:** Faster letter generation

---

## 📈 MONITORING & OBSERVABILITY (Week 3-4)

### Day 16: Error Tracking

**Task 17: Sentry Integration**
- [ ] Install Sentry
- [ ] Configure error boundaries
- [ ] Add performance monitoring
- [ ] Set up alerts
- **Time:** 2-3 hours

### Day 18: Performance Monitoring

**Task 18: APM & Metrics**
- [ ] Create health check dashboard
- [ ] Monitor AI response times
- [ ] Track database query performance
- [ ] Set up uptime monitoring
- **Time:** 3-4 hours

---

## 🎯 SONARQUBE INTEGRATION WORKFLOW

### Setup SonarQube in Your Project

**Step 1: Add sonar-project.properties**

```properties
sonar.projectKey=lightpoint-v2
sonar.organization=oracleconsulting
sonar.projectName=Lightpoint v2.0
sonar.projectVersion=2.0.0

# Source directories
sonar.sources=app,components,lib,types
sonar.tests=tests

# Exclusions
sonar.exclusions=node_modules/**,\
  .next/**,\
  coverage/**,\
  **/*.test.ts,\
  **/*.spec.ts,\
  **/*.d.ts

# Test coverage
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.javascript.lcov.reportPaths=coverage/lcov.info

# Code coverage thresholds
sonar.coverage.exclusions=**/*.test.ts,**/*.spec.ts

# Quality gates
sonar.qualitygate.wait=true
```

**Step 2: Add SonarQube Script to package.json**

```json
{
  "scripts": {
    "sonar": "sonar-scanner",
    "sonar:local": "npm run test:coverage && sonar-scanner"
  }
}
```

**Step 3: Run Locally**

```bash
# Generate test coverage first
npm run test:coverage

# Run SonarQube scan
npm run sonar
```

**Step 4: View Results**

- Open your SonarQube dashboard
- Check quality gates
- Review code smells
- Fix security hotspots

---

## 📋 IMPLEMENTATION CHECKLIST

### Week 1: Critical Fixes & Security
- [ ] Fix KB search error (FIX_KB_SEARCH_ERROR.md)
- [ ] Create storage buckets
- [ ] Implement tRPC authentication
- [ ] Add rate limiting
- [ ] Split monolithic router

### Week 2: Testing & CI/CD
- [ ] Set up Vitest
- [ ] Write critical path tests (60% coverage goal)
- [ ] Configure SonarQube
- [ ] Create GitHub Actions pipeline
- [ ] Implement structured logging

### Week 3: Performance & Optimization
- [ ] Code splitting & bundle optimization
- [ ] Caching layer
- [ ] Database query optimization
- [ ] AI pipeline optimization

### Week 4: Monitoring & Polish
- [ ] Sentry error tracking
- [ ] Performance monitoring
- [ ] Documentation updates
- [ ] Load testing
- [ ] Final security audit

---

## 🎯 SUCCESS METRICS

### Code Quality (SonarQube)
- Quality Gate: PASSING ✅
- Code Coverage: >60%
- Technical Debt: <1 day
- Security Hotspots: 0
- Bugs: 0
- Code Smells: <50

### Performance
- Page load: <2s
- Time to Interactive: <3s
- API response time: <500ms
- Letter generation: <45s

### Security
- npm audit: 0 vulnerabilities
- SonarQube security: A rating
- Authentication: Enforced on all endpoints
- Rate limiting: Active

---

## 💬 DAILY STANDUP FORMAT

Each day, report:
1. ✅ What was completed
2. 🔄 What's in progress
3. 🚨 Any blockers
4. 📊 SonarQube score changes

---

**Status:** 📋 Plan ready  
**Next:** Fix KB search error, then start Week 1  
**Timeline:** 3-4 weeks to production-ready  
**SonarQube:** Ready to integrate throughout

