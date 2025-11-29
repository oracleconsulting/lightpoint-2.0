'use client';

import React from 'react';
import type { StatsRowProps, Stat } from '../types';

/**
 * StatsRow - Horizontal row of statistics
 * 
 * Matches Gamma pages 2 and 10:
 * - Flat variant: Large numbers with labels
 * - Ring variant: Circular progress rings around numbers
 * - 3 or 4 column layout
 */
export function StatsRow({
  stats,
  variant = 'flat',
  columns = 4,
  centered = true,
  className = '',
}: StatsRowProps) {
  const gridCols = columns === 3 
    ? 'grid-cols-1 sm:grid-cols-3' 
    : 'grid-cols-2 md:grid-cols-4';

  return (
    <div className={`bg-white py-12 px-8 ${className}`}>
      <div className="max-w-5xl mx-auto">
        <div className={`grid ${gridCols} gap-8`}>
          {stats.map((stat, index) => (
            <StatItem 
              key={index} 
              stat={stat} 
              variant={variant} 
              centered={centered}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatItemProps {
  stat: Stat;
  variant: 'flat' | 'ring';
  centered?: boolean;
}

function StatItem({ stat, variant, centered = true }: StatItemProps) {
  const alignClass = centered ? 'text-center' : 'text-left';

  if (variant === 'ring') {
    return (
      <div className={alignClass}>
        <RingStat value={stat.value} />
        <div className="font-semibold text-slate-700 mb-1">{stat.label}</div>
        <div className="text-sm text-gray-500">{stat.description}</div>
      </div>
    );
  }

  return (
    <div className={alignClass}>
      <div className="text-4xl md:text-5xl font-bold text-slate-800 mb-2">
        {stat.value}
      </div>
      <div className="font-semibold text-slate-700 mb-1">{stat.label}</div>
      <div className="text-sm text-gray-500">{stat.description}</div>
    </div>
  );
}

interface RingStatProps {
  value: string;
}

function RingStat({ value }: RingStatProps) {
  // Extract numeric value for the ring progress
  const numericMatch = value.match(/[\d.]+/);
  const numericValue = numericMatch ? parseFloat(numericMatch[0]) : 50;
  
  // Normalize to percentage (cap at 100)
  const percentage = Math.min(numericValue, 100);
  
  // SVG circle calculations
  const size = 112;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-28 h-28 mx-auto mb-4">
      <svg className="w-28 h-28 transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1e3a5f"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {/* Value in center */}
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-800">
        {value}
      </span>
    </div>
  );
}

export default StatsRow;

