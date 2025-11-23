'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/Provider';
import { BookOpen, Clock, Award, Lock, Search, Filter } from 'lucide-react';
import { ResourcePageHeader } from '@/components/ResourcePageComponents';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function CPDPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data: posts, isLoading } = trpc.cms.listContentPosts.useQuery({
    contentType: 'cpd_article',
    status: 'published',
    limit: 50,
  });

  const { data: subscription } = trpc.subscription.getUserSubscription.useQuery();
  const hasAccess = subscription && ['professional', 'enterprise'].includes((subscription as any).tier?.name);

  const categories = [
    'all',
    'HMRC Updates',
    'Complaint Process',
    'Charter Breaches',
    'Fee Recovery',
    'Best Practices',
    'Case Studies'
  ];

  const filteredPosts = posts?.posts?.filter((post: any) => {
    const matchesSearch = !searchTerm || 
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || 
      post.tags?.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="space-y-8">
            <Skeleton className="h-12 w-64" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
      <ResourcePageHeader
        badge={{ icon: BookOpen, text: "Professional Development" }}
        title="CPD Library"
        description="Stay up-to-date with the latest HMRC procedures, complaint strategies, and industry best practices"
        gradient="from-purple-600 via-indigo-600 to-blue-600"
      />

      {/* Access Check */}
      {!hasAccess ? (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-200 rounded-2xl p-12 text-center">
            <div className="inline-flex p-4 bg-orange-100 rounded-full mb-6">
              <Lock className="h-12 w-12 text-orange-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Professional or Enterprise Required
            </h2>
            <p className="text-lg text-gray-700 mb-8 max-w-2xl mx-auto">
              Access our comprehensive CPD library with dozens of articles, training materials, and expert insights. 
              Upgrade to Professional or Enterprise tier to unlock this feature.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <Award className="mr-2 h-5 w-5" />
              Upgrade Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Search & Filter */}
          <div className="mb-12 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search CPD articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-lg"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-4 overflow-x-auto pb-2">
              <Filter className="h-5 w-5 text-gray-500 flex-shrink-0" />
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedCategory === category
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Articles Grid */}
          {!filteredPosts || filteredPosts.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'No articles match your filters. Try adjusting your search.'
                  : 'No CPD articles yet. Check back soon!'}
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((article: any) => (
                <Link
                  key={article.id}
                  href={`/cpd/${article.slug}`}
                  className="block group"
                >
                  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-indigo-200 hover:-translate-y-1 h-full flex flex-col">
                    {/* Category Badge */}
                    {article.tags && article.tags[0] && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 mb-4 self-start">
                        {article.tags[0]}
                      </span>
                    )}

                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-indigo-600 transition-colors">
                      {article.title}
                    </h3>

                    {/* Excerpt */}
                    {article.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-3 flex-grow">
                        {article.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>5 min read</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="h-4 w-4 text-indigo-600" />
                        <span className="text-indigo-600 font-medium">CPD</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="mt-16 grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
              <div className="text-4xl font-bold mb-2">{filteredPosts?.length || 0}</div>
              <div className="text-indigo-100">CPD Articles Available</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white">
              <div className="text-4xl font-bold mb-2">12+</div>
              <div className="text-purple-100">Hours of Content</div>
            </div>
            <div className="bg-gradient-to-br from-pink-500 to-red-600 rounded-2xl p-6 text-white">
              <div className="text-4xl font-bold mb-2">Updated</div>
              <div className="text-pink-100">Weekly</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

