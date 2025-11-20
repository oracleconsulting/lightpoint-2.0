# ⚡ Lightpoint v2.0 - Performance Optimization Plan

## 🎯 Goal: 7min → <3min (180s) 

### Current State Analysis

**Total Time: ~420s (7 minutes)**

```
Document Analysis:     90-120s  (21-29%)
├─ Vector Search:      15-20s   (Multi-angle + reranking)
├─ LLM Analysis:       70-100s  (Sonnet 4.5, 4000 tokens)
└─ DB Operations:      5s

Letter Generation:     180-240s (71-79%)
├─ Stage 1 (Facts):    60-80s   (Sonnet 4.5, 3000 tokens)
├─ Stage 2 (Structure):60-80s   (Opus 4.1, 3000 tokens)
└─ Stage 3 (Tone):     60-80s   (Opus 4.1, 4000 tokens)

TOTAL:                 270-360s (4.5-6min typical, 7min worst case)
```

---

## 🚀 Optimization Strategies (Ranked by Impact)

### **Tier 1: Quick Wins (30-40% reduction, <1 hour work)**

#### 1. **Parallel Stage 1 + Vector Search** 
**Impact: Save 15-20s**
- Currently: Vector search → Analysis (sequential)
- Optimized: Run vector search WHILE Stage 1 is running
- Vector search doesn't need analysis results
- **Implementation:** `Promise.all([vectorSearch(), stage1()])`

#### 2. **Redis Cache for Knowledge Base**
**Impact: Save 10-15s on repeat complaints**
- Cache vector search results by query hash
- TTL: 24 hours (knowledge base doesn't change that often)
- Hit rate: ~40-60% (similar complaints)
- **Implementation:** Check cache → if miss, search → cache results

#### 3. **Reduce max_tokens Safely**
**Impact: Save 20-30s across all stages**
- Stage 1: 3000 → 2500 tokens (facts are concise)
- Stage 2: 3000 → 2500 tokens (structure is predictable)
- Stage 3: 4000 → 3500 tokens (final letter)
- LLM speed is proportional to output tokens
- **Risk:** Low (current letters are ~2000-2500 tokens)

#### 4. **Streaming Response (UX Improvement)**
**Impact: Perceived time: 7min → 2min**
- Don't wait for full letter
- Stream stage-by-stage to frontend:
  - "✅ Analysis complete..." (after 90s)
  - "✅ Facts extracted..." (after 150s)
  - "✅ Structure complete..." (after 210s)
  - "✅ Final touches..." (after 270s)
- User sees progress, feels faster
- **Implementation:** Server-Sent Events (SSE) or WebSocket

---

### **Tier 2: Medium Wins (20-30% reduction, 2-3 hours work)**

#### 5. **Two-Stage Pipeline (Aggressive)**
**Impact: Save 60-80s**
- **Current:** 3 stages (Extract → Structure → Tone)
- **Optimized:** 2 stages (Structure + Tone → Polish)
- **Rationale:** Opus 4.1 is smart enough to structure AND add tone in one go
- **Risk:** Medium (need to test quality)
- **A/B Test:** Run both pipelines, compare quality

#### 6. **Smarter Context Management**
**Impact: Save 10-15s**
- Currently: Sending full analysis (5000+ tokens) to each stage
- Optimized: Send only what that stage needs
  - Stage 1: Just raw analysis
  - Stage 2: Just facts from Stage 1
  - Stage 3: Just structured letter from Stage 2
- Smaller inputs = faster LLM responses

#### 7. **Better Model Selection**
**Impact: Save 20-30s, reduce cost 40%**
- **Stage 1 (Facts):** Sonnet 4.5 → **Haiku 4** (5x faster, same quality for extraction)
- **Stage 2 (Structure):** Opus 4.1 → **Sonnet 4.5** (2x faster, 90% quality)
- **Stage 3 (Tone):** Keep Opus 4.1 (this is where quality matters)
- **Cost:** $0.60 → $0.35 per letter

---

### **Tier 3: Big Wins (40-50% reduction, 1-2 days work)**

#### 8. **Pre-compute Common Patterns**
**Impact: Save 30-40s**
- Build a "letter template cache" for common complaint types
- Pre-generate structure for:
  - DT-Individual delays
  - Penalty cancellation errors
  - SEIS claim delays
- Stage 2 becomes "fill in the blanks" not "generate structure"
- **Implementation:** Background job to pre-generate templates

#### 9. **Batch Processing + Priority Queue**
**Impact: Save 20-30s under load**
- When multiple complaints are being processed:
  - Batch LLM requests (save API overhead)
  - Priority queue (urgent complaints first)
  - Load balancing across OpenRouter providers
- **Implementation:** Bull queue + Redis

#### 10. **Edge Caching (Cloudflare Workers)**
**Impact: Save 5-10s**
- Cache vector embeddings at edge
- Cache knowledge base chunks
- Reduce latency to Supabase
- **Cost:** ~$5/month Cloudflare Workers

---

## 📈 Projected Timeline

### **Phase 1: Quick Wins (Today, 2-3 hours)**
```bash
✓ Parallel Stage 1 + Vector Search    (-20s)
✓ Reduce max_tokens                    (-25s)
✓ Redis cache for KB                   (-15s on cache hit)
✓ Streaming UX                         (feels 70% faster)

NEW TOTAL: ~280s (4.6min) typical, 200s (3.3min) on cache hit
```

### **Phase 2: Medium Wins (Tomorrow, 4-6 hours)**
```bash
✓ Two-stage pipeline (optional)        (-70s, needs testing)
✓ Smarter context management           (-12s)
✓ Better model selection               (-25s)

NEW TOTAL: ~173s (2.9min) typical, 120s (2min) on cache hit
```

### **Phase 3: Big Wins (Next Week, 2-3 days)**
```bash
✓ Pre-computed templates               (-35s)
✓ Batch processing                     (-20s under load)
✓ Edge caching                         (-8s)

NEW TOTAL: ~110s (1.8min) typical, 70s (1.2min) on cache hit
```

---

## 🎯 Recommended Immediate Actions

### **Start with Phase 1 (Today):**

1. **Parallel Processing** (30 min)
2. **Token Reduction** (15 min)
3. **Streaming UX** (45 min)
4. **Redis Cache** (60 min)

**Result: 7min → 3.3min (53% faster) with ~2.5 hours work**

---

## 💰 Cost vs Speed Trade-offs

| Optimization | Time Saved | Cost Impact | Quality Impact | Effort |
|--------------|-----------|-------------|----------------|--------|
| Parallel Processing | 20s | None | None | 30 min |
| Token Reduction | 25s | -15% | -2% | 15 min |
| Redis Cache | 15s | +$10/mo | None | 1 hr |
| Streaming UX | 0s (UX) | None | None | 45 min |
| Two-Stage Pipeline | 70s | -20% | -5%? | 3 hrs |
| Model Swap | 25s | -40% | -5% | 2 hrs |
| Templates | 35s | None | +10% | 2 days |

---

## 🔬 A/B Testing Strategy

### Test Quality vs Speed:

```typescript
// Track performance + quality metrics
interface LetterMetrics {
  pipelineType: 'three-stage' | 'two-stage';
  totalTime: number;
  stage1Time: number;
  stage2Time: number;
  stage3Time: number;
  userRating: number; // 1-5 stars
  editsMade: number; // How many edits user made
  approved: boolean; // Did user approve letter?
  costUSD: number;
}
```

**Success Criteria:**
- Time: <180s target
- Quality: >4.2 stars average
- Approval rate: >90%
- Cost: <$0.50 per letter

---

## 📊 Monitoring Dashboard

Track in production:
- P50, P95, P99 generation times
- Cache hit rates
- Model costs per letter
- User satisfaction scores
- Error rates by stage

---

## 🚨 Rollback Plan

If any optimization degrades quality:
1. Feature flag to revert
2. A/B test old vs new
3. Gradual rollout (10% → 50% → 100%)

---

## Next Steps

1. **Implement Phase 1 (Today):** Parallel + Tokens + Streaming + Redis
2. **Deploy to staging:** Test with real complaints
3. **A/B test in production:** 20% traffic
4. **Monitor metrics:** Speed, quality, cost
5. **Full rollout:** If metrics ✅

**Target: 7min → <3min by end of week! 🚀**

