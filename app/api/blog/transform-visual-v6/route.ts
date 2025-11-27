/**
 * Visual Transformation API V6
 * 
 * Multi-stage pipeline:
 * 1. Extract ALL structured content (stats, quotes, lists, timeline)
 * 2. Map to components deterministically
 * 3. Return layout with extraction data for debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { transformContentV6 } from '@/lib/blog/extractionPipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const { title, content, excerpt } = await req.json();

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

    console.log(`🎨 Starting V6 visual transformation for: ${title}`);

    const { layout, extraction } = await transformContentV6(
      title,
      content,
      excerpt || '',
      openrouterApiKey
    );

    console.log('✅ V6 transformation complete');
    console.log(`   Stats extracted: ${extraction.stats.length}`);
    console.log(`   Lists extracted: ${extraction.lists.length}`);
    console.log(`   Quotes extracted: ${extraction.quotes.length}`);
    console.log(`   Components generated: ${layout.layout.length}`);

    return NextResponse.json({
      success: true,
      layout,
      extraction, // Include for debugging
      version: 'v6',
    });

  } catch (error: any) {
    console.error('Error in V6 visual transformation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

