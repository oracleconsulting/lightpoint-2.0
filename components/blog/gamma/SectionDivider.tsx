'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface SectionDividerProps {
  readonly style?: 'gradient' | 'line' | 'dots' | 'space';
  readonly accent?: 'cyan' | 'purple' | 'amber';
}

/**
 * SectionDivider - Visual separator between major sections
 * 
 * Creates breathing room and clear visual breaks in the content.
 */
export default function SectionDivider({ 
  style = 'gradient',
  accent = 'cyan' 
}: SectionDividerProps) {
  const accentGradient = {
    cyan: 'from-transparent via-cyan-500/30 to-transparent',
    purple: 'from-transparent via-purple-500/30 to-transparent',
    amber: 'from-transparent via-amber-500/30 to-transparent',
  };

  if (style === 'space') {
    return <div className="h-8 md:h-12" aria-hidden="true" />;
  }

  if (style === 'dots') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="flex justify-center items-center gap-3 py-8 md:py-12"
        aria-hidden="true"
      >
        {[0, 1, 2].map((i) => (
          <div 
            key={i}
            className={`w-2 h-2 rounded-full ${
              accent === 'cyan' ? 'bg-cyan-500/50' :
              accent === 'purple' ? 'bg-purple-500/50' :
              'bg-amber-500/50'
            }`}
          />
        ))}
      </motion.div>
    );
  }

  if (style === 'line') {
    return (
      <motion.div 
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="py-8 md:py-12"
        aria-hidden="true"
      >
        <div className={`h-px w-full bg-gradient-to-r ${accentGradient[accent]}`} />
      </motion.div>
    );
  }

  // Default: gradient style
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-10 md:py-14"
      aria-hidden="true"
    >
      <div className={`h-px w-full bg-gradient-to-r ${accentGradient[accent]}`} />
    </motion.div>
  );
}
