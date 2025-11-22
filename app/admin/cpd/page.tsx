'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Plus, Trash2, Eye, EyeOff, Award, Clock } from 'lucide-react';

interface CPDArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  duration: number; // minutes
  tier: string;
  isPublished: boolean;
  createdAt: string;
}

export default function CPDManagement() {
  const [articles, setArticles] = useState<CPDArticle[]>([
    {
      id: '1',
      title: 'Understanding HMRC Charter Rights',
      category: 'Fundamentals',
      content: 'A comprehensive guide to taxpayer rights under the HMRC Charter...',
      duration: 15,
      tier: 'Professional',
      isPublished: true,
      createdAt: '2024-11-01',
    },
    {
      id: '2',
      title: 'Advanced Complaint Resolution Techniques',
      category: 'Advanced',
      content: 'Learn advanced strategies for complex HMRC complaints...',
      duration: 30,
      tier: 'Enterprise',
      isPublished: true,
      createdAt: '2024-11-10',
    },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<CPDArticle>>({});

  const categories = ['Fundamentals', 'Intermediate', 'Advanced', 'Case Studies', 'Updates'];
  const tiers = ['Free', 'Professional', 'Enterprise'];

  const handleEdit = (article: CPDArticle) => {
    setEditingId(article.id);
    setFormData(article);
  };

  const handleSave = () => {
    if (editingId && editingId !== 'new') {
      setArticles(articles.map(a => a.id === editingId ? { ...a, ...formData } as CPDArticle : a));
      setEditingId(null);
      setFormData({});
    }
  };

  const handleAdd = () => {
    const newArticle: CPDArticle = {
      id: Date.now().toString(),
      title: formData.title || 'Untitled Article',
      category: formData.category || 'Fundamentals',
      content: formData.content || '',
      duration: formData.duration || 10,
      tier: formData.tier || 'Professional',
      isPublished: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setArticles([newArticle, ...articles]);
    setFormData({});
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this CPD article?')) {
      setArticles(articles.filter(a => a.id !== id));
    }
  };

  const togglePublish = (id: string) => {
    setArticles(articles.map(a => 
      a.id === id ? { ...a, isPublished: !a.isPublished } : a
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">CPD Articles</h1>
          <p className="text-gray-600 mt-2">Continuing Professional Development content for subscribers</p>
        </div>
        <Button onClick={() => setEditingId('new')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Article
        </Button>
      </div>

      {/* Editor */}
      {(editingId === 'new' || editingId) && (
        <Card className="border-brand-gold/30 shadow-lg">
          <CardHeader>
            <CardTitle>{editingId === 'new' ? 'Create CPD Article' : 'Edit Article'}</CardTitle>
            <CardDescription>Professional development content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="Article title..."
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  value={formData.category || ''}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  value={formData.duration || ''}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Required Tier</label>
                <select
                  className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  value={formData.tier || ''}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                >
                  {tiers.map(tier => (
                    <option key={tier} value={tier}>{tier}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                rows={12}
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold font-mono text-sm"
                placeholder="Article content (markdown supported)..."
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => { setEditingId(null); setFormData({}); }}>
                Cancel
              </Button>
              <Button onClick={editingId === 'new' ? handleAdd : handleSave}>
                <Save className="h-4 w-4 mr-2" />
                {editingId === 'new' ? 'Create' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Articles Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Card key={article.id} className={`${!article.isPublished ? 'opacity-60' : ''} hover:shadow-lg transition-shadow`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {article.isPublished ? (
                    <Eye className="h-4 w-4 text-brand-gold" aria-label="Published" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" aria-label="Draft" />
                  )}
                  <span className="text-xs px-2 py-1 rounded-button bg-brand-blurple/10 text-brand-blurple">
                    {article.category}
                  </span>
                </div>
                <Award className="h-5 w-5 text-brand-gold" />
              </div>

              <h3 className="font-heading text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {article.title}
              </h3>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {article.duration} min
                </div>
                <div className="px-2 py-0.5 rounded-button bg-brand-gold/10 text-brand-gold font-medium">
                  {article.tier}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePublish(article.id)}
                  className="flex-1"
                >
                  {article.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(article)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(article.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {articles.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No CPD articles yet</p>
            <Button onClick={() => setEditingId('new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Article
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
