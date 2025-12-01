import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';

interface Props {
  params: { slug: string };
  children: React.ReactNode;
}

// Generate dynamic metadata for each blog post
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = params;
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return getDefaultMetadata(slug);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    const { data: post } = await supabase
      .from('blog_posts')
      .select('title, excerpt, meta_title, meta_description, featured_image, author, tags, published_at, updated_at')
      .eq('slug', slug)
      .single();
    
    if (!post) {
      return getDefaultMetadata(slug);
    }

    const title = post.meta_title || post.title;
    const description = post.meta_description || post.excerpt || `Read ${post.title} on Lightpoint`;
    const imageUrl = post.featured_image || 'https://lightpoint.uk/og-image.png';
    const canonicalUrl = `https://lightpoint.uk/blog/${slug}`;
    
    return {
      title: `${title} | Lightpoint Blog`,
      description,
      keywords: post.tags?.join(', ') || 'HMRC complaints, tax disputes, UK accountants',
      authors: [{ name: post.author || 'Lightpoint' }],
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        siteName: 'Lightpoint',
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
        locale: 'en_GB',
        type: 'article',
        publishedTime: post.published_at,
        modifiedTime: post.updated_at,
        authors: [post.author || 'Lightpoint'],
        tags: post.tags || [],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: canonicalUrl,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return getDefaultMetadata(slug);
  }
}

function getDefaultMetadata(slug: string): Metadata {
  return {
    title: 'Blog Post | Lightpoint',
    description: 'Expert insights on HMRC complaints and tax disputes for UK accountants',
    alternates: {
      canonical: `https://lightpoint.uk/blog/${slug}`,
    },
  };
}

export default function BlogPostLayout({ children }: Props) {
  return <>{children}</>;
}

