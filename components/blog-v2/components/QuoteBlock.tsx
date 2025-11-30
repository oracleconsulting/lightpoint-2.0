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
      <blockquote className="relative py-12 max-w-4xl mx-auto text-center">
        {/* Large decorative quote mark */}
        <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-9xl text-slate-200 font-serif leading-none select-none">
          &ldquo;
        </div>
        
        <p className="relative text-[28px] lg:text-[32px] text-slate-700 leading-[1.5] font-light italic px-6">
          {text}
        </p>
        
        {(attribution || source) && (
          <footer className="mt-8">
            {attribution && (
              <cite className="text-[19px] font-semibold text-slate-800 not-italic">
                — {attribution}
              </cite>
            )}
            {source && (
              <span className="text-slate-500 ml-2 text-[17px]">
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
    <blockquote className="relative pl-7 border-l-4 border-blue-500 py-2">
      <p className="text-[19px] lg:text-[20px] text-slate-700 leading-[1.7] italic">
        &ldquo;{text}&rdquo;
      </p>
      
      {(attribution || source) && (
        <footer className="mt-4">
          {attribution && (
            <cite className="font-medium text-slate-600 not-italic text-[17px]">
              — {attribution}
            </cite>
          )}
          {source && (
            <span className="text-slate-500 text-[15px] ml-2">
              {source}
            </span>
          )}
        </footer>
      )}
    </blockquote>
  );
}

export default QuoteBlock;
