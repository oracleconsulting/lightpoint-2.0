'use client';

import React from 'react';
import type { TimelineProps, TimelineEvent } from '../types';

/**
 * Timeline - Vertical timeline with alternating cards
 * 
 * Matches Gamma page 7:
 * - Central vertical line
 * - Cards alternate left/right
 * - Dots on connection points
 * - Optional quote at bottom
 */
export function Timeline({
  title,
  intro,
  events,
  quote,
  quoteAttribution,
  className = '',
}: TimelineProps) {
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

        {/* Timeline */}
        <div className="relative">
          {/* Central line - hidden on mobile, visible on md+ */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-200 transform -translate-x-1/2" />

          {/* Events */}
          <div className="space-y-6 md:space-y-8">
            {events.map((event, index) => (
              <TimelineItem 
                key={index} 
                event={event} 
                index={index}
                isLast={index === events.length - 1}
              />
            ))}
          </div>
        </div>

        {/* Quote */}
        {quote && (
          <div className="mt-10 border-l-4 border-blue-500 pl-6 py-3 bg-gray-50 rounded-r-lg">
            <p className="text-gray-700 italic leading-relaxed">&quot;{quote}&quot;</p>
            {quoteAttribution && (
              <p className="text-sm text-gray-500 mt-2">— {quoteAttribution}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface TimelineItemProps {
  event: TimelineEvent;
  index: number;
  isLast: boolean;
}

function TimelineItem({ event, index, isLast }: TimelineItemProps) {
  const isLeft = index % 2 === 0;

  return (
    <div className="relative">
      {/* Mobile layout - simple vertical */}
      <div className="md:hidden flex gap-4">
        <div className="flex flex-col items-center">
          <div className="w-3 h-3 bg-slate-800 rounded-full flex-shrink-0" />
          {!isLast && <div className="w-0.5 flex-1 bg-gray-200 mt-2" />}
        </div>
        <div className="bg-gray-100 rounded-lg p-4 flex-1 mb-2">
          <div className="font-bold text-slate-800 mb-1">{event.date}</div>
          <div className="text-gray-600 text-sm">{event.description}</div>
        </div>
      </div>

      {/* Desktop layout - alternating */}
      <div className="hidden md:flex items-center">
        {/* Dot on timeline */}
        <div className="absolute left-1/2 w-3 h-3 bg-slate-800 rounded-full transform -translate-x-1/2 z-10" />

        {/* Left side content */}
        <div className={`w-5/12 ${isLeft ? '' : 'invisible'}`}>
          {isLeft && (
            <div className="bg-gray-100 rounded-lg p-4 mr-8">
              <div className="font-bold text-slate-800 mb-1">{event.date}</div>
              <div className="text-gray-600 text-sm">{event.description}</div>
            </div>
          )}
        </div>

        {/* Center spacer */}
        <div className="w-2/12" />

        {/* Right side content */}
        <div className={`w-5/12 ${isLeft ? 'invisible' : ''}`}>
          {!isLeft && (
            <div className="bg-gray-100 rounded-lg p-4 ml-8">
              <div className="font-bold text-slate-800 mb-1">{event.date}</div>
              <div className="text-gray-600 text-sm">{event.description}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Timeline;

