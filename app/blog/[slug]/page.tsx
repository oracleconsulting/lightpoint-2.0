'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/Provider';
import { ArrowLeft, Calendar, Clock, Tag, Share2, User, FileText, ExternalLink, LayoutTemplate } from 'lucide-react';
import DynamicGammaRenderer from '@/components/blog/DynamicGammaRenderer';
import TableOfContents, { generateTocItems } from '@/components/blog/gamma/TableOfContents';
// NEW: Clean Gamma-style renderer (V2)
import { BlogRenderer as BlogRendererV2 } from '@/components/blog-v2';
// NEW: Blog engagement (likes + comments)
import BlogEngagement from '@/components/blog/BlogEngagement';
// NEW: JSON-LD structured data for SEO
import BlogJsonLd from '@/components/blog/BlogJsonLd';

// Author credentials mapping - AUDIT FIX: Add professional credentials to byline
const AUTHOR_CREDENTIALS: Record<string, { title: string; credentials: string; bio?: string }> = {
  'james howard': {
    title: 'Tax Director',
    credentials: 'ACA, CTA',
    bio: 'Specialist in HMRC disputes and professional fee recovery',
  },
  'james.howard': {
    title: 'Tax Director',
    credentials: 'ACA, CTA',
    bio: 'Specialist in HMRC disputes and professional fee recovery',
  },
  // Add more authors as needed
};

/**
 * AuthorByline - Enhanced author display with credentials
 * AUDIT FIX: Score 5/10 → 8/10 for trust signals
 */
function AuthorByline({ author }: { author: string }) {
  const authorKey = author.toLowerCase().trim();
  const authorInfo = AUTHOR_CREDENTIALS[authorKey];

  if (authorInfo) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
          {author.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
        </div>
        <div className="flex flex-col">
          <span className="font-medium text-white">
            {author} <span className="text-cyan-300 text-sm">{authorInfo.credentials}</span>
          </span>
          <span className="text-sm text-blue-200">{authorInfo.title}</span>
        </div>
      </div>
    );
  }

  // Fallback for unknown authors
  return (
    <div className="flex items-center gap-2">
      <User className="h-5 w-5" />
      <span>By {author}</span>
    </div>
  );
}

/**
 * Detect if the layout is V2 format (has 'components' array at root)
 * V2 layouts have: { theme?: {...}, components: [...] }
 * V1 layouts have: { theme?: {...}, layout: [...] }
 */
function isV2Layout(layout: any): boolean {
  if (!layout || typeof layout !== 'object') return false;
  return Array.isArray(layout.components) && layout.components.length > 0;
}

/**
 * Blog Content Renderer - Shows Lightpoint visual layout with optional Gamma presentation link
 * Now supports both V1 (dark theme) and V2 (clean Gamma-style) layouts
 */
function BlogContentRenderer({ 
  post, 
  renderContent 
}: { 
  post: any; 
  renderContent: () => React.ReactNode;
}) {
  const [useV2, setUseV2] = useState(false);
  const hasGammaUrl = !!(post as any).gamma_url;
  const gammaUrl = (post as any).gamma_url;
  const hasStructuredLayout = post.structured_layout && typeof post.structured_layout === 'object';
  const hasV1Layout = hasStructuredLayout && post.structured_layout.layout;
  const hasV2Layout = hasStructuredLayout && isV2Layout(post.structured_layout);

  // DEBUG: Log layout detection
  console.log('🔍 [BlogContentRenderer] Layout Detection:', {
    hasStructuredLayout,
    hasV1Layout,
    hasV2Layout,
    structuredLayoutKeys: post.structured_layout ? Object.keys(post.structured_layout) : [],
    componentsLength: post.structured_layout?.components?.length,
    layoutLength: post.structured_layout?.layout?.length,
  });

  // Auto-detect V2 layout
  const shouldUseV2 = hasV2Layout || useV2;

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-3">
        {/* Toggle V2 Layout (only show if we have V1 layout) */}
        {hasV1Layout && !hasV2Layout && (
          <button
            onClick={() => setUseV2(!useV2)}
            className={`group flex items-center gap-3 px-5 py-3 font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all ${
              useV2 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white' 
                : 'bg-white text-gray-700 border border-gray-200'
            }`}
            title="Toggle clean layout"
          >
            <LayoutTemplate className="h-5 w-5" />
            <span className="hidden sm:inline">{useV2 ? 'Clean Mode' : 'Try Clean Mode'}</span>
          </button>
        )}

        {/* Gamma Presentation Button */}
        {hasGammaUrl && (
          <a
            href={gammaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          >
            <FileText className="h-5 w-5" />
            <span className="hidden sm:inline">View as Presentation</span>
            <ExternalLink className="h-4 w-4 opacity-70 group-hover:opacity-100" />
          </a>
        )}
      </div>

      {/* Main Content */}
      {hasV2Layout ? (
        // V2 Layout: Clean Gamma-style (light theme)
        <BlogRendererV2 layout={post.structured_layout} />
      ) : hasV1Layout && !shouldUseV2 ? (
        // V1 Layout: Dark theme with glows
        <DynamicGammaRenderer layout={post.structured_layout} />
      ) : (
        // Fallback: Plain text
        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
          <div
            className="prose prose-lg prose-invert max-w-none
            prose-headings:font-bold prose-headings:text-white
            prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-lg
            prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white prose-strong:font-semibold
            prose-ul:list-disc prose-ol:list-decimal
            prose-li:text-gray-300
            prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-300
            prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:text-cyan-400
            prose-img:rounded-xl prose-img:shadow-lg"
          >
            {renderContent()}
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Table of Contents Section - extracts headings from structured layout
 */
function TableOfContentsSection({ layout }: { layout: any }) {
  const tocItems = useMemo(() => {
    if (!layout || typeof layout !== 'object') return [];
    
    const layoutArray = Array.isArray(layout) ? layout : (layout?.layout || []);
    if (!layoutArray || layoutArray.length === 0) return [];
    
    return generateTocItems(layoutArray);
  }, [layout]);

  // Only show TOC if we have 3+ sections
  if (tocItems.length < 3) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
      <TableOfContents 
        items={tocItems} 
        variant="collapsible"
        accent="cyan"
      />
    </div>
  );
}

export default function BlogPostPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params?.slug as string;
  const isPreview = searchParams?.get('preview') === 'true';

  const { data: post, isLoading, error } = trpc.blog.getBySlug.useQuery(
    { slug },
    {
      enabled: !!slug,
    }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-64 bg-gray-200 rounded" />
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded" />
              <div className="h-4 bg-gray-200 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-8">The blog post you're looking for doesn't exist.</p>
          <Link
            href="/blog"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // Convert TipTap JSON to HTML for rendering
  const renderContent = () => {
    if (typeof post.content === 'string') {
      // If content is already HTML string
      return <div dangerouslySetInnerHTML={{ __html: post.content }} />;
    } else {
      // If content is TipTap JSON, render a basic version
      // In production, you'd use a proper TipTap renderer
      const renderNode = (node: any): string => {
        if (!node) return '';
        
        if (node.type === 'text') {
          let text = node.text || '';
          if (node.marks) {
            node.marks.forEach((mark: any) => {
              if (mark.type === 'bold') text = `<strong>${text}</strong>`;
              if (mark.type === 'italic') text = `<em>${text}</em>`;
              if (mark.type === 'underline') text = `<u>${text}</u>`;
              if (mark.type === 'link') text = `<a href="${mark.attrs.href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
            });
          }
          return text;
        }
        
        const content = node.content?.map(renderNode).join('') || '';
        
        switch (node.type) {
          case 'paragraph':
            return `<p>${content}</p>`;
          case 'heading':
            return `<h${node.attrs?.level || 2}>${content}</h${node.attrs?.level || 2}>`;
          case 'bulletList':
            return `<ul>${content}</ul>`;
          case 'orderedList':
            return `<ol>${content}</ol>`;
          case 'listItem':
            return `<li>${content}</li>`;
          case 'blockquote':
            return `<blockquote>${content}</blockquote>`;
          case 'codeBlock':
            return `<pre><code>${content}</code></pre>`;
          case 'hardBreak':
            return '<br />';
          case 'image':
            return `<img src="${node.attrs.src}" alt="${node.attrs.alt || ''}" />`;
          default:
            return content;
        }
      };
      
      const html = post.content?.content?.map(renderNode).join('') || '<p>No content available</p>';
      return <div dangerouslySetInnerHTML={{ __html: html }} />;
    }
  };

  // Check if this is a V2 layout - if so, render completely differently
  const hasStructuredLayout = post.structured_layout && typeof post.structured_layout === 'object';
  const hasV2Layout = hasStructuredLayout && isV2Layout(post.structured_layout);

  // CRITICAL DEBUG: Log exactly what we're seeing
  console.log('🔍 [BlogPostPage] Layout Analysis:', {
    slug: post.slug,
    hasStructuredLayout,
    hasV2Layout,
    structuredLayoutType: typeof post.structured_layout,
    structuredLayoutKeys: post.structured_layout ? Object.keys(post.structured_layout) : [],
    hasComponentsArray: Array.isArray(post.structured_layout?.components),
    componentsLength: post.structured_layout?.components?.length,
    hasLayoutArray: Array.isArray(post.structured_layout?.layout),
    layoutLength: post.structured_layout?.layout?.length,
    firstComponentType: post.structured_layout?.components?.[0]?.type || post.structured_layout?.layout?.[0]?.type,
  });

  // V2 Layout: Clean, light theme - skip the dark wrapper entirely
  if (hasV2Layout) {
    console.log('🎨 [BlogPostPage] ✅ Rendering V2 Layout with', post.structured_layout?.components?.length, 'components');
    return (
      <div className="min-h-screen bg-white">
        {/* JSON-LD Structured Data for SEO and AI Search */}
        <BlogJsonLd
          title={post.title}
          description={post.excerpt || post.meta_description || ''}
          slug={post.slug}
          author={post.author || 'Lightpoint'}
          publishedAt={post.published_at}
          updatedAt={post.updated_at}
          imageUrl={post.featured_image}
          tags={post.tags || []}
        />
        
        {/* Preview Banner */}
        {isPreview && (
          <div className="bg-amber-500 text-white py-3 px-4 text-center font-semibold z-50 relative">
            📝 Preview Mode - This post is not yet published
          </div>
        )}
        
        {/* V2 Renderer handles everything including hero */}
        <BlogRendererV2 layout={post.structured_layout} />
        
        {/* Engagement Section: Likes & Comments */}
        <div className="max-w-4xl mx-auto px-6 lg:px-8 pb-16">
          <BlogEngagement 
            postId={post.id}
            postSlug={post.slug}
            initialLikeCount={post.like_count || 0}
            initialCommentCount={post.comment_count || 0}
          />
        </div>
      </div>
    );
  }

  // V1/Legacy Layout: Dark theme with old structure
  return (
    <div 
      className="min-h-screen relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a0a1a 0%, #0f0f23 50%, #1a1a2e 100%)'
      }}
    >
      {/* Preview Banner */}
      {isPreview && (
        <div className="bg-amber-500 text-white py-3 px-4 text-center font-semibold z-50 relative">
          📝 Preview Mode - This post is not yet published
        </div>
      )}

      {/* Hero/Header - V3 Dark Theme */}
      <div 
        className="text-white relative"
        style={{
          background: 'linear-gradient(135deg, rgba(10, 10, 26, 0.95) 0%, rgba(79, 134, 249, 0.15) 50%, rgba(0, 212, 255, 0.1) 100%)'
        }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-300 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Blog
          </Link>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {post.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-white backdrop-blur-sm border border-white/20"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 
            className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight"
            style={{
              textShadow: '0 2px 20px rgba(0, 0, 0, 0.5)'
            }}
          >
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 text-blue-100">
            {post.author && (
              <AuthorByline author={post.author} />
            )}

            {post.published_at && (
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>
                  {new Date(post.published_at).toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}

            {post.read_time_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>{post.read_time_minutes} min read</span>
              </div>
            )}

            <button className="flex items-center gap-2 hover:text-white transition-colors">
              <Share2 className="h-5 w-5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* Featured Image */}
      {post.featured_image_url && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
          <div className="rounded-2xl overflow-hidden shadow-2xl border border-gray-800/50">
            <img
              src={post.featured_image_url}
              alt={post.featured_image_alt || post.title}
              className="w-full h-auto"
            />
          </div>
        </div>
      )}

      {/* Excerpt */}
      {post.excerpt && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <p className="text-xl text-gray-300 leading-relaxed italic border-l-4 border-cyan-500 pl-6 py-2">
            {post.excerpt}
          </p>
        </div>
      )}

      {/* Table of Contents - AUDIT FIX: Add TOC for long articles */}
      <TableOfContentsSection layout={post.structured_layout} />

      {/* Content */}
      <article className="w-full">
        <BlogContentRenderer 
          post={post} 
          renderContent={renderContent} 
        />
      </article>

      {/* Author/CTA Section */}
      <div className="border-t border-gray-800/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-white text-center shadow-2xl">
            <h3 className="text-3xl font-bold mb-4">
              Want to Learn More?
            </h3>
            <p className="text-xl text-blue-100 mb-8">
              Join Lightpoint to access our full library of CPD articles, webinars, and worked examples
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Start Free Trial
              <ArrowLeft className="ml-2 h-5 w-5 rotate-180" />
            </Link>
          </div>
        </div>
      </div>

      {/* Related Posts (placeholder) */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-2xl font-bold text-white mb-8">Related Articles</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {/* These would be populated with actual related posts */}
          <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6 hover:border-cyan-500/50 transition-all">
            <h4 className="font-semibold text-white mb-2">More posts coming soon!</h4>
            <p className="text-gray-400 text-sm">Check back for related articles</p>
          </div>
        </div>
      </div>
    </div>
  );
}

