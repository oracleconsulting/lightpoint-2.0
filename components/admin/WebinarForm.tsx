'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RichTextEditor } from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Eye, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { trpc } from '@/lib/trpc/Provider';

interface WebinarFormProps {
  webinarId?: string;
}

export function WebinarForm({ webinarId }: WebinarFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [webinarType, setWebinarType] = useState<'live' | 'recorded'>('recorded');
  const [status, setStatus] = useState<'upcoming' | 'live' | 'completed' | 'cancelled'>('upcoming');
  const [scheduledDate, setScheduledDate] = useState('');
  const [duration, setDuration] = useState<number>(60);
  const [videoUrl, setVideoUrl] = useState('');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamKey, setStreamKey] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [speakerName, setSpeakerName] = useState('');
  const [speakerBio, setSpeakerBio] = useState('');
  const [speakerAvatar, setSpeakerAvatar] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [maxAttendees, setMaxAttendees] = useState<number>(0);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // tRPC mutations
  const createWebinar = trpc.webinars.create.useMutation();
  const updateWebinar = trpc.webinars.update.useMutation();
  const deleteWebinar = trpc.webinars.delete.useMutation();

  // Load existing webinar if editing
  const { data: existingWebinar, isLoading: isLoadingWebinar } = trpc.webinars.getById.useQuery(
    { id: webinarId! },
    { enabled: !!webinarId }
  );

  // Populate form when editing
  React.useEffect(() => {
    if (existingWebinar) {
      setTitle(existingWebinar.title || '');
      setSlug(existingWebinar.slug || '');
      setDescription(existingWebinar.description || '');
      setContent(existingWebinar.content || '');
      setWebinarType(existingWebinar.webinar_type || 'recorded');
      setStatus(existingWebinar.status || 'upcoming');
      setScheduledDate(existingWebinar.scheduled_date ? new Date(existingWebinar.scheduled_date).toISOString().slice(0, 16) : '');
      setDuration(existingWebinar.duration_minutes || 60);
      setVideoUrl(existingWebinar.video_url || '');
      setStreamUrl(existingWebinar.stream_url || '');
      setStreamKey(existingWebinar.stream_key || '');
      setThumbnailUrl(existingWebinar.thumbnail_url || '');
      setSpeakerName(existingWebinar.speaker_name || '');
      setSpeakerBio(existingWebinar.speaker_bio || '');
      setSpeakerAvatar(existingWebinar.speaker_avatar_url || '');
      setCategory(existingWebinar.category || '');
      setTags(existingWebinar.tags?.join(', ') || '');
      setMaxAttendees(existingWebinar.max_attendees || 0);
      setMetaTitle(existingWebinar.seo_title || '');
      setMetaDescription(existingWebinar.seo_description || '');
      setIsPublished(existingWebinar.is_published);
    }
  }, [existingWebinar]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!webinarId && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  }, [title, webinarId]);

  // Auto-generate meta fields
  useEffect(() => {
    if (!metaTitle && title) {
      setMetaTitle(title.substring(0, 60));
    }
    if (!metaDescription && description) {
      setMetaDescription(description.substring(0, 160));
    }
  }, [title, description, metaTitle, metaDescription]);

  const handleSave = async () => {
    if (!title || !slug) {
      alert('Please fill in required fields (title and slug)');
      return;
    }

    setSaving(true);
    try {
      const webinarData = {
        title,
        slug,
        description: description || undefined,
        content,
        webinarType,
        status,
        scheduledDate: scheduledDate || undefined,
        duration: duration || undefined,
        videoUrl: videoUrl || undefined,
        streamUrl: streamUrl || undefined,
        streamKey: streamKey || undefined,
        thumbnailUrl: thumbnailUrl || undefined,
        speakerName: speakerName || undefined,
        speakerBio: speakerBio || undefined,
        speakerAvatar: speakerAvatar || undefined,
        category: category || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        maxAttendees: maxAttendees || undefined,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        isPublished,
      };

      if (webinarId) {
        await updateWebinar.mutateAsync({
          id: webinarId,
          data: webinarData,
        });
        alert('Webinar updated successfully!');
      } else {
        await createWebinar.mutateAsync(webinarData);
        alert('Webinar created successfully!');
      }
      
      router.push('/admin/webinars');
    } catch (error: any) {
      console.error('Error saving webinar:', error);
      alert(`Failed to save webinar: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!webinarId) return;
    if (!confirm('Are you sure you want to delete this webinar? This action cannot be undone.')) return;

    try {
      await deleteWebinar.mutateAsync({ id: webinarId });
      alert('Webinar deleted successfully!');
      router.push('/admin/webinars');
    } catch (error: any) {
      console.error('Error deleting webinar:', error);
      alert(`Failed to delete webinar: ${error?.message || 'Unknown error'}`);
    }
  };

  if (isLoadingWebinar) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading webinar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/webinars">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold">
            {webinarId ? 'Edit Webinar' : 'New Webinar'}
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
              placeholder="Enter webinar title..."
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
              URL: /webinars/{slug || 'your-slug-here'}
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary (160 characters recommended for SEO)..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              maxLength={200}
            />
            <p className="text-sm text-gray-500 mt-1">
              {description.length}/200 characters
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="webinarType">Webinar Type</Label>
              <select
                id="webinarType"
                value={webinarType}
                onChange={(e) => setWebinarType(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="recorded">Recorded</option>
                <option value="live">Live</option>
              </select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="upcoming">Upcoming</option>
                <option value="live">Live Now</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="scheduledDate">Scheduled Date/Time</Label>
              <Input
                id="scheduledDate"
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                placeholder="e.g., 60"
                min="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Tax Updates"
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tax, webinar, hmrc (comma-separated)"
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
            placeholder="Write webinar details..."
            bucket="webinar-videos"
          />
        </CardContent>
      </Card>

      {/* Video/Stream Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Video & Streaming</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="videoUrl">Video URL (for recorded webinars)</Label>
            <Input
              id="videoUrl"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
            />
            <p className="text-sm text-gray-500 mt-1">
              YouTube, Vimeo, or Cloudflare Stream URL
            </p>
          </div>

          <div>
            <Label htmlFor="streamUrl">Stream URL (for live webinars)</Label>
            <Input
              id="streamUrl"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="rtmp://..."
            />
          </div>

          <div>
            <Label htmlFor="streamKey">Stream Key (for live webinars)</Label>
            <Input
              id="streamKey"
              type="password"
              value={streamKey}
              onChange={(e) => setStreamKey(e.target.value)}
              placeholder="Enter stream key..."
            />
          </div>

          <div>
            <Label htmlFor="thumbnailUrl">Thumbnail URL</Label>
            <Input
              id="thumbnailUrl"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {thumbnailUrl && (
            <div>
              <img
                src={thumbnailUrl}
                alt="Thumbnail preview"
                className="max-w-md rounded-lg border"
              />
            </div>
          )}

          <div>
            <Label htmlFor="maxAttendees">Max Attendees (0 = unlimited)</Label>
            <Input
              id="maxAttendees"
              type="number"
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(Number(e.target.value))}
              placeholder="e.g., 100"
              min="0"
            />
          </div>
        </CardContent>
      </Card>

      {/* Speaker Info */}
      <Card>
        <CardHeader>
          <CardTitle>Speaker Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="speakerName">Speaker Name</Label>
            <Input
              id="speakerName"
              value={speakerName}
              onChange={(e) => setSpeakerName(e.target.value)}
              placeholder="e.g., James Howard"
            />
          </div>

          <div>
            <Label htmlFor="speakerBio">Speaker Bio</Label>
            <textarea
              id="speakerBio"
              value={speakerBio}
              onChange={(e) => setSpeakerBio(e.target.value)}
              placeholder="Brief bio..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="speakerAvatar">Speaker Avatar URL</Label>
            <Input
              id="speakerAvatar"
              value={speakerAvatar}
              onChange={(e) => setSpeakerAvatar(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {speakerAvatar && (
            <div>
              <img
                src={speakerAvatar}
                alt="Speaker avatar preview"
                className="w-24 h-24 rounded-full border"
              />
            </div>
          )}
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
              ? 'This webinar will be visible on your site.'
              : 'This webinar will be saved as unlisted.'}
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pb-8">
        <Button variant="outline" onClick={() => router.push('/admin/webinars')}>
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          {webinarId && (
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
