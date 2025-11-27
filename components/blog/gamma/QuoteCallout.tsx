'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

interface QuoteCalloutProps {
  readonly text: string;
  readonly attribution?: string;
  readonly source?: string;
  readonly accent?: 'blue' | 'cyan' | 'purple' | 'pink' | 'amber';
}

const accentConfig = {
  blue: {
    border: 'border-l-blue-500',
    bg: 'from-blue-500/10 to-blue-500/5',
    quote: 'text-blue-400',
    glow: 'shadow-blue-500/20'
  },
  cyan: {
    border: 'border-l-cyan-500',
    bg: 'from-cyan-500/10 to-cyan-500/5',
    quote: 'text-cyan-400',
    glow: 'shadow-cyan-500/20'
  },
  purple: {
    border: 'border-l-purple-500',
    bg: 'from-purple-500/10 to-purple-500/5',
    quote: 'text-purple-400',
    glow: 'shadow-purple-500/20'
  },
  pink: {
    border: 'border-l-pink-500',
    bg: 'from-pink-500/10 to-pink-500/5',
    quote: 'text-pink-400',
    glow: 'shadow-pink-500/20'
  },
  amber: {
    border: 'border-l-amber-500',
    bg: 'from-amber-500/10 to-amber-500/5',
    quote: 'text-amber-400',
    glow: 'shadow-amber-500/20'
  }
};

export default function QuoteCallout({ 
  text, 
  attribution, 
  source,
  accent = 'cyan' 
}: QuoteCalloutProps) {
  const config = accentConfig[accent];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto my-10 px-4"
    >
      <div className={`
        relative
        bg-gradient-to-br ${config.bg}
        border-l-4 ${config.border}
        rounded-r-xl
        p-8
        backdrop-blur-sm
        shadow-lg ${config.glow}
      `}>
        {/* Quote icon */}
        <div className={`absolute -top-4 -left-2 ${config.quote}`}>
          <Quote className="w-10 h-10 fill-current opacity-50" />
        </div>
        
        {/* Quote text */}
        <blockquote className="text-xl md:text-2xl text-white/90 leading-relaxed italic pl-4">
          "{text}"
        </blockquote>
        
        {/* Attribution */}
        {(attribution || source) && (
          <div className="mt-6 pl-4 flex items-center gap-2">
            <div className={`w-8 h-0.5 ${config.border.replace('border-l-', 'bg-')}`} />
            <div className="text-sm text-white/60">
              {attribution && <span className="font-semibold">{attribution}</span>}
              {attribution && source && <span className="mx-2">•</span>}
              {source && <span>{source}</span>}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

