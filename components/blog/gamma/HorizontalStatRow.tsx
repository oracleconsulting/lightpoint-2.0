'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface Stat {
  readonly metric: string;
  readonly label: string;
  readonly sublabel?: string;
  readonly prefix?: string;
  readonly suffix?: string;
  readonly color?: 'blue' | 'cyan' | 'green' | 'amber' | 'purple' | 'red';
}

interface HorizontalStatRowProps {
  readonly stats: readonly Stat[];
  readonly title?: string;
}

const colorClasses = {
  blue: {
    text: 'text-blue-400',
    glow: 'drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]',
  },
  cyan: {
    text: 'text-cyan-400',
    glow: 'drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]',
  },
  green: {
    text: 'text-emerald-400',
    glow: 'drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]',
  },
  amber: {
    text: 'text-amber-400',
    glow: 'drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]',
  },
  purple: {
    text: 'text-purple-400',
    glow: 'drop-shadow-[0_0_20px_rgba(167,139,250,0.5)]',
  },
  red: {
    text: 'text-red-400',
    glow: 'drop-shadow-[0_0_20px_rgba(248,113,113,0.5)]',
  },
};

export default function HorizontalStatRow({ stats, title }: HorizontalStatRowProps) {
  // Determine grid columns based on stat count
  const gridCols = stats.length === 2 
    ? 'grid-cols-2' 
    : stats.length === 3 
    ? 'grid-cols-3' 
    : 'grid-cols-2 lg:grid-cols-4';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {title && (
        <h3 className="text-lg font-semibold text-white/60 mb-8 text-center uppercase tracking-wider">
          {title}
        </h3>
      )}
      
      {/* Subtle background panel for visual grouping - very transparent */}
      <div className={`grid ${gridCols} gap-8 md:gap-12 lg:gap-16 py-10 md:py-14 px-4 md:px-6 rounded-2xl bg-white/[0.02]`}>
        {stats.map((stat) => {
          const safeColor = stat.color && colorClasses[stat.color] ? stat.color : 'cyan';
          const colors = colorClasses[safeColor];
          const statKey = `${stat.metric}-${stat.label}`.replaceAll(/\s+/g, '-');
          
          return (
            <motion.div 
              key={statKey} 
              className="text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: stats.indexOf(stat) * 0.1 }}
            >
              {/* Large metric with glow - BIGGER for impact */}
              <div 
                className={`
                  text-4xl sm:text-5xl md:text-6xl lg:text-7xl
                  font-black 
                  ${colors.text}
                  ${colors.glow}
                  mb-3 md:mb-4
                  tracking-tight
                  leading-none
                `}
              >
                {stat.prefix}
                {stat.metric}
                {stat.suffix}
              </div>
              
              {/* Primary label - larger */}
              <div className="text-base sm:text-lg md:text-xl font-semibold text-white mb-2 md:mb-3 uppercase tracking-wide">
                {stat.label}
              </div>
              
              {/* Sublabel / context */}
              {stat.sublabel && (
                <div className="text-sm md:text-base text-white/50 leading-relaxed max-w-[220px] mx-auto">
                  {stat.sublabel}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}


