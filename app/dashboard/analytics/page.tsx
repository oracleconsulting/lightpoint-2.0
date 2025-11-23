'use client';

import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/AnimatedCounter';
import { trpc } from '@/lib/trpc/Provider';
import { TrendingUp, Users, PoundSterling, Award, Clock, BarChart3, PieChart, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

export default function FirmAnalyticsDashboard() {
  const { user } = useAuth();
  
  // TODO: Get actual organization ID from user context
  const organizationId = user?.user_metadata?.organization_id || '00000000-0000-0000-0000-000000000001';

  const { data: stats, isLoading } = trpc.analytics.getOrganizationStats.useQuery(
    { organizationId },
    { refetchInterval: 60000 }
  );

  const { data: platformStats } = trpc.analytics.getPlatformStats.useQuery();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const totalComplaints = stats?.total_complaints || 0;
  const successfulComplaints = stats?.successful_complaints || 0;
  const successRate = stats?.success_rate || 0;
  const totalFeesRecovered = stats?.total_fees_recovered || 0;
  const avgFeeRecovery = stats?.avg_fee_recovery || 0;
  const platformSuccessRate = platformStats?.success_rate?.value || 94.6;

  // Calculate performance vs platform average
  const vsAverage = successRate - platformSuccessRate;
  const isAboveAverage = vsAverage > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
          Your Analytics Dashboard
        </h1>
        <p className="text-gray-600">
          Track your complaint management performance and compare against platform benchmarks
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="relative overflow-hidden hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Award className="h-8 w-8 text-green-600" />
                {isAboveAverage ? (
                  <TrendingUp className="h-5 w-5 text-green-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                <AnimatedCounter end={successRate} suffix="%" decimals={1} />
              </div>
              <div className="text-sm text-gray-600 font-medium">Success Rate</div>
              <div className={`text-xs mt-2 ${isAboveAverage ? 'text-green-600' : 'text-amber-600'}`}>
                {isAboveAverage ? '+' : ''}{vsAverage.toFixed(1)}% vs platform avg
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <PoundSterling className="h-8 w-8 text-blue-600" />
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                £<AnimatedCounter end={totalFeesRecovered} decimals={0} />
              </div>
              <div className="text-sm text-gray-600 font-medium">Total Recovered</div>
              <div className="text-xs text-gray-500 mt-2">
                {successfulComplaints} successful cases
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <Users className="h-8 w-8 text-purple-600" />
                <BarChart3 className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                <AnimatedCounter end={totalComplaints} decimals={0} />
              </div>
              <div className="text-sm text-gray-600 font-medium">Total Cases</div>
              <div className="text-xs text-gray-500 mt-2">
                {successfulComplaints} successful
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden hover:shadow-xl transition-shadow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-full -mr-16 -mt-16" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between mb-4">
                <TrendingUp className="h-8 w-8 text-amber-600" />
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">
                £<AnimatedCounter end={avgFeeRecovery} decimals={0} />
              </div>
              <div className="text-sm text-gray-600 font-medium">Avg Recovery</div>
              <div className="text-xs text-gray-500 mt-2">
                Per successful case
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Breakdown by Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Complaints by Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.complaints_by_type ? (
              <div className="space-y-4">
                {Object.entries(stats.complaints_by_type as Record<string, number>).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="text-sm font-medium text-gray-700 uppercase">{type}</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{count}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No data yet - start recording complaint outcomes</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Complaints by Client Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.complaints_by_client_type ? (
              <div className="space-y-4">
                {Object.entries(stats.complaints_by_client_type as Record<string, number>).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-purple-500" />
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {type.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">{count}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No data yet - start recording complaint outcomes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Platform Comparison */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle>Platform Benchmarks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Your Success Rate</div>
              <div className="text-2xl font-bold text-gray-900">
                {successRate.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Platform Average</div>
              <div className="text-2xl font-bold text-gray-900">
                {platformSuccessRate.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Your Performance</div>
              <div className={`text-2xl font-bold ${isAboveAverage ? 'text-green-600' : 'text-amber-600'}`}>
                {isAboveAverage ? '+' : ''}{vsAverage.toFixed(1)}%
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            {isAboveAverage 
              ? '🎉 Excellent! Your success rate is above the platform average.'
              : '💡 Tip: Review successful patterns on the platform to improve your success rate.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

