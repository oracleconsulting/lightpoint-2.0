/**
 * Visual Transformation API V6.3
 * 
 * Multi-stage pipeline:
 * 1. Extract ALL structured content (stats, quotes, lists, timeline, comparisons)
 * 2. Map to components deterministically
 * 3. Generate contextual images using NanoBanana (optional)
 * 4. Return layout with extraction data for debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { transformContentV6 } from '@/lib/blog/extractionPipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes - increased for image generation

export async function POST(req: NextRequest) {
  try {
    const { title, content, excerpt, enableImages = true } = await req.json();

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterApiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    console.log(`🎨 Starting V6.3 visual transformation for: ${title}`);
    console.log(`🖼️ Image generation: ${enableImages ? 'enabled' : 'disabled'}`);

    const { layout, extraction } = await transformContentV6(
      title,
      content,
      excerpt || '',
      openrouterApiKey,
      { enableImages }
    );

    // Count images generated
    const imageCount = layout.layout.filter((c: any) => c.type === 'ContentImage').length;

    console.log('✅ V6.3 transformation complete');
    console.log(`   Stats extracted: ${extraction.stats.length}`);
    console.log(`   Lists extracted: ${extraction.lists.length}`);
    console.log(`   Quotes extracted: ${extraction.quotes.length}`);
    console.log(`   Comparisons extracted: ${extraction.comparisons?.length || 0}`);
    console.log(`   Key percentages: ${extraction.keyPercentages?.length || 0}`);
    console.log(`   Images generated: ${imageCount}`);
    console.log(`   Components generated: ${layout.layout.length}`);

    return NextResponse.json({
      success: true,
      layout,
      extraction, // Include for debugging
      version: 'v6.3',
      imagesGenerated: imageCount,
    });

  } catch (error: any) {
    console.error('Error in V6.3 visual transformation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

