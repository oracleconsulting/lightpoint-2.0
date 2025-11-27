'use client';

/**
 * AI Visual Transformer
 * Takes existing blog content and transforms it into a visually powerful layout
 * Like Gamma's "Enhance" or "Beautify" feature
 */

import React, { useState } from 'react';
import { Sparkles, Wand2, Loader2, CheckCircle, XCircle, RefreshCw, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DynamicGammaRenderer from './DynamicGammaRenderer';

interface VisualTransformerProps {
  title: string;
  content: string;
  excerpt?: string;
  onTransformed: (layout: any) => void;
}

export function VisualTransformer({
  title,
  content,
  excerpt,
  onTransformed,
}: VisualTransformerProps) {
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transformedLayout, setTransformedLayout] = useState<any | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [useV6, setUseV6] = useState(true); // Default to V6 pipeline

  const handleTransform = async () => {
    if (!title || !content) {
      setError('Need title and content to transform');
      return;
    }

    setError(null);
    setIsTransforming(true);
    setTransformedLayout(null);

    // Use V6 or V5 pipeline based on toggle
    const endpoint = useV6 ? '/api/blog/transform-visual-v6' : '/api/blog/transform-visual';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: stripHtml(content),
          excerpt,
        }),
      });

      // Check if response is OK before parsing
      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Server error: ${response.status}`);
        } else {
          throw new Error(`Server error: ${response.status} ${response.statusText}`);
        }
      }

      const result = await response.json();

      if (result.success && result.layout) {
        setTransformedLayout(result.layout);
        setShowPreview(true);
      } else {
        setError(result.error || 'Failed to transform content');
      }
    } catch (err: any) {
      console.error('Transform error:', err);
      setError(err.message || 'Failed to transform content');
    } finally {
      setIsTransforming(false);
    }
  };

  const handleAccept = () => {
    if (transformedLayout) {
      onTransformed(transformedLayout);
      setShowPreview(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Transform Button (Show when there's content but no preview) */}
      {!showPreview && title && content && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                ✨ Transform to Visual Layout
              </h3>
              <p className="text-gray-700 mb-4">
                Already have your content written? Let AI transform it into a stunning visual layout with
                charts, stat cards, timelines, and professional formatting.
              </p>
              
              {/* V6 Toggle */}
              <div className="flex items-center gap-2 mb-4">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={useV6} 
                    onChange={(e) => setUseV6(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
                <span className="text-sm font-medium text-gray-700">
                  {useV6 ? (
                    <span className="flex items-center gap-1">
                      <Zap className="h-4 w-4 text-purple-600" />
                      V6 Pipeline (Recommended)
                    </span>
                  ) : (
                    'V5 Pipeline (Legacy)'
                  )}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleTransform}
                  disabled={isTransforming}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {isTransforming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Transforming...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Transform to Visual Layout
                    </>
                  )}
                </Button>
                {isTransforming && (
                  <span className="text-sm text-gray-600">
                    {useV6 
                      ? 'V6: Extracting content → Mapping components...' 
                      : 'AI is analyzing your content and creating the perfect visual layout...'
                    }
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Transformation Failed</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Preview Display */}
      {showPreview && transformedLayout && (
        <div className="space-y-4">
          {/* Preview Header */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div>
                  <p className="font-bold text-green-900">Visual Layout Created!</p>
                  <p className="text-sm text-green-700">
                    AI extracted data, identified key points, and created a professional visual layout
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleTransform}
                  variant="outline"
                  size="sm"
                  disabled={isTransforming}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isTransforming ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
                <Button 
                  onClick={handleAccept} 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Apply This Layout
                </Button>
              </div>
            </div>
          </div>

          {/* Layout Preview */}
          <div className="border-2 border-gray-300 rounded-xl p-8 bg-white">
            <div className="mb-6 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Sparkles className="h-4 w-4" />
                <span>AI-Enhanced Visual Layout Preview</span>
              </div>
            </div>
            <DynamicGammaRenderer
              layout={transformedLayout}
            />
          </div>

          {/* What Changed */}
          {transformedLayout.enhancements && Array.isArray(transformedLayout.enhancements) && transformedLayout.enhancements.length > 0 && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold text-blue-900 mb-2">✨ AI Enhancements Applied:</p>
                  <ul className="text-blue-800 space-y-1 list-disc list-inside">
                    {transformedLayout.enhancements.map((enhancement: string, i: number) => (
                      <li key={i}>{enhancement}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function to strip HTML tags and extract text from TipTap JSON
function stripHtml(content: any): string {
  if (!content) return '';
  
  // If it's a TipTap JSON object
  if (typeof content === 'object' && content.type === 'doc') {
    const extractText = (node: any): string => {
      if (!node) return '';
      
      if (node.type === 'text') {
        return node.text || '';
      }
      
      if (node.content && Array.isArray(node.content)) {
        return node.content.map(extractText).join(' ');
      }
      
      return '';
    };
    
    return extractText(content).replace(/\s+/g, ' ').trim();
  }
  
  // If it's an HTML string
  if (typeof content === 'string') {
    return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  
  // Otherwise try to stringify it
  return String(content).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

