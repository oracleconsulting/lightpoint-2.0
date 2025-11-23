'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { trpc } from '@/lib/trpc/Provider';
import { ArrowRight, Calendar, Clock, Tag, Sparkles, BookOpen } from 'lucide-react';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function BlogPage() {
  const { data: posts, isLoading } = trpc.cms.listContentPosts.useQuery({
    contentType: 'blog_post',
    status: 'published',
    limit: 20,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="space-y-8">
            <Skeleton className="h-12 w-64" />
            <div className="grid gap-8">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/30 mb-6 bg-white/10">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-semibold">Expert Insights</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">
              Lightpoint Blog
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Expert insights on HMRC complaints, tax compliance, and fee recovery for UK accountants
            </p>
          </motion.div>
        </div>
      </div>

      {/* Blog Posts */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {!posts?.posts || posts.posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.posts.map((post: any, index: number) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="block group"
                >
                  <article className="glass rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 hover:-translate-y-2">
                    <div className="md:flex">
                    {/* Featured Image */}
                    {post.featured_image_url && (
                      <div className="md:w-1/3 h-64 md:h-auto relative overflow-hidden">
                        <img
                          src={post.featured_image_url}
                          alt={post.title}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Content */}
                    <div className={`p-8 ${post.featured_image_url ? 'md:w-2/3' : 'w-full'}`}>
                      {/* Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.slice(0, 3).map((tag: string) => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"
                            >
                              <Tag className="h-3 w-3 mr-1" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Title */}
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                        {post.title}
                      </h2>

                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-gray-600 text-lg mb-4 line-clamp-3">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(post.published_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>

                        {post.view_count > 0 && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{post.view_count} views</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-blue-600 font-medium group-hover:gap-3 transition-all">
                          <span>Read more</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination (if needed) */}
        {posts && posts.total > 20 && (
          <div className="mt-12 flex justify-center">
            <nav className="flex gap-2">
              <button className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                Previous
              </button>
              <button className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
                1
              </button>
              <button className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                2
              </button>
              <button className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50">
                Next
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* CTA Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/30 mb-6 bg-white/10">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-semibold">Ready to get started?</span>
          </div>
          <h2 className="text-3xl font-heading font-bold mb-4">
            Transform Your HMRC Complaints Today
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join the waitlist to be among the first firms using Lightpoint
          </p>
          <Link
            href="/waitlist"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all btn-hover"
          >
            Join Waitlist
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

