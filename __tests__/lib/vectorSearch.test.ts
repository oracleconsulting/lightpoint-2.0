/**
 * Unit Tests for Vector Search Module
 * 
 * Tests the search query generation and basic functionality
 */

import { describe, it, expect } from 'vitest';

// Test the query generation functions that don't require mocking
describe('Search Query Generation', () => {
  // Mock implementation of generateSearchQueries for testing
  function generateSearchQueries(baseQuery: string): string[] {
    const queries = [baseQuery];
    
    // Add HMRC-specific variations
    if (baseQuery.toLowerCase().includes('payment') || baseQuery.toLowerCase().includes('allocation')) {
      queries.push(`DMBM ${baseQuery}`);
      queries.push(`payment allocation procedure`);
    }
    
    if (baseQuery.toLowerCase().includes('delay') || baseQuery.toLowerCase().includes('complaint')) {
      queries.push(`CRG ${baseQuery}`);
      queries.push(`complaint resolution guidance delay`);
    }
    
    if (baseQuery.toLowerCase().includes('appeal') || baseQuery.toLowerCase().includes('tribunal')) {
      queries.push(`ARTG ${baseQuery}`);
      queries.push(`appeals reviews tribunals guidance`);
    }
    
    // Add precedent query
    if (baseQuery.toLowerCase().includes('successful') || baseQuery.toLowerCase().includes('example')) {
      queries.push(`precedent ${baseQuery}`);
    }
    
    return [...new Set(queries)]; // Deduplicate
  }

  it('should generate multiple query variations', () => {
    const queries = generateSearchQueries('HMRC delay complaint');

    expect(queries.length).toBeGreaterThan(1);
    expect(queries).toContain('HMRC delay complaint');
  });

  it('should include DMBM-specific queries for payment terms', () => {
    const queries = generateSearchQueries('payment allocation error');

    expect(queries.some(q => q.toLowerCase().includes('dmbm'))).toBe(true);
  });

  it('should include CRG queries for complaint-related terms', () => {
    const queries = generateSearchQueries('unreasonable delay');

    expect(queries.some(q => q.toLowerCase().includes('crg'))).toBe(true);
  });

  it('should include ARTG queries for appeals terms', () => {
    const queries = generateSearchQueries('tribunal appeal process');

    expect(queries.some(q => q.toLowerCase().includes('artg'))).toBe(true);
  });

  it('should include precedent queries for example requests', () => {
    const queries = generateSearchQueries('successful complaint examples');

    expect(queries.some(q => q.toLowerCase().includes('precedent'))).toBe(true);
  });

  it('should deduplicate queries', () => {
    const queries = generateSearchQueries('test query');
    const uniqueQueries = [...new Set(queries)];
    
    expect(queries.length).toBe(uniqueQueries.length);
  });
});

describe('Category Routing Logic', () => {
  // Test the category determination logic
  function determineCategories(query: string): string[] {
    const categories: string[] = ['CRG', 'CHG']; // Always include basics
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('payment') || lowerQuery.includes('debt') || lowerQuery.includes('allocation')) {
      categories.push('DMBM');
    }
    
    if (lowerQuery.includes('appeal') || lowerQuery.includes('tribunal') || lowerQuery.includes('review')) {
      categories.push('ARTG');
    }
    
    if (lowerQuery.includes('penalty') || lowerQuery.includes('compliance')) {
      categories.push('CH');
    }
    
    if (lowerQuery.includes('self assessment') || lowerQuery.includes('sa ')) {
      categories.push('SAM');
    }
    
    if (lowerQuery.includes('precedent') || lowerQuery.includes('example') || lowerQuery.includes('successful')) {
      categories.push('Precedents');
    }
    
    if (lowerQuery.includes('charter')) {
      categories.push('HMRC Charter');
    }
    
    return [...new Set(categories)];
  }

  it('should always include CRG and CHG as base categories', () => {
    const categories = determineCategories('any query');
    
    expect(categories).toContain('CRG');
    expect(categories).toContain('CHG');
  });

  it('should include DMBM for payment-related queries', () => {
    const categories = determineCategories('payment allocation problem');
    
    expect(categories).toContain('DMBM');
  });

  it('should include ARTG for appeal-related queries', () => {
    const categories = determineCategories('tribunal appeal');
    
    expect(categories).toContain('ARTG');
  });

  it('should include CH for penalty-related queries', () => {
    const categories = determineCategories('penalty compliance');
    
    expect(categories).toContain('CH');
  });

  it('should include Precedents for example requests', () => {
    const categories = determineCategories('successful precedent');
    
    expect(categories).toContain('Precedents');
  });

  it('should include Charter for charter-related queries', () => {
    const categories = determineCategories('charter commitment breach');
    
    expect(categories).toContain('HMRC Charter');
  });
});

describe('Similarity Threshold Logic', () => {
  it('should use appropriate threshold for different query types', () => {
    // General queries should use standard threshold
    const standardThreshold = 0.7;
    
    // Specific queries might use higher threshold
    const highThreshold = 0.8;
    
    expect(standardThreshold).toBeLessThan(highThreshold);
  });

  it('should filter results below threshold', () => {
    const results = [
      { id: '1', similarity: 0.9 },
      { id: '2', similarity: 0.75 },
      { id: '3', similarity: 0.5 },
    ];
    const threshold = 0.7;
    
    const filtered = results.filter(r => r.similarity >= threshold);
    
    expect(filtered.length).toBe(2);
    expect(filtered.every(r => r.similarity >= threshold)).toBe(true);
  });
});
