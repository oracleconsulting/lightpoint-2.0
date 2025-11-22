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

interface ExampleFormProps {
  exampleId?: string;
}

export function ExampleForm({ exampleId }: ExampleFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [background, setBackground] = useState('');
  const [actionsTaken, setActionsTaken] = useState('');
  const [outcome, setOutcome] = useState('');
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [category, setCategory] = useState('');
  const [complexity, setComplexity] = useState<'simple' | 'intermediate' | 'complex'>('intermediate');
  const [feeRecoveryAmount, setFeeRecoveryAmount] = useState<number>(0);
  const [durationDays, setDurationDays] = useState<number>(0);
  const [tags, setTags] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  // tRPC mutations
  const createExample = trpc.examples.create.useMutation();
  const updateExample = trpc.examples.update.useMutation();
  const deleteExample = trpc.examples.delete.useMutation();

  // Load existing example if editing
  const { data: existingExample, isLoading: isLoadingExample } = trpc.examples.getById.useQuery(
    { id: exampleId! },
    { enabled: !!exampleId }
  );

  // Populate form when editing
  React.useEffect(() => {
    if (existingExample) {
      setTitle(existingExample.title || '');
      setSlug(existingExample.slug || '');
      setSummary(existingExample.summary || '');
      setBackground(existingExample.background || '');
      setActionsTaken(existingExample.actions_taken || '');
      setOutcome(existingExample.outcome || '');
      setLessonsLearned(existingExample.lessons_learned || '');
      setCategory(existingExample.category || '');
      setComplexity(existingExample.complexity_rating || 'intermediate');
      setFeeRecoveryAmount(existingExample.fee_recovery_amount || 0);
      setDurationDays(existingExample.duration_days || 0);
      setTags(existingExample.tags?.join(', ') || '');
      setMetaTitle(existingExample.seo_title || '');
      setMetaDescription(existingExample.seo_description || '');
      setIsPublished(existingExample.status === 'published');
    }
  }, [existingExample]);

  // Auto-generate slug from title
  useEffect(() => {
    if (!exampleId && title) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      setSlug(generatedSlug);
    }
  }, [title, exampleId]);

  // Auto-generate meta fields
  useEffect(() => {
    if (!metaTitle && title) {
      setMetaTitle(title.substring(0, 60));
    }
    if (!metaDescription && summary) {
      setMetaDescription(summary.substring(0, 160));
    }
  }, [title, summary, metaTitle, metaDescription]);

  const handleSave = async () => {
    if (!title || !slug) {
      alert('Please fill in required fields (title and slug)');
      return;
    }

    setSaving(true);
    try {
      const exampleData = {
        title,
        slug,
        summary: summary || undefined,
        background,
        actionsTaken,
        outcome,
        lessonsLearned,
        category: category || undefined,
        complexity,
        feeRecoveryAmount: feeRecoveryAmount || undefined,
        durationDays: durationDays || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        metaTitle: metaTitle || undefined,
        metaDescription: metaDescription || undefined,
        isPublished,
      };

      if (exampleId) {
        await updateExample.mutateAsync({
          id: exampleId,
          data: exampleData,
        });
        alert('Worked example updated successfully!');
      } else {
        await createExample.mutateAsync(exampleData);
        alert('Worked example created successfully!');
      }
      
      router.push('/admin/examples');
    } catch (error: any) {
      console.error('Error saving worked example:', error);
      alert(`Failed to save worked example: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!exampleId) return;
    if (!confirm('Are you sure you want to delete this worked example? This action cannot be undone.')) return;

    try {
      await deleteExample.mutateAsync({ id: exampleId });
      alert('Worked example deleted successfully!');
      router.push('/admin/examples');
    } catch (error: any) {
      console.error('Error deleting worked example:', error);
      alert(`Failed to delete worked example: ${error?.message || 'Unknown error'}`);
    }
  };

  if (isLoadingExample) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading example...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/examples">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-heading font-bold">
            {exampleId ? 'Edit Worked Example' : 'New Worked Example'}
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
              placeholder="Enter case title..."
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
              URL: /examples/{slug || 'your-slug-here'}
            </p>
          </div>

          <div>
            <Label htmlFor="summary">Summary</Label>
            <textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief summary of the case..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              maxLength={200}
            />
            <p className="text-sm text-gray-500 mt-1">
              {summary.length}/200 characters
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="complexity">Complexity</Label>
              <select
                id="complexity"
                value={complexity}
                onChange={(e) => setComplexity(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="simple">Simple</option>
                <option value="intermediate">Intermediate</option>
                <option value="complex">Complex</option>
              </select>
            </div>

            <div>
              <Label htmlFor="feeRecoveryAmount">Fee Recovery (£)</Label>
              <Input
                id="feeRecoveryAmount"
                type="number"
                value={feeRecoveryAmount}
                onChange={(e) => setFeeRecoveryAmount(Number(e.target.value))}
                placeholder="e.g., 1250"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="durationDays">Duration (days)</Label>
              <Input
                id="durationDays"
                type="number"
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                placeholder="e.g., 45"
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
                placeholder="e.g., Penalty Appeals"
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="penalty, appeal, success (comma-separated)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Background Section */}
      <Card>
        <CardHeader>
          <CardTitle>Background</CardTitle>
          <CardDescription>Describe the initial situation and problem</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={background}
            onChange={setBackground}
            placeholder="What was the initial situation? What problem did the client face?"
            bucket="documents"
          />
        </CardContent>
      </Card>

      {/* Actions Taken Section */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Taken</CardTitle>
          <CardDescription>Detail the steps and strategies used</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={actionsTaken}
            onChange={setActionsTaken}
            placeholder="What steps did you take? What was your strategy?"
            bucket="documents"
          />
        </CardContent>
      </Card>

      {/* Outcome Section */}
      <Card>
        <CardHeader>
          <CardTitle>Outcome</CardTitle>
          <CardDescription>Explain the results achieved</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={outcome}
            onChange={setOutcome}
            placeholder="What was the final result? Was the complaint resolved?"
            bucket="documents"
          />
        </CardContent>
      </Card>

      {/* Lessons Learned Section */}
      <Card>
        <CardHeader>
          <CardTitle>Lessons Learned</CardTitle>
          <CardDescription>Key takeaways and insights</CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={lessonsLearned}
            onChange={setLessonsLearned}
            placeholder="What did you learn? What would you do differently?"
            bucket="documents"
          />
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
              ? 'This example will be visible on your site.'
              : 'This example will be saved as a draft.'}
          </p>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pb-8">
        <Button variant="outline" onClick={() => router.push('/admin/examples')}>
          Cancel
        </Button>
        <div className="flex items-center gap-2">
          {exampleId && (
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
