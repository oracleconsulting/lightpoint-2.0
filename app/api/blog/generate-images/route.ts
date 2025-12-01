/**
 * API Route: Generate Blog Images using NanoBanana
 * 
 * POST /api/blog/generate-images
 * 
 * Generates contextual images for blog post sections using
 * Google's Gemini 3 Pro (NanoBanana Pro) image model.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateContextualImage } from '@/lib/blog/imageGeneration';

// Initialize Supabase client (check both possible env var names)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';

interface ImageRequest {
  slug: string;
  sections?: Array<{
    componentIndex: number;
    heading: string;
    description?: string;
    style?: 'professional' | 'infographic' | 'abstract' | 'diagram';
  }>;
  generateAll?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: ImageRequest = await request.json();
    const { slug, sections, generateAll } = body;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Blog post slug is required' },
        { status: 400 }
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Supabase credentials not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the blog post
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('title, structured_layout')
      .eq('slug', slug)
      .single();

    if (fetchError || !post) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }

    const layout = post.structured_layout;
    if (!layout?.components) {
      return NextResponse.json(
        { success: false, error: 'Blog post has no structured layout' },
        { status: 400 }
      );
    }

    const results: Array<{
      componentIndex: number;
      success: boolean;
      imageUrl?: string;
      error?: string;
    }> = [];

    // Determine which sections to generate images for
    let targetSections = sections || [];
    
    if (generateAll) {
      // Find all textWithImage components that need images
      targetSections = layout.components
        .map((component: any, index: number) => ({
          componentIndex: index,
          type: component.type,
          heading: component.props?.imageAlt || `Section ${index}`,
          hasImage: !!component.props?.imageSrc,
        }))
        .filter((c: any) => c.type === 'textWithImage' && !c.hasImage)
        .map((c: any) => ({
          componentIndex: c.componentIndex,
          heading: c.heading,
          style: 'professional' as const,
        }));
    }

    if (targetSections.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sections need images',
        generated: 0,
      });
    }

    console.log(`🎨 Generating ${targetSections.length} images for blog: ${slug}`);

    // Generate images for each section
    for (const section of targetSections) {
      try {
        console.log(`  📸 Generating image for component ${section.componentIndex}: ${section.heading}`);
        
        const result = await generateContextualImage({
          articleTitle: post.title,
          sectionHeading: section.heading,
          sectionContent: section.description,
          style: section.style || 'professional',
          aspectRatio: '16:9',
        });

        if (result.success) {
          const imageData = result.base64 || result.imageUrl;
          
          if (imageData) {
            // If it's base64, upload to Supabase storage
            let finalImageUrl = imageData;
            
            if (imageData.startsWith('data:image')) {
              const uploadResult = await uploadImageToStorage(
                supabase,
                imageData,
                slug,
                section.componentIndex
              );
              
              if (uploadResult.success && uploadResult.url) {
                finalImageUrl = uploadResult.url;
              }
            }

            // Update the component with the image URL
            layout.components[section.componentIndex].props.imageSrc = finalImageUrl;
            
            results.push({
              componentIndex: section.componentIndex,
              success: true,
              imageUrl: finalImageUrl,
            });
          }
        } else {
          results.push({
            componentIndex: section.componentIndex,
            success: false,
            error: result.error,
          });
        }

        // Rate limiting between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error: any) {
        results.push({
          componentIndex: section.componentIndex,
          success: false,
          error: error.message,
        });
      }
    }

    // Save the updated layout
    const successCount = results.filter(r => r.success).length;
    
    if (successCount > 0) {
      const { error: updateError } = await supabase
        .from('blog_posts')
        .update({
          structured_layout: layout,
          updated_at: new Date().toISOString(),
        })
        .eq('slug', slug);

      if (updateError) {
        console.error('Failed to update blog post:', updateError);
        return NextResponse.json({
          success: false,
          error: 'Failed to save images to blog post',
          results,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${successCount} of ${targetSections.length} images`,
      generated: successCount,
      results,
    });

  } catch (error: any) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Upload base64 image to Supabase storage
 */
async function uploadImageToStorage(
  supabase: any,
  base64Data: string,
  slug: string,
  componentIndex: number
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Parse base64 data
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return { success: false, error: 'Invalid base64 image data' };
    }

    const extension = matches[1];
    const base64Content = matches[2];
    const buffer = Buffer.from(base64Content, 'base64');

    const filename = `blog-images/${slug}/${componentIndex}-${Date.now()}.${extension}`;

    // Upload to Supabase storage
    const { data, error } = await supabase.storage
      .from('public')
      .upload(filename, buffer, {
        contentType: `image/${extension}`,
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('public')
      .getPublicUrl(filename);

    return { success: true, url: urlData.publicUrl };

  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// GET endpoint to check image generation status
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  
  if (!slug) {
    return NextResponse.json(
      { success: false, error: 'Slug parameter required' },
      { status: 400 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('structured_layout')
    .eq('slug', slug)
    .single();

  if (error || !post) {
    return NextResponse.json(
      { success: false, error: 'Blog post not found' },
      { status: 404 }
    );
  }

  const layout = post.structured_layout;
  const components = layout?.components || [];

  // Find textWithImage components and their image status
  const imageComponents = components
    .map((c: any, index: number) => ({
      index,
      type: c.type,
      imageAlt: c.props?.imageAlt,
      hasImage: !!c.props?.imageSrc,
      imageSrc: c.props?.imageSrc,
    }))
    .filter((c: any) => c.type === 'textWithImage');

  return NextResponse.json({
    success: true,
    slug,
    totalTextWithImage: imageComponents.length,
    withImages: imageComponents.filter((c: any) => c.hasImage).length,
    needingImages: imageComponents.filter((c: any) => !c.hasImage).length,
    components: imageComponents,
  });
}

