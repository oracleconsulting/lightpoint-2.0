'use client';

import React from 'react';
import StatCard from './StatCard';

interface StatItem {
  metric: string;
  label: string;
  context?: string;
  color: 'blue' | 'cyan' | 'green' | 'amber' | 'red' | 'purple';
  prefix?: string;
  suffix?: string;
  icon?: string;
}

interface StatCardGroupProps {
  title?: string;
  stats: StatItem[];
}

export default function StatCardGroup({ title, stats }: StatCardGroupProps) {
  // Determine grid columns based on stat count
  const getGridCols = () => {
    if (stats.length === 2) return 'md:grid-cols-2';
    if (stats.length === 3) return 'md:grid-cols-3';
    if (stats.length >= 4) return 'md:grid-cols-2 lg:grid-cols-4';
    return 'md:grid-cols-1';
  };

  return (
    <div className="stat-card-group max-w-4xl mx-auto my-6 px-4">
      {title && (
        <div className="text-sm font-semibold text-white/50 uppercase tracking-wider mb-4 pl-3 border-l-2 border-blue-500/40">
          {title}
        </div>
      )}
      <div className={`grid grid-cols-1 ${getGridCols()} gap-4`}>
        {stats.map((stat, index) => (
          <StatCard 
            key={index} 
            {...stat} 
            compact={true}
            animationDelay={index * 0.05}
          />
        ))}
      </div>
    </div>
  );
}

