import { NextRequest, NextResponse } from 'next/server';
import { generateGammaFromBlog, isGammaConfigured } from '@/lib/gamma/client';

export const maxDuration = 300; // 5 minutes for long generation

export async function POST(request: NextRequest) {
  try {
    // Check if Gamma is configured
    if (!isGammaConfigured()) {
      return NextResponse.json(
        { error: 'Gamma API is not configured. Please set GAMMA_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { content, title } = body;

    if (!content || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: content and title' },
        { status: 400 }
      );
    }

    console.log(`[Gamma] Starting generation for: "${title}"`);

    // Generate with Gamma
    const result = await generateGammaFromBlog(content, title, {
      pollOptions: {
        maxAttempts: 90, // 4.5 minutes max
        intervalMs: 3000,
        onProgress: (status, attempt) => {
          console.log(`[Gamma] Status: ${status} (attempt ${attempt})`);
        },
      },
    });

    console.log(`[Gamma] Generation complete: ${result.gammaUrl}`);

    return NextResponse.json({
      success: true,
      generationId: result.generationId,
      gammaUrl: result.gammaUrl,
      exportUrl: result.exportUrl,
      generatedAt: result.generatedAt.toISOString(),
    });
  } catch (error) {
    console.error('[Gamma] Generation error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to generate Gamma presentation',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

