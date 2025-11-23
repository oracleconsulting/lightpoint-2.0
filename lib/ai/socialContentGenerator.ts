import OpenAI from 'openai';

/**
 * AI Social Content Generator
 * 
 * Transforms blog posts into platform-optimized social media content
 * Supports: Twitter, LinkedIn, Facebook
 * Uses: OpenAI GPT-4 Turbo for high-quality generation
 */

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface BlogPost {
  title: string;
  excerpt: string;
  content: string | any; // TipTap JSON or HTML
  category?: string;
  tags?: string[];
  url: string;
  readTimeMinutes?: number;
}

export interface GenerationOptions {
  platform: 'twitter' | 'linkedin' | 'facebook';
  variants: number; // 1-5
  contentType?: 'announcement' | 'key_quote' | 'detailed_summary' | 'stat_highlight' | 'case_study' | 'evergreen_reshare';
  tone?: 'professional' | 'casual' | 'authoritative';
  includeHashtags?: boolean;
  includeCTA?: boolean;
  customPrompt?: string;
}

export interface GeneratedContent {
  content: string;
  variant: number;
  hashtags: string[];
  estimatedReach?: string;
  characterCount: number;
  aiModel: string;
  tokens: number;
  cost: number;
}

/**
 * Platform-specific guidelines and constraints
 */
const PLATFORM_SPECS = {
  twitter: {
    maxLength: 280,
    optimalLength: 200,
    hashtagCount: 2,
    style: 'Concise, punchy, use line breaks for readability. High-impact hooks.',
    cta: 'Read more 👇',
    audience: 'Tech-savvy professionals, quick scanners',
  },
  linkedin: {
    maxLength: 3000,
    optimalLength: 800,
    hashtagCount: 5,
    style: 'Professional, detailed storytelling. Use emojis sparingly (1-3 max). First 2 lines are critical for engagement.',
    cta: 'Read the full article on our blog →',
    audience: 'Senior professionals, decision-makers, thought leaders',
  },
  facebook: {
    maxLength: 2000,
    optimalLength: 500,
    hashtagCount: 3,
    style: 'Conversational, engaging, ask questions to spark discussion. More personal tone.',
    cta: 'Learn more in our latest blog post',
    audience: 'Broader professional audience, community-focused',
  },
};

/**
 * Extract plain text from TipTap JSON content
 */
function extractTextFromContent(content: any): string {
  if (typeof content === 'string') {
    // Already plain text or HTML
    return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  if (content && typeof content === 'object') {
    // TipTap JSON format
    const extractText = (node: any): string => {
      if (node.type === 'text') return node.text || '';
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((child: any) => extractText(child)).join(' ');
      }
      return '';
    };

    return extractText(content).trim();
  }

  return '';
}

/**
 * Generate social media content using OpenAI GPT-4
 */
export async function generateSocialContent(
  blogPost: BlogPost,
  options: GenerationOptions
): Promise<GeneratedContent[]> {
  const specs = PLATFORM_SPECS[options.platform];
  const contentText = extractTextFromContent(blogPost.content);
  const contentPreview = contentText.substring(0, 2000); // First 2000 chars for context

  // Build the prompt
  const systemPrompt = `You are an expert social media strategist specializing in ${options.platform.toUpperCase()} content for B2B SaaS companies in the UK professional services sector (accounting, tax, compliance).

Your expertise:
- Converting long-form blog content into engaging social posts
- Platform-specific optimization (character limits, hashtags, CTAs)
- Driving click-throughs while providing value upfront
- Understanding UK accounting/tax professional audience

Key principles:
- HOOK: First line must grab attention
- VALUE: Give something useful even without clicking
- SPECIFICITY: Use numbers, examples, concrete benefits
- CLARITY: Avoid jargon unless audience-appropriate
- URGENCY: Create FOMO or timely relevance
- CTA: Clear next step`;

  const userPrompt = `Create ${options.variants} unique, high-performing ${options.platform.toUpperCase()} posts for this blog article.

BLOG DETAILS:
Title: ${blogPost.title}
Excerpt: ${blogPost.excerpt}
Category: ${blogPost.category || 'General'}
Tags: ${blogPost.tags?.join(', ') || 'None'}
Read time: ${blogPost.readTimeMinutes || '5'} minutes
Content preview: ${contentPreview}

PLATFORM: ${options.platform.toUpperCase()}
SPECS:
- Max length: ${specs.maxLength} characters
- Optimal length: ${specs.optimalLength} characters
- Style: ${specs.style}
- Audience: ${specs.audience}
- CTA: ${specs.cta}

CONTENT TYPE: ${options.contentType || 'announcement'}
${options.contentType === 'key_quote' ? '- Extract and highlight the MOST powerful quote or insight' : ''}
${options.contentType === 'stat_highlight' ? '- Focus on the most compelling statistic or data point' : ''}
${options.contentType === 'detailed_summary' ? '- Provide substantial value, tell a story' : ''}
${options.contentType === 'evergreen_reshare' ? '- Frame as "still relevant", "reminder", or "in case you missed"' : ''}

REQUIREMENTS:
1. Each variant must be UNIQUE (different hook, angle, or focus)
2. ${options.includeHashtags !== false ? `Include ${specs.hashtagCount} relevant hashtags (mix broad + niche)` : 'No hashtags'}
3. ${options.includeCTA !== false ? `End with clear CTA: "${specs.cta} [LINK]"` : 'No CTA'}
4. Tone: ${options.tone || 'professional'}
5. Stay under ${specs.maxLength} characters
6. Use emojis strategically (${options.platform === 'linkedin' ? '1-2 max' : '2-4'})

EXAMPLES OF HIGH-PERFORMING ${options.platform.toUpperCase()} POSTS:
${getExamplePosts(options.platform, options.contentType)}

OUTPUT FORMAT:
Return ONLY the ${options.variants} post variants, one per line, with hashtags included inline.
No numbering, no labels, no explanations.
Each post must be complete and ready to publish.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8, // Creative but focused
      max_tokens: 1500,
      presence_penalty: 0.3, // Encourage unique variants
      frequency_penalty: 0.3, // Reduce repetition
    });

    const response = completion.choices[0]?.message?.content || '';
    const tokens = completion.usage?.total_tokens || 0;
    const cost = calculateCost(tokens, 'gpt-4-turbo-preview');

    // Parse response into variants
    const variants = response
      .split('\n')
      .filter((line: string) => line.trim().length > 50) // Filter out empty lines or short text
      .slice(0, options.variants)
      .map((content: string, index: number) => {
        // Extract hashtags
        const hashtagMatches = content.match(/#\w+/g) || [];
        const hashtags = hashtagMatches.map((tag: string) => tag.substring(1)); // Remove #

        return {
          content: content.trim(),
          variant: index + 1,
          hashtags,
          characterCount: content.length,
          aiModel: 'gpt-4-turbo-preview',
          tokens: Math.ceil(tokens / options.variants), // Estimate per variant
          cost: cost / options.variants,
        };
      });

    return variants;

  } catch (error: any) {
    console.error('Error generating social content:', error);
    throw new Error(`Failed to generate social content: ${error?.message || 'Unknown error'}`);
  }
}

/**
 * Calculate OpenAI API cost
 * GPT-4 Turbo: $0.01/1K input tokens, $0.03/1K output tokens
 */
function calculateCost(tokens: number, model: string): number {
  const rates: Record<string, number> = {
    'gpt-4-turbo-preview': 0.02, // Average of input/output
    'gpt-4': 0.045,
    'gpt-3.5-turbo': 0.002,
  };

  const rate = rates[model] || 0.02;
  return (tokens / 1000) * rate;
}

/**
 * Platform-specific example posts for context
 */
function getExamplePosts(platform: string, contentType?: string): string {
  const examples: Record<string, Record<string, string>> = {
    twitter: {
      announcement: `🚨 96%+ success rate in HMRC complaints isn't magic—it's data.

Our AI analyzes 10,000+ precedents to build bulletproof cases in minutes.

See how it works 👇 [LINK]

#HMRCCompliance #TaxTech`,

      key_quote: `"78% of rejected HMRC complaints could have succeeded with better precedent citations."

This is exactly why we built Lightpoint's AI complaint engine.

Learn more: [LINK] #HMRC #TaxAdvice`,

      stat_highlight: `⚡ From 8-12 hours → 90 minutes

That's how much time our AI saves on HMRC complaints.

Same quality. 6x faster.

Here's the exact process: [LINK] #Automation`,
    },

    linkedin: {
      announcement: `After reviewing 10,000+ HMRC complaints, we discovered something surprising:

78% of rejected complaints could have succeeded with better precedent citations.

Most accountants don't have time to research every case law precedent. They're billing clients, managing deadlines, putting out fires.

That's why we built Lightpoint—an AI that knows every successful complaint strategy from the past decade.

It doesn't just draft letters. It:
✅ Analyzes your specific case
✅ Finds the most relevant precedents
✅ Scores your likelihood of success
✅ Generates a bulletproof complaint in 5 minutes

The result? 96%+ success rate for our users.

Read the full case study on our blog: [LINK]

#HMRCCompliance #TaxTechnology #ProfessionalServices #AI #Accounting`,

      detailed_summary: `Handling HMRC complaints used to take our team 8-12 hours per case.

Research. Drafting. Finding precedents. Checking regulations. It was exhausting.

Then we automated it with AI.

Now? 90 minutes. Same quality, 6x faster.

Here's what changed:

1️⃣ RESEARCH (was 4 hrs → now 10 mins)
AI scans 10,000+ historical complaints instantly

2️⃣ PRECEDENT MATCHING (was 3 hrs → now 5 mins)
AI finds the exact case law that supports your position

3️⃣ DRAFTING (was 2 hrs → now 30 mins)
AI generates professional, precedent-backed letters

4️⃣ QUALITY CHECK (was 1 hr → still 45 mins)
Human review ensures accuracy (this can't be rushed)

The kicker? Our success rate actually INCREASED from 82% to 96%+.

Why? Because the AI never misses a relevant precedent.

Full breakdown in our latest article: [LINK]

#HMRC #TaxCompliance #AIinAccounting #Productivity`,
    },

    facebook: {
      announcement: `Ever feel like HMRC complaints are a black box? 🤔

You submit, wait weeks, and hope for the best...

There's a better way.

Our AI analyzes your case against 10,000+ historical complaints and tells you:

✅ Your chances of success
✅ Which precedents to cite
✅ Exactly what to write

Accountants using Lightpoint are seeing 96%+ success rates.

Want to see it in action? Read our latest post: [LINK]

#HMRC #TaxAdvice #Accounting`,
    },
  };

  const platformExamples = examples[platform];
  if (!platformExamples) return '';

  if (contentType && platformExamples[contentType]) {
    return platformExamples[contentType];
  }

  // Return all examples for this platform
  return Object.values(platformExamples).join('\n\n---\n\n');
}

/**
 * Batch generate content for multiple platforms
 */
export async function generateMultiPlatformContent(
  blogPost: BlogPost,
  platforms: ('twitter' | 'linkedin' | 'facebook')[],
  variantsPerPlatform: number = 3
): Promise<Record<string, GeneratedContent[]>> {
  const results: Record<string, GeneratedContent[]> = {};

  for (const platform of platforms) {
    try {
      const content = await generateSocialContent(blogPost, {
        platform,
        variants: variantsPerPlatform,
        contentType: 'announcement',
        tone: 'professional',
        includeHashtags: true,
        includeCTA: true,
      });

      results[platform] = content;

      // Rate limiting: wait 1 second between API calls
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Failed to generate content for ${platform}:`, error);
      results[platform] = [];
    }
  }

  return results;
}

