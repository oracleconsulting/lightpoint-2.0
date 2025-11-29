'use client';

import { useState, useEffect } from 'react';
import { ExternalLink, Maximize2, Minimize2, RefreshCw, FileText, Play } from 'lucide-react';

interface GammaEmbedProps {
  gammaUrl: string;
  title?: string;
  className?: string;
}

/**
 * Embeds a Gamma presentation/document directly in the page
 * Falls back to a preview card if embedding is blocked
 */
export function GammaEmbed({ gammaUrl, title, className = '' }: GammaEmbedProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [embedBlocked, setEmbedBlocked] = useState(false);
  const [showEmbed, setShowEmbed] = useState(false);

  // Convert docs URL to embed URL
  const embedUrl = gammaUrl.replace('/docs/', '/embed/');

  // Check if embed is allowed after a timeout
  useEffect(() => {
    if (showEmbed) {
      const timeout = setTimeout(() => {
        // If still loading after 5 seconds, assume blocked
        if (isLoading) {
          setEmbedBlocked(true);
          setIsLoading(false);
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [showEmbed, isLoading]);

  const handleLoad = () => {
    setIsLoading(false);
    setEmbedBlocked(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setEmbedBlocked(true);
  };

  // Show preview card by default - user can click to try embedding
  if (!showEmbed || embedBlocked) {
    return (
      <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl overflow-hidden shadow-lg border border-gray-200 ${className}`}>
        {/* Preview Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-semibold">Visual Presentation</p>
              <p className="text-blue-100 text-sm">Powered by Gamma</p>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {title || 'Interactive Presentation'}
          </h3>
          <p className="text-gray-600 mb-6">
            This article has been transformed into a beautiful visual presentation with 
            charts, timelines, and professional formatting.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <a
              href={gammaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Play className="w-5 h-5" />
              View Presentation
            </a>
            
            {!embedBlocked && (
              <button
                onClick={() => setShowEmbed(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-300 transition-colors"
              >
                <Maximize2 className="w-5 h-5" />
                Try Embed
              </button>
            )}
          </div>

          {embedBlocked && (
            <p className="mt-4 text-sm text-gray-500">
              Embedding is not available. Click "View Presentation" to open in Gamma.
            </p>
          )}
        </div>

        {/* Gamma Branding */}
        <div className="px-6 py-3 bg-gray-100 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Hosted on gamma.app
            </span>
            <a
              href={gammaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              Open in new tab <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Try to show embed
  return (
    <div 
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''} ${className}`}
    >
      {/* Controls */}
      <div className={`flex items-center justify-between mb-3 ${isFullscreen ? 'absolute top-4 right-4 z-10' : ''}`}>
        {!isFullscreen && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEmbed(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to preview
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4 text-gray-600" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-600" />
            )}
          </button>
          <a
            href={gammaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4 text-gray-600" />
          </a>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-xl z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading presentation...</p>
          </div>
        </div>
      )}

      {/* Iframe */}
      <iframe
        src={embedUrl}
        className={`gamma-iframe w-full border-0 rounded-xl shadow-lg transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${isFullscreen ? 'h-full' : 'min-h-[80vh]'}`}
        allowFullScreen
        allow="fullscreen"
        onLoad={handleLoad}
        onError={handleError}
        title={title || 'Gamma Presentation'}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />

      {/* Fullscreen close button */}
      {isFullscreen && (
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 left-4 p-2 rounded-lg bg-white/90 hover:bg-white transition-colors shadow-lg"
        >
          <Minimize2 className="w-5 h-5 text-gray-700" />
        </button>
      )}
    </div>
  );
}

export default GammaEmbed;
