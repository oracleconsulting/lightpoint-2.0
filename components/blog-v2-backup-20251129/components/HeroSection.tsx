'use client';

import React from 'react';
import type { HeroSectionProps } from '../types';

/**
 * HeroSection - Full-width hero with gradient background
 * 
 * Matches Gamma page 1 style:
 * - Large title (48px+)
 * - Subtle subtitle
 * - Optional background image with overlay
 * - Reading time and author metadata
 */
export function HeroSection({
  title,
  subtitle,
  readingTime,
  author,
  publishDate,
  backgroundImage,
  backgroundGradient = true,
  className = '',
}: HeroSectionProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background */}
      <div className="absolute inset-0">
        {backgroundImage ? (
          <>
            <img
              src={backgroundImage}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-white/80" />
          </>
        ) : backgroundGradient ? (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Decorative blobs */}
            <div className="absolute top-20 right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl" />
          </div>
        ) : (
          <div className="absolute inset-0 bg-white" />
        )}
      </div>

      {/* Content */}
      <div className="relative max-w-5xl mx-auto px-8 py-24">
        {/* Metadata */}
        {(readingTime || author || publishDate) && (
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
            {readingTime && (
              <span className="flex items-center gap-1.5">
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
                {readingTime}
              </span>
            )}
            {author && (
              <span className="flex items-center gap-1.5">
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                  />
                </svg>
                {author}
              </span>
            )}
            {publishDate && (
              <span className="flex items-center gap-1.5">
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
                  />
                </svg>
                {publishDate}
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-slate-800 leading-tight mb-6 max-w-4xl">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

export default HeroSection;

