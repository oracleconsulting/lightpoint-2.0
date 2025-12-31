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
  try {
    const body: V2LayoutRequest = await req.json();
    const { title, content, excerpt, author, includeHero = true, includeCTA = true } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      layout,
      stats: {
        componentCount: layout.components?.length ?? 0,
        componentTypes: [...new Set(layout.components?.map(c => c.type) ?? [])],
      },
    });

  } catch (error: any) {
    console.error('[V2 Layout] Error:', error.message);
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
