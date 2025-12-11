/**
 * V2 Layout Generator API Route
 * Uses pattern-based detection (no AI) to generate clean Gamma-style layouts
 * Fast, deterministic, and debuggable
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateLayout } from '@/components/blog-v2/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface V2LayoutRequest {
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
  includeHero?: boolean;
  includeCTA?: boolean;
  slug?: string;
  autoGenerateImages?: boolean;
}

export async function POST(req: NextRequest) {
  console.log('🔴🔴🔴 V2 ROUTE CALLED 🔴🔴🔴');
  try {
    const body: V2LayoutRequest = await req.json();
    const { title, content, excerpt, author, includeHero = true, includeCTA = true } = body;

    // 🔴 CRITICAL DIAGNOSTIC: Check content at API entry point
    console.log('🔴 [API] Content type:', typeof content);
    console.log('🔴 [API] Content is object:', typeof content === 'object');
    console.log('🔴 [API] Content length:', typeof content === 'string' ? content.length : 'N/A');
    if (typeof content === 'string') {
      console.log('🔴 [API] Content (first 500 chars):', content.substring(0, 500));
      // Check if spaces are preserved
      console.log('🔴 [API] Has "sent debt collectors":', content.includes('sent debt collectors'));
      console.log('🔴 [API] Has "sentdebtcollectors":', content.includes('sentdebtcollectors'));
      console.log('🔴 [API] Newline count:', (content.match(/\n/g) || []).length);
      console.log('🔴 [API] Space count:', (content.match(/ /g) || []).length);
      if (content.includes('sentdebtcollectorsforit') || !content.includes('sent debt')) {
        console.log('🔴🔴🔴 [API] CONTENT ALREADY BROKEN AT API ENTRY POINT! 🔴🔴🔴');
      }
    } else if (typeof content === 'object') {
      const contentStr = JSON.stringify(content);
      console.log('🔴 [API] Content JSON (first 500 chars):', contentStr.substring(0, 500));
      if (contentStr.includes('sentdebtcollectorsforit')) {
        console.log('🔴🔴🔴 [API] CONTENT ALREADY BROKEN AT API ENTRY POINT (JSON)! 🔴🔴🔴');
      }
    }

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    console.log('📄 [V2 Layout] Generating layout for:', title.substring(0, 50));
    console.log('📄 [V2 Layout] Content length:', typeof content === 'string' ? content.length : JSON.stringify(content).length);
    console.log('📄 [V2 Layout] Content type:', typeof content);
    console.log('📄 [V2 Layout] Content preview (first 500 chars):', typeof content === 'string' ? content.substring(0, 500) : JSON.stringify(content).substring(0, 500));

    // Generate the layout using pattern detection
    const slug = body.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const autoGenerateImages = body.autoGenerateImages !== false; // Default true
    
    const layout = await generateLayout({
      title,
      content,
      excerpt,
      author,
      includeHero,
      includeCTA,
      slug,
    }, autoGenerateImages);

    console.log('✅ [V2 Layout] Generated', layout.components.length, 'components');
    console.log('📄 [V2 Layout] Component types:', layout.components.map(c => c.type).join(', '));

    return NextResponse.json({
      success: true,
      layout,
      stats: {
        componentCount: layout.components.length,
        componentTypes: [...new Set(layout.components.map(c => c.type))],
      },
    });

  } catch (error: any) {
    console.error('❌ [V2 Layout] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: 'v2',
    description: 'Pattern-based layout generator (no AI)',
  });
}

