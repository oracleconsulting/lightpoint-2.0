'use client';

import { useState } from 'react';
import { ExternalLink, Maximize2, Minimize2, RefreshCw } from 'lucide-react';

interface GammaEmbedProps {
  gammaUrl: string;
  title?: string;
  className?: string;
}

/**
 * Embeds a Gamma presentation/document directly in the page
 */
export function GammaEmbed({ gammaUrl, title, className = '' }: GammaEmbedProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Convert docs URL to embed URL
  const embedUrl = gammaUrl.replace('/docs/', '/embed/');

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setHasError(false);
    // Force iframe reload by updating key
    const iframe = document.querySelector('.gamma-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = embedUrl;
    }
  };

  if (hasError) {
    return (
      <div className={`bg-gray-50 rounded-xl p-8 text-center ${className}`}>
        <p className="text-gray-600 mb-4">Failed to load visual presentation</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <a
            href={gammaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open in Gamma
          </a>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''} ${className}`}
    >
      {/* Controls */}
      <div className={`flex items-center justify-between mb-3 ${isFullscreen ? 'absolute top-4 right-4 z-10' : ''}`}>
        {!isFullscreen && title && (
          <span className="text-sm text-gray-500">Visual Presentation</span>
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
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-xl">
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
        onLoad={handleLoad}
        onError={handleError}
        title={title || 'Gamma Presentation'}
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

