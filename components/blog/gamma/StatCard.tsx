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
  const colors = colorMap[color];
  const IconComponent = icon ? iconMap[icon] : null;
  const TrendIcon = trend ? trendMap[trend].icon : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: animationDelay }}
      className="relative group h-full"
    >
      {/* Animated glow effect */}
      <div 
        className="absolute inset-0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at center, ${colors.glow}, transparent 70%)`
        }}
      />

      {/* Card content */}
      <div className={`relative h-full bg-gray-900/50 backdrop-blur-sm border ${colors.border} 
                      rounded-2xl p-6 hover:border-opacity-70 transition-all duration-300
                      hover:transform hover:-translate-y-1`}>
        
        {/* Header with icon and trend */}
        <div className="flex items-start justify-between mb-4">
          {IconComponent && (
            <div className={`${colors.bg} p-3 rounded-xl`}>
              <IconComponent className={`w-6 h-6 text-${color}-400`} />
            </div>
          )}
          {TrendIcon && (
            <div className="flex items-center gap-1">
              <TrendIcon className={`w-5 h-5 ${trendMap[trend!].color}`} />
            </div>
          )}
        </div>

        {/* Metric */}
        <div className="mb-2">
          <div className={`text-5xl font-bold bg-gradient-to-r ${colors.gradient} 
                          bg-clip-text text-transparent leading-tight`}>
            {prefix}{metric}{suffix}
          </div>
        </div>

        {/* Label */}
        <div className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">
          {label}
        </div>

        {/* Context */}
        {context && (
          <div className="text-gray-300 text-base mt-2 leading-relaxed">
            {context}
          </div>
        )}
      </div>
    </motion.div>
  );
}

