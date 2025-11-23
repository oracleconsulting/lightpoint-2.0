'use client';

/**
 * AI Layout Generator Component
 * Allows users to generate visual layouts from content using AI
 * Similar to Gamma's AI-powered design generation
 */

import React, { useState } from 'react';
import { Sparkles, Wand2, RefreshCw, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DynamicLayoutRenderer } from './DynamicLayoutRenderer';

interface AILayoutGeneratorProps {
  title: string;
  content: string;
  excerpt?: string;
  onLayoutGenerated: (layout: any) => void;
}

export function AILayoutGenerator({
  title,
  content,
  excerpt,
  onLayoutGenerated,
}: AILayoutGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedLayout, setGeneratedLayout] = useState<any | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleGenerate = async () => {
    if (!title || !content) {
      setError('Please provide a title and content first');
      return;
    }

    setError(null);
    setIsGenerating(true);
    setGeneratedLayout(null);

    try {
      const response = await fetch('/api/blog/generate-layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: stripHtml(content), // Strip HTML tags for better analysis
          excerpt,
          tone: 'professional',
        }),
      });

      const result = await response.json();

      if (result.success && result.layout) {
        setGeneratedLayout(result.layout);
        setShowPreview(true);
      } else {
        setError(result.error || 'Failed to generate layout');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate layout');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAccept = () => {
    if (generatedLayout) {
      onLayoutGenerated(generatedLayout);
      setShowPreview(false);
    }
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  return (
    <div className="space-y-6">
      {/* Generator Button */}
      {!showPreview && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Wand2 className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                ✨ AI-Powered Visual Layout
              </h3>
              <p className="text-gray-700 mb-4">
                Let AI analyze your content and automatically create a stunning visual layout with
                charts, stat cards, timelines, and infographics—just like Gamma.
              </p>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !title || !content}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Layout...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate AI Layout
                  </>
                )}
              </Button>
              {!title || !content ? (
                <p className="text-sm text-gray-500 mt-2">
                  Add a title and content first to generate a layout
                </p>
              ) : null}
            </div>
          </div>
        </div>
      )}

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

      {/* Preview Display */}
      {showPreview && generatedLayout && (
        <div className="space-y-4">
          {/* Preview Header */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-bold text-green-900">Layout Generated!</p>
                  <p className="text-sm text-green-700">
                    {generatedLayout.reasoning || 'AI has created an optimal visual layout for your content'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleRegenerate}
                  variant="outline"
                  size="sm"
                  disabled={isGenerating}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
                <Button onClick={handleAccept} size="sm" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Use This Layout
                </Button>
              </div>
            </div>
          </div>

          {/* Layout Preview */}
          <div className="border-2 border-gray-300 rounded-xl p-8 bg-white">
            <div className="flex items-center gap-2 mb-6 text-sm text-gray-500">
              <Eye className="h-4 w-4" />
              <span>Preview Mode</span>
            </div>
            <DynamicLayoutRenderer
              layout={generatedLayout.layout}
              theme={generatedLayout.theme}
            />
          </div>

          {/* Preview Footer */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-blue-900 mb-1">What happens next:</p>
                <ul className="text-blue-800 space-y-1 list-disc list-inside">
                  <li>Click "Use This Layout" to apply it to your blog post</li>
                  <li>The layout will be saved as structured JSON (fully editable)</li>
                  <li>You can manually tweak any section, add/remove components, or regenerate</li>
                  <li>All charts, stats, and visuals are fully customizable</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to strip HTML tags
function stripHtml(html: string): string {
  if (typeof html !== 'string') return '';
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

