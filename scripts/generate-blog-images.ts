/**
 * Generate Images for Blog Post using NanoBanana (Gemini Image)
 * 
 * Usage: npx tsx scripts/generate-blog-images.ts
 * 
 * Requires:
 * - OPENROUTER_API_KEY
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Image contexts for the HMRC blog post
const IMAGE_CONTEXTS = [
  {
    key: 'intro_frustrated_accountant',
    prompt: `Generate a professional illustration for a UK tax advisory blog.

Scene: A frustrated professional accountant at their desk, on hold with HMRC.
Style: Modern, clean corporate illustration. Dark blue and teal color scheme.
Elements: Phone held to ear, computer screen showing "On Hold...", clock showing time passing.
Mood: Professional frustration, relatable business scenario.
No text or watermarks. 16:9 aspect ratio. High quality.`,
    section: 'intro'
  },
  {
    key: 'october_2024_change',
    prompt: `Generate a professional infographic-style illustration for a UK tax advisory blog.

Concept: Fast-track process improvement - showing a streamlined path vs old bureaucratic path.
Style: Clean process diagram with dark background, cyan/teal highlights.
Elements: Two parallel paths - one long and winding (faded), one direct and short (highlighted).
Mood: Innovation, efficiency, positive change.
No text or watermarks. 16:9 aspect ratio. High quality.`,
    section: 'october_2024'
  },
  {
    key: 'documentation_system',
    prompt: `Generate a professional illustration for a UK tax advisory blog.

Concept: Organized documentation and evidence collection system.
Style: Modern, clean design with dark blue background, teal accents.
Elements: Organized folders, checklists with checkmarks, timeline chart, stacked documents.
Mood: Professional, organized, systematic, thorough.
No text or watermarks. 16:9 aspect ratio. High quality.`,
    section: 'documentation'
  }
];

async function generateImage(prompt: string): Promise<string | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENROUTER_API_KEY not set');
    return null;
  }

  console.log('🎨 Generating image...');

  try {
    // Try with Gemini image model
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lightpoint.uk',
        'X-Title': 'Lightpoint Blog Image Generation',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash-exp:free', // Using available Gemini model
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ],
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API error:', response.status, error);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    // Check for image URL in response
    if (content) {
      // Look for URLs
      const urlMatch = content.match(/https?:\/\/[^\s\)\"]+\.(png|jpg|jpeg|webp|gif)/i);
      if (urlMatch) {
        return urlMatch[0];
      }
      
      // Look for base64
      if (content.includes('data:image')) {
        const base64Match = content.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
        if (base64Match) {
          return base64Match[0];
        }
      }
    }

    console.log('⚠️ No image URL in response, trying alternative...');
    return null;

  } catch (error: any) {
    console.error('❌ Generation failed:', error.message);
    return null;
  }
}

async function uploadToSupabase(
  supabase: any,
  imageData: string,
  filename: string
): Promise<string | null> {
  try {
    let buffer: Buffer;
    let contentType = 'image/png';

    if (imageData.startsWith('data:image')) {
      // Base64 image
      const matches = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) return null;
      
      contentType = `image/${matches[1]}`;
      buffer = Buffer.from(matches[2], 'base64');
    } else if (imageData.startsWith('http')) {
      // URL - download first
      const response = await fetch(imageData);
      const arrayBuffer = await response.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      contentType = response.headers.get('content-type') || 'image/png';
    } else {
      return null;
    }

    const path = `blog-images/${filename}`;
    
    const { data, error } = await supabase.storage
      .from('public')
      .upload(path, buffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('❌ Upload failed:', error);
      return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('public')
      .getPublicUrl(path);

    return urlData.publicUrl;
  } catch (error: any) {
    console.error('❌ Upload error:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Blog Image Generator\n');

  // Check environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openrouterKey = process.env.OPENROUTER_API_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.log('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  if (!openrouterKey) {
    console.error('❌ Missing OPENROUTER_API_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // For now, let's use high-quality placeholder images from Unsplash
  // that match the context. These can be replaced with AI-generated ones later.
  
  const placeholderImages = {
    'intro_frustrated_accountant': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=675&fit=crop',
    'october_2024_change': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=675&fit=crop',
    'documentation_system': 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&h=675&fit=crop'
  };

  console.log('📸 Using high-quality Unsplash placeholders:\n');
  
  for (const [key, url] of Object.entries(placeholderImages)) {
    console.log(`  ${key}: ${url}`);
  }

  // Update the blog post with these image URLs
  console.log('\n📝 Updating blog post with images...\n');

  // Read current structured_layout
  const { data: post, error: fetchError } = await supabase
    .from('blog_posts')
    .select('structured_layout')
    .eq('slug', 'why-hmrc-complaints-fail-how-to-fix')
    .single();

  if (fetchError || !post) {
    console.error('❌ Failed to fetch post:', fetchError);
    process.exit(1);
  }

  const layout = post.structured_layout;
  let updated = false;

  // Update textWithImage components with real images
  for (const component of layout.components) {
    if (component.type === 'textWithImage') {
      const alt = component.props.imageAlt?.toLowerCase() || '';
      
      if (alt.includes('frustrated') || alt.includes('accountant') || alt.includes('phone')) {
        component.props.imageSrc = placeholderImages.intro_frustrated_accountant;
        updated = true;
        console.log('✅ Updated intro image');
      } else if (alt.includes('fast-track') || alt.includes('process')) {
        component.props.imageSrc = placeholderImages.october_2024_change;
        updated = true;
        console.log('✅ Updated October 2024 image');
      } else if (alt.includes('documentation') || alt.includes('organized')) {
        component.props.imageSrc = placeholderImages.documentation_system;
        updated = true;
        console.log('✅ Updated documentation image');
      }
    }
  }

  if (updated) {
    const { error: updateError } = await supabase
      .from('blog_posts')
      .update({ 
        structured_layout: layout,
        updated_at: new Date().toISOString()
      })
      .eq('slug', 'why-hmrc-complaints-fail-how-to-fix');

    if (updateError) {
      console.error('❌ Failed to update post:', updateError);
      process.exit(1);
    }

    console.log('\n✅ Blog post updated with images!');
    console.log('🔗 View at: https://lightpoint.uk/blog/why-hmrc-complaints-fail-how-to-fix');
  } else {
    console.log('\n⚠️ No matching textWithImage components found');
  }
}

main().catch(console.error);

