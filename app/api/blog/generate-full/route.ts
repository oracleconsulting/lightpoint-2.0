/**
 * ONE-CLICK BLOG GENERATOR
 * Full Gamma-style blog generation from a simple topic/prompt
 * Uses multiple AI models:
 * - ChatGPT 5.1 Deep Search: Research & data gathering
 * - Claude Opus 4.1: Expert writing, layout generation & SEO
 * - Gemini 3 Pro: Hero images, charts & visual generation
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for full generation

interface GenerationRequest {
  topic: string;
  audience?: string;
  tone?: 'professional' | 'casual' | 'technical' | 'storytelling';
  length?: 'short' | 'medium' | 'long';
  includeCharts?: boolean;
  includeImages?: boolean;
  templateStyle?: 'data-story' | 'guide' | 'case-study' | 'classic';
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  
  try {
    const {
      topic,
      audience = 'UK accountants and tax professionals',
      tone = 'professional',
      length = 'medium',
      includeCharts = true,
      includeImages = true,
      templateStyle = 'data-story',
    }: GenerationRequest = await req.json();

    if (!topic) {
      return NextResponse.json(
        { success: false, error: 'Topic is required' },
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

    console.log(`🚀 Starting one-click blog generation for topic: ${topic}`);

    // ============================================
    // STEP 1: Research with ChatGPT 5.1 Deep Search
    // ============================================
    console.log('🔍 Step 1: Researching topic with ChatGPT 5.1 Deep Search...');
    
    const researchResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://lightpoint.uk',
      },
      body: JSON.stringify({
        model: 'openai/chatgpt-5.1',
        messages: [
          {
            role: 'system',
            content: `You are a data journalist finding VISUAL STORIES in UK accounting, tax, and HMRC matters.

Extract content specifically for VISUAL PRESENTATION. Every data point must be visual-ready.

CRITICAL: Structure your findings for Gamma-style visual components.

Extract in this EXACT format:

HERO_HOOK (for opening impact):
- One shocking statistic (must include £, %, or large number)
- The "villain" (what's causing the problem/pain)
- The transformation promise (what readers will achieve)

VISUAL_ELEMENTS:

1. STAT_CARDS (minimum 8, maximum 12):
   Each stat must be: {metric: "92,000", label: "Failed Claims", context: "98% preventable", trend: "up/down/neutral", visual_impact: "high/medium"}
   Look for: percentages, money amounts, time savings, success rates, volume numbers

2. PROCESS_FLOWS (minimum 2):
   Format: {title: "Process Name", steps: [{number: 1, title: "Step", description: "Action", duration: "Day 1"}], outcome: "Result"}
   Look for: step-by-step procedures, workflows, complaint processes, regulatory sequences

3. COMPARISONS (minimum 2):
   Format: {title: "Comparison", before: {label: "Old Way", metric: "£5,000", pain: "Manual"}, after: {label: "New Way", metric: "£500", gain: "Automated"}, improvement: "90%"}
   Look for: before/after, old vs new, with vs without, internal vs external

4. TIMELINES (if applicable):
   Format: {title: "Journey", events: [{date: "May 2024", title: "Milestone", description: "What happened", status: "completed/pending"}]}
   Look for: regulatory changes, historical developments, typical journeys, deadlines

5. CALLOUT_QUOTES (3-5):
   Format: {quote: "Exact quote", source: "Authority name", context: "Why it matters", type: "expert/warning/insight"}

6. CHART_DATA:
   - Pie/Donut charts: {title: "", data: [{label: "", value: 0, percentage: 0}]}
   - Bar charts: {title: "", data: [{name: "", value: 0}], insight: ""}
   - Line charts: {title: "", data: [{period: "", value: 0}], trend: ""}

Return as structured JSON ready for component generation.`,
          },
          {
            role: 'user',
            content: `Research "${topic}" for ${audience}.

Focus on finding VISUAL STORY elements:
- Statistics that will shock or surprise (with %, £, time)
- Step-by-step processes that can become flowcharts
- Before/after transformations
- Timeline events or regulatory milestones
- Expert quotes and insights
- Data suitable for charts (breakdowns, comparisons, trends)

Extract practical, actionable information formatted for visual presentation.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
      }),
    });

    if (!researchResponse.ok) {
      throw new Error(`Research failed: ${researchResponse.statusText}`);
    }

    const researchData = await researchResponse.json();
    const researchRaw = researchData.choices[0].message.content;
    
    // Parse research JSON
    let researchFindings;
    try {
      const jsonMatch = researchRaw.match(/```json\n([\s\S]*?)\n```/);
      researchFindings = JSON.parse(jsonMatch ? jsonMatch[1] : researchRaw);
    } catch {
      researchFindings = { research_summary: researchRaw, key_statistics: [], problems: [], solutions: [] };
    }

    console.log('✅ Research complete:', researchFindings.key_statistics?.length || 0, 'statistics found');

    // ============================================
    // STEP 2: Generate Content with Claude Opus 4.1 (Expert Writing)
    // ============================================
    console.log('📝 Step 2: Writing content with Claude Opus 4.1...');
    
    const contentResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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
            content: `You are creating a Gamma-style VISUAL PRESENTATION blog post for ${audience}.

CRITICAL WRITING RULES:
1. Maximum 150 words between [VISUAL] markers
2. Each paragraph must introduce and support its visual component
3. Write "visual hooks" - sentences that lead into charts/stats/diagrams
4. Use second person ("you"), active voice
5. UK spelling and terminology throughout
6. Bold key phrases (1-2 per paragraph)
7. Every section builds to its visual payoff

EXACT STRUCTURE TO FOLLOW:

[HERO SECTION]
# [Number-driven headline using research stat]
**[One powerful sentence creating urgency]**
[Brief value promise - what reader achieves]
[VISUAL: hero_gradient with stat overlay]

[PROBLEM SECTION - 100 words max]
Last year, [shocking statistic from research]. That's roughly [relatable comparison].

The numbers don't lie: [context about scope]

[VISUAL: stat_card_grid - 3-4 key metrics]

[CONTEXT SECTION - 150 words max]
If you're [audience role] dealing with [problem], you already know the pattern.

[Explain why this matters, set up the story]

[VISUAL: pie_chart OR bar_chart showing breakdown]

[CORE INSIGHT SECTION - 200 words max]
The research reveals [main revelation].

[Deep dive into key finding with specifics]

[Transition: "Here's how it actually works..."]

[VISUAL: process_flow OR timeline showing sequence]

[SOLUTION SECTION - 200 words max]
There's a better way. [Introduce solution approach]

[Explain the transformation]

[Set up action steps]

[VISUAL: numbered_checklist with action items]

[EVIDENCE SECTION - 150 words max]
Consider [case study or example].

[Show concrete results]

[VISUAL: before_after_comparison with metrics]

[KEY INSIGHT CALLOUT - 50 words]
[Expert quote or critical insight]

[VISUAL: callout_box with quote]

[ACTION SECTION - 150 words max]
Start with these specific steps:

[Brief intro to checklist]

[VISUAL: checklist_card with numbered actions]

[CLOSING SECTION - 100 words max]
[Reinforce the transformation from problem to solution]

[Final motivational statement]

[VISUAL: final_stat_card showing key outcome]

OUTPUT REQUIREMENTS:
- Mark each [VISUAL] with exact component type and required data
- Never exceed 150 words between visuals
- Include specific numbers from research in every section
- Write transitions that lead into visual elements
- Bold 1-2 key phrases per paragraph`,
          },
          {
            role: 'user',
            content: `Write a Gamma-style visual blog post about: ${topic}

**Research Data:**
${JSON.stringify(researchFindings, null, 2)}

Use this research to create a visually-driven, component-based article.

Remember:
- Maximum 150 words between visual breaks
- Every statistic becomes a visual component
- Write TO the visuals, not just with them
- Lead with numbers and impact
- UK business tone throughout`,
          },
        ],
        temperature: 0.8, // Higher for creativity
        max_tokens: 4000,
      }),
    });

    if (!contentResponse.ok) {
      throw new Error(`Content generation failed: ${contentResponse.statusText}`);
    }

    const contentData = await contentResponse.json();
    const contentRaw = contentData.choices[0].message.content;
    
    // Parse content JSON
    let parsedContent;
    try {
      const jsonMatch = contentRaw.match(/```json\n([\s\S]*?)\n```/);
      parsedContent = JSON.parse(jsonMatch ? jsonMatch[1] : contentRaw);
    } catch {
      parsedContent = { title: topic, excerpt: '', sections: [{ type: 'paragraph', content: contentRaw }] };
    }

    console.log('✅ Content generated:', parsedContent.title);

    // ============================================
    // STEP 3: Generate Visual Layout with Claude Opus 4.1
    // ============================================
    console.log('🎨 Step 3: Generating visual layout with Claude Opus 4.1...');
    
    const layoutResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4.1',
        messages: [
          {
            role: 'user',
            content: `Transform this blog content into Gamma-style visual component specification.

**Content:**
${JSON.stringify(parsedContent, null, 2)}

**Template Style:** ${templateStyle}

You must create SPECIFIC, IMPLEMENTABLE components using this exact schema:

COMPONENT LIBRARY (use precise specifications):

1. StatCard:
{
  "type": "StatCard",
  "props": {
    "metric": "92,000",  // Large number, formatted
    "label": "Annual Complaints",  // What it represents
    "context": "98% resolved internally",  // Additional insight
    "trend": "up|down|neutral",  // Optional trend
    "color": "blue|cyan|purple|green",  // Theme color
    "icon": "users|chart|alert|check|pound"  // Icon type
  }
}

2. ProcessFlow:
{
  "type": "ProcessFlow",
  "props": {
    "title": "Complaint Resolution Path",
    "steps": [
      {
        "number": 1,
        "title": "Initial Complaint",
        "description": "Submit formal complaint to HMRC",
        "duration": "Day 1"
      }
    ],
    "style": "horizontal|vertical|snake",
    "showConnectors": true
  }
}

3. ComparisonChart:
{
  "type": "ComparisonChart",
  "props": {
    "title": "Resolution Rates",
    "data": [
      {"label": "Internal", "value": 98, "color": "blue"},
      {"label": "Escalated", "value": 2, "color": "cyan"}
    ],
    "chartType": "donut|bar|horizontal-bar|pie",
    "showPercentages": true
  }
}

4. Timeline:
{
  "type": "Timeline",
  "props": {
    "title": "Your Complaint Journey",
    "events": [
      {
        "date": "May 2024",
        "title": "VAT Registration",
        "description": "Online submission completed",
        "status": "completed|pending|failed"
      }
    ],
    "orientation": "vertical|horizontal"
  }
}

5. CalloutBox:
{
  "type": "CalloutBox",
  "props": {
    "variant": "info|warning|success|quote",
    "title": "Key Insight",
    "content": "Text content here",
    "icon": "lightbulb|alert|check|quote",
    "borderGlow": true
  }
}

6. ChecklistCard:
{
  "type": "ChecklistCard",
  "props": {
    "title": "Action Steps",
    "items": [
      {
        "number": 1,
        "title": "Document Everything",
        "description": "Track all hours and communications"
      }
    ],
    "style": "numbered|checkbox|icon"
  }
}

7. HeroGradient:
{
  "type": "HeroGradient",
  "props": {
    "headline": "Number-driven headline",
    "subheadline": "Supporting hook",
    "statOverlay": {"metric": "£92,000", "label": "At Risk"},
    "ctaText": "Learn How"
  }
}

LAYOUT RULES (STRICT):
1. First section MUST be HeroGradient with key stat
2. Every 150 words of text MUST have a visual component
3. Group 2-4 related StatCards into grids
4. Alternate between data (stats/charts) and process (flows/timelines) components
5. Use CalloutBoxes for quotes and critical insights
6. End sections with ChecklistCard for clear actions
7. Maximum 3 text-only paragraphs in entire post

GENERATE THIS EXACT STRUCTURE:
{
  "theme": {
    "mode": "dark",
    "backgroundGradient": "from-[#1a1a2e] to-[#0f0f1e]",
    "colors": {
      "primary": "#4F86F9",
      "secondary": "#00D4FF",
      "success": "#00FF88",
      "warning": "#FFB800"
    },
    "effects": {
      "glow": true,
      "glassmorphism": true,
      "animations": "subtle"
    }
  },
  "layout": [
    {
      "id": "hero",
      "type": "HeroGradient",
      "props": { /* complete props */ }
    },
    {
      "id": "problem-stats",
      "layoutType": "grid",
      "columns": 3,
      "components": [
        { /* 3 StatCards with complete props */ }
      ]
    },
    {
      "id": "context-text",
      "type": "text",
      "content": "Max 150 words",
      "style": "single-column"
    },
    {
      "id": "data-visualization",
      "type": "ComparisonChart",
      "props": { /* complete props */ }
    },
    {
      "id": "process-section",
      "type": "ProcessFlow",
      "props": { /* complete props */ }
    }
  ],
  "imagePrompts": [
    "Professional abstract tech background for hero with dark gradients and neon accents"
  ]
}

Remember: This must be DIRECTLY implementable. Every component needs complete, valid props. No placeholders or "...".`,
          },
        ],
        temperature: 0.5,
        max_tokens: 6000,
      }),
    });

    if (!layoutResponse.ok) {
      throw new Error(`Layout generation failed: ${layoutResponse.statusText}`);
    }

    const layoutData = await layoutResponse.json();
    const layoutRaw = layoutData.choices[0].message.content;
    
    let generatedLayout;
    try {
      const jsonMatch = layoutRaw.match(/```json\n([\s\S]*?)\n```/);
      generatedLayout = JSON.parse(jsonMatch ? jsonMatch[1] : layoutRaw);
    } catch {
      generatedLayout = { layout: [], theme: {}, imagePrompts: [] };
    }

    console.log('✅ Layout generated with', generatedLayout.layout.length, 'sections');

    // ============================================
    // STEP 4: Generate Hero Image & Charts with Gemini 3 Pro
    // ============================================
    let heroImageUrl = null;
    
    if (includeImages && generatedLayout.imagePrompts?.[0]) {
      console.log('🖼️  Step 4: Generating hero image with Gemini 3 Pro...');
      
      try {
        const imageResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openrouterApiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://lightpoint.uk',
          },
          body: JSON.stringify({
            model: 'google/gemini-3-pro-image-preview',
            messages: [
              {
                role: 'user',
                content: `Generate a Gamma-style hero visual for: ${generatedLayout.imagePrompts[0]}

STYLE REQUIREMENTS:
Background: Dark gradient (#1a1a2e → #0f0f1e)
Accent Colors: Neon cyan (#00D4FF) and blue (#4F86F9)
Visual Style: Abstract, tech-forward, modern
Elements: Subtle geometric shapes, light rays, particles
Typography: NO text overlay (will be added separately)
Mood: Professional, innovative, trustworthy

Technical Specs:
- Aspect Ratio: 16:9 (1920x1080 optimal)
- Format: Web-optimized PNG or WebP
- Effects: Subtle glow, glass morphism elements
- Composition: Asymmetric, with negative space for text overlay
- Suitable for UK business/accounting audience

Create a striking background that makes users stop scrolling.`,
              },
            ],
            max_tokens: 1000,
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          // Gemini returns image data or URL in the response
          heroImageUrl = imageData.choices[0].message.content?.image_url || imageData.choices[0].message.content;
          console.log('✅ Hero image generated');
        } else {
          console.warn('⚠️  Image generation failed, continuing without image');
        }
      } catch (error) {
        console.error('Error generating image:', error);
        // Continue without image
      }
    }

    // Generate charts for visual sections
    if (includeCharts && generatedLayout.layout) {
      console.log('📊 Generating charts with Gemini 3 Pro...');
      
      for (const section of generatedLayout.layout) {
        if (section.type === 'chart' && section.content?.data) {
          try {
            const chartResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${openrouterApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'google/gemini-3-pro-image-preview',
                messages: [
                  {
                    role: 'user',
                    content: `Generate a Gamma-style chart visualization component:

COMPONENT TYPE: ${section.content.type}
TITLE: ${section.content.title}
DATA: ${JSON.stringify(section.content.data)}

GAMMA STYLE REQUIREMENTS:
Background: Dark (#1a1a2e) with subtle gradient
Chart Colors: 
  - Primary: Cyan (#00D4FF)
  - Secondary: Blue (#4F86F9)
  - Accent: Purple (#8B5CF6)
  - Success: Green (#00FF88)
Typography: 
  - Title: Bold, white, 24px
  - Labels: Thin, gray-400, 14px
  - Values: Bold, gradient text
Effects:
  - Subtle glow on bars/segments
  - Glass morphism background
  - Smooth gradients on chart elements
  - Drop shadows for depth
Layout:
  - Clean, minimal gridlines
  - Ample whitespace
  - Modern, tech-forward aesthetic

Technical Specs:
- Format: PNG or SVG
- Size: 800x500px
- Style: Professional UK business
- Readable at all screen sizes

Create a chart that looks like it's from a premium presentation tool.`,
                  },
                ],
                max_tokens: 1000,
              }),
            });

            if (chartResponse.ok) {
              const chartData = await chartResponse.json();
              section.content.generated_image = chartData.choices[0].message.content?.image_url || chartData.choices[0].message.content;
              console.log(`✅ Chart generated for: ${section.content.title}`);
            }
          } catch (error) {
            console.error('Error generating chart:', error);
            // Continue without chart image
          }
        }
      }
    }

    console.log('✅ Image and chart generation complete');

    // ============================================
    // STEP 5: Generate SEO Metadata
    // ============================================
    console.log('🔍 Step 5: Generating SEO metadata...');
    
    const seoResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4.1',
        messages: [
          {
            role: 'user',
            content: `Generate SEO metadata for this blog post:

Title: ${parsedContent.title}
Excerpt: ${parsedContent.excerpt}

Return JSON:
{
  "metaTitle": "SEO title (60 chars max)",
  "metaDescription": "Meta description (155 chars max)",
  "tags": ["tag1", "tag2", "tag3"],
  "slug": "url-friendly-slug"
}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    const seoData = await seoResponse.json();
    const seoRaw = seoData.choices[0].message.content;
    
    let seoMetadata;
    try {
      const jsonMatch = seoRaw.match(/```json\n([\s\S]*?)\n```/);
      seoMetadata = JSON.parse(jsonMatch ? jsonMatch[1] : seoRaw);
    } catch {
      seoMetadata = {
        metaTitle: parsedContent.title.substring(0, 60),
        metaDescription: parsedContent.excerpt.substring(0, 155),
        tags: [],
        slug: parsedContent.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      };
    }

    console.log('✅ SEO metadata generated');

    // ============================================
    // FINAL RESULT
    // ============================================
    const generationTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: true,
      blogPost: {
        title: parsedContent.title,
        slug: seoMetadata.slug,
        excerpt: parsedContent.excerpt,
        content: parsedContent, // Structured content
        layout: generatedLayout.layout,
        theme: generatedLayout.theme,
        featuredImage: heroImageUrl,
        category: parsedContent.category || 'General',
        tags: seoMetadata.tags,
        seoTitle: seoMetadata.metaTitle,
        seoDescription: seoMetadata.metaDescription,
        layoutType: 'ai_generated',
      },
      metadata: {
        generationTime: `${(generationTime / 1000).toFixed(2)}s`,
        modelsUsed: ['gpt-4o', 'claude-3.5-sonnet', heroImageUrl ? 'flux-pro' : null].filter(Boolean),
        sectionsGenerated: generatedLayout.layout.length,
        imagesGenerated: heroImageUrl ? 1 : 0,
      },
    });

  } catch (error: any) {
    console.error('❌ Error in one-click blog generation:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

