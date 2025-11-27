/**
 * Re-embed existing knowledge base content with text-embedding-3-large @ 1536 dims
 * 
 * Run with: npx ts-node scripts/reembed-existing-content.ts
 * 
 * Or via API: POST /api/admin/reembed
 */

import { createClient } from '@supabase/supabase-js';
import { generateEmbeddingsBatch } from '../lib/embeddings';

// Categories that need re-embedding (created before the new model)
const CATEGORIES_TO_REEMBED = [
  'CRG',           // 174 records
  'CHG',           // 64 records
  'Precedents',    // 60 records
  'HMRC Charter',  // 21 records
  'LLM Prompts',   // 6 records
];

// Batch size for processing
const BATCH_SIZE = 10;

interface KnowledgeEntry {
  id: string;
  category: string;
  title: string;
  content: string;
}

async function reembedContent() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('🔄 Starting re-embedding process...');
  console.log(`📁 Categories to process: ${CATEGORIES_TO_REEMBED.join(', ')}`);
  
  let totalProcessed = 0;
  let totalErrors = 0;

  for (const category of CATEGORIES_TO_REEMBED) {
    console.log(`\n📂 Processing category: ${category}`);
    
    // Fetch all entries for this category
    const { data: entries, error: fetchError } = await supabase
      .from('knowledge_base')
      .select('id, category, title, content')
      .eq('category', category);

    if (fetchError) {
      console.error(`❌ Error fetching ${category}:`, fetchError.message);
      continue;
    }

    if (!entries || entries.length === 0) {
      console.log(`  ⚠️ No entries found for ${category}`);
      continue;
    }

    console.log(`  📊 Found ${entries.length} entries`);

    // Process in batches
    for (let i = 0; i < entries.length; i += BATCH_SIZE) {
      const batch = entries.slice(i, i + BATCH_SIZE);
      console.log(`  🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(entries.length / BATCH_SIZE)}...`);

      try {
        // Prepare texts for embedding
        const texts = batch.map((entry: KnowledgeEntry) => 
          `${entry.title}\n\n${entry.content}`
        );

        // Generate embeddings using the new model
        const embeddings = await generateEmbeddingsBatch(texts, 'primary');

        // Update each entry with new embedding
        for (let j = 0; j < batch.length; j++) {
          const entry = batch[j];
          const embedding = embeddings[j];

          const { error: updateError } = await supabase
            .from('knowledge_base')
            .update({ 
              embedding,
              updated_at: new Date().toISOString(),
            })
            .eq('id', entry.id);

          if (updateError) {
            console.error(`    ❌ Failed to update ${entry.id}:`, updateError.message);
            totalErrors++;
          } else {
            totalProcessed++;
          }
        }

        // Rate limiting between batches
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.error(`    ❌ Batch error:`, error.message);
        totalErrors += batch.length;
      }
    }

    console.log(`  ✅ Completed ${category}`);
  }

  console.log('\n' + '='.repeat(50));
  console.log(`✅ Re-embedding complete!`);
  console.log(`   Total processed: ${totalProcessed}`);
  console.log(`   Errors: ${totalErrors}`);
  console.log('='.repeat(50));

  return { totalProcessed, totalErrors };
}

// Also re-embed precedents table
async function reembedPrecedents() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('\n📂 Processing precedents table...');
  
  const { data: precedents, error: fetchError } = await supabase
    .from('precedents')
    .select('id, complaint_type, issue_category, outcome, key_arguments, effective_citations');

  if (fetchError) {
    console.error('❌ Error fetching precedents:', fetchError.message);
    return { processed: 0, errors: 0 };
  }

  if (!precedents || precedents.length === 0) {
    console.log('  ⚠️ No precedents found');
    return { processed: 0, errors: 0 };
  }

  console.log(`  📊 Found ${precedents.length} precedents`);

  let processed = 0;
  let errors = 0;

  for (let i = 0; i < precedents.length; i += BATCH_SIZE) {
    const batch = precedents.slice(i, i + BATCH_SIZE);
    console.log(`  🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(precedents.length / BATCH_SIZE)}...`);

    try {
      // Prepare texts for embedding
      const texts = batch.map((p: any) => {
        const args = Array.isArray(p.key_arguments) ? p.key_arguments.join('. ') : '';
        const citations = Array.isArray(p.effective_citations) ? p.effective_citations.join('. ') : '';
        return `${p.complaint_type} - ${p.issue_category}\n${p.outcome || ''}\n${args}\n${citations}`;
      });

      const embeddings = await generateEmbeddingsBatch(texts, 'primary');

      for (let j = 0; j < batch.length; j++) {
        const { error: updateError } = await supabase
          .from('precedents')
          .update({ 
            embedding: embeddings[j],
            updated_at: new Date().toISOString(),
          })
          .eq('id', batch[j].id);

        if (updateError) {
          console.error(`    ❌ Failed to update precedent:`, updateError.message);
          errors++;
        } else {
          processed++;
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error: any) {
      console.error(`    ❌ Batch error:`, error.message);
      errors += batch.length;
    }
  }

  console.log(`  ✅ Completed precedents table`);
  return { processed, errors };
}

// Main execution
async function main() {
  try {
    // Re-embed knowledge_base
    const kbResult = await reembedContent();
    
    // Re-embed precedents
    const precResult = await reembedPrecedents();
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL RE-EMBEDDING COMPLETE!');
    console.log(`   Knowledge Base: ${kbResult.totalProcessed} processed, ${kbResult.totalErrors} errors`);
    console.log(`   Precedents: ${precResult.processed} processed, ${precResult.errors} errors`);
    console.log('='.repeat(60));
    
  } catch (error: any) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Export for API use
export { reembedContent, reembedPrecedents };

// Run if called directly
if (require.main === module) {
  main();
}

