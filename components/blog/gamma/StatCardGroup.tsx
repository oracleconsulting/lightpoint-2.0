'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface StatItem {
  metric: string;
  label: string;
  context?: string;
  color: 'blue' | 'cyan' | 'green' | 'amber' | 'red' | 'purple';
  prefix?: string;
  suffix?: string;
}

interface StatCardGroupProps {
  readonly title?: string;
  readonly stats: readonly StatItem[];
}

// V4 Color Styles - Enhanced for grouped display
const colorClasses = {
  blue: {
    border: 'border-l-blue-500',
    gradient: 'from-blue-400 to-cyan-400',
    glow: 'drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]'
  },
  cyan: {
    border: 'border-l-cyan-400',
    gradient: 'from-cyan-400 to-blue-400',
    glow: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'
  },
  green: {
    border: 'border-l-emerald-500',
    gradient: 'from-emerald-400 to-teal-400',
    glow: 'drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'
  },
  amber: {
    border: 'border-l-amber-500',
    gradient: 'from-amber-400 to-orange-400',
    glow: 'drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
  },
  red: {
    border: 'border-l-red-500',
    gradient: 'from-red-400 to-rose-400',
    glow: 'drop-shadow-[0_0_8px_rgba(248,113,113,0.5)]'
  },
  purple: {
    border: 'border-l-purple-500',
    gradient: 'from-purple-400 to-violet-400',
    glow: 'drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]'
  }
};

export default function StatCardGroup({ title, stats }: StatCardGroupProps) {
  // V4: Enforce horizontal layout - 2 or 3 columns only
  const cols = stats.length === 2 ? 'grid-cols-2' : 'grid-cols-3';
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto my-8 px-4"
    >
      {title && (
        <div className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4 pl-3 border-l-2 border-blue-500/40">
          {title}
        </div>
      )}
      
      {/* V4: Horizontal grid - NEVER vertical stacking */}
      <div className={`grid ${cols} gap-4 md:gap-6`}>
        {stats.map((stat) => {
          const safeColor = (stat.color && colorClasses[stat.color]) ? stat.color : 'blue';
          const colors = colorClasses[safeColor];
          const statKey = `${stat.metric}-${stat.label}`.replaceAll(/\s+/g, '-');
          
          return (
            <motion.div
              key={statKey}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: stats.indexOf(stat) * 0.1 }}
              className={`
                p-5
                bg-slate-800/60
                backdrop-blur-sm
                border-l-4 ${colors.border}
                rounded-r-xl
                transition-all duration-200
                hover:translate-y-[-2px]
                hover:shadow-lg
                hover:shadow-blue-500/10
              `}
            >
              {/* V4: Larger metric text - 32px in groups */}
              <div 
                className={`
                  text-3xl md:text-4xl font-extrabold
                  bg-gradient-to-r ${colors.gradient}
                  bg-clip-text text-transparent
                  ${colors.glow}
                  leading-none
                `}
              >
                {stat.prefix}{stat.metric}{stat.suffix}
              </div>
              
              {/* V4: Improved label - 15px */}
              <div className="text-sm md:text-base font-semibold text-white/90 mt-2 uppercase tracking-wide">
                {stat.label}
              </div>
              
              {stat.context && (
                <div className="text-sm text-white/60 mt-1">
                  {stat.context}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
