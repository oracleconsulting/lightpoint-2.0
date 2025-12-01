'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Eye, Calendar, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/Provider';

export default function AdminBlogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Fetch blog posts
  const { data: postsData, isLoading, refetch } = trpc.blog.list.useQuery({
    status: filter,
    searchTerm: searchTerm || undefined,
    limit: 50,
    offset: 0,
  });

  const posts = postsData?.posts || [];
  const total = postsData?.total || 0;

  // Delete mutation
  const deletePost = trpc.blog.delete.useMutation({
    onSuccess: () => {
      alert('Post deleted successfully');
      void refetch();
    },
    onError: (error) => {
      alert(`Failed to delete post: ${error.message}`);
    },
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    await deletePost.mutateAsync({ id });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Blog Posts</h1>
          <p className="text-gray-600 mt-1">Manage your blog content</p>
        </div>
        <Link href="/admin/blog/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                All ({total})
              </Button>
              <Button
                variant={filter === 'published' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('published')}
              >
                Published ({posts.filter((p: any) => p.status === 'published').length})
              </Button>
              <Button
                variant={filter === 'draft' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('draft')}
              >
                Drafts ({posts.filter((p: any) => p.status === 'draft').length})
              </Button>
          </div>
        </div>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading posts...</p>
          </Card>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No posts found</p>
          </Card>
        ) : (
          posts.map((post: any) => (
            <Card key={post.id} className="p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-heading font-semibold">
                      {post.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        post.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{post.excerpt || 'No excerpt'}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>By Admin</span>
                    {post.published_at && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.published_at).toLocaleDateString()}
                        </span>
                      </>
                    )}
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {post.view_count || 0} views
                    </span>
                    {(post.like_count || 0) > 0 && (
                      <>
                        <span>•</span>
                        <span>❤️ {post.like_count}</span>
                      </>
                    )}
                    {(post.comment_count || 0) > 0 && (
                      <>
                        <span>•</span>
                        <span>💬 {post.comment_count}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {post.status === 'published' && (
                    <>
                      <Link href={`/blog/${post.slug}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/admin/social-content?blogPostId=${post.id}`}>
                        <Button variant="outline" size="sm" className="text-blue-600 hover:bg-blue-50">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </Link>
                    </>
                  )}
                  <Link href={`/admin/blog/edit/${post.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(post.id, post.title)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
