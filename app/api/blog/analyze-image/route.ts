/**
 * AI Image Analysis API Route
 * Uses Claude 3.5 Sonnet (via OpenRouter) with vision capabilities to analyze blog post images
 * and extract structure/content for automatic HTML generation
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AnalysisResponse {
  success: boolean;
  structure?: {
    sections: Array<{
      type: string;
      content: any;
      style?: any;
    }>;
    theme?: {
      colors: string[];
      fonts: string[];
    };
  };
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, imageBase64 } = await req.json();

    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { success: false, error: 'Image URL or base64 required' },
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

    // Prepare the image content for Claude
    const imageContent = imageBase64
      ? {
          type: 'image',
          source: {
            type: 'base64',
            media_type: 'image/png',
            data: imageBase64,
          },
        }
      : {
          type: 'image',
          source: {
            type: 'url',
            url: imageUrl,
          },
        };

    // Call OpenRouter with Claude 3.5 Sonnet (Vision)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://lightpoint.uk',
        'X-Title': 'Lightpoint Blog AI Analyzer',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'user',
            content: [
              imageContent,
              {
                type: 'text',
                text: `Analyze this blog post design/layout image and extract its structure for HTML/React recreation.

Please identify:

1. **Sections** - What distinct sections exist? (hero, stats grid, text blocks, charts, tables, callouts, etc.)
2. **Content** - What text, numbers, and data are visible?
3. **Visual Elements** - Charts (bar, pie, line), tables, timelines, step numbers, icons
4. **Layout** - Single column, multi-column, grid layouts
5. **Styling** - Color scheme (primary, accent, background), typography, spacing

Return a JSON object with this structure:
\`\`\`json
{
  "sections": [
    {
      "type": "hero | stats_grid | text | chart | table | callout | timeline | numbered_steps | two_column",
      "content": {
        // Relevant content for this section type
        // For stats_grid: array of {label, value, color}
        // For chart: {type: "bar|pie|line", data: [...], title, description}
        // For text: {heading, body}
        // For table: {headers: [...], rows: [...]}
      },
      "style": {
        "background": "color",
        "textColor": "color",
        "columns": 2
      }
    }
  ],
  "theme": {
    "primary_color": "#hex",
    "accent_color": "#hex",
    "background": "#hex | white | dark",
    "fonts": ["primary font", "heading font"]
  }
}
\`\`\`

Be as detailed as possible. Extract ALL visible text, numbers, and data points.`,
              },
            ],
          },
        ],
        temperature: 0.3, // Lower temperature for more structured output
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { success: false, error: `AI analysis failed: ${errorData.error?.message || response.statusText}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiOutput = data.choices[0].message.content;

    // Attempt to extract JSON from the response
    let structure;
    try {
      // Claude might wrap the JSON in markdown code blocks
      const jsonMatch = aiOutput.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        structure = JSON.parse(jsonMatch[1]);
      } else {
        // Try parsing directly
        structure = JSON.parse(aiOutput);
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiOutput);
      return NextResponse.json(
        { success: false, error: 'AI returned invalid JSON structure' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      structure,
    });

  } catch (error: any) {
    console.error('Error in AI image analysis:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

