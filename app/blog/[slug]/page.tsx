'use client';

import React from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/Provider';
import { ArrowLeft, Calendar, Clock, Tag, Share2, User } from 'lucide-react';
import { DynamicLayoutRenderer } from '@/components/blog/DynamicLayoutRenderer';

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Preview Banner */}
      {isPreview && (
        <div className="bg-amber-500 text-white py-3 px-4 text-center font-semibold">
          📝 Preview Mode - This post is not yet published
        </div>
      )}

      {/* Hero/Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link
            href="/blog"
            className="inline-flex items-center text-blue-100 hover:text-white mb-6 transition-colors"
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
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white"
                >
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            {post.title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 text-blue-100">
            {post.author && (
              <div className="flex items-center gap-2">
                <User className="h-5 w-5" />
                <span>By {post.author}</span>
              </div>
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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16">
          <div className="rounded-2xl overflow-hidden shadow-2xl">
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
          <p className="text-xl text-gray-600 leading-relaxed italic border-l-4 border-blue-600 pl-6 py-2">
            {post.excerpt}
          </p>
        </div>
      )}

      {/* Content */}
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* If we have both structured layout AND content, show both */}
        {post.structured_layout ? (
          <div className="space-y-12">
            {/* First render the visual layout (stats, charts, etc.) */}
            <div className="space-y-8">
              <DynamicLayoutRenderer 
                layout={post.structured_layout.layout || post.structured_layout} 
                theme={post.structured_layout.theme}
              />
            </div>

            {/* Then render the full written content below */}
            <div className="border-t pt-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-8">Full Article</h2>
              <div
                className="prose prose-lg prose-blue max-w-none
                  prose-headings:font-bold prose-headings:text-gray-900
                  prose-p:text-gray-700 prose-p:leading-relaxed
                  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-ul:list-disc prose-ol:list-decimal
                  prose-li:text-gray-700
                  prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:pl-4 prose-blockquote:italic
                  prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
                  prose-img:rounded-xl prose-img:shadow-lg"
              >
                {renderContent()}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="prose prose-lg prose-blue max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900 prose-strong:font-semibold
              prose-ul:list-disc prose-ol:list-decimal
              prose-li:text-gray-700
              prose-blockquote:border-l-4 prose-blockquote:border-blue-600 prose-blockquote:pl-4 prose-blockquote:italic
              prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm
              prose-img:rounded-xl prose-img:shadow-lg"
          >
            {renderContent()}
          </div>
        )}
      </article>

      {/* Author/CTA Section */}
      <div className="bg-gradient-to-br from-gray-50 to-white border-t border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 md:p-12 text-white text-center">
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
        <h3 className="text-2xl font-bold text-gray-900 mb-8">Related Articles</h3>
        <div className="grid md:grid-cols-2 gap-6">
          {/* These would be populated with actual related posts */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
            <h4 className="font-semibold text-gray-900 mb-2">More posts coming soon!</h4>
            <p className="text-gray-600 text-sm">Check back for related articles</p>
          </div>
        </div>
      </div>
    </div>
  );
}

