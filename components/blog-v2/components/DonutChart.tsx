'use client';

import React from 'react';

// ============================================================================
// DONUT CHART
// SVG-based donut chart with legend and optional center label
// ============================================================================

interface ChartSegment {
  label: string;
  value: number;
  color?: string;
}

interface DonutChartProps {
  title?: string;
  segments?: ChartSegment[];
  size?: number;
  showLegend?: boolean;
  centerLabel?: string;
}

export function DonutChart({
  title,
  segments,
  size = 200,
  showLegend = true,
  centerLabel,
}: DonutChartProps) {
  // Defensive: ensure segments is an array
  const normalizedSegments = segments || [];
  if (normalizedSegments.length === 0) {
    return null;
  }

  // Default colors
  const defaultColors = ['#1e3a5f', '#3b82f6', '#60a5fa', '#93c5fd'];
  
  // Calculate total and percentages
  const total = normalizedSegments.reduce((sum, s) => sum + s.value, 0);
  
  // SVG calculations
  const strokeWidth = size * 0.15;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate stroke dash arrays for each segment
  let accumulatedOffset = 0;
  const segmentData = normalizedSegments.map((segment, index) => {
    const percentage = (segment.value / total) * 100;
    const dashLength = (percentage / 100) * circumference;
    const dashOffset = circumference - accumulatedOffset;
    accumulatedOffset += dashLength;
    
    return {
      ...segment,
      percentage,
      color: segment.color || defaultColors[index % defaultColors.length],
      dashArray: `${dashLength} ${circumference - dashLength}`,
      dashOffset: dashOffset,
      rotation: (accumulatedOffset - dashLength) / circumference * 360 - 90,
    };
  });

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-6 py-4">
      {/* Chart */}
      <div className="relative" style={{ width: size, height: size }}>
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
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="none"
          />
          
          {/* Segments */}
          {segmentData.map((segment, index) => (
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
              className="transition-all duration-500"
            />
          ))}
        </svg>
        
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {centerLabel ? (
            <span className="text-2xl font-bold text-slate-800">
              {centerLabel}
            </span>
          ) : normalizedSegments[0] && (
            <>
              <span className="text-3xl font-bold text-slate-800">
                {normalizedSegments[0].value}%
              </span>
              <span className="text-sm text-slate-500">
                {normalizedSegments[0].label}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="space-y-3">
          {title && (
            <h3 className="font-bold text-slate-800 text-lg mb-3">{title}</h3>
          )}
          {segmentData.map((segment, index) => (
            <div key={index} className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded-sm flex-shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <div>
                <span className="font-semibold text-slate-700">
                  {segment.value}%
                </span>
                <span className="text-slate-500 ml-2">
                  {segment.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default DonutChart;
