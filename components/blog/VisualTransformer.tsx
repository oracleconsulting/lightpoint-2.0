'use client';

/**
 * AI Visual Transformer
 * Takes existing blog content and transforms it into a visually powerful layout
 * Like Gamma's "Enhance" or "Beautify" feature
 */

import React, { useState } from 'react';
import { Sparkles, Wand2, Loader2, CheckCircle, XCircle, RefreshCw, Zap, Image as ImageIcon, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DynamicGammaRenderer from './DynamicGammaRenderer';
import { GammaEmbed } from './GammaEmbed';

interface VisualTransformerProps {
  title: string;
  content: string;
  excerpt?: string;
  onTransformed: (layout: any) => void;
  onGammaGenerated?: (gammaUrl: string, pdfUrl?: string) => void;
  existingGammaUrl?: string;
}

export function VisualTransformer({
  title,
  content,
  excerpt,
  onTransformed,
  onGammaGenerated,
  existingGammaUrl,
}: VisualTransformerProps) {
  const [isTransforming, setIsTransforming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transformedLayout, setTransformedLayout] = useState<any | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [useV6, setUseV6] = useState(true); // Default to V6 pipeline
  const [enableImages, setEnableImages] = useState(true); // NEW: Image generation toggle
  const [imagesGenerated, setImagesGenerated] = useState(0);
  
  // Gamma API state
  const [isGeneratingGamma, setIsGeneratingGamma] = useState(false);
  const [gammaUrl, setGammaUrl] = useState<string | null>(existingGammaUrl || null);
  const [gammaPdfUrl, setGammaPdfUrl] = useState<string | null>(null);
  const [showGammaPreview, setShowGammaPreview] = useState(false);
  const [generationMode, setGenerationMode] = useState<'lightpoint' | 'gamma'>('lightpoint');

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
          enableImages: useV6 ? enableImages : false, // Only V6 supports images
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
        setImagesGenerated(result.imagesGenerated || 0);
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
      // Debug: Log what we're passing to the parent
      console.log('📦 [VisualTransformer] Applying layout...');
      console.log('📦 Layout structure:', {
        hasTheme: !!transformedLayout.theme,
        hasLayout: !!transformedLayout.layout,
        layoutLength: transformedLayout.layout?.length || 0,
      });
      console.log('📦 First 5 component types:', 
        transformedLayout.layout?.slice(0, 5).map((c: any) => c.type) || []
      );
      console.log('📦 TextSection count:', 
        transformedLayout.layout?.filter((c: any) => c.type === 'TextSection').length || 0
      );
      
      // CRITICAL: Make a deep copy to prevent any mutation issues
      const layoutToSave = JSON.parse(JSON.stringify(transformedLayout));
      console.log('📦 Deep copy component count:', layoutToSave.layout?.length || 0);
      
      onTransformed(layoutToSave);
      setShowPreview(false);
    }
  };

  // Generate with Gamma API
  const handleGenerateWithGamma = async () => {
    if (!title || !content) {
      setError('Need title and content to generate with Gamma');
      return;
    }

    setError(null);
    setIsGeneratingGamma(true);

    try {
      const response = await fetch('/api/blog/generate-gamma', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content: stripHtml(content),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.gammaUrl) {
        setGammaUrl(result.gammaUrl);
        setGammaPdfUrl(result.exportUrl || null);
        setShowGammaPreview(true);
        
        // Notify parent
        onGammaGenerated?.(result.gammaUrl, result.exportUrl);
      } else {
        throw new Error(result.error || 'Failed to generate Gamma presentation');
      }
    } catch (err: any) {
      console.error('Gamma generation error:', err);
      setError(err.message || 'Failed to generate with Gamma');
    } finally {
      setIsGeneratingGamma(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Transform Button (Show when there's content but no preview) */}
      {!showPreview && !showGammaPreview && title && content && (
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
              
              {/* Generation Mode Selector */}
              <div className="flex items-center gap-2 mb-4 p-1 bg-gray-100 rounded-lg w-fit">
                <button
                  onClick={() => setGenerationMode('lightpoint')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    generationMode === 'lightpoint'
                      ? 'bg-white shadow-sm text-purple-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Lightpoint Pipeline
                  </span>
                </button>
                <button
                  onClick={() => setGenerationMode('gamma')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    generationMode === 'gamma'
                      ? 'bg-white shadow-sm text-orange-700'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Gamma API
                  </span>
                </button>
              </div>
              
              {/* Lightpoint Pipeline Options */}
              {generationMode === 'lightpoint' && (
                <>
                  <div className="flex flex-wrap items-center gap-6 mb-4">
                    {/* V6 Toggle */}
                    <div className="flex items-center gap-2">
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
                            V6.3 Pipeline
                          </span>
                        ) : (
                          'V5 Pipeline (Legacy)'
                        )}
                      </span>
                    </div>
                    
                    {/* Image Generation Toggle - Only show for V6 */}
                    {useV6 && (
                      <div className="flex items-center gap-2">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={enableImages} 
                            onChange={(e) => setEnableImages(e.target.checked)}
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                        <span className="text-sm font-medium text-gray-700">
                          <span className="flex items-center gap-1">
                            <ImageIcon className="h-4 w-4 text-indigo-600" />
                            {enableImages ? 'AI Images (NanoBanana)' : 'No Images'}
                          </span>
                        </span>
                      </div>
                    )}
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
                          ? enableImages 
                            ? 'V6.3: Extracting → Mapping → Generating images...' 
                            : 'V6.3: Extracting content → Mapping components...'
                          : 'AI is analyzing your content and creating the perfect visual layout...'
                        }
                      </span>
                    )}
                  </div>
                </>
              )}
              
              {/* Gamma API Options */}
              {generationMode === 'gamma' && (
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <p className="text-sm text-orange-800">
                      <strong>Gamma API</strong> generates a professional presentation hosted on gamma.app. 
                      Perfect quality, consistent design, and includes AI-generated images.
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      onClick={handleGenerateWithGamma}
                      disabled={isGeneratingGamma}
                      className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600"
                    >
                      {isGeneratingGamma ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating with Gamma...
                        </>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-2" />
                          Generate with Gamma
                        </>
                      )}
                    </Button>
                    {isGeneratingGamma && (
                      <span className="text-sm text-gray-600">
                        Creating presentation... This may take 1-2 minutes.
                      </span>
                    )}
                  </div>
                </div>
              )}
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
                    {imagesGenerated > 0 && (
                      <span className="ml-1 inline-flex items-center gap-1">
                        • <ImageIcon className="h-3 w-3" /> {imagesGenerated} contextual {imagesGenerated === 1 ? 'image' : 'images'} generated
                      </span>
                    )}
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

      {/* Gamma Preview */}
      {showGammaPreview && gammaUrl && (
        <div className="space-y-4">
          {/* Gamma Preview Header */}
          <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-6 w-6 text-orange-600" />
                <div>
                  <p className="font-bold text-orange-900">Gamma Presentation Created!</p>
                  <p className="text-sm text-orange-700">
                    Your content has been transformed into a professional Gamma presentation.
                    {gammaPdfUrl && ' PDF export is also available.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleGenerateWithGamma}
                  variant="outline"
                  size="sm"
                  disabled={isGeneratingGamma}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGeneratingGamma ? 'animate-spin' : ''}`} />
                  Regenerate
                </Button>
                <a
                  href={gammaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Gamma
                </a>
                {gammaPdfUrl && (
                  <a
                    href={gammaPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                  >
                    <FileText className="h-4 w-4" />
                    Download PDF
                  </a>
                )}
                <Button
                  onClick={() => setShowGammaPreview(false)}
                  variant="outline"
                  size="sm"
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </div>

          {/* Gamma Embed */}
          <GammaEmbed gammaUrl={gammaUrl} title={title} />
        </div>
      )}

      {/* Existing Gamma URL indicator */}
      {existingGammaUrl && !showGammaPreview && !showPreview && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Gamma presentation available</p>
                <p className="text-xs text-gray-500">A visual version of this post exists on Gamma</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  setGammaUrl(existingGammaUrl);
                  setShowGammaPreview(true);
                }}
                variant="outline"
                size="sm"
              >
                View Preview
              </Button>
              <a
                href={existingGammaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                Open in Gamma <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
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

