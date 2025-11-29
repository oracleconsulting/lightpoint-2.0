'use client';

import React from 'react';
import type { ThreeColumnCardsProps, Card } from '../types';

/**
 * ThreeColumnCards - Three equal-width cards with optional callouts
 * 
 * Matches Gamma page 5:
 * - Equal width columns
 * - Gray background cards
 * - Optional icon circle at top
 * - "Instead:" callout pattern
 */
export function ThreeColumnCards({
  title,
  intro,
  cards,
  background = 'gray',
  className = '',
}: ThreeColumnCardsProps) {
  const bgClass = background === 'gray' ? 'bg-gray-50' : 'bg-white';

  return (
    <div className={`py-16 px-8 ${bgClass} ${className}`}>
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

        {/* Cards grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <CardItem key={index} card={card} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface CardItemProps {
  card: Card;
}

function CardItem({ card }: CardItemProps) {
  return (
    <div className="bg-gray-100 rounded-lg p-6 flex flex-col">
      {/* Icon */}
      {card.icon && (
        <div className="mb-4">
          {typeof card.icon === 'string' ? (
            <span className="text-2xl">{card.icon}</span>
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-800" />
          )}
        </div>
      )}

      {/* Title */}
      <h3 className="font-bold text-slate-800 text-lg mb-3">
        {card.title}
      </h3>

      {/* Description */}
      <p className="text-gray-600 leading-relaxed flex-1">
        {card.description}
      </p>

      {/* Callout */}
      {card.callout && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <span className="font-bold text-slate-800">{card.callout.label}</span>{' '}
          <span className="text-gray-600 text-sm leading-relaxed">
            {card.callout.text}
          </span>
        </div>
      )}
    </div>
  );
}

export default ThreeColumnCards;

