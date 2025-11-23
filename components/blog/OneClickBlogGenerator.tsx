'use client';

/**
 * One-Click Blog Generator UI
 * Gamma-style blog generation from a simple topic
 */

import React, { useState } from 'react';
import { Wand2, Sparkles, Loader2, CheckCircle, XCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface OneClickGeneratorProps {
  onGenerated: (blogPost: any) => void;
}

export function OneClickBlogGenerator({ onGenerated }: OneClickGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced options
  const [audience, setAudience] = useState('UK accountants and tax professionals');
  const [tone, setTone] = useState<'professional' | 'casual' | 'technical'>('professional');
  const [length, setLength] = useState<'short' | 'medium' | 'long'>('medium');
  const [templateStyle, setTemplateStyle] = useState<'data-story' | 'guide' | 'case-study' | 'classic'>('data-story');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeCharts, setIncludeCharts] = useState(true);

  const [progress, setProgress] = useState<string>('');

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setProgress('Initializing AI models...');

    try {
      // Simulate progress updates
      const progressSteps = [
        'Generating content with GPT-4o...',
        'Creating visual layout with Claude...',
        includeImages ? 'Generating hero image with Flux Pro...' : 'Skipping image generation...',
        'Optimizing SEO metadata...',
        'Finalizing blog post...',
      ];

      let stepIndex = 0;
      const progressInterval = setInterval(() => {
        if (stepIndex < progressSteps.length - 1) {
          stepIndex++;
          setProgress(progressSteps[stepIndex]);
        }
      }, 3000);

      const response = await fetch('/api/blog/generate-full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic: topic.trim(),
          audience,
          tone,
          length,
          includeCharts,
          includeImages,
          templateStyle,
        }),
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (result.success && result.blogPost) {
        setProgress('✅ Complete!');
        onGenerated(result.blogPost);
      } else {
        setError(result.error || 'Failed to generate blog post');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate blog post');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-4 border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 flex items-center justify-center">
            <Wand2 className="h-6 w-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ✨ One-Click Blog Generator
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Hero Description */}
        <div className="bg-white rounded-xl p-6 border-2 border-purple-200">
          <p className="text-gray-700 mb-4">
            <strong>Gamma-style AI blog generation.</strong> Just enter a topic and let AI create a complete,
            professionally designed blog post with:
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>SEO-optimized content</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Visual layouts & charts</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>AI-generated images</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>Professional formatting</span>
            </div>
          </div>
        </div>

        {/* Topic Input */}
        <div>
          <Label htmlFor="topic" className="text-lg font-semibold">
            What should the blog post be about?
          </Label>
          <Input
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., How to handle HMRC late filing penalties..."
            className="mt-2 text-lg p-6"
            disabled={isGenerating}
          />
        </div>

        {/* Advanced Options Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800 font-medium"
        >
          <Settings className="h-4 w-4" />
          {showAdvanced ? 'Hide' : 'Show'} Advanced Options
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="bg-white rounded-xl p-6 border-2 border-gray-200 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tone">Tone</Label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  disabled={isGenerating}
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="technical">Technical</option>
                </select>
              </div>

              <div>
                <Label htmlFor="length">Length</Label>
                <select
                  id="length"
                  value={length}
                  onChange={(e) => setLength(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  disabled={isGenerating}
                >
                  <option value="short">Short (500-800 words)</option>
                  <option value="medium">Medium (1200-1800 words)</option>
                  <option value="long">Long (2000-3000 words)</option>
                </select>
              </div>

              <div>
                <Label htmlFor="template">Template Style</Label>
                <select
                  id="template"
                  value={templateStyle}
                  onChange={(e) => setTemplateStyle(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  disabled={isGenerating}
                >
                  <option value="data-story">Data Story (Charts & Stats)</option>
                  <option value="guide">Step-by-Step Guide</option>
                  <option value="case-study">Case Study</option>
                  <option value="classic">Classic Article</option>
                </select>
              </div>

              <div>
                <Label>Options</Label>
                <div className="mt-2 space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeImages}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                      disabled={isGenerating}
                      className="rounded"
                    />
                    <span className="text-sm">Generate AI images</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={includeCharts}
                      onChange={(e) => setIncludeCharts(e.target.checked)}
                      disabled={isGenerating}
                      className="rounded"
                    />
                    <span className="text-sm">Include data charts</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !topic.trim()}
          size="lg"
          className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 text-lg py-6"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
              {progress || 'Generating...'}
            </>
          ) : (
            <>
              <Sparkles className="h-5 w-5 mr-3" />
              Generate Complete Blog Post
            </>
          )}
        </Button>

        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Generation Failed</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-sm">
          <p className="text-blue-900">
            <strong>⚡ Powered by:</strong> GPT-4o (writing), Claude 3.5 Sonnet (layout), Flux Pro (images)
          </p>
          <p className="text-blue-700 mt-1">
            Generation takes 30-60 seconds. You'll be able to edit everything after it's created.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

