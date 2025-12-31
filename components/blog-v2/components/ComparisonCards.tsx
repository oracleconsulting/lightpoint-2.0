'use client';

import React from 'react';

// ============================================================================
// COMPARISON CARDS
// Side-by-side comparison (Old Way vs New Way, Before/After)
// ============================================================================

interface ComparisonCard {
  title?: string;
  content?: string;
  footer?: string;
  // AI compatibility props
  items?: string[];
  variant?: 'positive' | 'negative' | 'neutral';
}

interface ComparisonCardsProps {
  title?: string;
  intro?: string;
  leftCard?: ComparisonCard;
  rightCard?: ComparisonCard;
  conclusion?: string;
}

// Map AI variant to styling
const variantStyles = {
  positive: {
    border: 'border-2 border-green-200',
    header: 'bg-green-50 border-b border-green-100',
    headerText: 'text-green-700',
    icon: 'bg-green-500',
    iconPath: 'M5 13l4 4L19 7',
    footer: 'bg-green-50 border-t border-green-100',
    footerText: 'text-green-600',
    shadow: 'shadow-lg',
  },
  negative: {
    border: 'border border-red-200',
    header: 'bg-red-50 border-b border-red-100',
    headerText: 'text-red-700',
    icon: 'bg-red-400',
    iconPath: 'M6 18L18 6M6 6l12 12',
    footer: 'bg-red-50 border-t border-red-100',
    footerText: 'text-red-500',
    shadow: 'shadow-sm',
  },
  neutral: {
    border: 'border border-slate-200',
    header: 'bg-slate-100 border-b border-slate-200',
    headerText: 'text-slate-700',
    icon: 'bg-slate-400',
    iconPath: 'M6 18L18 6M6 6l12 12',
    footer: 'bg-slate-50 border-t border-slate-100',
    footerText: 'text-slate-500',
    shadow: 'shadow-sm',
  },
};

export function ComparisonCards({
  title,
  intro,
  leftCard,
  rightCard,
  conclusion,
}: ComparisonCardsProps) {
  // Defensive: ensure both cards exist
  if (!leftCard || !rightCard) {
    return null;
  }

  // Normalize card content: accept either 'content' string or 'items' array
  const normalizeContent = (card: ComparisonCard): string => {
    if (card.content) return card.content;
    if (card.items && card.items.length > 0) {
      return card.items.map(item => `• ${item}`).join('\n');
    }
    return '';
  };

  const leftContent = normalizeContent(leftCard);
  const rightContent = normalizeContent(rightCard);

  // Determine styling based on variant (default: left=negative, right=positive)
  const leftStyle = variantStyles[leftCard.variant || 'negative'];
  const rightStyle = variantStyles[rightCard.variant || 'positive'];

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
          {/* Left card */}
          <div className={`bg-white rounded-xl ${leftStyle.border} overflow-hidden ${leftStyle.shadow}`}>
            {/* Header */}
            <div className={`px-6 py-4 ${leftStyle.header}`}>
              <h3 className={`text-lg font-bold ${leftStyle.headerText} flex items-center gap-2`}>
                <span className={`w-6 h-6 rounded-full ${leftStyle.icon} flex items-center justify-center`}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={leftStyle.iconPath} />
                  </svg>
                </span>
                {leftCard.title || 'Left'}
              </h3>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                {leftContent}
              </p>
            </div>
            
            {/* Footer */}
            {leftCard.footer && (
              <div className={`px-6 py-4 ${leftStyle.footer}`}>
                <p className={`text-sm font-medium ${leftStyle.footerText}`}>
                  {leftCard.footer}
                </p>
              </div>
            )}
          </div>

          {/* Right card */}
          <div className={`bg-white rounded-xl ${rightStyle.border} overflow-hidden ${rightStyle.shadow}`}>
            {/* Header */}
            <div className={`px-6 py-4 ${rightStyle.header}`}>
              <h3 className={`text-lg font-bold ${rightStyle.headerText} flex items-center gap-2`}>
                <span className={`w-6 h-6 rounded-full ${rightStyle.icon} flex items-center justify-center`}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={rightStyle.iconPath} />
                  </svg>
                </span>
                {rightCard.title || 'Right'}
              </h3>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                {rightContent}
              </p>
            </div>
            
            {/* Footer */}
            {rightCard.footer && (
              <div className={`px-6 py-4 ${rightStyle.footer}`}>
                <p className={`text-sm font-bold ${rightStyle.footerText}`}>
                  {rightCard.footer}
                </p>
              </div>
            )}
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
