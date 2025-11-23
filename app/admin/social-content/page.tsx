'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  RefreshCw, 
  Twitter, 
  Linkedin, 
  Facebook, 
  Calendar,
  Send,
  Edit2,
  Check,
  X,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Eye,
  ThumbsUp,
  MousePointerClick,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Social Content Manager
 * 
 * Main admin interface for managing AI-generated social media content
 * Features:
 * - Generate AI content for all platforms
 * - Review and edit variants
 * - Approve and schedule posts
 * - Track analytics
 */

export default function SocialContentManagerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const blogPostId = searchParams.get('blogPostId');

  const [generating, setGenerating] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'twitter' | 'linkedin' | 'facebook' | 'instagram'>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'draft' | 'approved' | 'scheduled' | 'published'>('all');

  // Fetch blog posts (for selection)
  const { data: blogPosts, isLoading: loadingBlogPosts } = trpc.blog.list.useQuery({
    status: 'published',
    limit: 50,
  });

  // Fetch social content for selected blog post
  const { data: socialContent, refetch: refetchSocialContent, isLoading: loadingSocialContent } = trpc.socialContent.listByBlogPost.useQuery(
    {
      blogPostId: blogPostId!,
      platform: selectedPlatform === 'all' ? undefined : selectedPlatform,
      status: selectedStatus === 'all' ? undefined : selectedStatus,
    },
    { enabled: !!blogPostId }
  );

  // Fetch analytics
  const { data: analytics } = trpc.socialContent.getAnalytics.useQuery(
    { blogPostId: blogPostId! },
    { enabled: !!blogPostId }
  );

  // Mutations
  const generateMultiPlatform = trpc.socialContent.generateMultiPlatform.useMutation();

  const handleGenerate = async () => {
    if (!blogPostId) return;

    setGenerating(true);
    try {
      const result = await generateMultiPlatform.mutateAsync({
        blogPostId,
        platforms: ['twitter', 'linkedin', 'instagram'],
        variantsPerPlatform: 3,
        useDripCampaign: true,
      });

      alert(`✨ Generated ${result.generated} social posts!\n\nTwitter: ${result.byPlatform.twitter || 0}\nLinkedIn: ${result.byPlatform.linkedin || 0}\nInstagram: ${result.byPlatform.instagram || 0}\n\nCost: £0 (using OpenRouter)`);
      
      refetchSocialContent();
    } catch (error: any) {
      alert(`Failed to generate content: ${error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const selectedBlogPost = blogPosts?.posts?.find((p: any) => p.id === blogPostId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🤖 AI Social Content Manager
              </h1>
              <p className="text-gray-600 mt-2">
                Generate, review, and schedule social media content for your blog posts
              </p>
            </div>

            <Link href="/admin/blog">
              <Button variant="outline">
                ← Back to Blog
              </Button>
            </Link>
          </div>
        </div>

        {/* Blog Post Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Select Blog Post</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingBlogPosts ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <select
                value={blogPostId || ''}
                onChange={(e) => router.push(`/admin/social-content?blogPostId=${e.target.value}`)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">-- Select a blog post --</option>
                {blogPosts?.posts?.map((post: any) => (
                  <option key={post.id} value={post.id}>
                    {post.title} ({new Date(post.published_at).toLocaleDateString()})
                  </option>
                ))}
              </select>
            )}

            {selectedBlogPost && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900">{selectedBlogPost.title}</h3>
                <p className="text-sm text-blue-700 mt-1">{selectedBlogPost.excerpt}</p>
                <div className="flex items-center gap-4 mt-2 text-sm text-blue-600">
                  <span>📖 {selectedBlogPost.read_time_minutes} min read</span>
                  <span>👁️ {selectedBlogPost.views} views</span>
                  {selectedBlogPost.category && <span>📁 {selectedBlogPost.category}</span>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!blogPostId ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Sparkles className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Select a blog post to get started
              </h3>
              <p className="text-gray-600">
                Choose a published blog post from the dropdown above to generate AI-powered social media content
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Analytics Summary */}
            {analytics && (analytics.total_impressions > 0 || (socialContent?.posts && socialContent.posts.length > 0)) && (
              <Card className="mb-8 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-600" />
                    Campaign Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Eye className="h-4 w-4" />
                        <span className="text-sm">Impressions</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics.total_impressions?.toLocaleString() || 0}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">Engagements</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics.total_engagements?.toLocaleString() || 0}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <MousePointerClick className="h-4 w-4" />
                        <span className="text-sm">Clicks</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics.total_clicks?.toLocaleString() || 0}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <Share2 className="h-4 w-4" />
                        <span className="text-sm">Engagement Rate</span>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">
                        {analytics.engagement_rate?.toFixed(2) || 0}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generate Content Section */}
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    AI Content Generation
                  </CardTitle>

                  <Button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
                    {generating ? 'Generating...' : 'Generate AI Content'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Click "Generate AI Content" to create 3 optimized variants for each platform (Twitter, LinkedIn, Instagram) using OpenRouter (Claude).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <Twitter className="h-6 w-6 text-blue-500" />
                    <div>
                      <p className="font-semibold text-gray-900">Twitter</p>
                      <p className="text-sm text-gray-600">Punchy, 280 chars</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                    <Linkedin className="h-6 w-6 text-blue-700" />
                    <div>
                      <p className="font-semibold text-gray-900">LinkedIn</p>
                      <p className="text-sm text-gray-600">Professional, detailed</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg">
                    <div className="h-6 w-6 rounded bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500" />
                    <div>
                      <p className="font-semibold text-gray-900">Instagram</p>
                      <p className="text-sm text-gray-600">Visual, inspiring</p>
                    </div>
                  </div>
                </div>

                {generating && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⏳ AI is analyzing your blog post and generating platform-optimized content... This usually takes 10-15 seconds.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Filters */}
            {socialContent && socialContent.posts.length > 0 && (
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Platform:</label>
                  <select
                    value={selectedPlatform}
                    onChange={(e) => setSelectedPlatform(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Platforms</option>
                    <option value="twitter">Twitter</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="instagram">Instagram</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">Status:</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="approved">Approved</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="published">Published</option>
                  </select>
                </div>

                <div className="ml-auto text-sm text-gray-600">
                  {socialContent?.posts?.length || 0} post{socialContent?.posts?.length !== 1 ? 's' : ''}
                </div>
              </div>
            )}

            {/* Social Content Grid */}
            {loadingSocialContent ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : socialContent && socialContent.posts && socialContent.posts.length > 0 ? (
              <div className="space-y-4">
                {['twitter', 'linkedin', 'instagram'].map((platform) => {
                  const platformPosts = socialContent.posts?.filter(
                    (p: any) => p.platform === platform
                  ) || [];

                  if (platformPosts.length === 0 && selectedPlatform !== 'all') return null;
                  if (platformPosts.length === 0) return null;

                  return (
                    <PlatformSection
                      key={platform}
                      platform={platform as any}
                      posts={platformPosts}
                      onRefresh={refetchSocialContent}
                    />
                  );
                })}
              </div>
            ) : (
              <Card>
                <CardContent className="py-16 text-center">
                  <Sparkles className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No social content yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Click "Generate AI Content" above to create your first social media posts
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Platform Section - Groups posts by platform
 */
function PlatformSection({ 
  platform, 
  posts, 
  onRefresh 
}: { 
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  posts: any[];
  onRefresh: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const platformConfig = {
    twitter: {
      icon: Twitter,
      name: 'Twitter',
      color: 'blue-500',
      bgColor: 'blue-50',
    },
    linkedin: {
      icon: Linkedin,
      name: 'LinkedIn',
      color: 'blue-700',
      bgColor: 'blue-50',
    },
    facebook: {
      icon: Facebook,
      name: 'Facebook',
      color: 'blue-600',
      bgColor: 'blue-50',
    },
    instagram: {
      icon: () => <div className="h-6 w-6 rounded bg-gradient-to-br from-pink-500 via-purple-500 to-orange-500" />,
      name: 'Instagram',
      color: 'pink-500',
      bgColor: 'gradient-to-br from-pink-50 to-purple-50',
    },
  };

  const config = platformConfig[platform];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-${config.bgColor} rounded-lg`}>
              <Icon className={`h-6 w-6 text-${config.color}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">{config.name}</h3>
              <p className="text-sm text-gray-600">{posts.length} variant{posts.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="space-y-4">
            {posts.map((post: any) => (
              <SocialPostCard
                key={post.id}
                post={post}
                platform={platform}
                onRefresh={onRefresh}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

/**
 * Social Post Card - Individual post with actions
 */
function SocialPostCard({ 
  post, 
  platform,
  onRefresh 
}: { 
  post: any;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram';
  onRefresh: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(post.content);
  const [scheduledFor, setScheduledFor] = useState('');

  const approveAndSchedule = trpc.socialContent.approveAndSchedule.useMutation();

  const handleApprove = async (schedule: boolean = false) => {
    try {
      await approveAndSchedule.mutateAsync({
        socialPostId: post.id,
        scheduledFor: schedule && scheduledFor ? scheduledFor : undefined,
        edits: isEditing ? { content: editedContent } : undefined,
      });

      alert(`✅ Post ${schedule ? 'scheduled' : 'approved'}!`);
      onRefresh();
      setIsEditing(false);
    } catch (error: any) {
      alert(`Failed: ${error.message}`);
    }
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    approved: 'bg-green-100 text-green-700',
    scheduled: 'bg-blue-100 text-blue-700',
    published: 'bg-purple-100 text-purple-700',
    failed: 'bg-red-100 text-red-700',
  };

  return (
    <div className="border rounded-lg p-4 bg-white hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">
            Variant {post.content_variant}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[post.status]}`}>
            {post.status}
          </span>
          {post.ai_generated && (
            <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Generated
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {post.status === 'draft' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleApprove(false)}
                className="text-green-600 hover:bg-green-50"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </>
          )}
          {post.scheduled_for && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Clock className="h-3 w-3" />
              {new Date(post.scheduled_for).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      {isEditing ? (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 min-h-[120px]"
        />
      ) : (
        <p className="text-gray-800 whitespace-pre-wrap mb-3">
          {post.content}
        </p>
      )}

      {/* Meta */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
        <div className="flex items-center gap-4">
          <span>{post.content.length} characters</span>
          {post.hashtags && post.hashtags.length > 0 && (
            <span>{post.hashtags.length} hashtags</span>
          )}
          {post.generation_metrics?.cost && (
            <span>£{(post.generation_metrics.cost * 0.79).toFixed(3)}</span>
          )}
        </div>

        {post.status === 'draft' && (
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="px-2 py-1 border rounded text-xs"
            />
            <Button
              size="sm"
              onClick={() => handleApprove(true)}
              disabled={!scheduledFor}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Calendar className="h-3 w-3 mr-1" />
              Schedule
            </Button>
          </div>
        )}
      </div>

      {/* Analytics (if published) */}
      {post.status === 'published' && (post.impressions > 0 || post.engagements > 0) && (
        <div className="mt-3 pt-3 border-t grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-xs text-gray-500">Impressions</p>
            <p className="text-lg font-semibold">{post.impressions.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Engagements</p>
            <p className="text-lg font-semibold">{post.engagements.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Clicks</p>
            <p className="text-lg font-semibold">{post.clicks.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Shares</p>
            <p className="text-lg font-semibold">{post.shares.toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}

