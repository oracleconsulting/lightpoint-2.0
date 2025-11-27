import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateEmbeddingsBatch } from '@/lib/embeddings';

const CATEGORIES_TO_REEMBED = [
  'CRG',
  'CHG', 
  'Precedents',
  'HMRC Charter',
  'LLM Prompts',
];

const BATCH_SIZE = 10;

// Verify admin auth
function verifyAdminAuth(request: NextRequest): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return false;
  
  const token = authHeader.substring(7);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  
  return token === serviceKey;
}

export async function POST(request: NextRequest) {
  // Auth check
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let totalProcessed = 0;
  let totalErrors = 0;
  const results: { category: string; processed: number; errors: number }[] = [];

  try {
    // Process knowledge_base categories
    for (const category of CATEGORIES_TO_REEMBED) {
      const { data: entries, error: fetchError } = await supabase
        .from('knowledge_base')
        .select('id, category, title, content')
        .eq('category', category);

      if (fetchError || !entries) {
        results.push({ category, processed: 0, errors: 1 });
        continue;
      }

      let categoryProcessed = 0;
      let categoryErrors = 0;

      for (let i = 0; i < entries.length; i += BATCH_SIZE) {
        const batch = entries.slice(i, i + BATCH_SIZE);

        try {
          const texts = batch.map((entry: any) => 
            `${entry.title}\n\n${entry.content}`
          );

          const embeddings = await generateEmbeddingsBatch(texts, 'primary');

          for (let j = 0; j < batch.length; j++) {
            const { error: updateError } = await supabase
              .from('knowledge_base')
              .update({ 
                embedding: embeddings[j],
                updated_at: new Date().toISOString(),
              })
              .eq('id', batch[j].id);

            if (updateError) {
              categoryErrors++;
            } else {
              categoryProcessed++;
            }
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          categoryErrors += batch.length;
        }
      }

      results.push({ category, processed: categoryProcessed, errors: categoryErrors });
      totalProcessed += categoryProcessed;
      totalErrors += categoryErrors;
    }

    // Process precedents table
    const { data: precedents, error: precError } = await supabase
      .from('precedents')
      .select('id, complaint_type, issue_category, outcome, key_arguments, effective_citations');

    if (!precError && precedents && precedents.length > 0) {
      let precProcessed = 0;
      let precErrors = 0;

      for (let i = 0; i < precedents.length; i += BATCH_SIZE) {
        const batch = precedents.slice(i, i + BATCH_SIZE);

        try {
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
              precErrors++;
            } else {
              precProcessed++;
            }
          }

          await new Promise(resolve => setTimeout(resolve, 500));

        } catch (error) {
          precErrors += batch.length;
        }
      }

      results.push({ category: 'precedents_table', processed: precProcessed, errors: precErrors });
      totalProcessed += precProcessed;
      totalErrors += precErrors;
    }

    return NextResponse.json({
      success: true,
      message: 'Re-embedding complete',
      totalProcessed,
      totalErrors,
      results,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: 'Re-embedding failed', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  if (!verifyAdminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get counts per category
  const { data: categories } = await supabase
    .from('knowledge_base')
    .select('category');

  const counts: Record<string, number> = {};
  if (categories) {
    for (const entry of categories) {
      counts[entry.category] = (counts[entry.category] || 0) + 1;
    }
  }

  // Get precedents count
  const { count: precedentsCount } = await supabase
    .from('precedents')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json({
    categoriesToReembed: CATEGORIES_TO_REEMBED,
    currentCounts: counts,
    precedentsCount,
    totalToProcess: CATEGORIES_TO_REEMBED.reduce((sum, cat) => sum + (counts[cat] || 0), 0) + (precedentsCount || 0),
  });
}

