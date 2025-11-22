'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search, Edit, Trash2, Eye, Calendar, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { trpc } from '@/lib/trpc/Provider';

export default function AdminCPDPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Fetch CPD articles
  const { data: articlesData, isLoading, refetch } = trpc.cpd.list.useQuery({
    status: filter,
    searchTerm: searchTerm || undefined,
    limit: 50,
    offset: 0,
  });

  const articles = articlesData?.articles || [];
  const total = articlesData?.total || 0;

  // Delete mutation
  const deleteArticle = trpc.cpd.delete.useMutation({
    onSuccess: () => {
      alert('Article deleted successfully');
      void refetch();
    },
    onError: (error) => {
      alert(`Failed to delete article: ${error.message}`);
    },
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return;
    await deleteArticle.mutateAsync({ id });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">CPD Articles</h1>
          <p className="text-gray-600 mt-1">Manage CPD content and learning materials</p>
        </div>
        <Link href="/admin/cpd/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Article
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
              placeholder="Search articles..."
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
              Published ({articles.filter((a: any) => a.status === 'published').length})
            </Button>
            <Button
              variant={filter === 'draft' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('draft')}
            >
              Drafts ({articles.filter((a: any) => a.status === 'draft').length})
            </Button>
          </div>
        </div>
      </Card>

      {/* Articles List */}
      <div className="space-y-4">
        {isLoading ? (
          <Card className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading articles...</p>
          </Card>
        ) : articles.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No articles found</p>
          </Card>
        ) : (
          articles.map((article: any) => (
            <Card key={article.id} className="p-6 hover:shadow-lg transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-heading font-semibold">
                      {article.title}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        article.status === 'published'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {article.status}
                    </span>
                    {article.difficulty_level && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                        {article.difficulty_level}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-3">{article.excerpt || 'No excerpt'}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {article.cpd_hours && (
                      <>
                        <span className="flex items-center gap-1">
                          <Award className="h-4 w-4" />
                          {article.cpd_hours} CPD hours
                        </span>
                        <span>•</span>
                      </>
                    )}
                    {article.published_at && (
                      <>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(article.published_at).toLocaleDateString()}
                        </span>
                      </>
                    )}
                    {article.view_count > 0 && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {article.view_count} views
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {article.status === 'published' && (
                    <Link href={`/cpd/${article.slug}`} target="_blank">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                  <Link href={`/admin/cpd/edit/${article.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(article.id, article.title)}
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
