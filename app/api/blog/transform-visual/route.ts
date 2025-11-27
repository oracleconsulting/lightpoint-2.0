/**
 * Visual Transformation API V4
 * Takes existing blog content and transforms it into a Gamma-style visual layout
 * with configurable themes and enforced horizontal stat grouping
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTheme, getThemePromptVars } from '@/lib/blog/themes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for complex transformations

// Post-process layout to ensure stats are grouped horizontally
function postProcessLayout(layout: any[]): any[] {
  const result: any[] = [];
  let statBuffer: any[] = [];
  
  for (const item of layout) {
    if (item.type === 'StatCard') {
      statBuffer.push(item.props);
      
      // Look ahead - if next item is not a StatCard, flush buffer
      const currentIndex = layout.indexOf(item);
      const nextItem = layout[currentIndex + 1];
      
      if (!nextItem || nextItem.type !== 'StatCard') {
        if (statBuffer.length >= 2) {
          // Group 2-3 stats together
          result.push({
            type: 'StatCardGroup',
            props: { stats: statBuffer.slice(0, 3) },
            sourceText: statBuffer.map(s => s.sourceText || '').join(' ')
          });
          // Handle overflow (more than 3 stats)
          if (statBuffer.length > 3) {
            result.push({
              type: 'StatCardGroup',
              props: { stats: statBuffer.slice(3) },
              sourceText: statBuffer.slice(3).map((s: any) => s.sourceText || '').join(' ')
            });
          }
        } else if (statBuffer.length === 1) {
          // Single stat - keep as standalone but mark it
          result.push({
            type: 'StatCard',
            props: { ...statBuffer[0], standalone: true },
            sourceText: statBuffer[0].sourceText
          });
        }
        statBuffer = [];
      }
    } else {
      // Non-stat item - flush any pending stats first
      if (statBuffer.length >= 2) {
        result.push({
          type: 'StatCardGroup',
          props: { stats: statBuffer },
          sourceText: statBuffer.map((s: any) => s?.sourceText || '').join(' ')
        });
      } else if (statBuffer.length === 1) {
        result.push({
          type: 'StatCard',
          props: { ...statBuffer[0], standalone: true },
          sourceText: statBuffer[0].sourceText
        });
      }
      statBuffer = [];
      result.push(item);
    }
  }
  
  // Flush remaining stats
  if (statBuffer.length >= 2) {
    result.push({
      type: 'StatCardGroup',
      props: { stats: statBuffer },
      sourceText: statBuffer.map((s: any) => s.sourceText || '').join(' ')
    });
  } else if (statBuffer.length === 1) {
    result.push({
      type: 'StatCard',
      props: { ...statBuffer[0], standalone: true },
      sourceText: statBuffer[0].sourceText
    });
  }
  
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

    console.log(`🎨 Starting V4 visual transformation for: ${title} (theme: ${theme.name})`);

    // V4 AI Prompt - Streamlined for speed and quality
    const systemPrompt = `You are a visual designer creating Gamma-style blog layouts. Transform content into visually engaging presentations that ENHANCE text without overpowering it.

═══════════════════════════════════════════════════════════════════
                         THEME: ${themeVars.THEME_NAME}
═══════════════════════════════════════════════════════════════════
Use this colour palette:
- Page background: ${themeVars.PAGE_BG}
- Card background: ${themeVars.CARD_BG}
- Primary text: ${themeVars.TEXT_PRIMARY}
- Accent: ${themeVars.ACCENT_PRIMARY}

═══════════════════════════════════════════════════════════════════
                    🚨 CRITICAL RULES 🚨
═══════════════════════════════════════════════════════════════════

1. STAT GROUPING (MANDATORY)
   - 2-3 related stats within 200 words → StatCardGroup (horizontal)
   - NEVER output consecutive individual StatCards
   - Single isolated stat → StatCard with standalone: true

2. TYPOGRAPHY (READABILITY)
   - Body text must be substantial and readable
   - Section headings clear hierarchy
   
3. CONTENT EXTRACTION
   - NEVER invent content - only use what's in the source
   - Every component needs sourceText field with exact source snippet
   - UK spelling: standardised, optimise, colour
   - Replace em-dashes (—) with regular dashes (-)
   - Currency: "£5,000" → metric: "5,000", prefix: "£" (NEVER "££")

4. VISUAL RHYTHM
   - Max 150 words between visual elements
   - Alternate: Text → Visual → Text → Visual
   - Never cluster 3+ visuals without text between

═══════════════════════════════════════════════════════════════════
                    COMPONENT MAPPING
═══════════════════════════════════════════════════════════════════

NUMBERS:
- 2-3 related numbers → StatCardGroup
- Number comparison → ComparisonChart (bar or horizontalBar)
- Percentage breakdown → ComparisonChart (donut)

SEQUENCES:
- Explicit dates → Timeline
- Numbered steps → ProcessFlow
- Generic sequence → ChecklistCard

EMPHASIS:
- Quote → CalloutBox (quote)
- Warning/tip → CalloutBox (warning)
- Key insight → CalloutBox (info)

═══════════════════════════════════════════════════════════════════
                    OUTPUT STRUCTURE
═══════════════════════════════════════════════════════════════════

{
  "theme": {
    "name": "${themeVars.THEME_NAME}",
    "mode": "${themeVars.MODE}",
    "colors": {
      "background": "${themeVars.PAGE_BG}",
      "backgroundGradient": "${themeVars.PAGE_BG_GRADIENT}",
      "primary": "${themeVars.ACCENT_PRIMARY}"
    }
  },
  "layout": [
    {
      "type": "TextSection",
      "props": { "content": "<p>Prose paragraph...</p>" },
      "sourceText": "exact source text"
    },
    {
      "type": "StatCardGroup",
      "props": {
        "stats": [
          { "metric": "92,000", "label": "Complaints", "context": "Last year", "color": "blue" },
          { "metric": "98", "suffix": "%", "label": "Resolved Internally", "color": "amber" }
        ]
      },
      "sourceText": "exact source text"
    }
  ]
}

Return ONLY valid JSON. No markdown code blocks. No text before or after.`;

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

Return a single, complete, valid JSON object.`
          },
        ],
        temperature: 0.4, // Lower for more consistent output
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
      // Try to extract JSON from markdown code blocks first
      const jsonMatch = aiOutput.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      let jsonString = jsonMatch ? jsonMatch[1].trim() : aiOutput.trim();
      
      // Clean up common issues
      jsonString = jsonString
        .replace(/^[^{]*/, '') // Remove anything before first {
        .replace(/[^}]*$/, '') // Remove anything after last }
        .replaceAll(/,\s*}/g, '}') // Remove trailing commas before }
        .replaceAll(/,\s*]/g, ']') // Remove trailing commas before ]
        .replaceAll(/}\s*{/g, '},{') // Fix missing commas between objects
        .replaceAll(/]\s*{/g, '],{') // Fix missing commas after arrays
        .replaceAll(/}\s*"/g, '},"') // Fix missing commas before strings
        .replaceAll(/"\s*{/g, '",{'); // Fix missing commas after strings
      
      console.log('🔧 Attempting to parse cleaned JSON...');
      transformedLayout = JSON.parse(jsonString);
      console.log('✅ JSON parsed successfully');
      
    } catch (parseError: any) {
      console.error('❌ Failed to parse AI response:', parseError.message);
      console.error('📄 Full AI output:', aiOutput.substring(0, 2000));
      
      // Try a more aggressive fix - extract just the layout array
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

    // V4: Post-process to enforce horizontal stat grouping
    console.log('🔧 Post-processing layout for stat grouping...');
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

    console.log('✅ V4 Visual transformation complete:', transformedLayout.layout.length, 'sections');

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
