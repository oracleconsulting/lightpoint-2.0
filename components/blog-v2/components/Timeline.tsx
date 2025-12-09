'use client';

import React from 'react';

// ============================================================================
// TIMELINE
// Chronological event display with alternating layout
// ============================================================================

interface TimelineEvent {
  date: string;
  description: string;
  type?: 'neutral' | 'positive' | 'negative';
}

interface TimelineProps {
  title?: string;
  intro?: string;
  events: TimelineEvent[];
  quote?: string;
  quoteAttribution?: string;
}

export function Timeline({
  title,
  intro,
  events,
  quote,
  quoteAttribution,
}: TimelineProps) {
  return (
    <div className="w-full py-8 bg-white">
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        {/* Header */}
        {(title || intro) && (
          <div className="mb-6">
            {title && (
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-3 tracking-tight">
                {title}
              </h2>
            )}
            {intro && (
              <p className="text-lg text-slate-600 leading-relaxed">
                {intro}
              </p>
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="relative">
          {/* Center line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 md:transform md:-translate-x-0.5" />

          {/* Events */}
          <div className="space-y-6">
            {events.map((event, index) => (
              <TimelineEventItem 
                key={index} 
                event={event} 
                index={index}
                isLeft={index % 2 === 0}
              />
            ))}
          </div>
        </div>

        {/* Quote */}
        {quote && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <blockquote className="relative pl-6 border-l-4 border-blue-500">
              <p className="text-lg text-slate-700 italic leading-relaxed">
                &quot;{quote}&quot;
              </p>
              {quoteAttribution && (
                <cite className="block mt-3 text-sm text-slate-500 not-italic">
                  — {quoteAttribution}
                </cite>
              )}
            </blockquote>
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineEventItem({ 
  event, 
  index, 
  isLeft 
}: { 
  event: TimelineEvent; 
  index: number;
  isLeft: boolean;
}) {
  const typeColors = {
    neutral: 'bg-slate-400',
    positive: 'bg-emerald-500',
    negative: 'bg-red-500',
  };

  return (
    <div className={`
      relative flex items-start gap-6 
      ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'}
      ml-8 md:ml-0
    `}>
      {/* Content card */}
      <div className={`
        flex-1 bg-white rounded-xl border border-slate-200 p-5 shadow-sm
        hover:shadow-md transition-shadow
        ${isLeft ? 'md:text-right' : 'md:text-left'}
      `}>
        {/* Date badge */}
        <div className={`
          inline-block px-3 py-1 bg-slate-100 rounded-full 
          text-sm font-semibold text-slate-700 mb-2
        `}>
          {event.date}
        </div>
        
        {/* Description */}
        <p className="text-slate-600 leading-relaxed">
          {event.description.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^\.\s+/, '').trim()}
        </p>
      </div>

      {/* Center dot */}
      <div className="absolute left-0 md:left-1/2 top-6 md:transform md:-translate-x-1/2">
        <div className={`
          w-4 h-4 rounded-full border-4 border-white shadow-md
          ${typeColors[event.type || 'neutral']}
        `} />
      </div>

      {/* Spacer for alternating layout */}
      <div className="hidden md:block flex-1" />
    </div>
  );
}

export default Timeline;
