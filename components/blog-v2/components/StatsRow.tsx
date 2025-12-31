'use client';

import React from 'react';

// ============================================================================
// STATS ROW - Gamma-quality statistics display
// Features:
// - Vertical dividers between stats
// - Gradient text for impact
// - Ring variant for percentages
// - Dynamic grid based on stat count
// ============================================================================

interface Stat {
  value: string;
  label: string;
  description?: string;
}

interface StatsRowProps {
  stats?: Stat[];
  items?: Stat[]; // AI compatibility
  variant?: 'flat' | 'ring' | 'card';
  columns?: 3 | 4;
  title?: string;
  showDividers?: boolean;
}

export function StatsRow({
  stats,
  items,
  variant = 'flat',
  columns = 4,
  title,
  showDividers = true,
}: StatsRowProps) {
  // Normalize: accept either 'stats' or 'items' prop
  const normalizedStats = stats || items || [];
  
  if (normalizedStats.length === 0) {
    return null;
  }

  // Dynamic grid columns based on actual stat count
  const statCount = normalizedStats.length;
  const gridCols = 
    statCount === 1 ? 'grid-cols-1 max-w-xs' :
    statCount === 2 ? 'grid-cols-2 max-w-2xl' :
    statCount === 3 ? 'grid-cols-1 sm:grid-cols-3 max-w-4xl' :
    'grid-cols-2 md:grid-cols-4 max-w-5xl';

  return (
    <div className="w-full">
      {title && (
        <h2 className="text-3xl font-bold text-slate-800 mb-8 text-center">
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
            isLast={index === normalizedStats.length - 1}
            showDivider={showDividers && index < normalizedStats.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

interface StatItemProps {
  stat: Stat;
  variant: 'flat' | 'ring' | 'card';
  index: number;
  isLast: boolean;
  showDivider: boolean;
}

function StatItem({ stat, variant, index, isLast, showDivider }: StatItemProps) {
  if (variant === 'ring') {
    return <RingStatItem stat={stat} index={index} showDivider={showDivider} />;
  }
  
  if (variant === 'card') {
    return <CardStatItem stat={stat} index={index} />;
  }

  return (
    <div className="text-center relative group">
      {/* Large value with gradient */}
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
      {stat.description && (
        <div className="text-sm text-slate-500 leading-relaxed max-w-[200px] mx-auto">
          {stat.description}
        </div>
      )}
      
      {/* Vertical divider - positioned between stats */}
      {showDivider && (
        <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-[50%] w-px h-20 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
      )}
    </div>
  );
}

function RingStatItem({ stat, index, showDivider }: { stat: Stat; index: number; showDivider: boolean }) {
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

  // Brand-consistent colors
  const colors = [
    { ring: '#1e3a5f', glow: 'rgba(30, 58, 95, 0.3)' },   // Navy
    { ring: '#d4a84b', glow: 'rgba(212, 168, 75, 0.3)' }, // Gold
    { ring: '#1e3a5f', glow: 'rgba(30, 58, 95, 0.3)' },   // Navy
    { ring: '#475569', glow: 'rgba(71, 85, 105, 0.3)' },  // Slate
  ];
  const color = colors[index % colors.length];

  return (
    <div className="text-center relative">
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
      {stat.description && (
        <div className="text-sm text-slate-500 leading-relaxed max-w-[180px] mx-auto">
          {stat.description}
        </div>
      )}
      
      {/* Vertical divider */}
      {showDivider && (
        <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-[50%] w-px h-20 bg-gradient-to-b from-transparent via-slate-200 to-transparent" />
      )}
    </div>
  );
}

function CardStatItem({ stat, index }: { stat: Stat; index: number }) {
  // Alternating accent colors
  const accents = ['border-l-[#1e3a5f]', 'border-l-[#d4a84b]', 'border-l-[#1e3a5f]', 'border-l-slate-600'];
  const accent = accents[index % accents.length];
  
  return (
    <div className={`bg-white rounded-xl border border-slate-200 p-6 shadow-sm border-l-4 ${accent}`}>
      <div className="text-4xl font-bold text-slate-800 mb-2">
        {stat.value}
      </div>
      <div className="text-sm font-semibold uppercase tracking-wider text-slate-700 mb-1">
        {stat.label}
      </div>
      {stat.description && (
        <div className="text-sm text-slate-500">
          {stat.description}
        </div>
      )}
    </div>
  );
}

export default StatsRow;
