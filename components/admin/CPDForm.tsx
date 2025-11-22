'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/Provider';

interface CPDFormProps {
  articleId?: string;
}

export function CPDForm({ articleId }: CPDFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [cpdHours, setCpdHours] = useState<number>(0);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('intermediate');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // tRPC mutations
  const createArticle = trpc.cpd.create.useMutation();
  const updateArticle = trpc.cpd.update.useMutation();
  const deleteArticle = trpc.cpd.delete.useMutation();

  // Load existing article if editing
  const { data: existingArticle, isLoading: isLoadingArticle } = trpc.cpd.getById.useQuery(
    { id: articleId! },
    { enabled: !!articleId }
  );

  // Populate form when editing
  React.useEffect(() => {
    if (existingArticle) {
      setTitle(existingArticle.title || '');
      setSlug(existingArticle.slug || '');
      setExcerpt(existingArticle.excerpt || '');
      setContent(existingArticle.content || '');
      setFeaturedImage(existingArticle.featured_image_url || '');
      setFeaturedImageAlt(existingArticle.featured_image_alt || '');
      setCategory(existingArticle.category || '');
      setTags(existingArticle.tags?.join(', ') || '');
      setCpdHours(existingArticle.cpd_hours || 0);
      setDifficulty(existingArticle.difficulty_level || 'intermediate');
      setMetaTitle(existingArticle.seo_title || '');
      setMetaDescription(existingArticle.seo_description || '');
      setIsPublished(existingArticle.status === 'published');
    }
  }, [existingArticle]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!articleId && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  }, [title, articleId]);

  // Auto-generate meta fields
  useEffect(() => {
    if (!metaTitle && title) {
      setMetaTitle(title.substring(0, 60));
    }
    if (!metaDescription && excerpt) {
      setMetaDescription(excerpt.substring(0, 160));
    }
  }, [title, excerpt, metaTitle, metaDescription]);

  const handleSave = async () => {
    if (!title || !slug) {
      alert('Please fill in required fields (title and slug)');
      return;
    }

    setSaving(true);
    try {
      const articleData = {
        title,
        slug,
        excerpt: excerpt || undefined,
        content,
        featuredImage: featuredImage || undefined,
        featuredImageAlt: featuredImageAlt || undefined,
        category: category || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        cpdHours: cpdHours || undefined,
        difficulty: difficulty,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        isPublished,
      };

      if (articleId) {
        await updateArticle.mutateAsync({
          id: articleId,
          data: articleData,
        });
        alert('CPD article updated successfully!');
      } else {
        await createArticle.mutateAsync(articleData);
        alert('CPD article created successfully!');
      }
      
      router.push('/admin/cpd');
    } catch (error: any) {
      console.error('Error saving CPD article:', error);
      alert(`Failed to save CPD article: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!articleId) return;
    if (!confirm('Are you sure you want to delete this CPD article? This action cannot be undone.')) return;

    try {
      await deleteArticle.mutateAsync({ id: articleId });
      alert('CPD article deleted successfully!');
      router.push('/admin/cpd');
    } catch (error: any) {
      console.error('Error deleting CPD article:', error);
      alert(`Failed to delete CPD article: ${error?.message || 'Unknown error'}`);
    }
  };

  if (isLoadingArticle) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/cpd">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold">
            {articleId ? 'Edit CPD Article' : 'New CPD Article'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter post title..."
              required
            />
          </div>

          <div>
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="url-friendly-slug"
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              URL: /blog/{slug || 'your-slug-here'}
            </p>
          </div>

          <div>
            <Label htmlFor="excerpt">Excerpt</Label>
            <textarea
              id="excerpt"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Brief summary (160 characters recommended for SEO)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              maxLength={200}
            />
            <p className="text-sm text-gray-500 mt-1">
              {excerpt.length}/200 characters
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cpdHours">CPD Hours</Label>
              <Input
                id="cpdHours"
                type="number"
                value={cpdHours}
                onChange={(e) => setCpdHours(Number(e.target.value))}
                placeholder="e.g., 1.5"
                step="0.5"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., HMRC Updates"
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tax, hmrc, complaints (comma-separated)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Content</CardTitle>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Write your blog post content..."
            bucket="cpd-media"
          />
        </CardContent>
      </Card>

      {/* Featured Image */}
      <Card>
        <CardHeader>
          <CardTitle>Featured Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="featuredImage">Image URL</Label>
            <Input
              id="featuredImage"
              value={featuredImage}
              onChange={(e) => setFeaturedImage(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-sm text-gray-500 mt-1">
              Or upload via Media Library (coming soon)
            </p>
          </div>

          {featuredImage && (
            <div>
              <img
                src={featuredImage}
                alt="Featured image preview"
                className="max-w-md rounded-lg border"
              />
            </div>
          )}

          <div>
            <Label htmlFor="featuredImageAlt">Image Alt Text (for SEO)</Label>
            <Input
              id="featuredImageAlt"
              value={featuredImageAlt}
              onChange={(e) => setFeaturedImageAlt(e.target.value)}
              placeholder="Describe the image..."
            />
          </div>
        </CardContent>
      </Card>

      {/* SEO Settings */}
      <Card>
        <CardHeader>
          <CardTitle>SEO & Social Sharing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="metaTitle">Meta Title</Label>
            <Input
              id="metaTitle"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="SEO title (60 characters max)"
              maxLength={60}
            />
            <p className="text-sm text-gray-500 mt-1">
              {metaTitle.length}/60 characters
            </p>
          </div>

          <div>
            <Label htmlFor="metaDescription">Meta Description</Label>
            <textarea
              id="metaDescription"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="SEO description (160 characters max)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              maxLength={160}
            />
            <p className="text-sm text-gray-500 mt-1">
              {metaDescription.length}/160 characters
            </p>
          </div>

          {/* SEO Preview */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">Google Search Preview:</p>
            <div>
              <p className="text-blue-600 text-lg hover:underline cursor-pointer">
                {metaTitle || title || 'Your Post Title Here'}
              </p>
              <p className="text-green-700 text-sm">
                lightpoint.uk › blog › {slug || 'your-slug'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {metaDescription || excerpt || 'Your post description will appear here...'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Publishing */}
      <Card>
        <CardHeader>
          <CardTitle>Publishing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isPublished"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="isPublished" className="cursor-pointer">
              Publish immediately
            </Label>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {isPublished
              ? 'This post will be visible on your blog.'
              : 'This post will be saved as a draft.'}
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pb-8">
        <Button variant="outline" onClick={() => router.push('/admin/blog')}>
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          {articleId && (
            <Button 
              variant="outline" 
              className="text-red-600 hover:bg-red-50"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
          <Button onClick={handleSave} disabled={saving} size="lg">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : isPublished ? 'Publish' : 'Save Draft'}
          </Button>
        </div>
      </div>
    </div>
  );
}

