'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

interface DataPoint {
  readonly name: string;
  readonly value: number;
  readonly color: string;
}

interface DonutChartProps {
  readonly title?: string;
  readonly data: readonly DataPoint[];
  readonly centerValue?: string;
  readonly centerLabel?: string;
  readonly showLegend?: boolean;
  readonly showTooltip?: boolean;
  readonly size?: 'sm' | 'md' | 'lg';
}

const sizeConfig = {
  sm: { height: 200, inner: 50, outer: 70 },
  md: { height: 280, inner: 70, outer: 100 },
  lg: { height: 350, inner: 90, outer: 130 },
};

export default function DonutChart({ 
  title, 
  data, 
  centerValue, 
  centerLabel,
  showLegend = true,
  showTooltip = true,
  size = 'md'
}: DonutChartProps) {
  const config = sizeConfig[size];
  
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto my-10"
    >
      {title && (
        <h3 className="text-xl font-bold text-white text-center mb-6">
          {title}
        </h3>
      )}
      
      <div className="relative" style={{ height: config.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.map(d => ({ name: d.name, value: d.value, color: d.color }))}
              cx="50%"
              cy="50%"
              innerRadius={config.inner}
              outerRadius={config.outer}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${entry.name}-${index}`} 
                  fill={entry.color}
                  style={{
                    filter: `drop-shadow(0 0 8px ${entry.color}40)`,
                  }}
                />
              ))}
            </Pie>
            
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                }}
                formatter={(value: number) => [`${value}%`, '']}
              />
            )}
            
            {showLegend && (
              <Legend 
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => (
                  <span className="text-white/80 text-sm ml-2">{value}</span>
                )}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        
        {/* Center label overlay */}
        {centerValue && (
          <div 
            className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none"
            style={{ marginTop: showLegend ? '-20px' : 0 }}
          >
            <div className="text-4xl font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              {centerValue}
            </div>
            {centerLabel && (
              <div className="text-xs text-white/60 uppercase tracking-wider mt-1">
                {centerLabel}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Pre-configured version for common use case: resolution breakdown
export function ResolutionDonut({ 
  resolvedPercent = 98,
  resolvedLabel = 'Resolved Internally',
  escalatedLabel = 'Escalated Further'
}: {
  readonly resolvedPercent?: number;
  readonly resolvedLabel?: string;
  readonly escalatedLabel?: string;
}) {
  const data = [
    { name: resolvedLabel, value: resolvedPercent, color: '#3B82F6' },
    { name: escalatedLabel, value: 100 - resolvedPercent, color: '#06B6D4' },
  ];
  
  return (
    <DonutChart
      title="Complaint Resolution Breakdown"
      data={data}
      centerValue={`${resolvedPercent}%`}
      centerLabel="Internal"
    />
  );
}

