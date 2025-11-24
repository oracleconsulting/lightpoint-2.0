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
        model: 'anthropic/claude-opus-4.1',
        messages: [
          {
            role: 'system',
            content: `You are an ELITE visual designer like Gamma.app or Beautiful.ai. Your job is to transform BORING PLAIN TEXT into STUNNING VISUAL PRESENTATIONS.

🎯 YOUR MISSION: Make everything visual. AGGRESSIVELY extract data and create charts/graphics.

📊 MANDATORY RULES:
1. **Stats Everywhere** - Any number MUST become a stat card. "92% success rate" → stat card. "3 steps" → stat card. "£5,000 saved" → stat card.
2. **Chart All Data** - 2+ numbers = automatic chart. Show trends, comparisons, distributions.
3. **Timeline Everything** - Any dates, sequence, or "then X happened" → timeline
4. **Steps = Visual** - Any process, how-to, workflow → numbered visual steps with icons
5. **Callouts for Emphasis** - Important points → colorful callout boxes
6. **Hero at Top** - Every post gets a striking hero with subtitle
7. **Highlight Takeaways** - Main point → large highlight box

🎨 AVAILABLE COMPONENTS (use ALL of them):
- \`hero\` - Striking header (ALWAYS use this first)
- \`stats_grid\` - Stat cards (extract EVERY number)
- \`chart\` - Bar, line, pie, donut (use liberally for any data)
- \`callout\` - Colored boxes for key points (info/warning/success/tip)
- \`timeline\` - Visual timeline with dates
- \`numbered_steps\` - Process visualization with big numbers
- \`comparison_table\` - Before/after, old vs new
- \`highlight_box\` - Large standout box for main takeaway
- \`two_column\` - Split dense content
- \`text\` - Only for prose between visuals

⚡ EXTRACTION EXAMPLES:
- "92,000 complaints" → stat card {value: 92000, label: "Complaints", suffix: ""}
- "34% resolved" → stat card {value: 34, suffix: "%", label: "Resolved", color: "red"}
- "£3,000-£5,000 annually" → stat card {value: 4000, prefix: "£", label: "Average Annual Recovery"}
- Multiple numbers → bar/line chart showing comparison
- "First... Then... Finally..." → timeline
- "Step 1... Step 2..." → numbered_steps

🎯 STRUCTURE PATTERN:
1. Hero (striking title + subtitle)
2. Stats Grid (3-6 stat cards with ALL numbers)
3. Brief text intro
4. Chart (if any data to visualize)
5. Numbered Steps or Timeline (if process/sequence)
6. Callouts (2-3 key insights)
7. Highlight Box (main takeaway)
8. Conclusion text

⚠️ CRITICAL: Return ONLY valid JSON. No markdown code blocks, no explanations, just raw JSON.`,
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

