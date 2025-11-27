/**
 * Visual Transformation API V5
 * Gamma-style visual layout with HorizontalStatRow, DonutChart, TableTimeline
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTheme, getThemePromptVars } from '@/lib/blog/themes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for complex transformations

// V5 Post-processor: Convert to HorizontalStatRow format
function postProcessLayout(layout: any[]): any[] {
  const result: any[] = [];
  let statBuffer: any[] = [];
  
  const flushStatBuffer = () => {
    if (statBuffer.length >= 2) {
      // Convert to HorizontalStatRow (V5 preferred)
      result.push({
        type: 'HorizontalStatRow',
        props: {
          stats: statBuffer.map(s => ({
            metric: s.metric,
            label: s.label,
            sublabel: s.context,
            prefix: s.prefix,
            suffix: s.suffix,
            color: s.color || 'blue',
          }))
        },
        sourceText: statBuffer.map((s: any) => s?.sourceText || '').join(' ')
      });
    } else if (statBuffer.length === 1) {
      result.push({
        type: 'StatCard',
        props: { ...statBuffer[0], standalone: true },
        sourceText: statBuffer[0]?.sourceText
      });
    }
    statBuffer = [];
  };
  
  for (const item of layout) {
    if (item.type === 'StatCard') {
      statBuffer.push(item.props);
    } else if (item.type === 'StatCardGroup') {
      // Convert StatCardGroup to HorizontalStatRow
      flushStatBuffer();
      result.push({
        type: 'HorizontalStatRow',
        props: {
          stats: (item.props?.stats || []).map((s: any) => ({
            metric: s.metric,
            label: s.label,
            sublabel: s.context,
            prefix: s.prefix,
            suffix: s.suffix,
            color: s.color || 'blue',
          })),
          title: item.props?.title
        },
        sourceText: item.sourceText
      });
    } else if (item.type === 'HorizontalStatRow' || item.type === 'DonutChart' || item.type === 'TableTimeline') {
      // V5 components - pass through as-is
      flushStatBuffer();
      result.push(item);
    } else if (item.type === 'Timeline' && item.props?.events?.length > 0) {
      // Convert Timeline to TableTimeline
      flushStatBuffer();
      result.push({
        type: 'TableTimeline',
        props: {
          title: item.props.title || 'Timeline',
          events: item.props.events.map((e: any) => ({
            date: e.date,
            title: e.title,
            description: e.description || e.title,
            type: e.type,
          }))
        },
        sourceText: item.sourceText
      });
    } else {
      flushStatBuffer();
      result.push(item);
    }
  }
  
  flushStatBuffer();
  return result;
}

export async function POST(req: NextRequest) {
  try {
    const { title, content, excerpt, themeName = 'lightpoint' } = await req.json();

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

    // Get theme configuration
    const theme = getTheme(themeName);
    const themeVars = getThemePromptVars(themeName);

    console.log(`🎨 Starting V5 visual transformation for: ${title} (theme: ${theme.name})`);

    // V5 AI Prompt - Streamlined with HorizontalStatRow enforcement
    const systemPrompt = `You are a visual designer creating Gamma-style blog layouts. Transform content into visually engaging presentations where TEXT DRIVES THE NARRATIVE and VISUALS ACCENT (never overwhelm).

═══════════════════════════════════════════════════════════════════
                    🚨 CRITICAL STAT RULES 🚨
═══════════════════════════════════════════════════════════════════

RULE 1: ALWAYS USE HorizontalStatRow FOR MULTIPLE STATS

When text contains 2-3 statistics that are:
- In the same paragraph or within 150 words
- Thematically related

→ OUTPUT: HorizontalStatRow (NOT separate StatCards)

Example input:
"Last year, 92,000 people complained about HMRC. Yet 98% of these complaints get resolved internally."

✅ CORRECT OUTPUT:
{
  "type": "HorizontalStatRow",
  "props": {
    "stats": [
      { "metric": "92,000", "label": "Complaints", "sublabel": "Last year", "color": "blue" },
      { "metric": "98", "suffix": "%", "label": "Resolved Internally", "sublabel": "With template responses", "color": "amber" }
    ]
  }
}

❌ WRONG OUTPUT (NEVER DO THIS):
{"type": "StatCard", "props": { "metric": "92,000" }},
{"type": "StatCard", "props": { "metric": "98" }}

RULE 2: USE DonutChart FOR PROPORTION SPLITS

When text shows a percentage breakdown (X% vs Y%):

Example: "98% resolved internally"

✅ CORRECT:
{
  "type": "DonutChart",
  "props": {
    "title": "Complaint Resolution",
    "centerValue": "98%",
    "centerLabel": "Internal",
    "data": [
      { "name": "Resolved Internally", "value": 98, "color": "#3B82F6" },
      { "name": "Escalated", "value": 2, "color": "#06B6D4" }
    ]
  }
}

RULE 3: USE TableTimeline FOR DATE SEQUENCES

When text has explicit dates in sequence:

✅ CORRECT:
{
  "type": "TableTimeline",
  "props": {
    "title": "Evidence Timeline",
    "events": [
      { "date": "12 May 2024", "description": "VAT1 submitted online" },
      { "date": "12 June 2024", "description": "No registration received" }
    ]
  }
}

═══════════════════════════════════════════════════════════════════
                    COMPONENT REFERENCE
═══════════════════════════════════════════════════════════════════

Available components:

1. HeroGradient - Opening hero section
2. TextSection - Prose paragraphs (text-xl, readable)
3. HorizontalStatRow - 2-3 stats in horizontal row ⭐ USE THIS
4. DonutChart - Proportion visualization ⭐ USE THIS
5. TableTimeline - Clean table-format timeline ⭐ USE THIS
6. ComparisonChart - Bar/horizontal bar charts
7. ProcessFlow - Numbered steps with arrows
8. CalloutBox - Highlighted quotes/warnings
9. ChecklistCard - Action items
10. SectionDivider - Visual break between sections

═══════════════════════════════════════════════════════════════════
                    STAT COLOR GUIDE
═══════════════════════════════════════════════════════════════════

- blue: Default, complaint volumes, general stats
- cyan: Secondary stats, targets
- green: Success rates, positive outcomes, money recovered
- amber: Warnings, internal resolution rates
- red: Failures, problems
- purple: Special/unique metrics

═══════════════════════════════════════════════════════════════════
                    LAYOUT RULES
═══════════════════════════════════════════════════════════════════

1. Max 150 words between visual elements
2. Start with HeroGradient
3. Alternate: Text → Visual → Text → Visual
4. NEVER output consecutive StatCard components
5. Every component must have sourceText field

═══════════════════════════════════════════════════════════════════
                    UK STANDARDS
═══════════════════════════════════════════════════════════════════

- UK spelling: standardised, optimise, colour
- Currency: £ (not $)
- Dates: DD Month YYYY (12 May 2024)
- Replace em-dashes (—) with regular dashes (-)

Return ONLY valid JSON. No markdown code blocks.`;

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
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Transform this blog post into a visual layout.

TITLE: ${title}
${excerpt ? `EXCERPT: ${excerpt}` : ''}

CONTENT:
${content}

Return a single, complete, valid JSON object with this structure:
{
  "theme": { "name": "${themeVars.THEME_NAME}", "mode": "${themeVars.MODE}" },
  "layout": [
    { "type": "HeroGradient", "props": { "headline": "...", "subheadline": "..." }, "sourceText": "..." },
    { "type": "TextSection", "content": "<p>...</p>", "sourceText": "..." },
    { "type": "HorizontalStatRow", "props": { "stats": [...] }, "sourceText": "..." }
  ]
}`
          },
        ],
        temperature: 0.4,
        max_tokens: 8000,
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
      const jsonMatch = aiOutput.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      let jsonString = jsonMatch ? jsonMatch[1].trim() : aiOutput.trim();
      
      // Clean up common issues
      jsonString = jsonString
        .replace(/^[^{]*/, '')
        .replace(/[^}]*$/, '')
        .replaceAll(/,\s*}/g, '}')
        .replaceAll(/,\s*]/g, ']')
        .replaceAll(/}\s*{/g, '},{')
        .replaceAll(/]\s*{/g, '],{')
        .replaceAll(/}\s*"/g, '},"')
        .replaceAll(/"\s*{/g, '",{');
      
      console.log('🔧 Attempting to parse cleaned JSON...');
      transformedLayout = JSON.parse(jsonString);
      console.log('✅ JSON parsed successfully');
      
    } catch (parseError: any) {
      console.error('❌ Failed to parse AI response:', parseError.message);
      console.error('📄 Full AI output:', aiOutput.substring(0, 2000));
      
      // Try to recover layout array
      try {
        console.log('🔧 Attempting aggressive JSON repair...');
        const layoutMatch = aiOutput.match(/"layout"\s*:\s*\[([\s\S]*)\]/);
        if (layoutMatch) {
          const layoutArray = JSON.parse(`[${layoutMatch[1]}]`);
          transformedLayout = {
            theme: { 
              name: theme.name,
              mode: theme.mode, 
              colors: { 
                background: theme.colors.pageBg, 
                backgroundGradient: theme.colors.pageBgGradient,
                primary: theme.colors.accentPrimary 
              } 
            },
            layout: layoutArray
          };
          console.log('✅ Recovered layout array with', layoutArray.length, 'items');
        } else {
          throw new Error('Could not extract layout array');
        }
      } catch (recoveryError: any) {
        console.error('❌ Recovery failed:', recoveryError.message);
        return NextResponse.json(
          {
            success: false,
            error: 'AI returned malformed JSON. Please try again.',
            details: parseError.message,
          },
          { status: 500 }
        );
      }
    }

    // Validate the structure
    if (!transformedLayout.layout || !Array.isArray(transformedLayout.layout)) {
      return NextResponse.json(
        { success: false, error: 'Invalid layout structure returned by AI' },
        { status: 500 }
      );
    }

    // V5: Post-process to convert stats to HorizontalStatRow
    console.log('🔧 V5 Post-processing layout...');
    const originalCount = transformedLayout.layout.length;
    transformedLayout.layout = postProcessLayout(transformedLayout.layout);
    console.log(`✅ Post-processing complete: ${originalCount} → ${transformedLayout.layout.length} sections`);

    // Ensure theme is applied
    if (!transformedLayout.theme) {
      transformedLayout.theme = {
        name: theme.name,
        mode: theme.mode,
        colors: {
          background: theme.colors.pageBg,
          backgroundGradient: theme.colors.pageBgGradient,
          primary: theme.colors.accentPrimary
        }
      };
    }

    console.log('✅ V5 Visual transformation complete:', transformedLayout.layout.length, 'sections');

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
