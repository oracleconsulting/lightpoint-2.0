'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface DonutSegment {
  label: string;
  value: number;
  color?: 'cyan' | 'purple' | 'amber' | 'emerald' | 'red' | 'blue' | 'slate';
}

interface DonutChartProps {
  readonly title?: string;
  readonly segments: readonly DonutSegment[];
  readonly centerLabel?: string;
  readonly centerSubtext?: string;
  readonly size?: 'sm' | 'md' | 'lg';
}

/**
 * DonutChart - Percentage breakdown visualization
 * 
 * Displays proportional data in a donut/pie chart format.
 * Perfect for showing breakdowns like "98% internal / 2% escalated".
 */
export default function DonutChart({ 
  title, 
  segments, 
  centerLabel, 
  centerSubtext,
  size = 'md'
}: DonutChartProps) {
  const colorMap: Record<string, string> = {
    cyan: '#22d3ee',
    purple: '#a78bfa',
    amber: '#fbbf24',
    emerald: '#34d399',
    red: '#f87171',
    blue: '#60a5fa',
    slate: '#64748b',
  };

  const sizeMap = {
    sm: { chart: 160, stroke: 24, text: 'text-2xl' },
    md: { chart: 200, stroke: 28, text: 'text-4xl' },
    lg: { chart: 240, stroke: 32, text: 'text-5xl' },
  };

  const { chart: chartSize, stroke: strokeWidth, text: textSize } = sizeMap[size];
  const radius = (chartSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate total for percentages
  const total = segments.reduce((sum, seg) => sum + seg.value, 0);
  
  // Calculate stroke dasharray for each segment
  let accumulatedOffset = 0;
  const segmentData = segments.map((segment) => {
    const percentage = segment.value / total;
    const dashLength = circumference * percentage;
    const dashOffset = circumference - accumulatedOffset;
    accumulatedOffset += dashLength;
    
    return {
      ...segment,
      percentage,
      dashLength,
      dashOffset,
      color: colorMap[segment.color || 'cyan'],
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {title && (
        <h3 className="text-lg md:text-xl font-semibold text-white mb-6 text-center">
          {title}
        </h3>
      )}
      
      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        {/* Donut Chart */}
        <div className="relative" style={{ width: chartSize, height: chartSize }}>
          <svg
            width={chartSize}
            height={chartSize}
            viewBox={`0 0 ${chartSize} ${chartSize}`}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={chartSize / 2}
              cy={chartSize / 2}
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={strokeWidth}
            />
            
            {/* Segments */}
            {segmentData.map((segment, index) => (
              <motion.circle
                key={`${segment.label}-${index}`}
                cx={chartSize / 2}
                cy={chartSize / 2}
                r={radius}
                fill="none"
                stroke={segment.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${segment.dashLength} ${circumference - segment.dashLength}`}
                strokeDashoffset={segment.dashOffset}
                strokeLinecap="round"
                initial={{ strokeDasharray: `0 ${circumference}` }}
                whileInView={{ strokeDasharray: `${segment.dashLength} ${circumference - segment.dashLength}` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: index * 0.2, ease: 'easeOut' }}
                style={{ filter: `drop-shadow(0 0 8px ${segment.color}40)` }}
              />
            ))}
          </svg>
          
          {/* Center label */}
          {(centerLabel || centerSubtext) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {centerLabel && (
                <motion.span 
                  className={`${textSize} font-bold text-white`}
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  {centerLabel}
                </motion.span>
              )}
              {centerSubtext && (
                <span className="text-sm text-slate-400 uppercase tracking-wider">
                  {centerSubtext}
                </span>
              )}
            </div>
          )}
        </div>
        
        {/* Legend */}
        <div className="flex flex-col gap-3">
          {segmentData.map((segment, index) => (
            <motion.div
              key={`legend-${segment.label}-${index}`}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div 
                className="w-4 h-4 rounded-sm"
                style={{ backgroundColor: segment.color }}
              />
              <div className="flex flex-col">
                <span className="text-white font-medium">
                  {Math.round(segment.percentage * 100)}%
                </span>
                <span className="text-slate-400 text-sm">
                  {segment.label}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
