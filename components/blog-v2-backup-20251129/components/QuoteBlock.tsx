'use client';

import React from 'react';
import type { QuoteBlockProps } from '../types';

/**
 * QuoteBlock - Styled quote with optional attribution
 * 
 * Matches Gamma quote styles:
 * - Border variant: Left border accent
 * - Box variant: Full background
 * - Large variant: Hero-style quote
 */
export function QuoteBlock({
  text,
  attribution,
  source,
  variant = 'border',
  className = '',
}: QuoteBlockProps) {
  if (variant === 'large') {
    return (
      <div className={`bg-gray-50 py-12 px-8 ${className}`}>
        <div className="max-w-4xl mx-auto text-center">
          <blockquote className="text-2xl md:text-3xl text-slate-700 font-medium leading-relaxed mb-4">
            &quot;{text}&quot;
          </blockquote>
          {(attribution || source) && (
            <cite className="text-gray-500 not-italic">
              {attribution && <span className="font-medium">{attribution}</span>}
              {attribution && source && <span> — </span>}
              {source && <span>{source}</span>}
            </cite>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'box') {
    return (
      <div className={`bg-slate-100 rounded-lg p-6 ${className}`}>
        <blockquote className="text-lg text-slate-700 italic leading-relaxed">
          &quot;{text}&quot;
        </blockquote>
        {(attribution || source) && (
          <cite className="block mt-3 text-sm text-gray-500 not-italic">
            {attribution && <span className="font-medium">{attribution}</span>}
            {attribution && source && <span> — </span>}
            {source && <span>{source}</span>}
          </cite>
        )}
      </div>
    );
  }

  // Default: border variant
  return (
    <div className={`border-l-4 border-blue-500 pl-6 py-2 ${className}`}>
      <blockquote className="text-lg text-gray-700 italic leading-relaxed">
        &quot;{text}&quot;
      </blockquote>
      {(attribution || source) && (
        <cite className="block mt-2 text-sm text-gray-500 not-italic">
          {attribution && <span className="font-medium">{attribution}</span>}
          {attribution && source && <span> — </span>}
          {source && <span>{source}</span>}
        </cite>
      )}
    </div>
  );
}

export default QuoteBlock;

