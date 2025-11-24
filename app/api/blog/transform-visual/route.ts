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
            content: `You are a precision data extractor and visual component mapper. Your ONLY job is to identify visual opportunities in existing text WITHOUT changing or inventing content.

🚨 CRITICAL RULES - VIOLATION RESULTS IN FAILURE:

1. **NEVER INVENT CONTENT** - Only extract what explicitly exists in the source text
2. **NEVER REWRITE TEXT** - Preserve original wording exactly
3. **NEVER CREATE TIMELINES** unless dates/sequences are explicitly stated
4. **NEVER CREATE PROCESSES** unless steps are explicitly numbered/listed
5. **NEVER ADD CONTEXT** - Use exact phrases from source
6. **UK ENGLISH ONLY** - Change all -ize to -ise, -or to -our, remove em-dashes (—)
7. **CURRENCY FORMAT** - £ symbol prefix ONCE only (never ££), format as "£5,000" not "5000"

📊 EXTRACTION RULES (Only if explicitly present):

**StatCard** - Extract ONLY if explicit number + label exists:
✅ "92,000 complaints" → {metric: "92,000", label: "Complaints"}
✅ "98% resolved" → {metric: "98", suffix: "%", label: "Resolved"}
❌ DO NOT create cards for vague references like "many" or "several"
❌ DO NOT add context not in original text

**ComparisonChart** - ONLY if 2+ related numbers with clear labels:
✅ "Tier One: 2%, Tier Two: 12%, Adjudicator: 41%" → Bar chart
❌ DO NOT chart unrelated numbers
❌ DO NOT invent comparison categories

**Timeline** - ONLY if explicit dates AND events:
✅ "12 May 2024: Submitted, 12 June 2024: Response" → Timeline
❌ DO NOT create timeline from general narrative
❌ DO NOT invent dates or steps

**ProcessFlow** - ONLY if numbered steps explicitly exist:
✅ "1. Classification... 2. Specific Breach... 3. Evidence..." → ProcessFlow
❌ DO NOT extract from prose paragraphs
❌ DO NOT create steps from general descriptions

**CalloutBox** - ONLY for direct quotes or explicit warnings:
✅ "The Taxpayers' Charter states..." → quote variant
❌ DO NOT create callouts from regular text

**ChecklistCard** - ONLY if action items explicitly numbered/listed:
✅ "Evidence needed: 1. Call Records 2. Written Proof..." → ChecklistCard
❌ DO NOT extract from prose

🎯 MANDATORY WORKFLOW:

STEP 1: Read entire source text
STEP 2: Identify ONLY explicit visual elements (numbers with labels, lists, dates, quotes)
STEP 3: Map to components WITHOUT adding context
STEP 4: Verify EVERY component prop comes from source text
STEP 5: Return JSON with preserved prose + visual markers

⚠️ CURRENCY HANDLING:
- Input: "£5,000" → metric: "5,000", prefix: "£"
- Input: "£103,063" → metric: "103,063", prefix: "£"
- NEVER output "££" - prefix is applied by component

⚠️ UK ENGLISH ENFORCEMENT:
- standardized → standardised
- optimize → optimise
- color → colour
- Remove ALL em-dashes (—) and replace with regular dashes (-)
- Remove Americanisms: "gotten" → "received", "toward" → "towards"

🎨 COMPONENT LIBRARY:

StatCard: {metric, label, context?, prefix?, suffix?, color?, trend?}
ComparisonChart: {title, data: [{label, value}], chartType: "bar|horizontal-bar|donut"}
ProcessFlow: {title, steps: [{number, title, description}]}
Timeline: {title, events: [{date, title, description, status}]}
CalloutBox: {variant: "quote|info|warning", title, content}
ChecklistCard: {title, items: [{number, title, description}]}

✅ GOOD EXAMPLE:
Source: "92,000 complaints filed. 98% resolved internally. 34% resolved after escalation."
Output:
- StatCard{metric: "92,000", label: "Complaints Filed"}
- StatCard{metric: "98", suffix: "%", label: "Resolved Internally"}
- StatCard{metric: "34", suffix: "%", label: "Resolved After Escalation"}

❌ BAD EXAMPLE:
Source: "Many complaints are filed each year"
Output: StatCard{metric: "92,000", label: "Annual Complaints"} ← WRONG: Invented number

🎯 OUTPUT STRUCTURE:
Return JSON with components array. Each component must reference exact source text.`,
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
    "colors": {"primary": "#4F86F9", "secondary": "#00D4FF"}
  },
  "layout": [
    {
      "type": "StatCard",
      "props": {
        "metric": "92,000",
        "label": "Complaints Filed",
        "context": "Last year with HMRC",
        "color": "blue"
      },
      "sourceText": "Last year, 92,000 complaints were filed"
    }
  ],
  "warnings": ["List any components you could NOT create due to missing explicit data"]
}
\`\`\`

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

