# Lightpoint 2.0 - Roadmap to 10/10
## Comprehensive Action Plan from Architecture Assessment

**Assessment Date:** December 3, 2025  
**Target Completion:** Q1 2025  
**Current Overall Score:** 5.5/10  
**Target Score:** 10/10

---

## 📊 Current Scorecard vs Target

| Category | Current | Target | Gap |
|----------|---------|--------|-----|
| **Security** | 4/10 | 10/10 | 🚨 +6 |
| **Testing** | 1/10 | 10/10 | 🚨 +9 |
| **Performance** | 6/10 | 10/10 | 🟡 +4 |
| **Code Quality** | 7/10 | 10/10 | 🟢 +3 |
| **Scalability** | 7/10 | 10/10 | 🟢 +3 |
| **Documentation** | 8/10 | 10/10 | 🟢 +2 |

---

## 🚨 PHASE 1: CRITICAL SECURITY (Week 1)
**Goal: Security 4/10 → 7/10**

### 1.1 Next.js Security Update
```bash
# Update Next.js to fix SSRF and Cache Poisoning vulnerabilities
npm update next@14.2.33
npm audit fix --force
```

**Tasks:**
- [ ] Update Next.js to 14.2.33+ (latest stable)
- [ ] Run `npm audit` and fix all vulnerabilities
- [ ] Review and update all dependencies

### 1.2 API Authentication
**Current Issue:** All tRPC endpoints use `publicProcedure`

**Files to modify:**
- `lib/trpc/trpc.ts` - Add JWT validation middleware
- `lib/trpc/router.ts` - Convert public to protected procedures
- `middleware.ts` - Add authentication checks

```typescript
// lib/trpc/trpc.ts - Add protected procedure with auth
import { TRPCError } from '@trpc/server';

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const { supabase } = ctx;
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new TRPCError({ 
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this resource'
    });
  }
  
  return next({
    ctx: { ...ctx, user }
  });
});
```

**Procedures to protect:**
- [ ] `complaints.create`
- [ ] `complaints.list`
- [ ] `complaints.getById`
- [ ] `letters.generateComplaint`
- [ ] `letters.save`
- [ ] `documents.list`
- [ ] `knowledge.addPrecedent`
- [ ] `users.list`
- [ ] All admin procedures

### 1.3 Security Headers
**File:** `next.config.js`

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://openrouter.ai https://api.cohere.ai;"
  }
];

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

### 1.4 Remove Console Logging in Production
**File:** `lib/logger.ts`

```typescript
// lib/logger.ts - Production-safe logging
const isProduction = process.env.NODE_ENV === 'production';

export const logger = {
  info: (...args: any[]) => {
    if (!isProduction) console.log('[INFO]', ...args);
    // In production, send to logging service (e.g., Axiom, Logtail)
  },
  warn: (...args: any[]) => {
    console.warn('[WARN]', ...args);
    // Always log warnings
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
    // Always log errors, send to error tracking (e.g., Sentry)
  },
  debug: (...args: any[]) => {
    if (!isProduction) console.log('[DEBUG]', ...args);
  }
};
```

---

## 🧪 PHASE 2: TESTING INFRASTRUCTURE (Week 2-3)
**Goal: Testing 1/10 → 8/10**

### 2.1 Setup Testing Framework
```bash
# Already have vitest, ensure it's configured
npm install -D @testing-library/react @testing-library/jest-dom msw
```

### 2.2 Critical Path Tests (Priority Order)

#### A. Authentication Tests
```typescript
// __tests__/auth/login.test.ts
describe('Authentication', () => {
  test('redirects unauthenticated users to login', async () => {});
  test('allows authenticated users to access dashboard', async () => {});
  test('protects API endpoints', async () => {});
});
```

#### B. Complaint Flow Tests
```typescript
// __tests__/complaints/workflow.test.ts
describe('Complaint Workflow', () => {
  test('creates complaint with required fields', async () => {});
  test('uploads and processes documents', async () => {});
  test('generates analysis from documents', async () => {});
  test('generates letter with three-stage pipeline', async () => {});
  test('saves and locks letter', async () => {});
  test('tracks complaint status changes', async () => {});
});
```

#### C. Knowledge Base Tests
```typescript
// __tests__/knowledge/search.test.ts
describe('Knowledge Base Search', () => {
  test('returns relevant CRG documents', async () => {});
  test('matches precedents by similarity', async () => {});
  test('applies category filtering', async () => {});
  test('reranking improves precision', async () => {});
});
```

#### D. AI Pipeline Tests
```typescript
// __tests__/ai/pipeline.test.ts
describe('Three-Stage Letter Pipeline', () => {
  test('Stage 1: extracts facts correctly', async () => {});
  test('Stage 2: structures letter properly', async () => {});
  test('Stage 3: applies professional tone', async () => {});
  test('handles API failures gracefully', async () => {});
});
```

### 2.3 E2E Tests with Playwright
```bash
npm install -D @playwright/test
```

```typescript
// e2e/complaint-flow.spec.ts
test('complete complaint workflow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  await page.goto('/complaints/new');
  await page.fill('[name="reference"]', 'TEST-001');
  // ... complete flow
});
```

### 2.4 Coverage Targets
| Component | Current | Target Week 2 | Target Week 4 |
|-----------|---------|---------------|---------------|
| Auth | 0% | 80% | 95% |
| Complaints | 0% | 60% | 85% |
| Letters | 0% | 60% | 85% |
| Knowledge | 0% | 50% | 80% |
| UI Components | 0% | 40% | 70% |
| **Overall** | **0%** | **50%** | **80%** |

---

## ⚡ PHASE 3: PERFORMANCE (Week 3-4)
**Goal: Performance 6/10 → 9/10**

### 3.1 Implement Response Streaming
**File:** `app/api/complaints/generate-letter-stream/route.ts`

```typescript
// Already exists, ensure it's being used properly
export async function POST(request: Request) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Stage 1: Facts
      controller.enqueue(encoder.encode('data: {"stage": "facts", "progress": 0}\n\n'));
      const facts = await extractFacts(context);
      controller.enqueue(encoder.encode('data: {"stage": "facts", "progress": 100}\n\n'));
      
      // Stage 2: Structure
      controller.enqueue(encoder.encode('data: {"stage": "structure", "progress": 0}\n\n'));
      const structure = await generateStructure(facts);
      controller.enqueue(encoder.encode('data: {"stage": "structure", "progress": 100}\n\n'));
      
      // Stage 3: Tone
      controller.enqueue(encoder.encode('data: {"stage": "tone", "progress": 0}\n\n'));
      const letter = await applyTone(structure);
      controller.enqueue(encoder.encode(`data: {"stage": "complete", "letter": ${JSON.stringify(letter)}}\n\n`));
      
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 3.2 Parallelize AI Pipeline
```typescript
// lib/openrouter/three-stage-client.ts
async function generateLetterParallel(context: LetterContext) {
  // Run precedent search and structure prep in parallel
  const [precedents, structurePrep] = await Promise.all([
    searchPrecedents(context.complaintType),
    prepareStructureContext(context)
  ]);
  
  // Then run the 3 stages
  // Stage 1 can start immediately
  const facts = await extractFacts(context);
  
  // Structure and tone are sequential
  const structure = await generateStructure(facts, precedents);
  const letter = await applyTone(structure);
  
  return letter;
}
```

### 3.3 Redis Caching for Vector Search
```typescript
// lib/cache/vectorCache.ts
import { redis } from './redis';

const CACHE_TTL = 3600; // 1 hour

export async function cachedVectorSearch(
  query: string,
  category?: string
): Promise<SearchResult[]> {
  const cacheKey = `vs:${category || 'all'}:${hashQuery(query)}`;
  
  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Perform search
  const results = await vectorSearch(query, category);
  
  // Cache results
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(results));
  
  return results;
}
```

### 3.4 Query Optimization
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_complaints_org_status 
ON complaints(organization_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_documents_complaint 
ON documents(complaint_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_time_logs_complaint 
ON time_logs(complaint_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_letters_complaint_type 
ON generated_letters(complaint_id, letter_type);
```

### 3.5 Bundle Size Optimization
```bash
npm install -D @next/bundle-analyzer
```

```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... existing config
});
```

---

## 🧹 PHASE 4: CODE QUALITY (Week 4-5)
**Goal: Code Quality 7/10 → 10/10**

### 4.1 Split Monolithic Router
**Current:** `router.ts` - 1,830 lines  
**Target:** Domain-specific modules

```
lib/trpc/
├── router.ts              # Main router (< 100 lines)
├── routers/
│   ├── complaints.ts      # Complaint procedures
│   ├── letters.ts         # Letter procedures
│   ├── documents.ts       # Document procedures
│   ├── knowledge.ts       # Knowledge base procedures
│   ├── time.ts            # Time tracking procedures
│   ├── users.ts           # User management procedures
│   ├── tickets.ts         # Support ticket procedures
│   ├── dashboard.ts       # Dashboard procedures
│   ├── aiSettings.ts      # AI settings procedures
│   └── kbChat.ts          # KB chat procedures
├── trpc.ts                # tRPC setup
└── Provider.tsx           # React provider
```

### 4.2 Remove Dead Code
```bash
# Files to delete
rm lib/openrouter/client-OLD-PRESCRIPTIVE.ts
rm components/blog-v2-backup-20251129/ -rf
# Review and remove other unused files
```

### 4.3 Add Database Constraints
```sql
-- Add CHECK constraints
ALTER TABLE complaints 
ADD CONSTRAINT chk_complaint_status 
CHECK (status IN ('assessment', 'active', 'escalated', 'resolved', 'closed'));

ALTER TABLE generated_letters
ADD CONSTRAINT chk_letter_type
CHECK (letter_type IN ('initial_complaint', 'tier2_escalation', 'adjudicator', 'follow_up'));

ALTER TABLE support_tickets
ADD CONSTRAINT chk_ticket_priority
CHECK (priority IN ('low', 'medium', 'high', 'urgent'));

ALTER TABLE support_tickets
ADD CONSTRAINT chk_ticket_status
CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'));
```

### 4.4 Setup CI/CD Pipeline
**File:** `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run type-check
      
      - name: Lint
        run: npm run lint
      
      - name: Security audit
        run: npm audit --audit-level=high
      
      - name: Run tests
        run: npm run test
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
      
      - name: Build
        run: npm run build

  deploy:
    needs: quality
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Railway
        uses: railway/deploy@v1
        with:
          token: ${{ secrets.RAILWAY_TOKEN }}
```

---

## 📖 PHASE 5: DOCUMENTATION (Week 5)
**Goal: Documentation 8/10 → 10/10**

### 5.1 API Documentation
```typescript
// Add JSDoc comments to all tRPC procedures
/**
 * Creates a new complaint for the authenticated user's organization
 * 
 * @param input.reference - Unique client reference number
 * @param input.context - Description of the complaint situation
 * @param input.department - HMRC department involved (optional)
 * @returns Created complaint with ID and generated reference
 * 
 * @example
 * const complaint = await trpc.complaints.create.mutate({
 *   reference: 'CLIENT-001',
 *   context: 'VAT registration delayed for 6 months',
 *   department: 'VAT'
 * });
 */
```

### 5.2 Architecture Decision Records (ADRs)
```
docs/
├── adr/
│   ├── 001-three-stage-pipeline.md
│   ├── 002-vector-search-strategy.md
│   ├── 003-multi-tenant-architecture.md
│   ├── 004-authentication-approach.md
│   └── 005-caching-strategy.md
```

### 5.3 Runbook for Operations
```markdown
# docs/RUNBOOK.md
## Common Operations

### Adding Knowledge Base Documents
1. Place documents in `knowledge-uploads/`
2. Run `npm run process-knowledge`
3. Verify in admin panel

### Handling Rate Limits
1. Check Upstash dashboard
2. Increase limits in `lib/rateLimit/middleware.ts`
3. Deploy changes

### Database Migrations
1. Create SQL file in `supabase/migrations/`
2. Test locally
3. Run in Supabase SQL editor
4. Update SYSTEM_OVERVIEW.md
```

---

## 🚀 PHASE 6: SCALABILITY & ENTERPRISE (Week 6+)
**Goal: Scalability 7/10 → 10/10**

### 6.1 SOC 2 Preparation
- [ ] Document security policies
- [ ] Implement comprehensive audit logging
- [ ] Setup access control reviews
- [ ] Data encryption at rest verification
- [ ] Incident response procedures

### 6.2 SSO Integration
```typescript
// lib/auth/sso.ts
export async function handleSAMLCallback(request: Request) {
  // Parse SAML response
  // Verify signature
  // Create/update user
  // Create session
}
```

### 6.3 Enhanced Audit Trail
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  organization_id UUID REFERENCES organizations(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_org_time ON audit_logs(organization_id, created_at DESC);
```

### 6.4 Queue System for Heavy Operations
```typescript
// lib/queue/letterQueue.ts
import { Queue, Worker } from 'bullmq';
import { redis } from '../cache/redis';

export const letterQueue = new Queue('letter-generation', { connection: redis });

export const letterWorker = new Worker('letter-generation', async (job) => {
  const { complaintId, context } = job.data;
  
  await job.updateProgress(10);
  const facts = await extractFacts(context);
  
  await job.updateProgress(40);
  const structure = await generateStructure(facts);
  
  await job.updateProgress(70);
  const letter = await applyTone(structure);
  
  await job.updateProgress(100);
  return letter;
}, { connection: redis });
```

---

## 📅 Implementation Timeline

### Week 1 (Dec 4-10) - SECURITY 🚨
| Day | Task | Owner |
|-----|------|-------|
| Mon | Update Next.js, run npm audit | Dev |
| Tue | Implement tRPC authentication | Dev |
| Wed | Add security headers | Dev |
| Thu | Remove console logging, add proper logger | Dev |
| Fri | Security testing & verification | QA |

### Week 2 (Dec 11-17) - TESTING Part 1
| Day | Task | Owner |
|-----|------|-------|
| Mon | Setup testing infrastructure | Dev |
| Tue | Auth & complaint tests | Dev |
| Wed | Letter generation tests | Dev |
| Thu | Knowledge base tests | Dev |
| Fri | CI/CD pipeline setup | Dev |

### Week 3 (Dec 18-24) - TESTING Part 2 + PERFORMANCE
| Day | Task | Owner |
|-----|------|-------|
| Mon | E2E tests with Playwright | Dev |
| Tue | Response streaming implementation | Dev |
| Wed | Redis caching for vector search | Dev |
| Thu | Query optimization | Dev |
| Fri | Performance benchmarking | QA |

### Week 4 (Dec 25-31) - CODE QUALITY
| Day | Task | Owner |
|-----|------|-------|
| Mon | Split tRPC router | Dev |
| Tue | Remove dead code | Dev |
| Wed | Add database constraints | Dev |
| Thu | Code review & cleanup | Team |
| Fri | Documentation updates | Dev |

### Week 5-6 (Jan 1-14) - DOCUMENTATION & SCALABILITY
| Day | Task | Owner |
|-----|------|-------|
| Week 5 | API docs, ADRs, Runbook | Dev |
| Week 6 | SOC 2 prep, audit logging | Dev |

---

## ✅ Success Metrics

### Target Scores by Phase End

| Phase | Category | Start | Target |
|-------|----------|-------|--------|
| 1 | Security | 4/10 | 7/10 |
| 2 | Testing | 1/10 | 6/10 |
| 3 | Performance | 6/10 | 8/10 |
| 4 | Code Quality | 7/10 | 9/10 |
| 5 | Documentation | 8/10 | 10/10 |
| 6 | Scalability | 7/10 | 9/10 |

### Final Target (End of Q1 2025)

| Category | Target | Verification |
|----------|--------|--------------|
| Security | 10/10 | Penetration test pass |
| Testing | 10/10 | 80%+ coverage, E2E pass |
| Performance | 10/10 | < 15s letter gen, < 100ms search |
| Code Quality | 10/10 | SonarCloud A rating |
| Documentation | 10/10 | Complete API docs, ADRs |
| Scalability | 10/10 | SOC 2 ready, queue system |

---

## 🎯 Quick Wins (Can Do Today)

1. **Update Next.js:** `npm update next@latest`
2. **Run npm audit:** `npm audit fix`
3. **Remove console.log in production:** Update logger.ts
4. **Delete dead code:** Remove backup folders
5. **Add security headers:** Update next.config.js

---

**Document Version:** 1.0  
**Created:** December 3, 2025  
**Next Review:** December 10, 2025

