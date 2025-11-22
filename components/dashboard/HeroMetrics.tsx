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

interface HeroMetricsProps {
  activeComplaints: number;
  successRate: number;
  avgResolutionDays: number;
  totalRecovered: number;
  onMetricClick?: (metric: string) => void;
}

export default function HeroMetrics({
  activeComplaints,
  successRate,
  avgResolutionDays,
  totalRecovered,
  onMetricClick,
}: HeroMetricsProps) {
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
        trend="up"
        trendValue="+2.5%"
        icon={TrendingUp}
        iconColor="text-success"
        gradientFrom="from-success"
        gradientTo="to-green-600"
        onClick={() => onMetricClick?.('success')}
      />

      <MetricCard
        title="Avg Resolution Time"
        value={avgResolutionDays}
        suffix=" days"
        trend="down"
        trendValue="-5 days"
        icon={Clock}
        iconColor="text-brand-blurple"
        gradientFrom="from-brand-blurple"
        gradientTo="to-purple-600"
        onClick={() => onMetricClick?.('resolution')}
      />

      <MetricCard
        title="Total Recovered"
        value={totalRecovered}
        prefix="£"
        trend="up"
        trendValue="+£125K"
        icon={DollarSign}
        iconColor="text-amber-500"
        gradientFrom="from-amber-500"
        gradientTo="to-orange-600"
        onClick={() => onMetricClick?.('recovered')}
      />
    </div>
  );
}

