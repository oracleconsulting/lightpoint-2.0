/**
 * Knowledge Base Test Suite
 * 
 * Comprehensive testing for:
 * 1. Document availability - Are all documents embedded and accessible?
 * 2. Context retrieval quality - Is search finding relevant content?
 * 3. Performance benchmarks - Query speed and embedding quality
 * 
 * Run with: npx tsx scripts/test-knowledge-base.ts
 */

import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test queries for different complaint types
const TEST_QUERIES = [
  // General complaint queries
  { query: 'HMRC delay processing VAT registration', category: 'Delays', expectedCategories: ['CRG', 'Charter', 'DMBM'] },
  { query: 'professional fees reimbursement accountant costs', category: 'Fees', expectedCategories: ['CRG'] },
  { query: 'penalty cancellation reasonable excuse', category: 'Penalties', expectedCategories: ['CH', 'CRG'] },
  { query: 'taxpayer charter rights being responsive', category: 'Charter', expectedCategories: ['Charter'] },
  { query: 'tier 2 escalation complaint handling', category: 'Escalation', expectedCategories: ['CHG', 'CRG'] },
  { query: 'adjudicator referral compensation distress', category: 'Adjudicator', expectedCategories: ['CRG', 'ARTG'] },
  { query: 'payment allocation debt management', category: 'Payments', expectedCategories: ['DMBM'] },
  { query: 'self assessment enquiry investigation', category: 'Enquiries', expectedCategories: ['SAM', 'EM'] },
  
  // Specific HMRC manual references
  { query: 'CRG4025 unreasonable delays remedy', category: 'CRG Specific', expectedCategories: ['CRG'] },
  { query: 'CRG5225 professional costs reimbursement', category: 'CRG Specific', expectedCategories: ['CRG'] },
  { query: 'CRG6050 compensation worrying distress', category: 'CRG Specific', expectedCategories: ['CRG'] },
];

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
  duration?: number;
}

async function runTests(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('           KNOWLEDGE BASE TEST SUITE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const results: TestResult[] = [];
  
  // Test 1: Document Availability
  console.log('📚 TEST 1: Document Availability\n');
  results.push(await testDocumentAvailability());
  
  // Test 2: Embedding Quality
  console.log('\n🔢 TEST 2: Embedding Quality\n');
  results.push(await testEmbeddingQuality());
  
  // Test 3: Category Coverage
  console.log('\n📁 TEST 3: Category Coverage\n');
  results.push(await testCategoryCoverage());
  
  // Test 4: Vector Search Functionality
  console.log('\n🔍 TEST 4: Vector Search Functionality\n');
  results.push(await testVectorSearch());
  
  // Test 5: Context Retrieval Quality
  console.log('\n🎯 TEST 5: Context Retrieval Quality\n');
  const contextResults = await testContextRetrievalQuality();
  results.push(...contextResults);
  
  // Test 6: Performance Benchmarks
  console.log('\n⚡ TEST 6: Performance Benchmarks\n');
  results.push(await testPerformance());
  
  // Test 7: Precedents Check
  console.log('\n📖 TEST 7: Precedents Availability\n');
  results.push(await testPrecedents());
  
  // Summary
  printSummary(results);
}

async function testDocumentAvailability(): Promise<TestResult> {
  try {
    // Count total documents
    const { count: totalCount, error: countError } = await supabase
      .from('knowledge_base')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // Count documents with embeddings
    const { data: withEmbeddings, error: embError } = await supabase
      .from('knowledge_base')
      .select('id')
      .not('embedding', 'is', null);
    
    if (embError) throw embError;
    
    // Count documents without embeddings
    const { data: withoutEmbeddings, error: noEmbError } = await supabase
      .from('knowledge_base')
      .select('id, title, category')
      .is('embedding', null);
    
    if (noEmbError) throw noEmbError;
    
    const embeddedCount = withEmbeddings?.length || 0;
    const missingCount = withoutEmbeddings?.length || 0;
    const embeddingRate = totalCount ? ((embeddedCount / totalCount) * 100).toFixed(1) : 0;
    
    console.log(`   Total documents:      ${totalCount}`);
    console.log(`   With embeddings:      ${embeddedCount} (${embeddingRate}%)`);
    console.log(`   Missing embeddings:   ${missingCount}`);
    
    if (missingCount > 0) {
      console.log('\n   ⚠️  Documents missing embeddings:');
      withoutEmbeddings?.slice(0, 5).forEach(doc => {
        console.log(`      - [${doc.category}] ${doc.title?.substring(0, 50)}...`);
      });
      if (missingCount > 5) {
        console.log(`      ... and ${missingCount - 5} more`);
      }
    }
    
    const passed = missingCount === 0;
    return {
      name: 'Document Availability',
      passed,
      details: `${embeddedCount}/${totalCount} documents have embeddings (${embeddingRate}%)`,
    };
  } catch (error: any) {
    return {
      name: 'Document Availability',
      passed: false,
      details: `Error: ${error.message}`,
    };
  }
}

async function testEmbeddingQuality(): Promise<TestResult> {
  try {
    // Sample some embeddings to check dimensions
    const { data: samples, error } = await supabase
      .from('knowledge_base')
      .select('id, title, embedding')
      .not('embedding', 'is', null)
      .limit(10);
    
    if (error) throw error;
    
    if (!samples || samples.length === 0) {
      return {
        name: 'Embedding Quality',
        passed: false,
        details: 'No embeddings found to test',
      };
    }
    
    // Check dimensions
    const dimensions = new Set<number>();
    let validCount = 0;
    let invalidCount = 0;
    
    samples.forEach(doc => {
      if (doc.embedding && Array.isArray(doc.embedding)) {
        dimensions.add(doc.embedding.length);
        if (doc.embedding.length === 3072) {
          validCount++;
        } else {
          invalidCount++;
          console.log(`   ⚠️  Wrong dimensions: ${doc.title?.substring(0, 40)} has ${doc.embedding.length} dims`);
        }
      }
    });
    
    console.log(`   Expected dimensions:  3072`);
    console.log(`   Found dimensions:     ${Array.from(dimensions).join(', ')}`);
    console.log(`   Valid samples:        ${validCount}/${samples.length}`);
    
    // Check for all-zero embeddings
    const zeroEmbeddings = samples.filter(doc => 
      doc.embedding && doc.embedding.every((v: number) => v === 0)
    );
    
    if (zeroEmbeddings.length > 0) {
      console.log(`   ⚠️  All-zero embeddings: ${zeroEmbeddings.length}`);
    }
    
    const passed = dimensions.size === 1 && dimensions.has(3072) && zeroEmbeddings.length === 0;
    return {
      name: 'Embedding Quality',
      passed,
      details: `${validCount}/${samples.length} samples have correct 3072 dimensions`,
    };
  } catch (error: any) {
    return {
      name: 'Embedding Quality',
      passed: false,
      details: `Error: ${error.message}`,
    };
  }
}

async function testCategoryCoverage(): Promise<TestResult> {
  try {
    // Get category distribution
    const { data, error } = await supabase
      .from('knowledge_base')
      .select('category')
      .not('embedding', 'is', null);
    
    if (error) throw error;
    
    // Count by category
    const categoryCounts: Record<string, number> = {};
    data?.forEach(doc => {
      const cat = doc.category || 'Uncategorized';
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });
    
    // Expected categories for HMRC complaints
    const expectedCategories = ['CRG', 'Charter', 'CHG', 'DMBM', 'ARTG', 'CH', 'SAM', 'EM'];
    const missingCategories = expectedCategories.filter(cat => !categoryCounts[cat]);
    
    console.log('   Category Distribution:');
    Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => {
        const bar = '█'.repeat(Math.min(count / 5, 30));
        console.log(`   ${cat.padEnd(15)} ${count.toString().padStart(4)} ${bar}`);
      });
    
    if (missingCategories.length > 0) {
      console.log(`\n   ⚠️  Missing expected categories: ${missingCategories.join(', ')}`);
    }
    
    const passed = missingCategories.length === 0;
    return {
      name: 'Category Coverage',
      passed,
      details: `${Object.keys(categoryCounts).length} categories, ${missingCategories.length} expected categories missing`,
    };
  } catch (error: any) {
    return {
      name: 'Category Coverage',
      passed: false,
      details: `Error: ${error.message}`,
    };
  }
}

async function testVectorSearch(): Promise<TestResult> {
  try {
    // Test if the RPC function exists and works
    const testQuery = 'HMRC professional fees reimbursement';
    
    // Generate a simple test embedding (we'll use the API)
    const { generateEmbedding } = await import('../lib/embeddings');
    
    console.log(`   Testing query: "${testQuery}"`);
    
    const startTime = Date.now();
    const embedding = await generateEmbedding(testQuery);
    const embeddingTime = Date.now() - startTime;
    
    console.log(`   Embedding generated: ${embedding.length} dimensions in ${embeddingTime}ms`);
    
    // Test the RPC function
    const searchStart = Date.now();
    const { data, error } = await supabase.rpc('match_knowledge_base', {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 5,
    });
    const searchTime = Date.now() - searchStart;
    
    if (error) {
      console.log(`   ❌ RPC Error: ${error.message}`);
      throw error;
    }
    
    console.log(`   Search completed: ${data?.length || 0} results in ${searchTime}ms`);
    
    if (data && data.length > 0) {
      console.log('\n   Top 3 results:');
      data.slice(0, 3).forEach((result: any, i: number) => {
        console.log(`   ${i + 1}. [${result.similarity?.toFixed(3)}] ${result.title?.substring(0, 50)}...`);
      });
    }
    
    const passed = data && data.length > 0;
    return {
      name: 'Vector Search',
      passed,
      details: `Found ${data?.length || 0} results in ${searchTime}ms`,
      duration: searchTime,
    };
  } catch (error: any) {
    return {
      name: 'Vector Search',
      passed: false,
      details: `Error: ${error.message}`,
    };
  }
}

async function testContextRetrievalQuality(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  try {
    const { generateEmbedding } = await import('../lib/embeddings');
    
    for (const testCase of TEST_QUERIES.slice(0, 5)) { // Test first 5
      console.log(`   Testing: "${testCase.query.substring(0, 40)}..."`);
      
      const embedding = await generateEmbedding(testCase.query);
      
      const { data, error } = await supabase.rpc('match_knowledge_base', {
        query_embedding: embedding,
        match_threshold: 0.6,
        match_count: 5,
      });
      
      if (error) {
        results.push({
          name: `Context: ${testCase.category}`,
          passed: false,
          details: `Error: ${error.message}`,
        });
        continue;
      }
      
      // Check if results include expected categories
      const resultCategories = new Set(data?.map((r: any) => r.category) || []);
      const foundExpected = testCase.expectedCategories.some(cat => resultCategories.has(cat));
      
      const topSimilarity = data?.[0]?.similarity || 0;
      
      console.log(`      Results: ${data?.length || 0}, Top similarity: ${topSimilarity.toFixed(3)}`);
      console.log(`      Categories: ${Array.from(resultCategories).join(', ')}`);
      console.log(`      Expected: ${testCase.expectedCategories.join(', ')}`);
      console.log(`      Match: ${foundExpected ? '✅' : '❌'}`);
      console.log('');
      
      results.push({
        name: `Context: ${testCase.category}`,
        passed: foundExpected && topSimilarity > 0.7,
        details: `Top similarity: ${topSimilarity.toFixed(3)}, Found expected categories: ${foundExpected}`,
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Context Retrieval',
      passed: false,
      details: `Error: ${error.message}`,
    });
  }
  
  return results;
}

async function testPerformance(): Promise<TestResult> {
  try {
    const { generateEmbedding } = await import('../lib/embeddings');
    
    const iterations = 5;
    const embeddingTimes: number[] = [];
    const searchTimes: number[] = [];
    
    console.log(`   Running ${iterations} iterations...`);
    
    for (let i = 0; i < iterations; i++) {
      const query = TEST_QUERIES[i % TEST_QUERIES.length].query;
      
      // Time embedding generation
      const embStart = Date.now();
      const embedding = await generateEmbedding(query);
      embeddingTimes.push(Date.now() - embStart);
      
      // Time search
      const searchStart = Date.now();
      await supabase.rpc('match_knowledge_base', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 10,
      });
      searchTimes.push(Date.now() - searchStart);
    }
    
    const avgEmbedding = embeddingTimes.reduce((a, b) => a + b, 0) / iterations;
    const avgSearch = searchTimes.reduce((a, b) => a + b, 0) / iterations;
    const totalAvg = avgEmbedding + avgSearch;
    
    console.log(`   Embedding generation: ${avgEmbedding.toFixed(0)}ms avg`);
    console.log(`   Vector search:        ${avgSearch.toFixed(0)}ms avg`);
    console.log(`   Total per query:      ${totalAvg.toFixed(0)}ms avg`);
    
    // Performance thresholds
    const embeddingOk = avgEmbedding < 2000; // 2 seconds
    const searchOk = avgSearch < 500; // 500ms
    
    return {
      name: 'Performance',
      passed: embeddingOk && searchOk,
      details: `Embedding: ${avgEmbedding.toFixed(0)}ms, Search: ${avgSearch.toFixed(0)}ms`,
      duration: totalAvg,
    };
  } catch (error: any) {
    return {
      name: 'Performance',
      passed: false,
      details: `Error: ${error.message}`,
    };
  }
}

async function testPrecedents(): Promise<TestResult> {
  try {
    // Count precedents
    const { count, error: countError } = await supabase
      .from('precedents')
      .select('*', { count: 'exact', head: true });
    
    if (countError) throw countError;
    
    // Count with embeddings
    const { data: withEmbeddings, error: embError } = await supabase
      .from('precedents')
      .select('id')
      .not('embedding', 'is', null);
    
    if (embError) throw embError;
    
    const embeddedCount = withEmbeddings?.length || 0;
    
    console.log(`   Total precedents:     ${count || 0}`);
    console.log(`   With embeddings:      ${embeddedCount}`);
    
    // Test precedent search if we have any
    if (embeddedCount > 0) {
      const { generateEmbedding } = await import('../lib/embeddings');
      const embedding = await generateEmbedding('successful VAT complaint compensation');
      
      const { data: searchResults, error: searchError } = await supabase.rpc('match_precedents', {
        query_embedding: embedding,
        match_threshold: 0.6,
        match_count: 3,
      });
      
      if (searchError) {
        console.log(`   ⚠️  Precedent search error: ${searchError.message}`);
      } else {
        console.log(`   Search test:          ${searchResults?.length || 0} results found`);
      }
    }
    
    const passed = (count || 0) > 0 && embeddedCount === count;
    return {
      name: 'Precedents',
      passed,
      details: `${embeddedCount}/${count || 0} precedents have embeddings`,
    };
  } catch (error: any) {
    return {
      name: 'Precedents',
      passed: false,
      details: `Error: ${error.message}`,
    };
  }
}

function printSummary(results: TestResult[]): void {
  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('                        SUMMARY');
  console.log('═══════════════════════════════════════════════════════════════\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    const duration = result.duration ? ` (${result.duration.toFixed(0)}ms)` : '';
    console.log(`${icon} ${result.name.padEnd(25)} ${result.details}${duration}`);
  });
  
  console.log('\n───────────────────────────────────────────────────────────────');
  console.log(`Total: ${passed} passed, ${failed} failed out of ${results.length} tests`);
  console.log('───────────────────────────────────────────────────────────────\n');
  
  if (failed > 0) {
    console.log('⚠️  Some tests failed. Review the output above for details.\n');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!\n');
  }
}

// ============================================================================
// RUN TESTS
// ============================================================================

runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

