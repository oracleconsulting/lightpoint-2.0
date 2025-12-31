/**
 * AI-Powered Layout Generator API Route
 * Uses Claude via OpenRouter to intelligently select visual components for blog content
 * Uses NanoBanana (Gemini 3 Pro) for image generation
 * Produces Gamma-quality layouts with stats, comparisons, images, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateContextualImage } from '@/lib/blog/imageGeneration';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const LAYOUT_MODEL = 'anthropic/claude-sonnet-4.5'; // Use Sonnet for layout (cheaper, still excellent)

const COMPONENT_SCHEMA = `
Available component types and their props:

1. hero - { title: string, subtitle: string, backgroundImage?: string }

2. sectionHeading - { title: string, subtitle?: string }

3. paragraph - { text: string }

4. stats - { stats: Array<{ value: string, label: string, description?: string }> }
   Use for ANY numbers/statistics found in prose. Extract and highlight them.
   Example: "£6,174" becomes { stats: [{ value: "£6,174", label: "Professional costs", description: "paid through Adjudicator" }] }

5. threeColumnCards - { cards: Array<{ icon?: string, title: string, description: string }> }
   Icons: 🎯 📋 ⚖️ 💡 ✅ ❌ 📊 🔍 📈 💰 ⏱️ 📞 📧 📄 🏆 ⚠️ 💼 🔒

6. comparisonCards - { leftCard: { title, items: string[], variant }, rightCard: { title, items: string[], variant } }
   Variants: 'positive', 'negative', 'neutral'
   Use for ANY comparison: do/don't, claimable/not claimable, before/after, good/bad

7. bulletList - { title?: string, items: string[], variant?: 'check' | 'bullet' | 'number' }

8. numberedSteps - { steps: Array<{ number: number, title: string, description: string }> }
   Use for sequential processes or how-to instructions.

9. timeline - { events: Array<{ date: string, title: string, description: string }> }
   Use for chronological events or case study progressions.

10. callout - { type: 'info' | 'warning' | 'success' | 'tip', title?: string, content: string }
    Use for tips, warnings, important notes, or key takeaways.

11. quote - { text: string, author?: string, source?: string }
    Use for important quotes, especially from documents or officials.

12. donutChart - { segments: Array<{ label: string, value: number, color?: string }>, centerLabel?: string }
    Use when showing proportions or percentages.

13. textWithImage - { text: string, imagePrompt: string, imagePosition: 'left' | 'right' }
    imagePrompt should describe the ideal image for this section (will be generated with AI).

14. cta - { title: string, description: string, primaryButton: { text: string, href: string }, secondaryButton?: { text: string, href: string } }
    Use at the end for calls to action.
`;

const SYSTEM_PROMPT = `You are an expert visual content designer transforming blog posts into magazine-quality layouts.

${COMPONENT_SCHEMA}

## Design Rules (MUST FOLLOW)

1. **NEVER have more than 2 paragraphs in a row** - always break up text with visual components.

2. **ALWAYS extract statistics into stats components**:
   - Any £ amount, percentage, or significant number in prose → stats component
   - Multiple nearby stats → combine into one stats component with 2-3 items
   - "HMRC paid £6,174" → { value: "£6,174", label: "Paid by HMRC" }

3. **ALWAYS use comparisonCards for comparisons**:
   - Claimable/Not claimable → comparisonCards
   - Do/Don't → comparisonCards  
   - Before/After → comparisonCards
   - Good/Bad → comparisonCards

4. **Use threeColumnCards for 3 related items** with title + description structure.

5. **Use textWithImage at least twice** per article for visual interest. The imagePrompt should describe a professional, conceptual image.

6. **Use callout for key tips or warnings** - look for "important", "note", "tip", or key advice.

7. **Keep formal letters/templates as paragraphs** - don't convert to lists.

8. **End with cta component** pointing to waitlist/pricing.

9. **Start with hero component** using the title and a compelling subtitle.

## Output Format

Return ONLY a JSON object (no markdown code blocks):
{
  "theme": {
    "primaryColor": "#1e3a5f",
    "secondaryColor": "#f8fafc", 
    "accentColor": "#f59e0b"
  },
  "components": [
    { "type": "...", "props": { ... } },
    ...
  ]
}`;

interface AILayoutRequest {
  title: string;
  subtitle?: string;
  content: string;
  authorName?: string;
  category?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AILayoutRequest = await request.json();
    const { title, subtitle, content, authorName, category } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    const userPrompt = `Transform this blog post into a visually rich, engaging layout.

TITLE: ${title}
${subtitle ? `SUBTITLE: ${subtitle}` : ''}
${category ? `CATEGORY: ${category}` : ''}
${authorName ? `AUTHOR: ${authorName}` : ''}

CONTENT:
${content}

Remember:
- Extract ALL statistics into stats components
- Use comparisonCards for any comparison content
- Include textWithImage components for visual variety
- Never have more than 2 paragraphs in a row
- Start with a hero component
- End with a cta component

Return ONLY the JSON object, no code blocks.`;

    // Call OpenRouter with Claude Sonnet
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lightpoint.uk',
        'X-Title': 'Lightpoint Blog AI Layout Generator',
      },
      body: JSON.stringify({
        model: LAYOUT_MODEL,
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[AI Layout] OpenRouter error:', errorData);
      return NextResponse.json(
        { success: false, error: `OpenRouter API error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    // Parse JSON (handle potential markdown code blocks)
    let jsonStr = responseText;
    if (responseText.includes('```json')) {
      jsonStr = responseText.split('```json')[1].split('```')[0];
    } else if (responseText.includes('```')) {
      jsonStr = responseText.split('```')[1].split('```')[0];
    }

    let layout;
    try {
      layout = JSON.parse(jsonStr.trim());
    } catch (parseError: any) {
      console.error('[AI Layout] JSON parse error:', parseError.message);
      console.error('[AI Layout] Raw response:', responseText.substring(0, 500));
      return NextResponse.json(
        { success: false, error: 'AI returned invalid JSON', details: parseError.message },
        { status: 500 }
      );
    }

    // Validate structure
    if (!layout.components || !Array.isArray(layout.components)) {
      return NextResponse.json(
        { success: false, error: 'Invalid layout structure: missing components array' },
        { status: 500 }
      );
    }

    // Enhance with NanoBanana-generated images
    const enhancedLayout = await enhanceWithNanoBananaImages(layout, title);

    return NextResponse.json({
      success: true,
      layout: enhancedLayout,
      stats: {
        componentCount: enhancedLayout.components.length,
        componentTypes: [...new Set(enhancedLayout.components.map((c: any) => c.type))],
      },
    });

  } catch (error: any) {
    console.error('[AI Layout] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Enhance layout with NanoBanana-generated images
 */
async function enhanceWithNanoBananaImages(layout: any, articleTitle: string): Promise<any> {
  const enhancedComponents = await Promise.all(
    layout.components.map(async (component: any) => {
      // Handle textWithImage components
      if (component.type === 'textWithImage' && component.props?.imagePrompt) {
        try {
          const result = await generateContextualImage({
            articleTitle,
            sectionHeading: component.props.imagePrompt,
            sectionContent: component.props.text,
            style: 'professional',
            aspectRatio: '16:9',
          });

          if (result.success && (result.imageUrl || result.base64)) {
            component.props.image = {
              url: result.imageUrl || result.base64,
              alt: component.props.imagePrompt,
            };
          } else {
            // Fallback to placeholder
            component.props.image = {
              url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
              alt: component.props.imagePrompt,
            };
          }
          delete component.props.imagePrompt;
        } catch (e) {
          console.error('[AI Layout] NanoBanana error:', e);
          component.props.image = {
            url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800',
            alt: 'Professional business image',
          };
          delete component.props.imagePrompt;
        }
      }

      // Handle hero background images
      if (component.type === 'hero' && !component.props?.backgroundImage) {
        try {
          const result = await generateContextualImage({
            articleTitle,
            sectionHeading: 'Hero banner for ' + articleTitle,
            style: 'abstract',
            aspectRatio: '16:9',
          });

          if (result.success && (result.imageUrl || result.base64)) {
            component.props.backgroundImage = result.imageUrl || result.base64;
          }
        } catch (e) {
          // Hero image is optional, no fallback needed
        }
      }

      return component;
    })
  );

  return {
    ...layout,
    components: enhancedComponents,
  };
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    version: 'ai',
    description: 'AI-powered layout generator using Claude via OpenRouter + NanoBanana images',
    hasApiKey: !!process.env.OPENROUTER_API_KEY,
  });
}
