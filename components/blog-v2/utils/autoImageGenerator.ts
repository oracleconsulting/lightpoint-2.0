/**
 * Automatic Image Generation for Blog Layouts
 * 
 * Automatically generates and populates images for textWithImage components
 * when a layout is created or updated.
 */

import { generateContextualImage } from '@/lib/blog/imageGeneration';
import { createClient } from '@supabase/supabase-js';
import type { BlogLayout, LayoutComponent } from '../types';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

/**
 * Generate images for all textWithImage components in a layout
 */
export async function generateImagesForLayout(
  layout: BlogLayout,
  articleTitle: string,
  slug: string
): Promise<BlogLayout> {
  if (!layout?.components) {
    return layout;
  }

  const updatedComponents: LayoutComponent[] = [];
  let imageIndex = 0;

  for (let i = 0; i < layout.components.length; i++) {
    const component = layout.components[i];
    
    if (component.type === 'textWithImage' && !component.props?.imageSrc) {
      // Generate image for this component
      const imageAlt = component.props?.imageAlt || `Illustration for ${articleTitle}`;
      const sectionContent = Array.isArray(component.props?.paragraphs)
        ? component.props.paragraphs.join(' ')
        : component.props?.paragraphs || '';

      logger.info(`🎨 Auto-generating image ${imageIndex + 1} for: ${imageAlt.substring(0, 50)}...`);

      try {
        const result = await generateContextualImage({
          articleTitle,
          sectionHeading: imageAlt,
          sectionContent: sectionContent.substring(0, 500), // Limit content length
          style: 'professional',
          aspectRatio: '4:3', // Better for blog layouts
        });

        if (result.success && (result.base64 || result.imageUrl)) {
          // Upload to Supabase storage
          const imageUrl = await uploadImageToStorage(
            result.base64 || result.imageUrl!,
            slug,
            i,
            imageIndex
          );

          if (imageUrl) {
            updatedComponents.push({
              ...component,
              props: {
                ...component.props,
                imageSrc: imageUrl,
              },
            });
            imageIndex++;
            
            // Rate limiting - wait 2 seconds between images
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        }
      } catch (error) {
        logger.error(`❌ Failed to generate image for component ${i}:`, error);
      }
    }

    // Keep component as-is
    updatedComponents.push(component);
  }

  return {
    ...layout,
    components: updatedComponents,
  };
}

/**
 * Upload image to Supabase storage
 */
async function uploadImageToStorage(
  imageData: string,
  slug: string,
  componentIndex: number,
  imageIndex: number
): Promise<string | null> {
  try {
    if (!supabaseUrl || !supabaseKey) {
      logger.warn('⚠️ Supabase credentials not configured for image upload');
      return null;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parse base64 data if needed
    let buffer: Buffer;
    let extension = 'png';
    let contentType = 'image/png';

    if (imageData.startsWith('data:image')) {
      const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) {
        logger.error('❌ Invalid base64 image data');
        return null;
      }
      extension = matches[1];
      contentType = `image/${extension}`;
      buffer = Buffer.from(matches[2], 'base64');
    } else if (imageData.startsWith('http')) {
      // If it's already a URL, return it
      return imageData;
    } else {
      // Assume it's base64 without data URL prefix
      buffer = Buffer.from(imageData, 'base64');
    }

    const filename = `blog-images/${slug}/${componentIndex}-${imageIndex}-${Date.now()}.${extension}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('public')
      .upload(filename, buffer, {
        contentType,
        upsert: true,
        cacheControl: '3600',
      });

    if (error) {
      logger.error('❌ Storage upload error:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('public')
      .getPublicUrl(filename);

    logger.info(`✅ Image uploaded: ${urlData.publicUrl}`);
    return urlData.publicUrl;

  } catch (error) {
    logger.error('❌ Image upload failed:', error);
    return null;
  }
}

/**
 * Check if layout needs image generation
 */
export function layoutNeedsImages(layout: BlogLayout): boolean {
  if (!layout?.components) return false;

  return layout.components.some(
    (c) => c.type === 'textWithImage' && !c.props?.imageSrc
  );
}

/**
 * Generate images in background (non-blocking)
 */
export async function generateImagesInBackground(
  layout: BlogLayout,
  articleTitle: string,
  slug: string,
  onComplete?: (updatedLayout: BlogLayout) => void
): Promise<void> {
  // Run in background
  generateImagesForLayout(layout, articleTitle, slug)
    .then((updatedLayout) => {
      if (onComplete) {
        onComplete(updatedLayout);
      }
    })
    .catch((error) => {
      logger.error('❌ Background image generation failed:', error);
    });
}



