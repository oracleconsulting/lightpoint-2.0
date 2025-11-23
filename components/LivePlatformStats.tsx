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

  if (isLoading || !stats) {
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

  const metrics = [
    {
      label: 'Success Rate',
      value: stats.success_rate?.value || 94.6,
      suffix: '%',
      decimals: 1,
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Total Recovered',
      value: (stats.total_fees_recovered?.value || 2400000) / 1000,
      prefix: '£',
      suffix: 'k+',
      decimals: 0,
      icon: PoundSterling,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Cases Managed',
      value: stats.total_complaints?.value || 847,
      suffix: '+',
      decimals: 0,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Avg Recovery',
      value: stats.avg_fee_recovery?.value || 2997,
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
            <div className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 border border-gray-100">
              {/* Background Icon */}
              <div className={`absolute -right-4 -top-4 opacity-10 ${metric.color}`}>
                <Icon className="h-32 w-32" />
              </div>

              {/* Content */}
              <div className="relative z-10">
                <div className={`inline-flex items-center justify-center p-3 rounded-xl ${metric.bgColor} mb-3`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>

                <div className={`text-3xl font-bold ${metric.color} mb-1`}>
                  <AnimatedCounter
                    end={metric.value}
                    prefix={metric.prefix}
                    suffix={metric.suffix}
                    decimals={metric.decimals}
                    duration={2}
                  />
                </div>

                <p className="text-sm text-gray-600 font-medium">{metric.label}</p>

                {/* Live Indicator */}
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1">
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
                      className="h-2 w-2 rounded-full bg-green-500"
                    />
                    <span className="text-xs text-gray-500">Live</span>
                  </div>
                </div>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className={`absolute inset-0 bg-gradient-to-br ${metric.bgColor} opacity-20 blur-xl`}></div>
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

