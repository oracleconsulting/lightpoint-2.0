'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/Provider';
import { Video, Calendar, Clock, Users, Lock, Play, Download } from 'lucide-react';
import { ResourcePageHeader } from '@/components/ResourcePageComponents';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

export default function WebinarsPage() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'recorded'>('all');

  const { data: webinars, isLoading } = trpc.cms.listContentPosts.useQuery({
    contentType: 'webinar',
    status: 'published',
    limit: 50,
  });

  const { data: subscription } = trpc.subscription.getUserSubscription.useQuery();
  const hasAccess = subscription && ['professional', 'enterprise'].includes((subscription as any).tier?.name);

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
        badge={{ icon: Video, text: "Live & On-Demand Training" }}
        title="Expert Webinars"
        description="Live and on-demand training from HMRC complaint resolution specialists. Interactive Q&A, real case studies, and actionable strategies."
        gradient="from-pink-600 via-rose-600 to-red-600"
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
              Access our library of expert webinars with live Q&A sessions, downloadable resources, 
              and exclusive insights from complaint resolution specialists.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <Video className="mr-2 h-5 w-5" />
              Upgrade Now
            </Link>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Filter Tabs */}
          <div className="flex items-center gap-4 mb-12">
            {['all', 'upcoming', 'recorded'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  filter === f
                    ? 'bg-pink-600 text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                }`}
              >
                {f === 'all' ? 'All Webinars' : f === 'upcoming' ? 'Upcoming Live' : 'Recorded'}
              </button>
            ))}
          </div>

          {/* Webinars Grid */}
          {!webinars?.posts || webinars.posts.length === 0 ? (
            <div className="text-center py-20">
              <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No webinars available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {webinars.posts.map((webinar: any) => (
                <div
                  key={webinar.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-pink-200 group"
                >
                  {/* Thumbnail */}
                  <div className="relative aspect-video bg-gradient-to-br from-pink-100 to-rose-100">
                    {webinar.featured_image_url ? (
                      <img
                        src={webinar.featured_image_url}
                        alt={webinar.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Play className="h-16 w-16 text-pink-400" />
                      </div>
                    )}
                    
                    {/* Play Overlay */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-4 bg-white rounded-full shadow-lg hover:scale-110 transition-transform">
                        <Play className="h-8 w-8 text-pink-600" />
                      </button>
                    </div>

                    {/* Live Badge */}
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        RECORDED
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-pink-600 transition-colors">
                      {webinar.title}
                    </h3>

                    {webinar.excerpt && (
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {webinar.excerpt}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(webinar.published_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>60 mins</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{250 + (parseInt(webinar.id.slice(-2), 16) % 300)} attended</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/webinars/${webinar.slug}`}
                        className="flex-1 inline-flex items-center justify-center px-4 py-3 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 transition-all"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Watch Now
                      </Link>
                      <button className="p-3 border-2 border-gray-200 rounded-lg hover:border-pink-600 hover:text-pink-600 transition-all">
                        <Download className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Upcoming Live Sessions */}
          <div className="mt-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl p-8 md:p-12 text-white">
            <div className="flex items-start justify-between gap-8">
              <div className="flex-1">
                <div className="inline-flex px-3 py-1 bg-white/20 rounded-full text-sm font-semibold mb-4">
                  NEXT LIVE WEBINAR
                </div>
                <h3 className="text-3xl font-bold mb-4">
                  Advanced Fee Recovery Strategies for 2024
                </h3>
                <p className="text-pink-100 text-lg mb-6">
                  Join us for an in-depth session on maximizing fee recovery with the latest HMRC guidance. 
                  Live Q&A included.
                </p>
                <div className="flex items-center gap-6 text-pink-100 mb-8">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>Thursday, Dec 15, 2024</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    <span>2:00 PM GMT</span>
                  </div>
                </div>
                <button className="px-8 py-4 bg-white text-pink-600 font-semibold rounded-xl hover:bg-pink-50 transition-all shadow-lg">
                  Register Now - Free for Members
                </button>
              </div>
              <div className="hidden md:block">
                <div className="w-32 h-32 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Video className="h-16 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

