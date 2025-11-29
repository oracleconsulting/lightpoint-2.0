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
  cards: Card[];
  background?: 'white' | 'gray';
}

export function ThreeColumnCards({
  title,
  intro,
  cards,
  background = 'white',
}: ThreeColumnCardsProps) {
  const bgClass = background === 'gray' ? 'bg-slate-50' : 'bg-white';

  return (
    <div className={`w-full py-16 ${bgClass}`}>
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        {/* Header */}
        {(title || intro) && (
          <div className="mb-12 text-center">
            {title && (
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-4 tracking-tight">
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

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {cards.map((card, index) => (
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

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Card content */}
      <div className="p-6">
        {/* Icon */}
        {card.icon && (
          <div className={`
            w-12 h-12 rounded-xl bg-gradient-to-br ${iconColors[index % 3]} 
            flex items-center justify-center mb-4 shadow-lg
          `}>
            {typeof card.icon === 'string' ? (
              <span className="text-xl">{card.icon}</span>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-800 mb-3">
          {card.title}
        </h3>

        {/* Description */}
        <p className="text-slate-600 leading-relaxed">
          {card.description}
        </p>
      </div>

      {/* Callout section */}
      {card.callout && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-start gap-2">
            <span className="text-sm font-bold text-blue-600 uppercase tracking-wider flex-shrink-0">
              {card.callout.label}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-700 italic leading-relaxed">
            &quot;{card.callout.text}&quot;
          </p>
        </div>
      )}
    </div>
  );
}

export default ThreeColumnCards;
