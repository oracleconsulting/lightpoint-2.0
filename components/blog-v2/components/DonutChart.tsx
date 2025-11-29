'use client';

import React from 'react';
import type { DonutChartProps } from '../types';

/**
 * DonutChart - Clean donut/pie chart with legend
 * 
 * Matches Gamma page 4:
 * - SVG donut chart
 * - Legend below
 * - Clean colors (navy/blue progression)
 */

const defaultColors = [
  '#1e3a5f', // navy
  '#2563eb', // blue-600
  '#3b82f6', // blue-500
  '#60a5fa', // blue-400
  '#93c5fd', // blue-300
];

export function DonutChart({
  title,
  segments,
  size = 200,
  showLegend = true,
  centerLabel,
  className = '',
}: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  
  // Calculate paths for each segment
  const paths = calculatePaths(segments, total);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Title */}
      {title && (
        <h3 className="text-xl font-bold text-slate-800 mb-6">{title}</h3>
      )}

      {/* Chart */}
      <div className="relative">
        <svg 
          width={size} 
          height={size} 
          viewBox="0 0 100 100"
          className="transform -rotate-90"
        >
          {paths.map((path, index) => (
            <path
              key={index}
              d={path.d}
              fill={segments[index].color || defaultColors[index % defaultColors.length]}
              className="transition-opacity hover:opacity-80"
            />
          ))}
          {/* Center hole */}
          <circle cx="50" cy="50" r="25" fill="white" />
        </svg>

        {/* Center label */}
        {centerLabel && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-slate-800">{centerLabel}</span>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-6 mt-6">
          {segments.map((segment, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm flex-shrink-0" 
                style={{ 
                  backgroundColor: segment.color || defaultColors[index % defaultColors.length] 
                }} 
              />
              <span className="text-sm text-gray-600">
                {segment.label}
                {total > 0 && (
                  <span className="text-gray-400 ml-1">
                    ({Math.round((segment.value / total) * 100)}%)
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface PathData {
  d: string;
}

function calculatePaths(
  segments: { value: number; color?: string; label: string }[], 
  total: number
): PathData[] {
  const paths: PathData[] = [];
  let currentAngle = 0;

  segments.forEach((segment) => {
    const angle = (segment.value / total) * 360;
    const path = describeArc(50, 50, 35, currentAngle, currentAngle + angle);
    paths.push({ d: path });
    currentAngle += angle;
  });

  return paths;
}

function describeArc(
  x: number, 
  y: number, 
  radius: number, 
  startAngle: number, 
  endAngle: number
): string {
  // Convert angles to radians
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  // Calculate start and end points
  const x1 = x + radius * Math.cos(startRad);
  const y1 = y + radius * Math.sin(startRad);
  const x2 = x + radius * Math.cos(endRad);
  const y2 = y + radius * Math.sin(endRad);

  // Determine if we need a large arc
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  // Build the path
  return `M ${x} ${y} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export default DonutChart;

