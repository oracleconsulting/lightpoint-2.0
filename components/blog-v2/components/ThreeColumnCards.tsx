'use client';

import React from 'react';

// ============================================================================
// THREE COLUMN CARDS
// Feature cards with optional callout sections for "Instead:" examples
// ============================================================================

interface CardCallout {
  label: string;
  text: string;
}

interface Card {
  icon?: boolean | string;
  title: string;
  description: string;
  callout?: CardCallout;
}

interface ThreeColumnCardsProps {
  title?: string;
  intro?: string;
  cards?: Card[];
  background?: 'white' | 'gray';
}

export function ThreeColumnCards({
  title,
  intro,
  cards,
  background = 'white',
}: ThreeColumnCardsProps) {
  // Defensive: ensure cards is an array
  const normalizedCards = cards || [];
  if (normalizedCards.length === 0) {
    return null;
  }

  const bgClass = background === 'gray' ? 'bg-slate-50' : 'bg-white';

  return (
    <div className={`w-full py-8 ${bgClass}`}>
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Header */}
        {(title || intro) && (
          <div className="mb-6 text-center">
            {title && (
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-3 tracking-tight">
                {title}
              </h2>
            )}
            {intro && (
              <p className="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto">
                {intro}
              </p>
            )}
          </div>
        )}

        {/* Cards grid - adapts based on card count */}
        {/* 2 cards: side by side, 3 cards: 3 columns, 4 cards: 2x2 grid */}
        <div className={`grid gap-6 ${
          normalizedCards.length === 4 
            ? 'grid-cols-1 md:grid-cols-2' // 4 cards: 2x2 grid
            : normalizedCards.length === 2
            ? 'grid-cols-1 md:grid-cols-2' // 2 cards: side by side
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' // 3 cards: standard 3-column
        }`}>
          {normalizedCards.map((card, index) => (
            <CardItem key={index} card={card} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CardItem({ card, index }: { card: Card; index: number }) {
  const iconColors = [
    'from-blue-500 to-blue-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
  ];

  // Clean text helper - removes markdown artifacts and fixes broken text
  const cleanText = (text: string): string => {
    if (!text) return '';
    return text
      .replace(/\*\*/g, '')      // Remove bold markers
      .replace(/\*/g, '')        // Remove italic markers
      .replace(/__/g, '')        // Remove underline markers
      .replace(/_/g, '')         // Remove italic markers
      .replace(/^\.\s+/, '')     // Remove leading periods
      .replace(/\n\s*\.\s+/g, '. ') // Fix periods at start of lines
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim();
  };

  // Clean title and description
  const cleanTitle = cleanText(card.title);
  const cleanDescription = cleanText(card.description);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Card content */}
      <div className="p-7 lg:p-8">
        {/* Icon */}
        {card.icon && (
          <div className={`
            w-14 h-14 rounded-xl bg-gradient-to-br ${iconColors[index % 3]} 
            flex items-center justify-center mb-5 shadow-lg
          `}>
            {typeof card.icon === 'string' ? (
              <span className="text-2xl">{card.icon}</span>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="text-[23px] lg:text-[24px] font-bold text-slate-800 mb-3 leading-[1.3]">
          {cleanTitle}
        </h3>

        {/* Description */}
        <p className="text-[18px] lg:text-[19px] text-slate-600 leading-[1.75]">
          {cleanDescription}
        </p>
      </div>

      {/* Callout section */}
      {card.callout && (
        <div className="px-7 lg:px-8 py-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-sm font-bold text-blue-600 uppercase tracking-wider flex-shrink-0">
              {cleanText(card.callout.label)}
            </span>
          </div>
          <p className="text-[17px] lg:text-[18px] text-slate-700 italic leading-[1.75]">
            &quot;{cleanText(card.callout.text)}&quot;
          </p>
        </div>
      )}
    </div>
  );
}

export default ThreeColumnCards;
