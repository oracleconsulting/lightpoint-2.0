/**
 * Visual Transformation API V3
 * Takes existing blog content and transforms it into a Gamma-style visual layout
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for complex transformations

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

    // Call Claude 3.5 Sonnet for visual transformation (faster than Opus)
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
            content: `You are a visual designer creating Gamma-style blog layouts. Transform content into stunning dark-themed presentations.

CRITICAL RULES:
1. DARK THEME ONLY: Background #0a0a1a to #1a1a2e. NO light/purple/lavender backgrounds.
2. NEVER INVENT CONTENT: Only extract data explicitly in the source text.
3. GROUP RELATED STATS: 2-3 related numbers → StatCardGroup (horizontal). NEVER stack individual StatCards vertically.
4. UK ENGLISH: standardised, optimise, colour. Replace em-dashes (—) with dashes (-).
5. CURRENCY: "£5,000" → metric: "5,000", prefix: "£". NEVER output "££".
6. MAX 150 WORDS between visuals. Alternate TextSection and visual components.
7. Every component MUST include "sourceText" field with the exact source snippet.

COMPONENTS:
- TextSection: {content: "HTML"} - Prose paragraphs (preserve exact wording)
- StatCardGroup: {stats: [{metric, label, context?, prefix?, suffix?, color}]} - 2-3 horizontal stats
- StatCard: Single stat only when isolated (use StatCardGroup for 2+ related stats)
- ComparisonChart: {title, type: "bar"|"horizontalBar"|"donut", data: [{label, value}]}
- ProcessFlow: {steps: [{number, title, description}]} - ONLY if explicit numbered steps exist
- Timeline: {events: [{date, title, description}]} - ONLY if explicit dates exist
- CalloutBox: {variant: "quote"|"warning"|"info", text}
- ChecklistCard: {title, items: [{number, title, description}]}

COLORS: blue (general), cyan (secondary), green (positive), amber (warning), red (negative), purple (special)

Return ONLY valid JSON, no markdown code blocks.`
          },
          {
            role: 'user',
            content: `Transform this blog post into a visual layout. Return ONLY a valid JSON object.

TITLE: ${title}
${excerpt ? `EXCERPT: ${excerpt}` : ''}

CONTENT:
${content}

IMPORTANT: Return a single, complete, valid JSON object. Do not include any text before or after the JSON.

Example structure:
{"theme":{"mode":"dark","colors":{"background":"#0a0a1a","primary":"#4F86F9"}},"layout":[{"type":"TextSection","props":{"content":"<p>Text here</p>"},"sourceText":"source"},{"type":"StatCardGroup","props":{"stats":[{"metric":"92000","label":"Complaints","color":"blue"}]},"sourceText":"source"}]}`
          },
        ],
        temperature: 0.5,
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
        .replace(/,\s*}/g, '}') // Remove trailing commas before }
        .replace(/,\s*]/g, ']') // Remove trailing commas before ]
        .replace(/}\s*{/g, '},{') // Fix missing commas between objects
        .replace(/]\s*{/g, '],{') // Fix missing commas after arrays
        .replace(/}\s*"/g, '},"') // Fix missing commas before strings
        .replace(/"\s*{/g, '",{'); // Fix missing commas after strings
      
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
            theme: { mode: 'dark', colors: { background: '#0a0a1a', primary: '#4F86F9', secondary: '#00D4FF' } },
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
