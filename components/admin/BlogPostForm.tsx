'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/RichTextEditor';
import { MediaLibraryModal } from '@/components/MediaLibraryModal';
import { AILayoutGenerator } from '@/components/blog/AILayoutGenerator';
import { OneClickBlogGenerator } from '@/components/blog/OneClickBlogGenerator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ArrowLeft, Save, Eye, Trash2, Image, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/Provider';

interface BlogPostFormProps {
  postId?: string;
}

export function BlogPostForm({ postId }: BlogPostFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);
  const [generatingSEO, setGeneratingSEO] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [featuredImage, setFeaturedImage] = useState('');
  const [featuredImageAlt, setFeaturedImageAlt] = useState('');
  const [author, setAuthor] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [scheduledFor, setScheduledFor] = useState('');
  const [autoPublish, setAutoPublish] = useState(false);

  // tRPC mutations
  const createPost = trpc.blog.create.useMutation();
  const updatePost = trpc.blog.update.useMutation();
  const deletePost = trpc.blog.delete.useMutation();
  const generateSEO = trpc.blog.generateSEO.useMutation();

  // Load existing post if editing
  const { data: existingPost, isLoading: isLoadingPost } = trpc.blog.getById.useQuery(
    { id: postId! },
    { enabled: !!postId }
  );

  // Populate form when editing
  React.useEffect(() => {
    if (existingPost) {
      setTitle(existingPost.title || '');
      setSlug(existingPost.slug || '');
      setExcerpt(existingPost.excerpt || '');
      setContent(existingPost.content || '');
      setFeaturedImage(existingPost.featured_image_url || '');
      setFeaturedImageAlt(existingPost.featured_image_alt || '');
      setAuthor(existingPost.author || 'Admin'); // Populate author from existing post
      setCategory(existingPost.category || '');
      setTags(existingPost.tags?.join(', ') || '');
      setMetaTitle(existingPost.seo_title || '');
      setMetaDescription(existingPost.seo_description || '');
      setIsPublished(existingPost.status === 'published');
      
      // Scheduled publishing fields
      if (existingPost.scheduled_for) {
        const date = new Date(existingPost.scheduled_for);
        setScheduledFor(date.toISOString().slice(0, 16)); // Format for datetime-local
      }
      setAutoPublish(existingPost.auto_publish || false);
    }
  }, [existingPost]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!postId && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  }, [title, postId]);

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
      const postData = {
        title,
        slug,
        excerpt: excerpt || undefined,
        content,
        featuredImage: featuredImage || undefined,
        featuredImageAlt: featuredImageAlt || undefined,
        author: author || 'Admin',
        category: category || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        isPublished,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : undefined,
        autoPublish: autoPublish || undefined,
      };

      if (postId) {
        // Update existing post
        await updatePost.mutateAsync({
          id: postId,
          data: postData,
        });
        alert('Blog post updated successfully!');
      } else {
        // Create new post
        await createPost.mutateAsync(postData);
        alert('Blog post created successfully!');
      }
      
      router.push('/admin/blog');
    } catch (error: any) {
      console.error('Error saving blog post:', error);
      alert(`Failed to save blog post: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!postId) return;
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) return;

    try {
      await deletePost.mutateAsync({ id: postId });
      alert('Blog post deleted successfully!');
      router.push('/admin/blog');
    } catch (error: any) {
      console.error('Error deleting blog post:', error);
      alert(`Failed to delete blog post: ${error?.message || 'Unknown error'}`);
    }
  };

  const handlePreview = () => {
    if (!slug) {
      alert('Please add a URL slug before previewing');
      return;
    }
    // Open preview in new tab
    window.open(`/blog/${slug}?preview=true`, '_blank');
  };

  const handleGenerateSEO = async () => {
    if (!title || !content) {
      alert('Please add a title and content first');
      return;
    }

    setGeneratingSEO(true);
    try {
      const result = await generateSEO.mutateAsync({
        title,
        content: content.replace(/<[^>]*>/g, '').substring(0, 5000), // Strip HTML and limit length
        excerpt,
      });

      // Update SEO fields with AI-generated content
      if (result.metaTitle) setMetaTitle(result.metaTitle);
      if (result.metaDescription) setMetaDescription(result.metaDescription);
      if (result.suggestedTags) setTags(result.suggestedTags.join(', '));
      
      alert('SEO fields generated successfully!');
    } catch (error: any) {
      console.error('Error generating SEO:', error);
      alert(`Failed to generate SEO: ${error?.message || 'Unknown error'}`);
    } finally {
      setGeneratingSEO(false);
    }
  };

  if (isLoadingPost) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/blog">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold">
            {postId ? 'Edit Blog Post' : 'New Blog Post'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      {/* ONE-CLICK AI GENERATOR (Only show for new posts) */}
      {!postId && !title && (
        <OneClickBlogGenerator
          onGenerated={(blogPost) => {
            // Populate all form fields with AI-generated content
            setTitle(blogPost.title || '');
            setSlug(blogPost.slug || '');
            setExcerpt(blogPost.excerpt || '');
            // Convert structured content to HTML for now
            setContent(JSON.stringify(blogPost.content, null, 2));
            setFeaturedImage(blogPost.featuredImage || '');
            setCategory(blogPost.category || '');
            setTags(blogPost.tags?.join(', ') || '');
            setMetaTitle(blogPost.seoTitle || '');
            setMetaDescription(blogPost.seoDescription || '');
            
            alert('✅ Blog post generated! Review and customize the content below, then click Save.');
          }}
        />
      )}

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

          <div>
            <Label htmlFor="author">Author *</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
              required
            />
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
            bucket="blog-images"
          />
        </CardContent>
      </Card>

      {/* AI Layout Generator */}
      <Card>
        <CardHeader>
          <CardTitle>✨ AI-Powered Visual Layout</CardTitle>
        </CardHeader>
        <CardContent>
          <AILayoutGenerator
            title={title}
            content={content}
            excerpt={excerpt}
            onLayoutGenerated={(layout) => {
              // Store the AI-generated layout as JSON in the content field
              // In future, we'll have a dedicated field for structured content
              console.log('AI Generated Layout:', layout);
              alert('Layout generated! This will be integrated with the content editor in the next phase.');
              // For now, we can optionally convert it to HTML and append
              // setContent(prev => prev + '\n\n<!-- AI Generated Layout -->\n' + JSON.stringify(layout, null, 2));
            }}
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
            <Label htmlFor="featuredImage">Featured Image</Label>
            <div className="flex gap-2">
              <Input
                id="featuredImage"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="https://..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMediaLibrary(true)}
              >
                <Image className="h-4 w-4 mr-2" />
                Browse
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Upload or select from media library
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
          <div className="flex items-center justify-between">
            <CardTitle>SEO & Social Sharing</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSEO}
              disabled={generatingSEO || !title || !content}
            >
              {generatingSEO ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate SEO
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            AI will analyze your content and generate optimized meta fields and tags
          </p>
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
        <CardContent className="space-y-4">
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
          <p className="text-sm text-gray-500">
            {isPublished
              ? 'This post will be visible on your blog.'
              : 'This post will be saved as a draft.'}
          </p>

          {/* Scheduled Publishing */}
          {!isPublished && (
            <div className="border-t pt-4 space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="autoPublish"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label htmlFor="autoPublish" className="cursor-pointer">
                  Schedule for automatic publishing
                </Label>
              </div>

              {autoPublish && (
                <div>
                  <Label htmlFor="scheduledFor">Publish Date & Time</Label>
                  <Input
                    type="datetime-local"
                    id="scheduledFor"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    {scheduledFor ? (
                      <>
                        📅 This post will automatically publish on{' '}
                        <strong>{new Date(scheduledFor).toLocaleString()}</strong>
                      </>
                    ) : (
                      'Select when this post should be automatically published'
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pb-8">
        <Button variant="outline" onClick={() => router.push('/admin/blog')}>
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          {postId && (
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

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={showMediaLibrary}
        onClose={() => setShowMediaLibrary(false)}
        onSelect={(url) => {
          setFeaturedImage(url);
          setShowMediaLibrary(false);
        }}
        bucket="blog-images"
      />
    </div>
  );
}

