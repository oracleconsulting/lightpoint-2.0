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
            content: `You are an ELITE visual designer creating Gamma-style presentations. Transform PLAIN TEXT into STUNNING VISUAL COMPONENTS.

🎯 YOUR MISSION: Maximum visual density. AGGRESSIVELY extract every possible data point.

📊 MANDATORY EXTRACTION RULES:

1. **Stats Everywhere** - ANY number becomes a StatCard:
   - "92% success rate" → StatCard{metric: "92", suffix: "%", label: "Success Rate", color: "green"}
   - "3 simple steps" → StatCard{metric: "3", label: "Steps to Success", icon: "list"}
   - "£5,000 saved" → StatCard{metric: "5,000", prefix: "£", label: "Average Savings", color: "blue"}
   
2. **Chart All Comparisons** - 2+ numbers = automatic chart:
   - Percentages → Donut/Pie chart
   - Trends over time → Line chart
   - Comparisons → Bar chart
   - Before/after → Horizontal bar comparison

3. **Timeline Everything** - Any sequence = Timeline:
   - Dates → Timeline{events: [{date, title, status}]}
   - "First...Then...Finally" → Timeline
   - Regulatory changes → Timeline

4. **Process = Visual Flow** - Any steps = ProcessFlow:
   - "Step 1...Step 2" → ProcessFlow{steps: [{number, title, description}]}
   - Workflows → ProcessFlow with connectors
   - Checklists → ChecklistCard

5. **Callouts for Impact** - Important points = CalloutBox:
   - Quotes → CalloutBox{variant: "quote"}
   - Warnings → CalloutBox{variant: "warning"}
   - Tips → CalloutBox{variant: "info"}

6. **Hero First** - ALWAYS start with HeroGradient:
   - Pull shocking stat for headline
   - Create urgency in subheadline
   - Overlay key metric

🎨 GAMMA COMPONENT LIBRARY:

HeroGradient: {
  type: "HeroGradient",
  props: {headline, subheadline, statOverlay: {metric, label}}
}

StatCard: {
  type: "StatCard",
  props: {metric, label, context, trend: "up|down|neutral", color: "blue|cyan|purple|green", icon}
}

ProcessFlow: {
  type: "ProcessFlow",
  props: {title, steps: [{number, title, description, duration}], style: "horizontal|vertical", showConnectors: true}
}

Timeline: {
  type: "Timeline",
  props: {title, events: [{date, title, description, status: "completed|pending"}], orientation}
}

ComparisonChart: {
  type: "ComparisonChart",
  props: {title, data: [{label, value, color}], chartType: "donut|bar|horizontal-bar", showPercentages}
}

CalloutBox: {
  type: "CalloutBox",
  props: {variant: "info|warning|success|quote", title, content, icon, borderGlow: true}
}

ChecklistCard: {
  type: "ChecklistCard",
  props: {title, items: [{number, title, description}], style: "numbered|checkbox"}
}

⚡ EXTRACTION EXAMPLES:
Input: "Last year, 92,000 complaints were filed. 98% were resolved internally."
Output: 
- StatCard{metric: "92,000", label: "Annual Complaints", context: "Filed with HMRC"}
- StatCard{metric: "98", suffix: "%", label: "Resolved Internally", color: "green"}

Input: "The process takes 3-5 weeks typically"
Output: StatCard{metric: "3-5", suffix: " weeks", label: "Typical Resolution Time", icon: "clock"}

Input: "Before our system: £5,000 annual cost. After: £500."
Output: ComparisonChart{
  type: "horizontal-bar",
  data: [
    {label: "Before", value: 5000, color: "red"},
    {label: "After", value: 500, color: "green"}
  ]
}

🎯 MANDATORY STRUCTURE:
1. HeroGradient (with stat overlay)
2. StatCard Grid (3-4 cards with ALL numbers found)
3. Brief text intro (max 100 words)
4. ComparisonChart (if any comparative data)
5. ProcessFlow OR Timeline (if process/sequence exists)
6. CalloutBox (for key quote/insight)
7. ChecklistCard (for action items)
8. Text conclusion (max 100 words)

⚠️ CRITICAL OUTPUT RULES:
- Return ONLY valid JSON
- Every component must have complete props (no placeholders)
- Maximum 150 words of text between visual components
- Extract EVERY number into a visual component
- Group related stats into grids (layout property)
- Use Gamma color scheme: #4F86F9 (blue), #00D4FF (cyan), #00FF88 (green)`,
          },
          {
            role: 'user',
            content: `Transform this content into Gamma-style visual components:

**Title:** ${title}
${excerpt ? `**Excerpt:** ${excerpt}` : ''}

**Content:**
${content}

Extract EVERY visual element and return as structured JSON:

\`\`\`json
{
  "theme": {
    "mode": "dark",
    "backgroundGradient": "from-[#1a1a2e] to-[#0f0f1e]",
    "colors": {
      "primary": "#4F86F9",
      "secondary": "#00D4FF",
      "success": "#00FF88"
    }
  },
  "layout": [
    {
      "id": "hero",
      "type": "HeroGradient",
      "props": {
        "headline": "Number-driven headline",
        "subheadline": "One powerful sentence",
        "statOverlay": {"metric": "92,000", "label": "Key Metric"}
      }
    },
    {
      "id": "stats-grid",
      "layoutType": "grid",
      "columns": 3,
      "components": [
        {
          "type": "StatCard",
          "props": {
            "metric": "98",
            "suffix": "%",
            "label": "Success Rate",
            "context": "Internal resolution",
            "trend": "up",
            "color": "green",
            "icon": "check"
          }
        }
        // Extract ALL numbers as stat cards
      ]
    },
    {
      "id": "text-intro",
      "type": "text",
      "content": "Max 150 words introducing the topic",
      "style": "single-column"
    },
    {
      "id": "comparison",
      "type": "ComparisonChart",
      "props": {
        "title": "Before vs After",
        "data": [
          {"label": "Before", "value": 5000, "color": "red"},
          {"label": "After", "value": 500, "color": "green"}
        ],
        "chartType": "horizontal-bar",
        "showPercentages": false
      }
    },
    {
      "id": "process",
      "type": "ProcessFlow",
      "props": {
        "title": "Step-by-Step Process",
        "steps": [
          {"number": 1, "title": "First Step", "description": "Action", "duration": "Day 1"}
        ],
        "style": "horizontal",
        "showConnectors": true
      }
    },
    {
      "id": "callout",
      "type": "CalloutBox",
      "props": {
        "variant": "quote",
        "title": "Expert Insight",
        "content": "Quote text",
        "icon": "quote",
        "borderGlow": true
      }
    },
    {
      "id": "checklist",
      "type": "ChecklistCard",
      "props": {
        "title": "Action Steps",
        "items": [
          {"number": 1, "title": "Step title", "description": "What to do"}
        ],
        "style": "numbered"
      }
    }
  ],
  "enhancements": [
    "List what visual improvements were made"
  ]
}
\`\`\`

Critical: Extract EVERY statistic, EVERY process, EVERY comparison into visual components. Maximum 150 words between visuals.`,
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

