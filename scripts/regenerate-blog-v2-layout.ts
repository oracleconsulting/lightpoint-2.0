#!/usr/bin/env ts-node

/**
 * Regenerate V2 Layout for Blog Post
 * 
 * This script:
 * 1. Fetches the blog post content from the database
 * 2. Calls the V2 layout generator API
 * 3. Updates the structured_layout in the database with V2 format
 * 
 * Usage:
 *   npx ts-node scripts/regenerate-blog-v2-layout.ts <slug>
 *   
 * Example:
 *   npx ts-node scripts/regenerate-blog-v2-layout.ts why-hmrc-complaints-fail-how-to-fix
 */

import { createClient } from '@supabase/supabase-js';
import { generateLayout } from '../components/blog-v2/utils';

const slug = process.argv[2];

if (!slug) {
  console.error('❌ Error: Please provide a blog post slug');
  console.log('Usage: npx ts-node scripts/regenerate-blog-v2-layout.ts <slug>');
  process.exit(1);
}

async function regenerateLayout() {
  console.log('🚀 Regenerating V2 layout for:', slug);
  console.log('');

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase credentials');
    console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Fetch the blog post
  console.log('📄 Fetching blog post...');
  const { data: post, error: fetchError } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (fetchError || !post) {
    console.error('❌ Error fetching blog post:', fetchError?.message || 'Not found');
    process.exit(1);
  }

  console.log('✅ Found post:', post.title);
  console.log('   Content length:', post.content?.length || 0, 'chars');
  console.log('');

  // 2. Extract text content from TipTap JSON
  let contentText = '';
  if (typeof post.content === 'string') {
    contentText = post.content;
  } else if (post.content && typeof post.content === 'object') {
    // Extract text from TipTap JSON
    contentText = extractTextFromTipTap(post.content);
  }

  if (!contentText || contentText.length < 100) {
    console.error('❌ Error: Content too short or empty');
    process.exit(1);
  }

  console.log('📝 Extracted text content:', contentText.length, 'chars');
  console.log('');

  // 3. Generate V2 layout
  console.log('🔧 Generating V2 layout...');
  const layout = generateLayout({
    title: post.title,
    content: contentText,
    excerpt: post.excerpt || undefined,
    author: post.author || 'Lightpoint Team',
    includeHero: true,
    includeCTA: true,
  });

  console.log('✅ Generated layout with', layout.components.length, 'components');
  console.log('   Component types:', [...new Set(layout.components.map((c: any) => c.type))].join(', '));
  console.log('');

  // 4. Update the database
  console.log('💾 Updating database...');
  const { error: updateError } = await supabase
    .from('blog_posts')
    .update({
      structured_layout: layout,
      updated_at: new Date().toISOString(),
    })
    .eq('slug', slug);

  if (updateError) {
    console.error('❌ Error updating database:', updateError.message);
    process.exit(1);
  }

  console.log('✅ Successfully updated blog post with V2 layout!');
  console.log('');
  console.log('🎉 Done! Visit the blog post to see the changes:');
  console.log(`   http://localhost:3000/blog/${slug}`);
  console.log('');
  console.log('📊 Layout Summary:');
  console.log(`   - Total components: ${layout.components.length}`);
  console.log(`   - Component types: ${[...new Set(layout.components.map((c: any) => c.type))].join(', ')}`);
  
  // Count each type
  const typeCounts: Record<string, number> = {};
  layout.components.forEach((c: any) => {
    typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  });
  console.log('');
  console.log('   Component breakdown:');
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`     - ${type}: ${count}`);
  });
}

/**
 * Extract plain text from TipTap JSON content
 */
function extractTextFromTipTap(node: any): string {
  if (!node) return '';
  if (node.type === 'text') return node.text || '';
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractTextFromTipTap).join('\n');
  }
  return '';
}

// Run the script
regenerateLayout().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

