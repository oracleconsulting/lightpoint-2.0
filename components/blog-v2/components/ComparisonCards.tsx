'use client';

import React from 'react';
import type { ComparisonCardsProps } from '../types';

/**
 * ComparisonCards - Side-by-side comparison with left-border accent
 * 
 * Matches Gamma page 8:
 * - Two equal columns
 * - Left border accent (gray for left, blue for right)
 * - Steps with arrows
 * - Footer with timeline/summary
 */
export function ComparisonCards({
  title,
  intro,
  leftCard,
  rightCard,
  conclusion,
  className = '',
}: ComparisonCardsProps) {
  return (
    <div className={`bg-white py-16 px-8 ${className}`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        {title && (
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            {title}
          </h2>
        )}
        {intro && (
          <p className="text-lg text-gray-600 mb-10 max-w-3xl">
            {intro}
          </p>
        )}

        {/* Comparison grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left card - "old way" style */}
          <div className="border-l-4 border-gray-400 bg-gray-50 rounded-r-lg p-6">
            <h3 className="font-bold text-slate-800 text-xl mb-4">
              {leftCard.title}
            </h3>
            <div className="text-gray-600 mb-4 leading-relaxed">
              <FormattedContent content={leftCard.content} />
            </div>
            <div className="font-semibold text-slate-700 pt-3 border-t border-gray-200">
              {leftCard.footer}
            </div>
          </div>

          {/* Right card - "new way" style */}
          <div className="border-l-4 border-blue-500 bg-blue-50 rounded-r-lg p-6">
            <h3 className="font-bold text-slate-800 text-xl mb-4">
              {rightCard.title}
            </h3>
            <div className="text-gray-600 mb-4 leading-relaxed">
              <FormattedContent content={rightCard.content} />
            </div>
            <div className="font-semibold text-blue-700 pt-3 border-t border-blue-200">
              {rightCard.footer}
            </div>
          </div>
        </div>

        {/* Conclusion */}
        {conclusion && (
          <p className="text-lg text-gray-600 mt-10 max-w-3xl">
            {conclusion}
          </p>
        )}
      </div>
    </div>
  );
}

interface FormattedContentProps {
  content: string;
}

function FormattedContent({ content }: FormattedContentProps) {
  // Check if content contains arrows (→) indicating steps
  if (content.includes('→')) {
    const steps = content.split('→').map(s => s.trim()).filter(Boolean);
    return (
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <span className="bg-white/50 px-2 py-1 rounded text-sm">
              {step}
            </span>
            {index < steps.length - 1 && (
              <span className="text-gray-400">→</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // Otherwise, render as regular text
  return <span>{content}</span>;
}

export default ComparisonCards;

