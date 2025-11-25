'use client';

import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  BarChart3, 
  AlertCircle, 
  Check, 
  PoundSterling,
  Clock,
  Target
} from 'lucide-react';

interface StatCardProps {
  metric: string;
  label: string;
  context?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'cyan' | 'purple' | 'green' | 'red' | 'yellow';
  icon?: 'users' | 'chart' | 'alert' | 'check' | 'pound' | 'clock' | 'target';
  prefix?: string;
  suffix?: string;
  animationDelay?: number;
}

const colorMap = {
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    glow: 'rgba(79, 134, 249, 0.5)',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/10'
  },
  cyan: {
    gradient: 'from-cyan-500 to-cyan-600',
    glow: 'rgba(0, 212, 255, 0.5)',
    border: 'border-cyan-500/30',
    bg: 'bg-cyan-500/10'
  },
  purple: {
    gradient: 'from-purple-500 to-purple-600',
    glow: 'rgba(139, 92, 246, 0.5)',
    border: 'border-purple-500/30',
    bg: 'bg-purple-500/10'
  },
  green: {
    gradient: 'from-green-500 to-green-600',
    glow: 'rgba(0, 255, 136, 0.5)',
    border: 'border-green-500/30',
    bg: 'bg-green-500/10'
  },
  red: {
    gradient: 'from-red-500 to-red-600',
    glow: 'rgba(255, 68, 68, 0.5)',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10'
  },
  yellow: {
    gradient: 'from-yellow-500 to-yellow-600',
    glow: 'rgba(255, 184, 0, 0.5)',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/10'
  }
};

const iconMap = {
  users: Users,
  chart: BarChart3,
  alert: AlertCircle,
  check: Check,
  pound: PoundSterling,
  clock: Clock,
  target: Target
};

const trendMap = {
  up: { icon: TrendingUp, color: 'text-green-500' },
  down: { icon: TrendingDown, color: 'text-red-500' },
  neutral: { icon: Minus, color: 'text-gray-400' }
};

export default function StatCard({
  metric,
  label,
  context,
  trend,
  color = 'blue',
  icon,
  prefix,
  suffix,
  animationDelay = 0
}: StatCardProps) {
  // Fallback to 'blue' if color is invalid
  const safeColor = (color && colorMap[color as keyof typeof colorMap]) ? color : 'blue';
  const colors = colorMap[safeColor as keyof typeof colorMap];
  const IconComponent = icon ? iconMap[icon] : null;
  const TrendIcon = trend ? trendMap[trend].icon : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.4, delay: animationDelay }}
      className="my-6 max-w-4xl mx-auto"
    >
      {/* Gamma-style: Compact, elegant stat display */}
      <div className={`relative bg-gradient-to-br from-gray-900/40 to-gray-900/20 border-l-4 ${colors.border} 
                      rounded-lg px-6 py-4 backdrop-blur-sm hover:bg-gray-900/50 transition-all duration-300`}>
        
        <div className="flex items-center gap-6">
          {/* Icon - small and subtle */}
          {IconComponent && (
            <div className={`${colors.bg} p-2 rounded-lg flex-shrink-0`}>
              <IconComponent className={`w-5 h-5 text-${color}-400`} />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3 flex-wrap">
              {/* Metric - prominent but not overwhelming */}
              <div className={`text-4xl font-bold bg-gradient-to-r ${colors.gradient} 
                              bg-clip-text text-transparent leading-none`}>
                {prefix}{metric}{suffix}
              </div>

              {/* Trend indicator */}
              {TrendIcon && (
                <div className="flex items-center gap-1">
                  <TrendIcon className={`w-4 h-4 ${trendMap[trend!].color}`} />
                </div>
              )}
            </div>

            {/* Label - integrated, not separated */}
            <div className="text-gray-300 text-base font-medium mt-1">
              {label}
            </div>

            {/* Context - flows naturally */}
            {context && (
              <div className="text-gray-400 text-sm mt-1">
                {context}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

