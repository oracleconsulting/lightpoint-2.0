/**
 * AI Layout Generator API Route
 * Analyzes blog post content and automatically generates optimal visual layout
 * Similar to Gamma's AI-powered design generation
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface LayoutGenerationRequest {
  title: string;
  content: string; // Raw text content
  excerpt?: string;
  targetAudience?: string;
  tone?: 'professional' | 'casual' | 'technical' | 'storytelling';
}

export async function POST(req: NextRequest) {
  try {
    const { title, content, excerpt, targetAudience, tone }: LayoutGenerationRequest = await req.json();

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

    // Call OpenRouter with Claude 3.5 Sonnet
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://lightpoint.uk',
        'X-Title': 'Lightpoint Blog AI Layout Generator',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: `You are an expert visual designer and data storyteller. Your job is to analyze blog post content and create the most impactful visual layout using components like stat cards, charts, timelines, callouts, and infographics.

Available Components:
1. **hero** - Hero section with title, subtitle, optional background image
2. **stats_grid** - Grid of statistic cards (2-4 columns)
3. **text** - Rich text paragraphs (can be 1 or 2 columns)
4. **chart** - Data visualizations (bar, line, pie, horizontal-bar, multi-series)
5. **callout** - Highlighted boxes (info, warning, success, tip)
6. **timeline** - Chronological events
7. **numbered_steps** - Step-by-step process (1-3 columns)
8. **comparison_table** - Before/After or Old vs New
9. **two_column** - Split layout (text + image, or two text blocks)
10. **highlight_box** - Large stat or key takeaway
11. **table** - Structured data table

Your Goal:
- Extract key statistics and create stat cards
- Identify data that would work as charts
- Find processes and create numbered steps
- Detect comparisons and build comparison tables
- Highlight important information in callouts
- Create visual flow and hierarchy
- Make the post scannable and engaging

Return VALID JSON ONLY (no markdown, no explanations).`,
          },
          {
            role: 'user',
            content: `Generate an optimal visual layout for this blog post:

**Title:** ${title}

${excerpt ? `**Excerpt:** ${excerpt}` : ''}

**Content:**
${content}

${targetAudience ? `**Target Audience:** ${targetAudience}` : ''}
${tone ? `**Tone:** ${tone}` : ''}

Analyze the content and return a JSON object with this exact structure:

\`\`\`json
{
  "layout": [
    {
      "type": "hero",
      "content": {
        "title": "Main title",
        "subtitle": "Compelling subtitle",
        "imageUrl": null
      },
      "style": {
        "height": "large",
        "background": "gradient"
      }
    },
    {
      "type": "stats_grid",
      "content": {
        "stats": [
          {"label": "Success Rate", "value": 96, "suffix": "%", "color": "green"},
          {"label": "Cases", "value": 1200, "suffix": "+", "color": "blue"}
        ]
      },
      "style": {
        "columns": 4
      }
    },
    {
      "type": "text",
      "content": {
        "html": "<p>Paragraph text...</p>"
      },
      "style": {
        "columns": 1
      }
    },
    {
      "type": "chart",
      "content": {
        "title": "Chart Title",
        "type": "bar",
        "data": [
          {"name": "2021", "value": 100},
          {"name": "2022", "value": 200}
        ]
      }
    },
    {
      "type": "callout",
      "content": {
        "type": "tip",
        "title": "Pro Tip",
        "text": "Important information..."
      }
    }
  ],
  "theme": {
    "primary_color": "#3b82f6",
    "style": "modern"
  },
  "reasoning": "Brief explanation of design choices"
}
\`\`\`

Extract ALL numbers, percentages, and data points from the content. Convert them to stats or charts.
Identify processes and create numbered steps.
Find key quotes or tips and put them in callouts.
Create a logical flow: Hero → Stats → Problem → Solution → Data → Conclusion.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 8000, // Increased to ensure complete JSON response
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { success: false, error: `AI generation failed: ${errorData.error?.message || response.statusText}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiOutput = data.choices[0].message.content;

    console.log('📄 AI Layout Response (first 500 chars):', aiOutput.substring(0, 500));

    // Parse the AI response
    let generatedLayout;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = aiOutput.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        console.log('✅ Found JSON in markdown code block');
        generatedLayout = JSON.parse(jsonMatch[1]);
      } else {
        // Try parsing directly
        console.log('⚠️ No code block found, parsing raw response');
        generatedLayout = JSON.parse(aiOutput);
      }
    } catch (parseError: any) {
      console.error('❌ Failed to parse AI response:', parseError.message);
      console.error('📄 Full AI output:', aiOutput);
      return NextResponse.json(
        { 
          success: false, 
          error: 'AI returned invalid or incomplete JSON. Please try again.',
          details: parseError.message,
          raw: aiOutput.substring(0, 1000), // First 1000 chars for debugging
        },
        { status: 500 }
      );
    }

    // Validate the structure
    if (!generatedLayout.layout || !Array.isArray(generatedLayout.layout)) {
      return NextResponse.json(
        { success: false, error: 'Invalid layout structure returned by AI' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      layout: generatedLayout,
    });

  } catch (error: any) {
    console.error('Error in AI layout generation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

