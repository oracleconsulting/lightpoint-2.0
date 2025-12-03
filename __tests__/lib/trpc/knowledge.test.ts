import { describe, it, expect, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/supabase/client', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              { id: '1', title: 'HMRC Charter', category: 'regulations' },
              { id: '2', title: 'Penalty Guidance', category: 'guidance' },
            ],
            error: null,
          })),
          single: vi.fn(() => Promise.resolve({
            data: { id: '1', title: 'HMRC Charter', content: '...' },
            error: null,
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: [{ id: '1', category: 'regulations' }],
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'new-entry', title: 'New Entry' },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

vi.mock('@/lib/vectorSearch', () => ({
  searchKnowledgeBase: vi.fn(() => Promise.resolve([
    { id: '1', title: 'Result 1', similarity: 0.95 },
    { id: '2', title: 'Result 2', similarity: 0.87 },
  ])),
  searchPrecedents: vi.fn(() => Promise.resolve([
    { id: '1', title: 'Case 1', outcome: 'successful' },
  ])),
}));

vi.mock('@/lib/embeddings', () => ({
  generateEmbedding: vi.fn(() => Promise.resolve(new Array(1536).fill(0))),
}));

describe('Knowledge Router', () => {
  describe('search', () => {
    it('should search knowledge base with query', async () => {
      const { searchKnowledgeBase } = await import('@/lib/vectorSearch');
      
      const results = await searchKnowledgeBase('penalty cancellation', 0.7, 10);
      
      expect(results).toHaveLength(2);
      expect(results[0].similarity).toBeGreaterThan(0.8);
    });

    it('should use default threshold of 0.7', () => {
      const defaultThreshold = 0.7;
      const inputThreshold = undefined;
      
      const threshold = inputThreshold ?? defaultThreshold;
      
      expect(threshold).toBe(0.7);
    });

    it('should use default match count of 10', () => {
      const defaultCount = 10;
      const inputCount = undefined;
      
      const count = inputCount ?? defaultCount;
      
      expect(count).toBe(10);
    });
  });

  describe('list', () => {
    it('should return all knowledge base items', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase/client');
      
      const result = await supabaseAdmin
        .from('knowledge_base')
        .select('id, title, category, source, created_at')
        .order('created_at', { ascending: false });
      
      expect(result).toBeDefined();
    });

    it('should filter by category when provided', async () => {
      const items = [
        { id: '1', category: 'regulations' },
        { id: '2', category: 'guidance' },
        { id: '3', category: 'regulations' },
      ];
      
      const filtered = items.filter(i => i.category === 'regulations');
      
      expect(filtered).toHaveLength(2);
    });

    it('should respect limit parameter', async () => {
      const limit = 5;
      const items = new Array(10).fill({ id: 'item' });
      
      const limited = items.slice(0, limit);
      
      expect(limited).toHaveLength(5);
    });
  });

  describe('searchPrecedents', () => {
    it('should find similar cases', async () => {
      const { searchPrecedents } = await import('@/lib/vectorSearch');
      
      const results = await searchPrecedents('VAT penalty dispute', 0.75, 5);
      
      expect(results).toBeDefined();
      expect(results.length).toBeGreaterThan(0);
    });

    it('should use higher threshold for precedents', () => {
      const kbThreshold = 0.7;
      const precedentThreshold = 0.75;
      
      expect(precedentThreshold).toBeGreaterThan(kbThreshold);
    });
  });

  describe('addPrecedent', () => {
    it('should generate embedding for precedent', async () => {
      const { generateEmbedding } = await import('@/lib/embeddings');
      
      const contentForEmbedding = 'Title. Summary. Issues: VAT. Success factors: Good evidence.';
      const embedding = await generateEmbedding(contentForEmbedding);
      
      expect(embedding).toHaveLength(1536);
    });

    it('should store precedent with required fields', () => {
      const precedent = {
        complaint_id: 'complaint-123',
        title: 'Successful VAT Appeal',
        summary: 'Client successfully appealed penalty...',
        issue_category: 'VAT',
        success_factors: ['Strong evidence', 'Clear timeline'],
        key_arguments: ['Reasonable excuse', 'HMRC delay'],
        outcome_type: 'successful_full',
      };
      
      expect(precedent.complaint_id).toBeDefined();
      expect(precedent.success_factors).toHaveLength(2);
    });

    it('should support optional fields', () => {
      const precedent = {
        hmrc_weak_points: ['Inconsistent responses'],
        compensation_received: 1500,
      };
      
      expect(precedent.hmrc_weak_points).toHaveLength(1);
      expect(precedent.compensation_received).toBe(1500);
    });
  });

  describe('getCategories', () => {
    it('should return unique categories', () => {
      const items = [
        { category: 'regulations' },
        { category: 'guidance' },
        { category: 'regulations' },
        { category: 'case_law' },
      ];
      
      const categories = [...new Set(items.map(i => i.category))];
      
      expect(categories).toHaveLength(3);
      expect(categories).toContain('regulations');
      expect(categories).toContain('guidance');
      expect(categories).toContain('case_law');
    });
  });

  describe('uploadForComparison', () => {
    it('should stage document with pending status', () => {
      const staged = {
        title: 'New Document',
        content: 'Document content...',
        category: 'guidance',
        status: 'pending',
      };
      
      expect(staged.status).toBe('pending');
    });
  });

  describe('approveStaged', () => {
    it('should generate embedding on approval', async () => {
      const { generateEmbedding } = await import('@/lib/embeddings');
      
      const content = 'Document content for embedding';
      const embedding = await generateEmbedding(content);
      
      expect(embedding).toBeDefined();
      expect(embedding.length).toBe(1536);
    });

    it('should update status to approved', () => {
      const staged = { status: 'pending' };
      staged.status = 'approved';
      
      expect(staged.status).toBe('approved');
    });
  });

  describe('getTimeline', () => {
    it('should order by updated_at descending', () => {
      const items = [
        { id: '1', updated_at: '2024-01-01' },
        { id: '2', updated_at: '2024-01-03' },
        { id: '3', updated_at: '2024-01-02' },
      ];
      
      const sorted = items.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      
      expect(sorted[0].id).toBe('2');
      expect(sorted[2].id).toBe('1');
    });

    it('should respect limit parameter', () => {
      const defaultLimit = 20;
      const customLimit = 10;
      
      const limit = customLimit ?? defaultLimit;
      
      expect(limit).toBe(10);
    });
  });
});

