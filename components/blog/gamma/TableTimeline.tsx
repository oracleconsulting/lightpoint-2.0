'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface TimelineEvent {
  readonly date: string;
  readonly title?: string;
  readonly description: string;
  readonly type?: 'neutral' | 'negative' | 'positive';
}

interface TableTimelineProps {
  readonly title: string;
  readonly events: readonly TimelineEvent[];
  readonly compact?: boolean;
}

const typeColors = {
  neutral: 'text-cyan-400',
  negative: 'text-red-400',
  positive: 'text-emerald-400',
};

export default function TableTimeline({ title, events, compact = false }: TableTimelineProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <h3 className="text-2xl font-bold text-white mb-6">{title}</h3>
      
      <div 
        className="
          rounded-xl overflow-hidden 
          border border-white/[0.08]
          bg-slate-800/20
        "
      >
        <table className="w-full">
          <tbody>
            {events.map((event, index) => {
              const eventKey = `${event.date}-${index}`;
              
              return (
                <motion.tr 
                  key={eventKey}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`
                    border-b border-white/[0.04] last:border-b-0
                    hover:bg-white/[0.03] transition-colors duration-200
                  `}
                >
                  {/* Date column */}
                  <td className={`
                    ${compact ? 'px-4 py-3' : 'px-6 py-5'} 
                    w-36 md:w-48
                    border-r border-white/[0.04]
                  `}>
                    <span className={`
                      font-semibold text-sm md:text-base
                      ${typeColors[event.type || 'neutral']}
                    `}>
                      {event.date}
                    </span>
                  </td>
                  
                  {/* Content column */}
                  <td className={`${compact ? 'px-4 py-3' : 'px-6 py-5'}`}>
                    {event.title && (
                      <div className="font-semibold text-white mb-1">
                        {event.title}
                      </div>
                    )}
                    <span className="text-white/70 text-sm md:text-base leading-relaxed">
                      {event.description}
                    </span>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// Alternative: Compact inline timeline for smaller spaces
export function InlineTimeline({ events }: { readonly events: readonly TimelineEvent[] }) {
  return (
    <div className="max-w-4xl mx-auto my-6 px-4">
      <div className="flex flex-wrap gap-4">
        {events.map((event, index) => {
          const eventKey = `inline-${event.date}-${index}`;
          
          return (
            <motion.div 
              key={eventKey}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="
                flex items-center gap-3
                px-4 py-2
                bg-slate-800/50
                rounded-lg
                border border-white/5
              "
            >
              <span className="text-cyan-400 text-sm font-semibold">
                {event.date}
              </span>
              <span className="text-white/60 text-sm">
                {event.description}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

