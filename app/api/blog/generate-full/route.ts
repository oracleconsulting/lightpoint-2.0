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
            content: `You are a research assistant specializing in UK accounting, tax, and HMRC matters. Research and gather comprehensive information about the given topic.

Provide:
- Key statistics and data points (with sources)
- Recent developments and updates
- Common problems and solutions
- Industry best practices
- Relevant regulations and compliance requirements
- Real-world examples and case studies

Return findings as JSON:
{
  "research_summary": "Overview of findings",
  "key_statistics": [{"stat": "...", "value": "...", "source": "..."}],
  "problems": ["problem 1", "problem 2"],
  "solutions": ["solution 1", "solution 2"],
  "processes": [{"name": "...", "steps": ["...", "..."]}],
  "keywords": ["keyword1", "keyword2"],
  "sources": ["source1", "source2"]
}`,
          },
          {
            role: 'user',
            content: `Research this topic thoroughly: ${topic}

Audience: ${audience}
Focus on practical, actionable information.`,
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
            content: `You are an expert content writer specializing in UK accounting, tax, and HMRC matters. Write engaging, informative blog posts that help ${audience}.

Based on the research findings provided, craft a comprehensive, well-structured article.

Tone: ${tone}
Length: ${length === 'short' ? '500-800' : length === 'medium' ? '1200-1800' : '2000-3000'} words

Include:
- Compelling title
- Executive summary/excerpt
- Key statistics from research (with context)
- Step-by-step processes where relevant
- Real-world examples
- Actionable takeaways
- SEO-optimized content

Format as JSON with this structure:
{
  "title": "Compelling title",
  "excerpt": "160-char summary",
  "sections": [
    {"type": "paragraph", "content": "..."},
    {"type": "stat", "label": "Success Rate", "value": 96, "context": "..."},
    {"type": "process", "steps": ["Step 1", "Step 2"]},
    {"type": "data_table", "headers": [], "rows": []},
    {"type": "quote", "text": "...", "source": "..."}
  ],
  "keywords": ["keyword1", "keyword2"],
  "category": "HMRC Updates | Tax Planning | Compliance | etc"
}`,
          },
          {
            role: 'user',
            content: `Write a comprehensive blog post about: ${topic}

**Research Findings:**
${JSON.stringify(researchFindings, null, 2)}

Use this research to write an authoritative, data-driven article.`,
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
            content: `Based on this blog content, create an optimal visual layout using our template components.

**Content:**
${JSON.stringify(parsedContent, null, 2)}

**Template Style:** ${templateStyle}

Generate a layout with:
- Hero section with striking design
- Stat cards for all numerical data
- Charts for data visualization (bar, pie, line, horizontal-bar)
- Callout boxes for key insights
- Numbered steps for processes
- Timelines for chronological events
- Comparison tables for before/after

Return ONLY valid JSON:
{
  "layout": [
    {"type": "hero", "content": {...}, "style": {...}},
    {"type": "stats_grid", "content": {"stats": [...]}, "style": {"columns": 4}},
    {"type": "text", "content": {"html": "..."}, "style": {}},
    {"type": "chart", "content": {"type": "bar", "data": [...], "title": "..."}}
  ],
  "theme": {"primary_color": "#3b82f6"},
  "imagePrompts": [
    "Professional hero image showing...",
    "Infographic illustrating..."
  ]
}`,
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
                content: `Generate a professional, modern blog hero image: ${generatedLayout.imagePrompts[0]}
                
Style: Clean, corporate, suitable for UK accounting/business website
Aspect Ratio: 16:9
Format: High quality, web-optimized
No text overlay.`,
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
                    content: `Generate a professional chart visualization:
                    
Type: ${section.content.type}
Title: ${section.content.title}
Data: ${JSON.stringify(section.content.data)}

Style: Modern, clean, corporate, matching UK business standards
Colors: Professional palette (blues, grays, accent colors)
Format: High quality, web-optimized`,
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

