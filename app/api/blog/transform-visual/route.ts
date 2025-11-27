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
            content: `You are an ELITE visual designer creating Gamma-style presentations. Your mission is to transform blog content into visually stunning, narrative-focused layouts that ENHANCE text, never overpower it.

═══════════════════════════════════════════════════════════════════
                    🚨 CRITICAL THEME RULES 🚨
═══════════════════════════════════════════════════════════════════

MANDATORY DARK THEME:
- Page background: Deep navy (#0a0a1a to #1a1a2e)
- Card backgrounds: Translucent dark (rgba(26, 26, 46, 0.6))
- NEVER use light backgrounds, purple/lavender gradients, or pastels
- All text: White or white with opacity

FORBIDDEN OUTPUTS:
❌ Light purple/lavender backgrounds
❌ Pastel color schemes
❌ White or light grey page backgrounds
❌ Pink or purple gradients as primary backgrounds

═══════════════════════════════════════════════════════════════════
                    📊 STAT CARD RULES 📊
═══════════════════════════════════════════════════════════════════

STAT EXTRACTION:
- ANY number in text becomes a StatCard or part of StatCardGroup
- Currency: "£5,000" → metric: "5,000", prefix: "£"
  CRITICAL: NEVER output "££" - prefix is applied by component
- Percentages: "92%" → metric: "92", suffix: "%"
- Large numbers: "92,000" → metric: "92,000" (include comma)

STAT GROUPING (CRITICAL FOR VISUAL BALANCE):
- 2-3 related stats → Use StatCardGroup (horizontal)
- Never stack 2+ StatCards vertically in sequence
- Group by theme: performance metrics together, financial together

Examples of when to group:
- "92,000 complaints" + "98% resolved" → StatCardGroup
- "£103K compensation" + "£45K liabilities" + "41% success" → StatCardGroup
- "88% calls answered" + "34% resolved" → StatCardGroup

STAT CARD SIZING:
- Maximum height: 120px per card
- Maximum 15% of viewport for any stat element
- Compact horizontal layout, NOT tall vertical boxes

COLOR ASSIGNMENT:
- Blue: General stats, complaint volumes
- Cyan: Secondary/comparative stats
- Green: Success rates, positive outcomes
- Amber: Warnings, targets, thresholds
- Red: Failures, negative outcomes, problems
- Purple: Special highlights, unique metrics

═══════════════════════════════════════════════════════════════════
                    📐 LAYOUT RULES 📐
═══════════════════════════════════════════════════════════════════

VISUAL DENSITY:
- Maximum 150 words between visual elements
- Minimum one visual per major section
- Never cluster 3+ visuals without intervening text

COMPONENT FLOW:
✅ CORRECT: TextSection → StatCardGroup → TextSection → Chart → TextSection
❌ WRONG: TextSection → StatCard → StatCard → StatCard → TextSection

UNIFIED WIDTH:
- ALL components must be max-w-4xl (896px)
- No component should exceed this width
- No component should be significantly narrower

═══════════════════════════════════════════════════════════════════
                    🔍 EXTRACTION RULES 🔍
═══════════════════════════════════════════════════════════════════

CONTENT PRESERVATION:
1. NEVER invent content - only extract from provided text
2. NEVER rewrite prose - preserve exact wording in TextSections
3. NEVER add statistics not present in source
4. NEVER fabricate timeline dates

TIMELINE CREATION:
- ONLY create Timeline if dates are EXPLICITLY stated
- "12 May 2024" → Valid timeline event
- "Then...", "Later...", "After that..." → NOT valid for Timeline

PROCESS FLOW CREATION:
- ONLY create ProcessFlow if steps are EXPLICITLY numbered/listed
- "Step 1: ..., Step 2: ..." → Valid ProcessFlow
- Generic mention of "the process" → NOT valid for ProcessFlow

SOURCE TRACKING:
- Every component MUST include "sourceText" field
- sourceText = exact snippet from original content that justifies component

═══════════════════════════════════════════════════════════════════
                    🇬🇧 UK STANDARDS 🇬🇧
═══════════════════════════════════════════════════════════════════

SPELLING:
- standardised (not standardized)
- optimise (not optimize)
- colour (not color)
- organisation (not organization)

PUNCTUATION:
- Replace em-dashes (—) with regular dashes (-)
- Use £ not $ for currency

DATE FORMAT:
- DD Month YYYY: "12 May 2024"
- NOT: "May 12, 2024"

═══════════════════════════════════════════════════════════════════
                    🎨 COMPONENT LIBRARY 🎨
═══════════════════════════════════════════════════════════════════

**TextSection**: {content: "HTML string"} - Prose paragraphs between visuals
**StatCard**: {metric, label, context?, prefix?, suffix?, color}
**StatCardGroup**: {title?, stats: [StatCard props]} - 2-3 HORIZONTAL stats
**ComparisonChart**: {title, type: "bar"|"horizontalBar"|"donut", data: [{label, value, color?}]}
**ProcessFlow**: {title?, steps: [{number, title, description}]}
**Timeline**: {title?, events: [{date, title, description}]}
**CalloutBox**: {variant: "quote"|"info"|"warning"|"success", text, attribution?}
**ChecklistCard**: {title, items: [{number, title, description}]}
**SectionDivider**: {} - Visual break between major sections

⚠️ RETURN ONLY VALID JSON - No markdown, no explanations, just JSON.`,
          },
          {
            role: 'user',
            content: `TASK: Extract visual components from this blog post. DO NOT INVENT OR MODIFY CONTENT.

**Title:** ${title}
${excerpt ? `**Excerpt:** ${excerpt}` : ''}

**Full Source Text:**
${content}

INSTRUCTIONS:
1. Read the ENTIRE text above
2. Extract ONLY explicitly stated:
   - Numbers with labels (for StatCards)
   - Lists with numbers (for ProcessFlow/ChecklistCard)
   - Explicit dates with events (for Timeline)
   - Direct quotes (for CalloutBox)
   - Comparative data (for ComparisonChart)
3. DO NOT create components if data is vague or implied
4. DO NOT invent timelines, processes, or statistics
5. Fix currency: "£5,000" NOT "££5,000"
6. Fix UK English: -ize → -ise, remove em-dashes (—)
7. Return structured JSON ONLY

FORMAT:
\`\`\`json
{
  "theme": {
    "mode": "dark",
    "colors": {
      "background": "#0a0a1a",
      "backgroundGradient": "linear-gradient(180deg, #0a0a1a 0%, #0f0f23 50%, #1a1a2e 100%)",
      "primary": "#4F86F9",
      "secondary": "#00D4FF",
      "text": "#FFFFFF"
    }
  },
  "layout": [
    {
      "type": "TextSection",
      "props": {
        "content": "<p>Opening paragraph with context...</p>"
      },
      "sourceText": "Original prose from source"
    },
    {
      "type": "StatCardGroup",
      "props": {
        "stats": [
          {
            "metric": "92,000",
            "label": "Complaints Filed",
            "context": "Last year",
            "color": "blue"
          },
          {
            "metric": "98",
            "suffix": "%",
            "label": "Resolved Internally",
            "context": "With template responses",
            "color": "amber"
          }
        ]
      },
      "sourceText": "92,000 complaints... 98% resolved internally"
    },
    {
      "type": "TextSection",
      "props": {
        "content": "<p>Next paragraph explaining the statistics...</p>"
      },
      "sourceText": "Original prose explaining the data"
    }
  ],
  "validation": {
    "darkThemeEnforced": true,
    "noStackedStats": true,
    "maxWordsPerTextSection": 150,
    "allComponentsMaxW4xl": true
  },
  "warnings": ["List any components you could NOT create due to missing explicit data"]
}
\`\`\`

⚠️ CRITICAL LAYOUT RULES:
- Use StatCardGroup for 2-3 related stats (NEVER stack individual StatCards)
- Alternate between TextSections and visual components
- Never group all visuals together at the end
- Max 2-3 paragraphs before inserting a visual
- Preserve the natural flow of the original text
- Insert visuals where they're contextually relevant

CRITICAL: Every component must include "sourceText" field showing where the data came from. If you cannot find explicit data, DO NOT create the component.`,
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

