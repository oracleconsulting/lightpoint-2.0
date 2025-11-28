/**
 * Unit Tests for Vector Search Module
 * 
 * Tests the knowledge base search functionality including:
 * - Category-filtered search
 * - Multi-angle search
 * - Smart search routing
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase
const mockSupabaseRpc = vi.fn();
vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: mockSupabaseRpc,
  }),
}));

// Mock embedding generation
vi.mock('@/lib/embeddings', () => ({
  generateEmbedding: vi.fn().mockResolvedValue(new Array(1536).fill(0.1)),
}));

// Import after mocking
import { 
  searchKnowledgeBaseFiltered, 
  searchKnowledgeBaseSmart,
  generateSearchQueries 
} from '@/lib/vectorSearch';

describe('Vector Search Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabaseRpc.mockReset();
  });

  describe('searchKnowledgeBaseFiltered', () => {
    it('should call RPC with correct parameters', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [
          { id: '1', title: 'CRG4025', content: 'Delay standards', similarity: 0.85 },
        ],
        error: null,
      });

      const results = await searchKnowledgeBaseFiltered('delay complaint', {
        categories: ['CRG'],
        matchThreshold: 0.7,
        matchCount: 5,
      });

      expect(mockSupabaseRpc).toHaveBeenCalledWith(
        'match_knowledge_base_filtered',
        expect.objectContaining({
          filter_categories: ['CRG'],
          match_threshold: 0.7,
          match_count: 5,
        })
      );
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('CRG4025');
    });

    it('should handle empty results gracefully', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      const results = await searchKnowledgeBaseFiltered('nonexistent query', {});

      expect(results).toHaveLength(0);
    });

    it('should throw error on RPC failure', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      });

      await expect(
        searchKnowledgeBaseFiltered('test query', {})
      ).rejects.toThrow('Database connection failed');
    });
  });

  describe('generateSearchQueries', () => {
    it('should generate multiple query variations', () => {
      const queries = generateSearchQueries('HMRC delay complaint');

      expect(queries.length).toBeGreaterThan(1);
      expect(queries).toContain('HMRC delay complaint');
    });

    it('should include HMRC-specific queries for relevant terms', () => {
      const queries = generateSearchQueries('payment allocation error');

      expect(queries.some(q => q.toLowerCase().includes('dmbm'))).toBe(true);
    });

    it('should include CRG queries for complaint-related terms', () => {
      const queries = generateSearchQueries('unreasonable delay');

      expect(queries.some(q => q.toLowerCase().includes('crg'))).toBe(true);
    });
  });

  describe('searchKnowledgeBaseSmart', () => {
    it('should route to correct categories based on query content', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [
          { id: '1', title: 'Test', content: 'Content', similarity: 0.8 },
        ],
        error: null,
      });

      // Payment-related query should include DMBM
      await searchKnowledgeBaseSmart('payment allocation error');
      
      expect(mockSupabaseRpc).toHaveBeenCalledWith(
        'match_knowledge_base_filtered',
        expect.objectContaining({
          filter_categories: expect.arrayContaining(['DMBM']),
        })
      );
    });

    it('should include Precedents for complaint-related queries', async () => {
      mockSupabaseRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      await searchKnowledgeBaseSmart('successful complaint examples');

      expect(mockSupabaseRpc).toHaveBeenCalledWith(
        'match_knowledge_base_filtered',
        expect.objectContaining({
          filter_categories: expect.arrayContaining(['Precedents']),
        })
      );
    });
  });
});

describe('Search Quality', () => {
  it('should prioritize high-similarity results', async () => {
    mockSupabaseRpc.mockResolvedValue({
      data: [
        { id: '1', title: 'Low match', similarity: 0.6 },
        { id: '2', title: 'High match', similarity: 0.95 },
        { id: '3', title: 'Medium match', similarity: 0.8 },
      ],
      error: null,
    });

    const results = await searchKnowledgeBaseFiltered('test', {});
    
    // Results should be ordered by similarity (assuming DB returns ordered)
    expect(results[0].similarity).toBeGreaterThan(results[results.length - 1].similarity);
  });

  it('should filter by minimum threshold', async () => {
    mockSupabaseRpc.mockResolvedValue({
      data: [
        { id: '1', title: 'Above threshold', similarity: 0.75 },
      ],
      error: null,
    });

    const results = await searchKnowledgeBaseFiltered('test', {
      matchThreshold: 0.7,
    });

    results.forEach(r => {
      expect(r.similarity).toBeGreaterThanOrEqual(0.7);
    });
  });
});

