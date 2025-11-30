'use client';

import React from 'react';

// ============================================================================
// COMPARISON CARDS
// Side-by-side comparison (Old Way vs New Way, Before/After)
// ============================================================================

interface ComparisonCard {
  title: string;
  content: string;
  footer: string;
}

interface ComparisonCardsProps {
  title?: string;
  intro?: string;
  leftCard: ComparisonCard;
  rightCard: ComparisonCard;
  conclusion?: string;
}

export function ComparisonCards({
  title,
  intro,
  leftCard,
  rightCard,
  conclusion,
}: ComparisonCardsProps) {
  return (
    <div className="w-full py-8 bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        {/* Header */}
        {(title || intro) && (
          <div className="mb-6 text-center">
            {title && (
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-3 tracking-tight">
                {title}
              </h2>
            )}
            {intro && (
              <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
                {intro}
              </p>
            )}
          </div>
        )}

        {/* Comparison grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
          {/* Left card (Old Way) */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-100 border-b border-slate-200">
              <h3 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-slate-400 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </span>
                {leftCard.title}
              </h3>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {leftCard.content}
              </p>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-500">
                {leftCard.footer}
              </p>
            </div>
          </div>

          {/* Right card (New Way) */}
          <div className="bg-white rounded-xl border-2 border-blue-200 overflow-hidden shadow-lg">
            {/* Header */}
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
              <h3 className="text-lg font-bold text-blue-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                {rightCard.title}
              </h3>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {rightCard.content}
              </p>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
              <p className="text-sm font-bold text-blue-600">
                {rightCard.footer}
              </p>
            </div>
          </div>
        </div>

        {/* Conclusion */}
        {conclusion && (
          <div className="mt-6 text-center">
            <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
              {conclusion}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ComparisonCards;
