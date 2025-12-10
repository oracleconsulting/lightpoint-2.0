/**
 * Layout Generator - Converts detected sections to V2 BlogLayout
 * Takes section detector output and produces a complete layout
 */

import type { BlogLayout, LayoutComponent, ComponentType } from '../types';
import { detectSections, DetectedSection } from './sectionDetector';
import { generateImagesForLayout } from './autoImageGenerator';

// ============================================================================
// MAIN GENERATOR FUNCTION
// ============================================================================

export interface GenerateLayoutOptions {
  title: string;
  content: string;
  excerpt?: string;
  author?: string;
  readingTime?: string;
  includeHero?: boolean;
  includeCTA?: boolean;
  slug?: string; // Required for auto image generation
}

/**
 * Generate a complete V2 BlogLayout from markdown/text content
 * 
 * @param options Layout generation options
 * @param autoGenerateImages If true, automatically generates images for textWithImage components (async)
 */
export async function generateLayout(
  options: GenerateLayoutOptions,
  autoGenerateImages: boolean = false
): Promise<BlogLayout> {
  const {
    title,
    content,
    excerpt,
    author = 'Lightpoint Team',
    readingTime,
    includeHero = true,
    includeCTA = true,
  } = options;

  console.log('🔍 [V2 Layout] Input content length:', content?.length || 0);
  console.log('🔍 [V2 Layout] Content type:', typeof content);
  console.log('🔍 [V2 Layout] Content preview:', typeof content === 'string' ? content?.substring(0, 500) : JSON.stringify(content).substring(0, 500));

  // Detect sections from content
  const sections = detectSections(content);
  
  console.log('🔍 [V2 Layout] Detected sections:', sections.length);
  console.log('🔍 [V2 Layout] Section types:', sections.map(s => s.type));
  
  // Convert sections to components
  const components: LayoutComponent[] = [];
  
  // Add hero if requested
  if (includeHero) {
    components.push({
      type: 'hero',
      props: {
        title,
        subtitle: excerpt || extractFirstParagraph(content),
        author,
        readingTime: readingTime || estimateReadingTime(content),
        backgroundGradient: true,
      },
    });
  }
  
  // Convert each detected section to a component
  for (const section of sections) {
    const component = sectionToComponent(section);
    if (component) {
      components.push(component);
    }
  }
  
  // Add CTA if requested
  if (includeCTA) {
    components.push({
      type: 'cta',
      props: {
        title: 'Ready to Get Started?',
        description: 'Let Lightpoint help you navigate HMRC complaints with confidence.',
        primaryButton: { text: 'Join the Waitlist', href: '/subscription/checkout' },
        secondaryButton: { text: 'View Pricing', href: '/pricing' },
      },
    });
  }
  
  const layout: BlogLayout = {
    theme: {
      mode: 'light',
      name: 'lightpoint',
    },
    components,
  };

  // Auto-generate images if requested
  if (autoGenerateImages && options.slug) {
    try {
      return await generateImagesForLayout(layout, options.title, options.slug);
    } catch (error) {
      console.error('❌ Image generation failed, returning layout without images:', error);
      return layout;
    }
  }

  return layout;
}

// ============================================================================
// SECTION TO COMPONENT CONVERTER
// ============================================================================

function sectionToComponent(section: DetectedSection): LayoutComponent | null {
  switch (section.type) {
    case 'stats':
      return {
        type: 'stats',
        props: {
          stats: section.data?.stats || [],
          variant: section.data?.variant || 'flat',
          columns: section.data?.columns || 4,
        },
      };
    
    case 'donutChart':
      return {
        type: 'donutChart',
        props: {
          segments: section.data?.segments || [],
          showLegend: section.data?.showLegend ?? true,
          size: 220,
        },
      };
    
    case 'numberedSteps':
      return {
        type: 'numberedSteps',
        props: {
          title: section.data?.title,
          steps: (section.data?.steps || []).map((s: any, i: number) => ({
            number: s.number || i + 1,
            title: s.title || `Step ${i + 1}`,
            description: s.description || '',
          })),
          variant: section.data?.variant || 'vertical',
        },
      };
    
    case 'timeline':
      return {
        type: 'timeline',
        props: {
          events: section.data?.events || [],
        },
      };
    
    case 'callout':
      return {
        type: 'callout',
        props: {
          icon: section.data?.icon || (section.data?.variant === 'gold' ? 'alert' : 'lightbulb'),
          label: section.data?.label || (section.data?.variant === 'gold' ? 'Warning' : 'Pro Tip'),
          text: section.data?.text || section.content,
          variant: section.data?.variant || 'blue',
        },
      };
    
    case 'quote':
      return {
        type: 'quote',
        props: {
          text: section.data?.text || section.content,
          variant: 'border',
        },
      };
    
    case 'comparisonCards':
      return {
        type: 'comparisonCards',
        props: {
          leftCard: section.data?.leftCard,
          rightCard: section.data?.rightCard,
        },
      };
    
    case 'threeColumnCards':
      // Ensure cards have proper titles, not "Point X"
      const processedCards = (section.data?.cards || []).map((card: any, idx: number) => {
        // If title is generic "Point X", extract from description
        if (!card.title || card.title.match(/^Point\s+\d+$/i)) {
          // Extract title from first sentence of description
          const firstSentence = card.description?.split(/[.!?]/)[0] || '';
          if (firstSentence && firstSentence.length > 10 && firstSentence.length < 60) {
            return {
              ...card,
              title: firstSentence.trim(),
              description: card.description?.substring(firstSentence.length + 1).trim() || card.description || '',
            };
          }
          // Fallback: use first meaningful words
          const words = card.description?.split(/\s+/).slice(0, 5).join(' ') || '';
          if (words.length > 5) {
            return {
              ...card,
              title: words,
              description: card.description?.substring(words.length).trim() || '',
            };
          }
        }
        return card;
      });
      
      return {
        type: 'threeColumnCards',
        props: {
          cards: processedCards,
        },
      };
    
    case 'bulletList':
      return {
        type: 'bulletList',
        props: {
          items: section.data?.items || [],
          variant: 'check',
        },
      };
    
    case 'sectionHeading':
      return {
        type: 'sectionHeading',
        props: {
          title: section.data?.title || section.content,
        },
      };
    
    case 'textWithImage':
      // Ensure paragraphs is always an array
      let paragraphs = section.data?.paragraphs;
      if (!paragraphs || !Array.isArray(paragraphs)) {
        // Split content by double newlines to create paragraphs
        paragraphs = section.content.split(/\n\n+/).filter(p => p.trim());
        if (paragraphs.length === 0) {
          paragraphs = [section.content];
        }
      }
      
      return {
        type: 'textWithImage',
        props: {
          paragraphs,
          imageAlt: section.data?.imageAlt || 'Illustration',
          imagePosition: section.data?.imagePosition || 'right',
          imageSrc: section.data?.imageSrc, // Preserve existing image if any
        },
      };
    
    case 'paragraph':
      // Skip very short paragraphs (less than 20 chars)
      if (section.content.length < 20) return null;
      return {
        type: 'paragraph',
        props: {
          text: section.content,
        },
      };
    
    default:
      // Unknown type - render as paragraph
      return {
        type: 'paragraph',
        props: {
          text: section.content,
        },
      };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractFirstParagraph(content: string): string {
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 50);
  return paragraphs[0]?.trim().substring(0, 200) || '';
}

function estimateReadingTime(content: string): string {
  const words = content.split(/\s+/).length;
  const minutes = Math.ceil(words / 200); // 200 words per minute
  return `${minutes} min read`;
}

/**
 * Extract metadata from markdown frontmatter
 */
export function extractMeta(markdown: string): {
  title?: string;
  excerpt?: string;
  author?: string;
  date?: string;
  tags?: string[];
  content: string;
} {
  const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!frontmatterMatch) {
    return { content: markdown };
  }
  
  const frontmatter = frontmatterMatch[1];
  const content = frontmatterMatch[2];
  
  const meta: any = { content };
  
  // Parse YAML-like frontmatter
  const lines = frontmatter.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const key = match[1].toLowerCase();
      let value: any = match[2].trim();
      
      // Handle arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map((s: string) => s.trim().replace(/^["']|["']$/g, ''));
      }
      // Handle quoted strings
      else if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      
      meta[key] = value;
    }
  }
  
  return meta;
}

/**
 * Strip frontmatter from markdown
 */
export function stripFrontmatter(markdown: string): string {
  return markdown.replace(/^---\n[\s\S]*?\n---\n/, '');
}

/**
 * Full pipeline: markdown → BlogLayout
 */
export async function markdownToLayout(
  markdown: string,
  autoGenerateImages: boolean = false,
  slug?: string
): Promise<BlogLayout> {
  const meta = extractMeta(markdown);
  
  return generateLayout({
    title: meta.title || 'Untitled',
    content: meta.content,
    excerpt: meta.excerpt,
    author: meta.author,
    slug,
  }, autoGenerateImages);
}

