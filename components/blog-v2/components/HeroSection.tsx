'use client';

import React from 'react';

// ============================================================================
// HERO SECTION
// Full-bleed hero with gradient background, large impactful typography,
// and elegant metadata presentation
// ============================================================================

interface HeroSectionProps {
  title: string;
  subtitle: string;
  readingTime?: string;
  author?: string;
  publishDate?: string;
  backgroundImage?: string;
  backgroundGradient?: boolean;
  tags?: string[];
}

export function HeroSection({
  title,
  subtitle,
  readingTime,
  author,
  publishDate,
  backgroundImage,
  backgroundGradient = true,
  tags = [],
}: HeroSectionProps) {
  return (
    <header className="relative min-h-[45vh] flex items-end overflow-hidden">
      {/* Background Layer */}
      <div className="absolute inset-0">
        {backgroundImage ? (
          <>
            <img
              src={backgroundImage}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-transparent" />
          </>
        ) : backgroundGradient ? (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900">
            {/* Decorative elements */}
            <div className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-3xl" />
            
            {/* Subtle grid pattern */}
            <div 
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)
                `,
                backgroundSize: '64px 64px'
              }}
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-slate-100" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 lg:px-8 pb-16 lg:pb-24 pt-32">
        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tags.map((tag, i) => (
              <span 
                key={i}
                className="px-3 py-1 text-xs font-medium uppercase tracking-wider 
                           bg-white/10 backdrop-blur-sm text-white/80 rounded-full
                           border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] mb-6 max-w-4xl">
          {title}
        </h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xl lg:text-2xl text-slate-300 leading-relaxed max-w-3xl mb-8 font-light">
            {subtitle}
          </p>
        )}

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-slate-400">
          {author && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {author.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <div>
                <div className="text-white font-medium">{author}</div>
                {publishDate && <div className="text-slate-400 text-xs">{publishDate}</div>}
              </div>
            </div>
          )}
          
          {readingTime && (
            <div className="flex items-center gap-2 text-slate-400">
              <ClockIcon />
              <span>{readingTime}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </header>
  );
}

function ClockIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth={2} 
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
      />
    </svg>
  );
}

export default HeroSection;
