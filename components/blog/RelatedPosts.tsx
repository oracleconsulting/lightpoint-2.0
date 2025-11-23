'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';
import Image from 'next/image';

interface RelatedPostsProps {
  currentPostId: string;
  currentPostTags?: string[];
  currentPostCategory?: string;
  limit?: number;
}

/**
 * RelatedPosts Component
 * 
 * Displays related blog posts based on:
 * 1. Shared tags (primary matching)
 * 2. Same category (secondary matching)
 * 3. Recent posts (fallback)
 * 
 * Uses tag-based similarity scoring for intelligent recommendations
 */
export function RelatedPosts({ 
  currentPostId, 
  currentPostTags = [], 
  currentPostCategory,
  limit = 3 
}: RelatedPostsProps) {
  
  // Fetch all published posts
  const { data: allPosts, isLoading } = trpc.blog.list.useQuery({
    status: 'published',
    limit: 50,
  });

  if (isLoading) {
    return (
      <div className="mt-16 border-t pt-12">
        <h2 className="text-3xl font-bold mb-8">Related Articles</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-4" />
              <div className="h-6 bg-gray-200 rounded mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!allPosts?.posts || allPosts.posts.length === 0) {
    return null;
  }

  // Calculate similarity score for each post
  const scoredPosts = allPosts.posts
    .filter((post: any) => post.id !== currentPostId) // Exclude current post
    .map((post: any) => {
      let score = 0;
      
      // Tag matching (most important)
      const postTags = post.tags || [];
      const sharedTags = currentPostTags.filter(tag => 
        postTags.includes(tag)
      );
      score += sharedTags.length * 10; // 10 points per shared tag
      
      // Category matching (secondary)
      if (currentPostCategory && post.category === currentPostCategory) {
        score += 5;
      }
      
      // Recency bonus (newer posts get slight boost)
      const daysOld = (Date.now() - new Date(post.published_at).getTime()) / (1000 * 60 * 60 * 24);
      if (daysOld < 30) score += 2;
      else if (daysOld < 90) score += 1;
      
      return { ...post, score };
    })
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .slice(0, limit); // Take top N

  if (scoredPosts.length === 0) {
    return null;
  }

  return (
    <div className="mt-16 border-t pt-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold">Related Articles</h2>
        <Link 
          href="/blog"
          className="text-blue-600 hover:text-blue-700 flex items-center gap-2 group"
        >
          View all posts
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {scoredPosts.map((post: any) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className="group"
          >
            <div className="glass rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
              {/* Featured Image */}
              {post.featured_image_url && (
                <div className="relative h-48 bg-gradient-to-br from-blue-100 to-purple-100 overflow-hidden">
                  <Image
                    src={post.featured_image_url}
                    alt={post.featured_image_alt || post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}

              <div className="p-6">
                {/* Category Badge */}
                {post.category && (
                  <span className="inline-block px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full mb-3">
                    {post.category}
                  </span>
                )}

                {/* Title */}
                <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>

                {/* Excerpt */}
                {post.excerpt && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>
                )}

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {post.read_time_minutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {post.read_time_minutes} min read
                    </div>
                  )}
                  {post.views > 0 && (
                    <div>{post.views.toLocaleString()} views</div>
                  )}
                </div>

                {/* Shared Tags Indicator (debug) */}
                {process.env.NODE_ENV === 'development' && post.score > 0 && (
                  <div className="mt-2 text-xs text-gray-400">
                    Match score: {post.score}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

