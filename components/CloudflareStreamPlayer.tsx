'use client';

import React, { useEffect, useState } from 'react';

interface CloudflareStreamPlayerProps {
  /** Cloudflare Stream video/live ID */
  videoId: string;
  
  /** Customer code from Cloudflare (e.g., 'gsyp6qxzsq50sfg1') */
  customerCode: string;
  
  /** Whether this is a live stream or recorded video */
  isLive?: boolean;
  
  /** Poster/thumbnail image URL */
  poster?: string;
  
  /** Auto-play the video (muted) */
  autoplay?: boolean;
  
  /** Show controls */
  controls?: boolean;
  
  /** Muted by default */
  muted?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Cloudflare Stream video player component
 * Supports both live streams and recorded videos
 * 
 * @example
 * // Live stream
 * <CloudflareStreamPlayer
 *   videoId="63e19586ffa85461ca82c07b51709b6a"
 *   customerCode="gsyp6qxzsq50sfg1"
 *   isLive={true}
 * />
 * 
 * @example
 * // Recorded video
 * <CloudflareStreamPlayer
 *   videoId="abc123..."
 *   customerCode="gsyp6qxzsq50sfg1"
 *   poster="https://..."
 * />
 */
export function CloudflareStreamPlayer({
  videoId,
  customerCode,
  isLive = false,
  poster,
  autoplay = false,
  controls = true,
  muted = false,
  className = '',
}: CloudflareStreamPlayerProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className={`relative w-full aspect-video bg-gray-900 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading player...</p>
        </div>
      </div>
    );
  }

  const iframeUrl = `https://customer-${customerCode}.cloudflarestream.com/${videoId}/iframe?${new URLSearchParams({
    ...(poster && { poster }),
    ...(autoplay && { autoplay: 'true', muted: 'true' }),
    ...(controls && { controls: 'true' }),
    ...(muted && { muted: 'true' }),
  }).toString()}`;

  return (
    <div className={`relative w-full ${className}`}>
      {/* 16:9 Aspect Ratio Container */}
      <div className="relative pt-[56.25%]">
        <iframe
          src={iframeUrl}
          style={{
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: '100%',
          }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          className="rounded-lg shadow-lg"
          title={isLive ? 'Live Stream' : 'Video Player'}
        />
      </div>

      {/* Live Indicator */}
      {isLive && (
        <div className="absolute top-4 left-4 z-10">
          <div className="flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full shadow-lg animate-pulse">
            <span className="h-2 w-2 rounded-full bg-white animate-ping"></span>
            <span className="font-semibold text-sm">LIVE</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Alternative: HLS Player using native HTML5 video
 * Use this if you want more control over the player UI
 */
export function CloudflareHLSPlayer({
  videoId,
  customerCode,
  poster,
  autoplay = false,
  controls = true,
  muted = false,
  className = '',
}: CloudflareStreamPlayerProps) {
  const hlsUrl = `https://customer-${customerCode}.cloudflarestream.com/${videoId}/manifest/video.m3u8`;

  return (
    <div className={`relative w-full ${className}`}>
      <video
        src={hlsUrl}
        poster={poster}
        autoPlay={autoplay}
        controls={controls}
        muted={muted}
        playsInline
        className="w-full aspect-video rounded-lg shadow-lg bg-black"
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

