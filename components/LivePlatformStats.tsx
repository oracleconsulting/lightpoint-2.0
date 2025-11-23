'use client';

import { motion } from 'framer-motion';
import { AnimatedCounter } from './AnimatedCounter';
import { trpc } from '@/lib/trpc/Provider';
import { TrendingUp, Users, PoundSterling, Award } from 'lucide-react';

export function LivePlatformStats() {
  // Fetch live platform statistics
  const { data: stats, isLoading } = trpc.analytics.getPlatformStats.useQuery(undefined, {
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider stale after 30 seconds
  });

  // Check if we actually have real data or just empty response
  const hasRealData = stats && (
    (stats.success_rate?.value && stats.success_rate.value > 0) ||
    (stats.total_fees_recovered?.value && stats.total_fees_recovered.value > 0) ||
    (stats.total_complaints?.value && stats.total_complaints.value > 0)
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  // If no real data, show "Coming Soon" message
  if (!hasRealData) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-12 text-center border-2 border-dashed border-blue-200">
        <div className="max-w-2xl mx-auto">
          <div className="text-5xl mb-4">📊</div>
          <h3 className="text-2xl font-heading font-bold text-gray-900 mb-3">
            Live Statistics Coming Soon
          </h3>
          <p className="text-lg text-gray-600 mb-6">
            We're gathering real data from our platform. Check back soon to see live success rates, 
            fee recoveries, and case statistics from accountants using Lightpoint.
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-lg border border-blue-100">
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-700">Platform launching Q1 2025</span>
          </div>
        </div>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Success Rate',
      value: stats.success_rate?.value || 0,
      suffix: '%',
      decimals: 1,
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Total Recovered',
      value: (stats.total_fees_recovered?.value || 0) / 1000,
      prefix: '£',
      suffix: 'k+',
      decimals: 0,
      icon: PoundSterling,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Cases Managed',
      value: stats.total_complaints?.value || 0,
      suffix: '+',
      decimals: 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Avg Recovery',
      value: stats.avg_fee_recovery?.value || 0,
      prefix: '£',
      decimals: 0,
      icon: TrendingUp,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="group relative"
          >
            <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-105 border-2 border-gray-100 hover:border-gray-200">
              {/* Background Icon */}
              <div className={`absolute -right-4 -top-4 opacity-5 ${metric.color}`}>
                <Icon className="h-32 w-32" />
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div className={`inline-flex items-center justify-center p-3 rounded-xl ${metric.bgColor} mb-3 shadow-md`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>

                <div className={`text-3xl font-bold ${metric.color} mb-1 drop-shadow-sm`}>
                  <AnimatedCounter
                    end={metric.value}
                    prefix={metric.prefix}
                    suffix={metric.suffix}
                    decimals={metric.decimals}
                    duration={2}
                  />
                </div>

                <p className="text-sm text-gray-700 font-semibold">{metric.label}</p>

                {/* Live Indicator with stronger contrast */}
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.5, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="h-2 w-2 rounded-full bg-green-500 shadow-sm"
                    />
                    <span className="text-xs font-semibold text-gray-700">Live</span>
                  </div>
                </div>
              </div>

              {/* Stronger Hover Glow Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgColor} opacity-30 blur-xl`}></div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

/**
 * Compact version for navigation or sidebar
 */
export function LiveStatsCompact() {
  const { data: stats } = trpc.analytics.getPlatformStats.useQuery(undefined, {
    refetchInterval: 60000,
  });

  if (!stats) return null;

  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-gray-600">
          <AnimatedCounter 
            end={stats.success_rate?.value || 94.6} 
            suffix="% success" 
            decimals={1} 
          />
        </span>
      </div>
      <div className="flex items-center gap-2">
        <PoundSterling className="h-4 w-4 text-blue-600" />
        <span className="text-gray-600">
          <AnimatedCounter 
            end={(stats.total_fees_recovered?.value || 2400000) / 1000} 
            prefix="£" 
            suffix="k recovered" 
            decimals={0} 
          />
        </span>
      </div>
    </div>
  );
}

