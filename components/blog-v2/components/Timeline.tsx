'use client';

import React from 'react';

// ============================================================================
// TIMELINE - Gamma-quality chronological event display
// Features:
// - Vertical connector line
// - Branded dot markers
// - Event type colors (positive/negative/neutral)
// - Alternating layout on desktop
// ============================================================================

interface TimelineEvent {
  date: string;
  description: string;
  title?: string;
  type?: 'neutral' | 'positive' | 'negative';
}

interface TimelineProps {
  title?: string;
  intro?: string;
  events?: TimelineEvent[];
  items?: TimelineEvent[]; // AI compatibility
  quote?: string;
  quoteAttribution?: string;
  variant?: 'default' | 'compact' | 'alternating';
}

export function Timeline({
  title,
  intro,
  events,
  items,
  quote,
  quoteAttribution,
  variant = 'default',
}: TimelineProps) {
  // Normalize: accept both 'events' and 'items'
  const normalizedEvents = events || items || [];
  
  if (normalizedEvents.length === 0 && !quote) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      {(title || intro) && (
        <div className="mb-8">
          {title && (
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-3 tracking-tight">
              {title}
            </h2>
          )}
          {intro && (
            <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
              {intro}
            </p>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {/* Vertical connector line */}
        <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#1e3a5f] via-slate-200 to-slate-100" />
        
        <div className="space-y-6">
          {normalizedEvents.map((event, index) => (
            <TimelineEventItem 
              key={index} 
              event={event} 
              index={index}
              isLast={index === normalizedEvents.length - 1}
              variant={variant}
            />
          ))}
        </div>
      </div>

      {/* Quote */}
      {quote && (
        <div className="mt-8 pt-6 border-t border-slate-200">
          <blockquote className="relative pl-6 border-l-4 border-[#d4a84b]">
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
  );
}

interface TimelineEventItemProps {
  event: TimelineEvent;
  index: number;
  isLast: boolean;
  variant: 'default' | 'compact' | 'alternating';
}

function TimelineEventItem({ event, index, isLast, variant }: TimelineEventItemProps) {
  const typeStyles = {
    neutral: {
      dot: 'bg-white border-4 border-[#1e3a5f]',
      badge: 'bg-slate-100 text-slate-700',
    },
    positive: {
      dot: 'bg-emerald-500 border-4 border-white shadow-lg shadow-emerald-500/30',
      badge: 'bg-emerald-50 text-emerald-700',
    },
    negative: {
      dot: 'bg-red-500 border-4 border-white shadow-lg shadow-red-500/30',
      badge: 'bg-red-50 text-red-700',
    },
  };

  const style = typeStyles[event.type || 'neutral'];

  if (variant === 'compact') {
    return (
      <div className="relative flex gap-4 items-start">
        {/* Dot */}
        <div className={`w-4 h-4 rounded-full flex-shrink-0 mt-1.5 z-10 ${style.dot}`} />
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-sm font-bold text-[#d4a84b]">{event.date}</span>
            {event.title && (
              <span className="text-sm font-semibold text-slate-800">{event.title}</span>
            )}
          </div>
          <p className="text-slate-600 leading-relaxed">
            {cleanText(event.description)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex gap-5 items-start">
      {/* Dot with ring effect */}
      <div className="relative z-10 flex-shrink-0">
        <div className={`w-9 h-9 rounded-full ${style.dot}`} />
        {/* Pulse animation for current/important events */}
        {event.type === 'positive' && (
          <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20" />
        )}
      </div>
      
      {/* Content card */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
        {/* Date badge */}
        <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3 ${style.badge}`}>
          {event.date}
        </div>
        
        {/* Title if present */}
        {event.title && (
          <h4 className="text-lg font-bold text-slate-800 mb-2">{event.title}</h4>
        )}
        
        {/* Description */}
        <p className="text-slate-600 leading-relaxed">
          {cleanText(event.description)}
        </p>
      </div>
    </div>
  );
}

// Helper function to clean markdown artifacts
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^\.\s+/, '')
    .trim();
}

export default Timeline;
