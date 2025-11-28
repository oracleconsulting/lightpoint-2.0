'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Clock, DollarSign, Target, ArrowUpRight } from 'lucide-react';
import { CountUp } from '@/components/CountUp';

interface MetricCardProps {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: React.ElementType;
  iconColor: string;
  gradientFrom: string;
  gradientTo: string;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  suffix = '',
  prefix = '',
  trend = 'neutral',
  trendValue,
  icon: Icon,
  iconColor,
  gradientFrom,
  gradientTo,
  onClick,
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative overflow-hidden rounded-card bg-white p-6 shadow-sm border border-gray-100 ${
        onClick ? 'cursor-pointer' : ''
      } group`}
      onClick={onClick}
    >
      {/* Gradient overlay on hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-gray-900">
              <CountUp end={value} prefix={prefix} suffix={suffix} />
            </span>
            {trendValue && (
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  trend === 'up'
                    ? 'text-success'
                    : trend === 'down'
                    ? 'text-red-500'
                    : 'text-gray-500'
                }`}
              >
                {trend === 'up' && <TrendingUp className="h-4 w-4" />}
                {trend === 'down' && <TrendingDown className="h-4 w-4" />}
                <span>{trendValue}</span>
              </div>
            )}
          </div>
        </div>

        {/* Icon with gradient background */}
        <div
          className={`p-3 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-lg group-hover:shadow-xl transition-shadow`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>

      {/* Click indicator */}
      {onClick && (
        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="h-4 w-4 text-gray-400" />
        </div>
      )}
    </motion.div>
  );
};

interface TrendData {
  activeChange?: number;
  successRateChange?: number;
  resolutionDaysChange?: number;
  recoveredChange?: number;
}

interface HeroMetricsProps {
  activeComplaints: number;
  successRate: number;
  avgResolutionDays: number;
  totalRecovered: number;
  trends?: TrendData;
  onMetricClick?: (metric: string) => void;
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `£${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `£${(amount / 1000).toFixed(0)}K`;
  }
  return `£${amount.toFixed(0)}`;
}

export default function HeroMetrics({
  activeComplaints,
  successRate,
  avgResolutionDays,
  totalRecovered,
  trends,
  onMetricClick,
}: HeroMetricsProps) {
  // Determine trend directions and values
  const successTrend = (trends?.successRateChange ?? 0) >= 0 ? 'up' : 'down';
  const successTrendValue = trends?.successRateChange 
    ? `${trends.successRateChange >= 0 ? '+' : ''}${trends.successRateChange} this month`
    : successRate > 0 ? `${successRate}% success` : 'No data yet';
  
  const resolutionTrend = (trends?.resolutionDaysChange ?? 0) <= 0 ? 'down' : 'up';
  const resolutionTrendValue = avgResolutionDays > 0 
    ? (trends?.resolutionDaysChange 
        ? `${trends.resolutionDaysChange <= 0 ? '' : '+'}${trends.resolutionDaysChange} days`
        : `${avgResolutionDays} day avg`)
    : 'No data yet';
  
  const recoveredTrend = (trends?.recoveredChange ?? 0) >= 0 ? 'up' : 'down';
  const recoveredTrendValue = trends?.recoveredChange 
    ? `${trends.recoveredChange >= 0 ? '+' : ''}${formatCurrency(trends.recoveredChange)}`
    : totalRecovered > 0 ? 'Total to date' : 'No recoveries yet';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <MetricCard
        title="Active Complaints"
        value={activeComplaints}
        trend={activeComplaints > 0 ? 'up' : 'neutral'}
        trendValue={activeComplaints > 0 ? `${activeComplaints} ongoing` : 'None'}
        icon={Target}
        iconColor="text-blue-500"
        gradientFrom="from-brand-primary"
        gradientTo="to-blue-600"
        onClick={() => onMetricClick?.('active')}
      />

      <MetricCard
        title="Success Rate"
        value={successRate}
        suffix="%"
        trend={successRate > 0 ? successTrend : 'neutral'}
        trendValue={successTrendValue}
        icon={TrendingUp}
        iconColor="text-success"
        gradientFrom="from-success"
        gradientTo="to-green-600"
        onClick={() => onMetricClick?.('success')}
      />

      <MetricCard
        title="Avg Resolution Time"
        value={avgResolutionDays}
        suffix={avgResolutionDays > 0 ? " days" : ""}
        trend={avgResolutionDays > 0 ? resolutionTrend : 'neutral'}
        trendValue={resolutionTrendValue}
        icon={Clock}
        iconColor="text-brand-blurple"
        gradientFrom="from-brand-blurple"
        gradientTo="to-purple-600"
        onClick={() => onMetricClick?.('resolution')}
      />

      <MetricCard
        title="Total Recovered"
        value={totalRecovered}
        prefix={totalRecovered > 0 ? "£" : ""}
        trend={totalRecovered > 0 ? recoveredTrend : 'neutral'}
        trendValue={recoveredTrendValue}
        icon={DollarSign}
        iconColor="text-amber-500"
        gradientFrom="from-amber-500"
        gradientTo="to-orange-600"
        onClick={() => onMetricClick?.('recovered')}
      />
    </div>
  );
}

