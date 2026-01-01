'use client';

import React from 'react';

// ============================================================================
// DONUT CHART
// SVG-based donut chart with legend and optional center label
// Intelligently handles both percentage and currency values
// ============================================================================

interface ChartSegment {
  label: string;
  value: number;
  color?: string;
  displayValue?: string; // Optional formatted value to show (e.g., "£45,691")
}

interface DonutChartProps {
  title?: string;
  segments?: ChartSegment[];
  items?: ChartSegment[]; // AI compatibility
  size?: number;
  showLegend?: boolean;
  centerLabel?: string;
  centerSubLabel?: string;
  valueFormat?: 'percentage' | 'currency' | 'auto'; // How to display values
}

// Format number as currency
function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `£${value.toLocaleString('en-GB')}`;
  }
  return `£${value}`;
}

// Format as percentage
function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

// Professional color palette - navy/slate based
const defaultColors = [
  '#1e3a5f', // Navy (primary)
  '#d4a84b', // Gold (accent)
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#10b981', // Green
  '#f59e0b', // Amber
  '#6366f1', // Indigo
  '#ec4899', // Pink
];

export function DonutChart({
  title,
  segments,
  items,
  size = 220,
  showLegend = true,
  centerLabel,
  centerSubLabel,
  valueFormat = 'auto',
}: DonutChartProps) {
  // Normalize: accept both 'segments' and 'items'
  const normalizedSegments = segments || items || [];
  
  if (normalizedSegments.length === 0) {
    return null;
  }

  // Calculate total
  const total = normalizedSegments.reduce((sum, s) => sum + s.value, 0);
  
  // Auto-detect if values are percentages or currency
  // If total is close to 100, they're probably percentages
  // If total is > 1000, they're probably currency
  const detectedFormat = valueFormat === 'auto' 
    ? (total > 500 ? 'currency' : 'percentage')
    : valueFormat;
  
  // SVG calculations
  const strokeWidth = size * 0.12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate segment data with proper percentages
  let accumulatedPercentage = 0;
  const segmentData = normalizedSegments.map((segment, index) => {
    const percentage = (segment.value / total) * 100;
    const startPercentage = accumulatedPercentage;
    accumulatedPercentage += percentage;
    
    const dashLength = (percentage / 100) * circumference;
    const gapLength = circumference - dashLength;
    const offset = circumference * (1 - startPercentage / 100);
    
    return {
      ...segment,
      percentage,
      color: segment.color || defaultColors[index % defaultColors.length],
      dashArray: `${dashLength} ${gapLength}`,
      dashOffset: offset,
      // Format the display value appropriately
      formattedValue: segment.displayValue || 
        (detectedFormat === 'currency' ? formatCurrency(segment.value) : formatPercentage(percentage)),
      formattedPercentage: formatPercentage(percentage),
    };
  });

  // Generate center label
  const displayCenterLabel = centerLabel || 
    (detectedFormat === 'currency' ? formatCurrency(total) : `${Math.round(segmentData[0]?.percentage || 0)}%`);
  const displayCenterSubLabel = centerSubLabel || 
    (detectedFormat === 'currency' ? 'Total' : segmentData[0]?.label);

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-xl font-bold text-slate-800 mb-6 text-center">{title}</h3>
      )}
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        {/* Chart */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg 
            width={size} 
            height={size} 
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="#f1f5f9"
              strokeWidth={strokeWidth}
              fill="none"
            />
            
            {/* Segments - render in reverse order so first is on top */}
            {[...segmentData].reverse().map((segment, index) => (
              <circle
                key={index}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={segment.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={segment.dashArray}
                strokeDashoffset={segment.dashOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                style={{
                  filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
                }}
              />
            ))}
          </svg>
          
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <span className="text-2xl md:text-3xl font-bold text-slate-800 leading-tight">
              {displayCenterLabel}
            </span>
            {displayCenterSubLabel && (
              <span className="text-sm text-slate-500 mt-1">
                {displayCenterSubLabel}
              </span>
            )}
          </div>
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="space-y-3 min-w-[200px]">
            {segmentData.map((segment, index) => (
              <div key={index} className="flex items-center gap-3 group">
                {/* Color dot */}
                <div 
                  className="w-3 h-3 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                  style={{ backgroundColor: segment.color }}
                />
                
                {/* Value and label */}
                <div className="flex items-baseline gap-2 flex-1 min-w-0">
                  <span className="font-bold text-slate-800 whitespace-nowrap">
                    {segment.formattedValue}
                  </span>
                  <span className="text-slate-500 text-sm truncate">
                    {segment.label}
                  </span>
                </div>
                
                {/* Percentage badge (only if showing currency) */}
                {detectedFormat === 'currency' && (
                  <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {segment.formattedPercentage}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default DonutChart;
