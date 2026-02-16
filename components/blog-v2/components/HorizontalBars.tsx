'use client';

import React from 'react';

/**
 * HorizontalBars - Animated horizontal bar chart for percentages/statistics
 * 
 * Perfect for showing escalation success rates, comparison metrics, etc.
 * Features:
 * - Animated bar fill on mount
 * - Navy gradient fill with brand consistency
 * - Labels on both ends for clarity
 */

interface Bar {
  label: string;
  value: number;
  suffix?: string;
  description?: string;
}

interface HorizontalBarsProps {
  title?: string;
  subtitle?: string;
  bars?: Bar[];
  items?: Bar[]; // AI compatibility
  maxValue?: number;
  showLabels?: boolean;
  className?: string;
}

export function HorizontalBars({ 
  title, 
  subtitle,
  bars, 
  items, 
  maxValue,
  showLabels = true,
  className = '' 
}: HorizontalBarsProps) {
  const normalizedBars = bars || items || [];
  
  if (normalizedBars.length === 0) return null;
  
  // Calculate max for scaling
  const max = maxValue || Math.max(...normalizedBars.map(b => b.value), 100);

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="mb-6">
          {title && (
            <h3 className="text-2xl font-bold text-slate-800 mb-2">{title}</h3>
          )}
          {subtitle && (
            <p className="text-slate-600">{subtitle}</p>
          )}
        </div>
      )}
      
      {/* Bars */}
      <div className="space-y-5">
        {normalizedBars.map((bar, index) => (
          <BarItem 
            key={index} 
            bar={bar} 
            maxValue={max}
            showLabels={showLabels}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

interface BarItemProps {
  bar: Bar;
  maxValue: number;
  showLabels: boolean;
  index: number;
}

function BarItem({ bar, maxValue, showLabels, index }: BarItemProps) {
  const percentage = (bar.value / maxValue) * 100;
  
  // Alternate between navy and slate for visual variety
  const barColors = [
    'from-[#1e3a5f] to-[#2d5a8f]', // Navy gradient
    'from-slate-600 to-slate-500', // Slate gradient
    'from-[#1e3a5f] to-[#2d5a8f]', // Navy gradient
    'from-amber-500 to-amber-600', // Gold accent (for last/best)
  ];
  const barColor = barColors[index % barColors.length];

  return (
    <div className="group">
      {/* Label row */}
      {showLabels && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-slate-700">{bar.label}</span>
          <span className="text-lg font-bold text-slate-800">
            {bar.value}{bar.suffix || '%'}
          </span>
        </div>
      )}
      
      {/* Bar container */}
      <div className="relative h-10 bg-slate-100 rounded-lg overflow-hidden">
        {/* Animated fill */}
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColor} rounded-lg transition-all duration-1000 ease-out`}
          style={{ 
            width: `${percentage}%`,
            animation: 'growWidth 1s ease-out forwards',
            animationDelay: `${index * 150}ms`
          }}
        >
          {/* Inner highlight */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
        </div>
        
        {/* Value inside bar (for larger bars) */}
        {percentage > 30 && (
          <div className="absolute inset-0 flex items-center px-4">
            <span className="text-white font-bold text-sm drop-shadow">
              {bar.value}{bar.suffix || '%'}
            </span>
          </div>
        )}
      </div>
      
      {/* Description */}
      {bar.description && (
        <p className="text-xs text-slate-500 mt-1">{bar.description}</p>
      )}
    </div>
  );
}

/**
 * Compact variant for inline use
 */
export function ProgressBar({ 
  label, 
  value, 
  maxValue = 100,
  className = '' 
}: { 
  label?: string; 
  value: number; 
  maxValue?: number;
  className?: string;
}) {
  const percentage = (value / maxValue) * 100;
  
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {label && (
        <span className="text-sm font-medium text-slate-600 w-24 text-right">{label}</span>
      )}
      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8f] rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-bold text-slate-800 w-12">{value}%</span>
    </div>
  );
}

export default HorizontalBars;



