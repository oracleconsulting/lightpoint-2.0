'use client';

import React from 'react';

// ============================================================================
// QUOTE BLOCK
// Styled blockquote with attribution
// ============================================================================

interface QuoteBlockProps {
  text: string;
  attribution?: string;
  source?: string;
  variant?: 'border' | 'box' | 'large';
}

export function QuoteBlock({
  text,
  attribution,
  source,
  variant = 'border',
}: QuoteBlockProps) {
  if (variant === 'large') {
    return (
      <blockquote className="relative py-8">
        {/* Large decorative quote mark */}
        <div className="absolute -top-4 -left-2 text-8xl text-slate-200 font-serif leading-none select-none">
          &ldquo;
        </div>
        
        <p className="relative text-2xl lg:text-3xl text-slate-700 leading-relaxed font-light italic pl-8">
          {text}
        </p>
        
        {(attribution || source) && (
          <footer className="mt-6 pl-8">
            {attribution && (
              <cite className="text-lg font-semibold text-slate-800 not-italic">
                — {attribution}
              </cite>
            )}
            {source && (
              <span className="text-slate-500 ml-2">
                {source}
              </span>
            )}
          </footer>
        )}
      </blockquote>
    );
  }

  if (variant === 'box') {
    return (
      <blockquote className="bg-slate-50 rounded-xl p-6 border border-slate-200">
        <p className="text-lg text-slate-700 leading-relaxed italic">
          &ldquo;{text}&rdquo;
        </p>
        
        {(attribution || source) && (
          <footer className="mt-4 pt-4 border-t border-slate-200">
            {attribution && (
              <cite className="font-semibold text-slate-700 not-italic">
                — {attribution}
              </cite>
            )}
            {source && (
              <span className="text-slate-500 text-sm ml-2">
                {source}
              </span>
            )}
          </footer>
        )}
      </blockquote>
    );
  }

  // Default: border variant
  return (
    <blockquote className="relative pl-6 border-l-4 border-blue-500">
      <p className="text-lg text-slate-700 leading-relaxed italic">
        &ldquo;{text}&rdquo;
      </p>
      
      {(attribution || source) && (
        <footer className="mt-3">
          {attribution && (
            <cite className="font-medium text-slate-600 not-italic">
              — {attribution}
            </cite>
          )}
          {source && (
            <span className="text-slate-500 text-sm ml-2">
              {source}
            </span>
          )}
        </footer>
      )}
    </blockquote>
  );
}

export default QuoteBlock;
