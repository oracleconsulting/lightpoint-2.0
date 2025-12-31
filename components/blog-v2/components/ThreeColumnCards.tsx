'use client';

import React from 'react';

// ============================================================================
// THREE COLUMN CARDS
// Professional feature cards with Lightpoint brand styling
// Navy icon containers for consistent, professional look
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
  items?: Card[]; // AI compatibility
  background?: 'white' | 'gray';
  variant?: 'default' | 'outlined' | 'minimal';
}

// Professional icon styling - navy/slate with consistent branding
const getIconStyle = (index: number) => {
  const styles = [
    'bg-[#1e3a5f]', // Navy - primary brand
    'bg-slate-700', // Slate
    'bg-[#1e3a5f]', // Navy
    'bg-amber-600', // Gold accent (occasional)
  ];
  return styles[index % styles.length];
};

export function ThreeColumnCards({
  title,
  intro,
  cards,
  items,
  background = 'white',
  variant = 'default',
}: ThreeColumnCardsProps) {
  // Defensive: ensure cards is an array, accept both prop names
  const normalizedCards = cards || items || [];
  if (normalizedCards.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      {(title || intro) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-3 tracking-tight">
              {title}
            </h2>
          )}
          {intro && (
            <p className="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-3xl">
              {intro}
            </p>
          )}
        </div>
      )}

      {/* Cards grid - adapts based on card count */}
      <div className={`grid gap-6 ${
        normalizedCards.length === 4 
          ? 'grid-cols-1 md:grid-cols-2' // 4 cards: 2x2 grid
          : normalizedCards.length === 2
          ? 'grid-cols-1 md:grid-cols-2 max-w-3xl' // 2 cards: side by side
          : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' // 3 cards: standard 3-column
      }`}>
        {normalizedCards.map((card, index) => (
          <CardItem 
            key={index} 
            card={card} 
            index={index}
            variant={variant}
          />
        ))}
      </div>
    </div>
  );
}

interface CardItemProps {
  card: Card;
  index: number;
  variant: 'default' | 'outlined' | 'minimal';
}

function CardItem({ card, index, variant }: CardItemProps) {
  const iconBgColor = getIconStyle(index);

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

  // Minimal variant - simple centered cards
  if (variant === 'minimal') {
    return (
      <div className="text-center">
        {card.icon && (
          <div className={`w-12 h-12 rounded-xl ${iconBgColor} flex items-center justify-center mx-auto mb-4`}>
            {typeof card.icon === 'string' ? (
              <span className="text-xl filter brightness-0 invert">{card.icon}</span>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
        <h3 className="font-semibold text-slate-800 text-lg mb-2">{cleanTitle}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{cleanDescription}</p>
      </div>
    );
  }

  // Outlined variant - subtle border, no background
  if (variant === 'outlined') {
    return (
      <div className="border border-slate-200 rounded-xl p-6 hover:border-slate-300 hover:shadow-sm transition-all">
        {card.icon && (
          <div className={`w-11 h-11 rounded-xl ${iconBgColor} flex items-center justify-center mb-4`}>
            {typeof card.icon === 'string' ? (
              <span className="text-lg filter brightness-0 invert">{card.icon}</span>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}
        <h3 className="font-semibold text-slate-800 text-lg mb-2">{cleanTitle}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{cleanDescription}</p>
      </div>
    );
  }

  // Default variant - card with background and shadow
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
      {/* Card content */}
      <div className="p-6 lg:p-7">
        {/* Icon in navy container - PROFESSIONAL STYLING */}
        {card.icon && (
          <div className={`w-12 h-12 rounded-xl ${iconBgColor} flex items-center justify-center mb-5`}>
            {typeof card.icon === 'string' ? (
              // Make emoji white/monochrome for consistent look
              <span className="text-xl filter brightness-0 invert">{card.icon}</span>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl lg:text-[22px] font-bold text-slate-800 mb-3 leading-tight">
          {cleanTitle}
        </h3>

        {/* Description */}
        <p className="text-base lg:text-[17px] text-slate-600 leading-relaxed">
          {cleanDescription}
        </p>
      </div>

      {/* Callout section */}
      {card.callout && (
        <div className="px-6 lg:px-7 py-4 bg-slate-50 border-t border-slate-100">
          <div className="flex items-start gap-2 mb-2">
            <span className="text-sm font-bold text-[#1e3a5f] uppercase tracking-wider flex-shrink-0">
              {cleanText(card.callout.label)}
            </span>
          </div>
          <p className="text-base text-slate-700 italic leading-relaxed">
            &quot;{cleanText(card.callout.text)}&quot;
          </p>
        </div>
      )}
    </div>
  );
}

export default ThreeColumnCards;
