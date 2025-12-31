'use client';

import React from 'react';

// ============================================================================
// STATS ROW
// Impactful statistics display with two variants:
// - Flat: Large numbers with supporting text
// - Ring: Circular progress indicators
// ============================================================================

interface Stat {
  value: string;
  label: string;
  description: string;
}

interface StatsRowProps {
  stats?: Stat[];
  items?: Stat[]; // Accept both prop names for backwards compatibility with AI layouts
  variant?: 'flat' | 'ring';
  columns?: 3 | 4;
  title?: string;
}

export function StatsRow({
  stats,
  items,
  variant = 'flat',
  columns = 4,
  title,
}: StatsRowProps) {
  // Normalize: accept either 'stats' or 'items' prop
  const normalizedStats = stats || items || [];
  
  // Early return if no stats
  if (normalizedStats.length === 0) {
    return null;
  }

  // DYNAMIC grid columns based on ACTUAL stat count with appropriate max-widths
  const statCount = normalizedStats.length;
  const gridCols = 
    statCount === 1 ? 'grid-cols-1 max-w-xs' :
    statCount === 2 ? 'grid-cols-2 max-w-2xl' :
    statCount === 3 ? 'grid-cols-1 sm:grid-cols-3 max-w-4xl' :
    'grid-cols-2 md:grid-cols-4 max-w-5xl';

  return (
    <div className="w-full">
      {title && (
        <h2 className="text-3xl font-bold text-slate-800 mb-6 text-center">
          {title}
        </h2>
      )}
      
      <div className={`grid ${gridCols} gap-8 md:gap-12 mx-auto`}>
        {normalizedStats.map((stat, index) => (
          <StatItem 
            key={index} 
            stat={stat} 
            variant={variant}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

interface StatItemProps {
  stat: Stat;
  variant: 'flat' | 'ring';
  index: number;
}

function StatItem({ stat, variant, index }: StatItemProps) {
  if (variant === 'ring') {
    return <RingStatItem stat={stat} index={index} />;
  }

  return (
    <div className="text-center group">
      {/* Large value */}
      <div className="relative inline-block mb-3">
        <span className="text-5xl lg:text-6xl font-bold bg-gradient-to-br from-slate-800 to-slate-600 bg-clip-text text-transparent">
          {stat.value}
        </span>
      </div>
      
      {/* Label */}
      <div className="text-sm font-semibold uppercase tracking-wider text-slate-700 mb-2">
        {stat.label}
      </div>
      
      {/* Description */}
      <div className="text-sm text-slate-500 leading-relaxed max-w-[200px] mx-auto">
        {stat.description}
      </div>
    </div>
  );
}

function RingStatItem({ stat, index }: { stat: Stat; index: number }) {
  // Extract numeric value for ring progress
  const numericMatch = stat.value.match(/[\d.]+/);
  const numericValue = numericMatch ? parseFloat(numericMatch[0]) : 50;
  const percentage = Math.min(numericValue, 100);

  // SVG calculations
  const size = 140;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color variations
  const colors = [
    { ring: '#1e40af', glow: 'rgba(30, 64, 175, 0.3)' },
    { ring: '#0f766e', glow: 'rgba(15, 118, 110, 0.3)' },
    { ring: '#7c3aed', glow: 'rgba(124, 58, 237, 0.3)' },
    { ring: '#b45309', glow: 'rgba(180, 83, 9, 0.3)' },
  ];
  const color = colors[index % colors.length];

  return (
    <div className="text-center">
      {/* Ring container */}
      <div className="relative w-36 h-36 mx-auto mb-4">
        <svg 
          className="w-full h-full transform -rotate-90" 
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color.ring}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{
              filter: `drop-shadow(0 0 8px ${color.glow})`,
              transition: 'stroke-dashoffset 1s ease-out',
            }}
          />
        </svg>
        
        {/* Center value */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-slate-800">
            {stat.value}
          </span>
        </div>
      </div>

      {/* Label */}
      <div className="text-sm font-semibold uppercase tracking-wider text-slate-700 mb-1">
        {stat.label}
      </div>
      
      {/* Description */}
      <div className="text-sm text-slate-500 leading-relaxed max-w-[180px] mx-auto">
        {stat.description}
      </div>
    </div>
  );
}

export default StatsRow;
