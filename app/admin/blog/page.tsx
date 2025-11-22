'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Plus, Trash2, Eye, EyeOff, Calendar, User, BookOpen } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  publishedAt: string;
  isPublished: boolean;
  tags: string[];
}

export default function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([
    {
      id: '1',
      title: 'Understanding HMRC Charter Breaches',
      slug: 'understanding-hmrc-charter-breaches',
      excerpt: 'Learn how to identify and document charter breaches for successful complaint resolution.',
      content: 'Full article content here...',
      author: 'James Howard',
      publishedAt: '2024-11-15',
      isPublished: true,
      tags: ['HMRC', 'Complaints', 'Charter'],
    },
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BlogPost>>({});

  const handleEdit = (post: BlogPost) => {
    setEditingId(post.id);
    setFormData(post);
  };

  const handleSave = () => {
    if (editingId && editingId !== 'new') {
      setPosts(posts.map(p => p.id === editingId ? { ...p, ...formData } as BlogPost : p));
      setEditingId(null);
      setFormData({});
    }
  };

  const handleAdd = () => {
    const newPost: BlogPost = {
      id: Date.now().toString(),
      title: formData.title || 'Untitled Post',
      slug: (formData.title || 'untitled').toLowerCase().replace(/\s+/g, '-'),
      excerpt: formData.excerpt || '',
      content: formData.content || '',
      author: formData.author || 'Admin',
      publishedAt: new Date().toISOString().split('T')[0],
      isPublished: false,
      tags: formData.tags || [],
    };
    setPosts([newPost, ...posts]);
    setFormData({});
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this blog post?')) {
      setPosts(posts.filter(p => p.id !== id));
    }
  };

  const togglePublish = (id: string) => {
    setPosts(posts.map(p => 
      p.id === id ? { ...p, isPublished: !p.isPublished } : p
    ));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Blog Posts</h1>
          <p className="text-gray-600 mt-2">Create and manage blog articles</p>
        </div>
        <Button onClick={() => setEditingId('new')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </div>

      {/* Editor */}
      {(editingId === 'new' || editingId) && (
        <Card className="border-brand-gold/30 shadow-lg">
          <CardHeader>
            <CardTitle>{editingId === 'new' ? 'Create New Post' : 'Edit Post'}</CardTitle>
            <CardDescription>Write and publish blog content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="Post title..."
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Excerpt</label>
              <textarea
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                placeholder="Short description for previews..."
                value={formData.excerpt || ''}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
              <textarea
                rows={10}
                className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold font-mono text-sm"
                placeholder="Full post content (markdown supported)..."
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Author</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  placeholder="Author name"
                  value={formData.author || ''}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-button focus:outline-none focus:ring-2 focus:ring-brand-gold"
                  placeholder="HMRC, Complaints, Tips"
                  value={formData.tags?.join(', ') || ''}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value.split(',').map(t => t.trim()) })}
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => { setEditingId(null); setFormData({}); }}>
                Cancel
              </Button>
              <Button onClick={editingId === 'new' ? handleAdd : handleSave}>
                <Save className="h-4 w-4 mr-2" />
                {editingId === 'new' ? 'Create Post' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Card key={post.id} className={`${!post.isPublished ? 'opacity-60' : ''} hover:shadow-lg transition-shadow`}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {post.isPublished ? (
                    <Eye className="h-4 w-4 text-brand-gold" aria-label="Published" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-gray-400" aria-label="Draft" />
                  )}
                  <span className="text-xs text-gray-500">
                    {post.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              <h3 className="font-heading text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {post.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{post.excerpt}</p>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {post.author}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {post.publishedAt}
                </div>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {post.tags.map((tag, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-button bg-brand-blurple/10 text-brand-blurple">
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => togglePublish(post.id)}
                  className="flex-1"
                >
                  {post.isPublished ? 'Unpublish' : 'Publish'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(post)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(post.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {posts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No blog posts yet</p>
            <Button onClick={() => setEditingId('new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Post
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
