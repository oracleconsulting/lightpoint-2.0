/**
 * HMRC Manual Ingestion Test Script
 * 
 * Tests the ingestion pipeline with a small subset of content.
 * 
 * Usage:
 *   npx ts-node scripts/test-ingestion.ts
 * 
 * Or with environment variables:
 *   OPENROUTER_API_KEY=xxx SUPABASE_URL=xxx SUPABASE_KEY=xxx npx ts-node scripts/test-ingestion.ts
 */

import { 
  ingestManualByCode,
  HMRC_MANUAL_CONFIGS,
  checkManualsNeedingUpdate,
  getIngestionStats,
} from '../lib/ingestion';
import { searchKnowledgeBaseFiltered, searchKnowledgeBaseSmart } from '../lib/vectorSearch';

async function testIngestion() {
  console.log('\n' + '='.repeat(60));
  console.log('  HMRC Manual Ingestion Test');
  console.log('='.repeat(60) + '\n');

  // Check environment
  const requiredEnvVars = [
    'OPENROUTER_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];

  const missingVars = requiredEnvVars.filter(v => !process.env[v]);
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(v => console.error(`   - ${v}`));
    console.error('\nPlease set these in your .env.local file or environment.');
    process.exit(1);
  }

  console.log('✅ Environment variables configured\n');

  // Show available manuals
  console.log('📚 Available HMRC Manuals:');
  HMRC_MANUAL_CONFIGS.forEach(config => {
    console.log(`   [${config.priority}] ${config.code}: ${config.name}`);
  });
  console.log('');

  // Test with DMBM (highest priority, most relevant for payment allocation)
  const testManualCode = 'DMBM';
  console.log(`🧪 Testing ingestion with ${testManualCode}...\n`);

  try {
    // Run ingestion with progress tracking
    const summary = await ingestManualByCode(testManualCode, (stage, current, total) => {
      if (total > 0) {
        const pct = Math.round((current / total) * 100);
        process.stdout.write(`\r   ${stage}: ${current}/${total} (${pct}%)`);
      } else {
        process.stdout.write(`\r   ${stage}...`);
      }
    });

    console.log('\n');
    console.log('📊 Ingestion Summary:');
    console.log(`   Manual: ${summary.manualCode}`);
    console.log(`   Sections found: ${summary.sectionsFound}`);
    console.log(`   Chunks added: ${summary.sectionsAdded}`);
    console.log(`   Chunks updated: ${summary.sectionsUpdated}`);
    console.log(`   Chunks unchanged: ${summary.sectionsUnchanged}`);
    console.log(`   Errors: ${summary.errors.length}`);
    console.log(`   Duration: ${(summary.duration / 1000).toFixed(1)}s`);

    if (summary.errors.length > 0 && summary.errors.length <= 5) {
      console.log('\n   Errors:');
      summary.errors.forEach(e => console.log(`   - ${e.section}: ${e.error}`));
    }

  } catch (error) {
    console.error('\n❌ Ingestion failed:', error);
    process.exit(1);
  }

  // Test search functionality
  console.log('\n' + '='.repeat(60));
  console.log('  Testing Search');
  console.log('='.repeat(60) + '\n');

  const testQueries = [
    { query: 'payment allocation oldest debt first', expectedCategory: 'DMBM' },
    { query: 'time to pay arrangement', expectedCategory: 'DMBM' },
    { query: 'debt collection enforcement', expectedCategory: 'DMBM' },
  ];

  for (const { query, expectedCategory } of testQueries) {
    console.log(`🔍 Query: "${query}"`);
    
    try {
      // Test filtered search
      const filteredResults = await searchKnowledgeBaseFiltered(query, {
        categories: [expectedCategory],
        matchCount: 3,
      });

      console.log(`   Filtered (${expectedCategory} only): ${filteredResults.length} results`);
      filteredResults.slice(0, 2).forEach(r => {
        console.log(`   - [${r.sectionReference || r.category}] ${r.title.substring(0, 50)}... (${(r.similarity * 100).toFixed(1)}%)`);
      });

      // Test smart search
      const smartResults = await searchKnowledgeBaseSmart(query, { matchCount: 3 });
      console.log(`   Smart (auto-routed): ${smartResults.length} results`);
      smartResults.slice(0, 2).forEach(r => {
        console.log(`   - [${r.sectionReference || r.category}] ${r.title.substring(0, 50)}... (${(r.similarity * 100).toFixed(1)}%)`);
      });

      console.log('');
    } catch (error) {
      console.error(`   ❌ Search failed: ${error}`);
    }
  }

  // Check ingestion stats
  console.log('='.repeat(60));
  console.log('  Ingestion Statistics');
  console.log('='.repeat(60) + '\n');

  try {
    const stats = await getIngestionStats(testManualCode);
    console.log(`📈 ${testManualCode} Statistics:`);
    console.log(`   Total chunks: ${stats.totalChunks}`);
    console.log(`   Last ingestion: ${stats.lastIngestion?.toISOString() || 'Never'}`);
    console.log(`   Oldest chunk: ${stats.oldestChunk?.toISOString() || 'N/A'}`);

    const needsUpdate = await checkManualsNeedingUpdate(30);
    if (needsUpdate.length > 0) {
      console.log('\n⚠️ Manuals needing update:');
      needsUpdate.forEach(m => console.log(`   - ${m.code}: ${m.staleCount} stale sections`));
    } else {
      console.log('\n✅ All manuals are up to date');
    }
  } catch (error) {
    console.error('❌ Failed to get stats:', error);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  Test Complete!');
  console.log('='.repeat(60) + '\n');
}

// Run the test
testIngestion().catch(console.error);

