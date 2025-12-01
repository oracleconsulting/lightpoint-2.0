/**
 * NanoBanana Image Generation Service
 * 
 * Uses Google's Gemini 3 Pro (NanoBanana Pro) via OpenRouter
 * for generating contextual blog images.
 * 
 * Model: google/gemini-3-pro-image-preview
 * 
 * API Docs: https://openrouter.ai/docs/features/multimodal/image-generation
 */

import { logger } from '../logger';

const IMAGE_MODEL = 'google/gemini-3-pro-image-preview';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  base64?: string;
  error?: string;
}

interface ImagePromptContext {
  articleTitle: string;
  sectionHeading?: string;
  sectionContent?: string;
  style?: 'professional' | 'infographic' | 'abstract' | 'diagram';
  aspectRatio?: '16:9' | '4:3' | '1:1' | '3:4';
}

// OpenRouter image response structure
interface OpenRouterImageMessage {
  role: string;
  content?: string;
  images?: Array<{
    image_url: {
      url: string; // base64 data URL
    };
  }>;
}

interface OpenRouterImageResponse {
  choices: Array<{
    message: OpenRouterImageMessage;
  }>;
}

/**
 * Generate a contextual image for a blog section
 * 
 * Uses NanoBanana Pro (Gemini 3) for high-quality image generation
 * with excellent text rendering for infographics.
 */
export async function generateContextualImage(
  context: ImagePromptContext
): Promise<ImageGenerationResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    return { success: false, error: 'OPENROUTER_API_KEY not configured' };
  }

  logger.info(`🎨 NanoBanana: Generating image for "${context.sectionHeading || context.articleTitle}"`);

  // Build the prompt based on context
  const prompt = buildImagePrompt(context);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lightpoint.uk',
        'X-Title': 'Lightpoint Blog Image Generation',
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        // OpenRouter image generation requires modalities parameter
        modalities: ['image', 'text'],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('NanoBanana API error:', error);
      return { success: false, error: `API error: ${response.status}` };
    }

    const data: OpenRouterImageResponse = await response.json();
    const message = data.choices?.[0]?.message;
    
    // Check for images in the response (OpenRouter format)
    if (message?.images && message.images.length > 0) {
      const imageDataUrl = message.images[0].image_url.url;
      logger.info(`✅ NanoBanana: Generated image (${imageDataUrl.substring(0, 50)}...)`);
      return { success: true, base64: imageDataUrl };
    }
    
    // Fallback: Check content for image data
    const imageContent = message?.content;
    if (imageContent) {
      if (imageContent.startsWith('http')) {
        return { success: true, imageUrl: imageContent };
      } else if (imageContent.startsWith('data:image')) {
        return { success: true, base64: imageContent };
      } else {
        // Try to extract from markdown image syntax
        const urlMatch = imageContent.match(/!\[.*?\]\((.*?)\)/);
        if (urlMatch) {
          return { success: true, imageUrl: urlMatch[1] };
        }
      }
    }

    logger.warn('NanoBanana: No image in response');
    return { success: false, error: 'No image generated' };

  } catch (error: any) {
    logger.error('NanoBanana generation failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Build an optimized prompt for blog image generation
 */
function buildImagePrompt(context: ImagePromptContext): string {
  const { articleTitle, sectionHeading, sectionContent, style = 'professional', aspectRatio = '16:9' } = context;

  // Style-specific instructions
  const styleInstructions = {
    professional: `
      Create a professional, corporate-style image suitable for a UK financial/tax advisory blog.
      Use a dark blue and teal color scheme with subtle gradients.
      Modern, clean aesthetic with minimal clutter.
      No text overlays - let the image speak visually.
    `,
    infographic: `
      Create a clean infographic-style illustration.
      Use icons, simple shapes, and visual metaphors.
      Dark background with cyan/teal accent colors.
      Professional and informative feel.
    `,
    abstract: `
      Create an abstract, conceptual illustration.
      Use geometric shapes, gradients, and flowing lines.
      Dark blue to teal color palette.
      Modern, sophisticated aesthetic.
    `,
    diagram: `
      Create a clear process diagram or flowchart style image.
      Use connected boxes, arrows, and icons.
      Dark theme with cyan highlights.
      Professional and educational.
    `,
  };

  // Build context-aware prompt
  let prompt = `Generate a ${aspectRatio} aspect ratio image for a professional UK tax advisory blog article.

Article: "${articleTitle}"
${sectionHeading ? `Section: "${sectionHeading}"` : ''}

${styleInstructions[style]}

Visual requirements:
- High quality, professional appearance
- Suitable for a sophisticated accountancy/tax audience
- Dark theme compatible (will be displayed on dark background)
- No text or watermarks in the image
- Clean, modern design

`;

  // Add content-specific guidance
  if (sectionContent) {
    const keywords = extractKeywords(sectionContent);
    if (keywords.length > 0) {
      prompt += `\nKey concepts to represent visually: ${keywords.join(', ')}`;
    }
  }

  // Add HMRC/tax-specific visual suggestions
  if (sectionHeading) {
    const visualSuggestion = getVisualSuggestion(sectionHeading);
    if (visualSuggestion) {
      prompt += `\n\nSuggested visual approach: ${visualSuggestion}`;
    }
  }

  return prompt;
}

/**
 * Extract keywords from content for image generation
 */
function extractKeywords(content: string): string[] {
  const keywords: string[] = [];
  
  // Tax/HMRC specific terms
  const domainTerms = [
    'complaint', 'resolution', 'escalation', 'adjudicator',
    'charter', 'taxpayer', 'professional', 'fees', 'compensation',
    'timeline', 'delay', 'failure', 'success', 'evidence',
    'documentation', 'process', 'system', 'error'
  ];

  const lowerContent = content.toLowerCase();
  domainTerms.forEach(term => {
    if (lowerContent.includes(term)) {
      keywords.push(term);
    }
  });

  return keywords.slice(0, 5); // Limit to 5 keywords
}

/**
 * Get visual suggestion based on section heading
 */
function getVisualSuggestion(heading: string): string | null {
  const lowerHeading = heading.toLowerCase();

  if (lowerHeading.includes('trap') || lowerHeading.includes('fail')) {
    return 'Show a visual metaphor of being stuck or blocked - perhaps a maze, barrier, or tangled path. Use warning colors like amber/red accents.';
  }

  if (lowerHeading.includes('success') || lowerHeading.includes('works') || lowerHeading.includes('win')) {
    return 'Show upward movement, achievement, or breakthrough - rising arrow, open door, clear path. Use positive green/cyan accents.';
  }

  if (lowerHeading.includes('process') || lowerHeading.includes('structure') || lowerHeading.includes('step')) {
    return 'Show a clear process flow or structured approach - connected nodes, numbered steps, organized workflow.';
  }

  if (lowerHeading.includes('timeline') || lowerHeading.includes('journey') || lowerHeading.includes('path')) {
    return 'Show a timeline or journey visualization - connected milestones, path with waypoints.';
  }

  if (lowerHeading.includes('evidence') || lowerHeading.includes('document')) {
    return 'Show documentation or evidence collection - stacked papers, organized files, checkmarks.';
  }

  if (lowerHeading.includes('money') || lowerHeading.includes('fee') || lowerHeading.includes('cost') || lowerHeading.includes('recover')) {
    return 'Show financial recovery or value - coins, upward trending chart, balance scales.';
  }

  if (lowerHeading.includes('change') || lowerHeading.includes('update') || lowerHeading.includes('new')) {
    return 'Show transformation or change - before/after contrast, evolving shapes, transition effect.';
  }

  return null;
}

/**
 * Generate multiple images for an article's sections
 */
export async function generateArticleImages(
  articleTitle: string,
  sections: { heading: string; content: string }[]
): Promise<Map<string, ImageGenerationResult>> {
  const results = new Map<string, ImageGenerationResult>();

  // Only generate images for key sections (not every one)
  const keyPatterns = [
    /trap|fail|problem/i,
    /success|works|solution/i,
    /process|structure|step/i,
    /change|update|new/i,
    /recover|fee|cost/i,
  ];

  for (const section of sections) {
    // Check if this section warrants an image
    const isKeySection = keyPatterns.some(pattern => pattern.test(section.heading));
    
    if (isKeySection) {
      const result = await generateContextualImage({
        articleTitle,
        sectionHeading: section.heading,
        sectionContent: section.content,
        style: 'professional',
        aspectRatio: '16:9',
      });

      results.set(section.heading, result);

      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}

export type { ImagePromptContext, ImageGenerationResult };

