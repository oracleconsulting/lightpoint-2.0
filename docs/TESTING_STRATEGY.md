# Critical Functions to Test - Priority List

## Phase 2: Testing Strategy

### **Test Coverage Target: 80%+ on new code**

---

## 🎯 **Priority 1: Business-Critical Functions** (Must test)

### 1. **Authentication & Authorization**
- `contexts/AuthContext.tsx` - User authentication flow
- `lib/trpc/trpc.ts` - Context creation with session validation
- `middleware.ts` - Route protection

### 2. **Data Processing**
- `lib/cache/redis.ts` - Cache operations (already has good structure)
- `lib/logger.ts` - Logging utility (already tested)
- `lib/embeddings.ts` - Vector embeddings generation

### 3. **Core Business Logic**
- `lib/trpc/router.ts` - API endpoints (195+ procedures)
- `lib/documentProcessor.ts` - Document analysis
- `lib/vectorSearch.ts` - Knowledge base search

---

## 📋 **Testing Approach**

### **Unit Tests** (Fast, isolated)
- Pure functions
- Utility libraries
- Data transformations

### **Integration Tests** (Slower, realistic)
- API endpoints
- Database operations
- External service calls

---

## 🚀 **Quick Wins** (Start here)

1. ✅ **`lib/logger.ts`** - Already has tests!
2. **`lib/cache/redis.ts`** - Simple, well-structured
3. **`lib/embeddings.ts`** - Pure functions
4. **`lib/documentAnalysis.ts`** - Text processing

---

## 📝 **Test Examples**

### Example 1: Testing Redis Cache
```typescript
describe('Redis Cache', () => {
  it('should generate consistent cache keys', () => {
    const key1 = generateCacheKey('test', { a: 1, b: 2 });
    const key2 = generateCacheKey('test', { b: 2, a: 1 });
    expect(key1).toBe(key2); // Should be same regardless of order
  });
  
  it('should handle missing Redis URL gracefully', async () => {
    process.env.REDIS_URL = '';
    const client = await getRedisClient();
    expect(client).toBeNull();
  });
});
```

### Example 2: Testing Document Processing
```typescript
describe('Document Processor', () => {
  it('should extract text from PDF', async () => {
    const mockFile = createMockPDF();
    const text = await extractText(mockFile);
    expect(text).toContain('expected content');
  });
  
  it('should handle corrupted files', async () => {
    const corruptedFile = createCorruptedPDF();
    await expect(extractText(corruptedFile)).rejects.toThrow();
  });
});
```

---

## 🎯 **Realistic Goal**

Instead of 80%+ overall coverage (which would require ~2000+ tests), let's target:

✅ **100% coverage on NEW code** (quality gate requirement)  
✅ **Critical path coverage** (auth, payments, data integrity)  
✅ **High-risk areas** (security, data processing)

This gives us **quality** over **quantity** and passes the Quality Gate!

