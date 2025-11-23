/**
 * Visual Transformation API
 * Takes existing blog content and transforms it into a visually powerful layout
 * Extracts data, creates charts, identifies key points, adds visual elements
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120; // 2 minutes

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

    console.log(`🎨 Starting visual transformation for: ${title}`);

    // Call Claude 3.5 Sonnet for visual transformation
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://lightpoint.uk',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: `You are a visual content designer. Transform plain blog content into visually stunning layouts.

Your job:
1. **Extract all data** - Find every number, percentage, date, statistic
2. **Identify structure** - Processes, timelines, comparisons, key points
3. **Create visual components** - Stat cards, charts, callouts, timelines
4. **Optimize flow** - Hero → Stats → Content → Visuals → Conclusion
5. **Add enhancements** - Highlight key insights, add context

Available components:
- hero (striking header with subtitle)
- stats_grid (extract ALL numbers into stat cards)
- text (rich formatted paragraphs)
- chart (bar, line, pie, donut, horizontal-bar for any data)
- callout (info, warning, success, tip - for important points)
- timeline (chronological events with dates)
- numbered_steps (any process or sequence)
- comparison_table (before/after, old vs new)
- highlight_box (large callout for key takeaway)
- two_column (split content for better readability)

Rules:
- Extract EVERY number into a stat card or chart
- Convert any process into numbered steps
- Find dates and create timelines
- Highlight quotes/tips in callouts
- Create visual hierarchy
- Make it scannable and engaging

Return ONLY valid JSON.`,
          },
          {
            role: 'user',
            content: `Transform this blog content into a visually powerful layout:

**Title:** ${title}
${excerpt ? `**Excerpt:** ${excerpt}` : ''}

**Content:**
${content}

Analyze the content and return JSON:
\`\`\`json
{
  "layout": [
    {"type": "hero", "content": {"title": "...", "subtitle": "..."}, "style": {}},
    {"type": "stats_grid", "content": {"stats": [{"label": "...", "value": 96, "suffix": "%", "color": "green"}]}, "style": {"columns": 4}},
    {"type": "text", "content": {"html": "<p>...</p>"}, "style": {}},
    {"type": "chart", "content": {"type": "bar", "title": "...", "data": [{"name": "2021", "value": 100}]}},
    {"type": "callout", "content": {"type": "tip", "title": "...", "text": "..."}},
    {"type": "numbered_steps", "content": {"steps": [{"title": "...", "description": "..."}]}, "style": {"columns": 2}}
  ],
  "theme": {
    "primary_color": "#3b82f6",
    "style": "modern"
  },
  "enhancements": [
    "Extracted 5 key statistics into stat cards",
    "Created bar chart from data table",
    "Added timeline for chronological events",
    "Highlighted 3 key insights in callouts",
    "Converted process into 6 numbered steps"
  ]
}
\`\`\`

Extract EVERYTHING visual. Turn boring text into engaging components.`,
          },
        ],
        temperature: 0.6,
        max_tokens: 8000, // Increased to ensure complete JSON response
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenRouter API error:', errorData);
      return NextResponse.json(
        { success: false, error: `AI transformation failed: ${errorData.error?.message || response.statusText}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiOutput = data.choices[0].message.content;

    console.log('📄 AI Response (first 500 chars):', aiOutput.substring(0, 500));

    // Parse the AI response
    let transformedLayout;
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = aiOutput.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        console.log('✅ Found JSON in markdown code block');
        transformedLayout = JSON.parse(jsonMatch[1]);
      } else {
        // Try parsing directly
        console.log('⚠️ No code block found, parsing raw response');
        transformedLayout = JSON.parse(aiOutput);
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
    if (!transformedLayout.layout || !Array.isArray(transformedLayout.layout)) {
      return NextResponse.json(
        { success: false, error: 'Invalid layout structure returned by AI' },
        { status: 500 }
      );
    }

    console.log('✅ Visual transformation complete:', transformedLayout.layout.length, 'sections');

    return NextResponse.json({
      success: true,
      layout: transformedLayout,
    });

  } catch (error: any) {
    console.error('Error in visual transformation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

