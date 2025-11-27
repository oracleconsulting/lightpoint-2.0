'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle,
  FileText,
  Clock,
  PoundSterling,
  Users,
  BarChart2,
  Target,
  Percent,
  Calculator
} from 'lucide-react';

export interface StatCardProps {
  metric: string;
  label: string;
  context?: string;
  color?: 'blue' | 'cyan' | 'green' | 'amber' | 'red' | 'purple';
  prefix?: string;
  suffix?: string;
  icon?: string;
  compact?: boolean;
  animationDelay?: number;
}

// V3 Color Styles - Dark theme with left accent bar
const colorStyles = {
  blue: {
    border: 'border-l-[#4F86F9]',
    bg: 'from-[rgba(79,134,249,0.1)] to-[rgba(0,212,255,0.05)]',
    gradient: 'from-[#4F86F9] to-[#00D4FF]',
    glow: 'rgba(79, 134, 249, 0.4)'
  },
  cyan: {
    border: 'border-l-[#00D4FF]',
    bg: 'from-[rgba(0,212,255,0.1)] to-[rgba(79,134,249,0.05)]',
    gradient: 'from-[#00D4FF] to-[#4F86F9]',
    glow: 'rgba(0, 212, 255, 0.4)'
  },
  green: {
    border: 'border-l-[#10B981]',
    bg: 'from-[rgba(16,185,129,0.1)] to-[rgba(52,211,153,0.05)]',
    gradient: 'from-[#10B981] to-[#34D399]',
    glow: 'rgba(16, 185, 129, 0.4)'
  },
  amber: {
    border: 'border-l-[#F59E0B]',
    bg: 'from-[rgba(245,158,11,0.1)] to-[rgba(251,191,36,0.05)]',
    gradient: 'from-[#F59E0B] to-[#FBBF24]',
    glow: 'rgba(245, 158, 11, 0.4)'
  },
  red: {
    border: 'border-l-[#EF4444]',
    bg: 'from-[rgba(239,68,68,0.1)] to-[rgba(248,113,113,0.05)]',
    gradient: 'from-[#EF4444] to-[#F87171]',
    glow: 'rgba(239, 68, 68, 0.4)'
  },
  purple: {
    border: 'border-l-[#8B5CF6]',
    bg: 'from-[rgba(139,92,246,0.1)] to-[rgba(167,139,250,0.05)]',
    gradient: 'from-[#8B5CF6] to-[#A78BFA]',
    glow: 'rgba(139, 92, 246, 0.4)'
  }
};

const iconMap: Record<string, React.ComponentType<any>> = {
  'trending-up': TrendingUp,
  'trending-down': TrendingDown,
  'alert': AlertCircle,
  'check': CheckCircle,
  'document': FileText,
  'clock': Clock,
  'currency': PoundSterling,
  'users': Users,
  'chart': BarChart2,
  'target': Target,
  'percent': Percent,
  'calculator': Calculator
};

export default function StatCard({ 
  metric, 
  label, 
  context, 
  color = 'blue',
  prefix, 
  suffix,
  icon,
  compact = false,
  animationDelay = 0
}: StatCardProps) {
  // Fallback to 'blue' if color is invalid
  const safeColor = (color && colorStyles[color]) ? color : 'blue';
  const styles = colorStyles[safeColor];
  const IconComponent = icon ? (iconMap[icon] || BarChart2) : BarChart2;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, delay: animationDelay }}
      className={`
        stat-card
        bg-gradient-to-br ${styles.bg}
        border-l-4 ${styles.border}
        rounded-r-xl
        ${compact ? 'px-4 py-3' : 'px-6 py-4'}
        flex items-start gap-4
        transition-all duration-300
        hover:translate-y-[-2px]
        max-h-[120px]
        backdrop-blur-sm
        shadow-[0_4px_6px_-1px_rgba(0,0,0,0.2),inset_0_1px_0_0_rgba(255,255,255,0.05)]
        hover:shadow-[0_12px_24px_rgba(0,0,0,0.3),0_0_40px_${styles.glow}]
      `}
    >
      <IconComponent 
        className={`
          ${compact ? 'w-6 h-6' : 'w-8 h-8'}
          text-white/60 
          flex-shrink-0
          mt-1
        `} 
      />
      
      <div className="flex-1 min-w-0">
        {/* Metric - prominent but not overwhelming */}
        <div 
          className={`
            ${compact ? 'text-2xl' : 'text-4xl'}
            font-extrabold
            bg-gradient-to-r ${styles.gradient}
            bg-clip-text text-transparent
            leading-none
          `}
          style={{
            filter: `drop-shadow(0 0 12px ${styles.glow})`
          }}
        >
          {prefix}{metric}{suffix}
        </div>
        
        {/* Label - integrated */}
        <div className={`
          ${compact ? 'text-sm' : 'text-base'}
          font-semibold
          text-white/90
          mt-1
          uppercase
          tracking-wide
        `}>
          {label}
        </div>
        
        {/* Context - flows naturally */}
        {context && (
          <div className={`
            ${compact ? 'text-xs' : 'text-sm'}
            text-white/60
            mt-0.5
          `}>
            {context}
          </div>
        )}
      </div>
    </motion.div>
  );
}
