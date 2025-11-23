/**
 * Reusable Blog Template Components
 * These components can be used in templates or added via the block editor
 */

import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Lightbulb, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

// ============================================
// STAT CARD COMPONENT
// ============================================
interface StatCardProps {
  label: string;
  value: string | number;
  prefix?: string;
  suffix?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red';
}

export function StatCard({ 
  label, 
  value, 
  prefix, 
  suffix, 
  trend, 
  trendValue, 
  icon,
  color = 'blue' 
}: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`relative rounded-xl border-2 p-6 transition-all hover:shadow-lg ${colorClasses[color]}`}
    >
      {icon && (
        <div className="mb-3">
          {icon}
        </div>
      )}
      <div className="text-3xl font-bold mb-1">
        {prefix}{value}{suffix}
      </div>
      <div className="text-sm font-medium opacity-80">{label}</div>
      {trend && trendValue && (
        <div className={`flex items-center gap-1 mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          <span>{trendValue}</span>
        </div>
      )}
    </motion.div>
  );
}

// ============================================
// STATS GRID COMPONENT
// ============================================
interface StatsGridProps {
  stats: StatCardProps[];
  columns?: 2 | 3 | 4;
}

export function StatsGrid({ stats, columns = 4 }: StatsGridProps) {
  const gridClasses = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-4',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-6 my-8`}>
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}

// ============================================
// CALLOUT BOX COMPONENT
// ============================================
interface CalloutBoxProps {
  type: 'info' | 'warning' | 'success' | 'error' | 'tip';
  title?: string;
  children: React.ReactNode;
}

export function CalloutBox({ type, title, children }: CalloutBoxProps) {
  const styles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-300',
      icon: <AlertCircle className="h-5 w-5 text-blue-600" />,
      titleColor: 'text-blue-900',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-300',
      icon: <AlertCircle className="h-5 w-5 text-amber-600" />,
      titleColor: 'text-amber-900',
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-300',
      icon: <CheckCircle className="h-5 w-5 text-green-600" />,
      titleColor: 'text-green-900',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-300',
      icon: <XCircle className="h-5 w-5 text-red-600" />,
      titleColor: 'text-red-900',
    },
    tip: {
      bg: 'bg-purple-50',
      border: 'border-purple-300',
      icon: <Lightbulb className="h-5 w-5 text-purple-600" />,
      titleColor: 'text-purple-900',
    },
  };

  const style = styles[type];

  return (
    <div className={`my-6 rounded-xl border-2 ${style.border} ${style.bg} p-6`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
        <div className="flex-1">
          {title && (
            <h4 className={`font-bold mb-2 ${style.titleColor}`}>{title}</h4>
          )}
          <div className="text-gray-700 leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// TWO COLUMN LAYOUT
// ============================================
interface TwoColumnLayoutProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: number; // Percentage
  gap?: 'sm' | 'md' | 'lg';
}

export function TwoColumnLayout({ left, right, leftWidth = 60, gap = 'md' }: TwoColumnLayoutProps) {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-8',
    lg: 'gap-12',
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 ${gapClasses[gap]} my-8`}>
      <div className={`lg:col-span-${Math.round(leftWidth / 10)}`}>
        {left}
      </div>
      <div className={`lg:col-span-${Math.round((100 - leftWidth) / 10)}`}>
        {right}
      </div>
    </div>
  );
}

// ============================================
// NUMBERED STEPS
// ============================================
interface Step {
  title: string;
  description: string;
}

interface NumberedStepsProps {
  steps: Step[];
  columns?: 1 | 2 | 3;
}

export function NumberedSteps({ steps, columns = 2 }: NumberedStepsProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
  };

  return (
    <div className={`grid ${gridClasses[columns]} gap-6 my-8`}>
      {steps.map((step, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 }}
          className="relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6"
        >
          <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-bold shadow-lg">
            {index + 1}
          </div>
          <h3 className="font-bold text-lg text-gray-900 mb-2 mt-2">{step.title}</h3>
          <p className="text-gray-700 leading-relaxed">{step.description}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ============================================
// COMPARISON TABLE
// ============================================
interface ComparisonItem {
  label: string;
  before: string;
  after: string;
}

interface ComparisonTableProps {
  title?: string;
  items: ComparisonItem[];
}

export function ComparisonTable({ title, items }: ComparisonTableProps) {
  return (
    <div className="my-8">
      {title && <h3 className="text-2xl font-bold text-gray-900 mb-6">{title}</h3>}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b-2 border-gray-300">
              <th className="text-left p-4 font-bold text-gray-900"></th>
              <th className="text-center p-4 font-bold text-red-600">❌ Before</th>
              <th className="text-center p-4 font-bold text-green-600">✅ After</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="p-4 font-medium text-gray-900">{item.label}</td>
                <td className="p-4 text-center text-gray-700">{item.before}</td>
                <td className="p-4 text-center text-gray-700">{item.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// TIMELINE COMPONENT
// ============================================
interface TimelineEvent {
  date: string;
  title: string;
  description?: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  return (
    <div className="my-8">
      <div className="relative border-l-4 border-blue-600 pl-8 space-y-8">
        {events.map((event, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div className="absolute -left-[42px] w-4 h-4 rounded-full bg-blue-600 border-4 border-white"></div>
            <div className="bg-white rounded-lg border-2 border-gray-200 p-4 shadow-sm">
              <div className="text-sm font-bold text-blue-600 mb-1">{event.date}</div>
              <div className="font-bold text-gray-900">{event.title}</div>
              {event.description && (
                <div className="text-gray-600 text-sm mt-1">{event.description}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// HIGHLIGHT BOX (For Key Statistics)
// ============================================
interface HighlightBoxProps {
  value: string | number;
  label: string;
  description?: string;
  color?: 'blue' | 'green' | 'purple' | 'amber';
  size?: 'sm' | 'md' | 'lg';
}

export function HighlightBox({ 
  value, 
  label, 
  description, 
  color = 'blue',
  size = 'md' 
}: HighlightBoxProps) {
  const colorClasses = {
    blue: 'from-blue-600 to-indigo-700',
    green: 'from-green-600 to-emerald-700',
    purple: 'from-purple-600 to-indigo-700',
    amber: 'from-amber-600 to-orange-700',
  };

  const sizeClasses = {
    sm: 'p-6 text-3xl',
    md: 'p-8 text-5xl',
    lg: 'p-12 text-6xl',
  };

  return (
    <div className={`my-8 bg-gradient-to-br ${colorClasses[color]} rounded-2xl ${sizeClasses[size]} text-white text-center`}>
      <div className="font-extrabold mb-2">{value}</div>
      <div className="text-xl font-semibold opacity-90">{label}</div>
      {description && (
        <div className="text-sm opacity-75 mt-3 max-w-2xl mx-auto">{description}</div>
      )}
    </div>
  );
}

