'use client';

import { motion } from 'framer-motion';
import { Info, AlertTriangle, CheckCircle2, Quote, Lightbulb, AlertCircle } from 'lucide-react';

interface CalloutBoxProps {
  variant?: 'info' | 'warning' | 'success' | 'quote' | 'tip' | 'error';
  title: string;
  content: string;
  icon?: 'lightbulb' | 'alert' | 'check' | 'quote' | 'info' | 'error';
  borderGlow?: boolean;
}

const variantConfig = {
  info: {
    icon: Info,
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    glow: 'shadow-blue-500/50',
    iconColor: 'text-blue-400'
  },
  warning: {
    icon: AlertTriangle,
    gradient: 'from-yellow-500 to-orange-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
    glow: 'shadow-yellow-500/50',
    iconColor: 'text-yellow-400'
  },
  success: {
    icon: CheckCircle2,
    gradient: 'from-green-500 to-emerald-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    glow: 'shadow-green-500/50',
    iconColor: 'text-green-400'
  },
  quote: {
    icon: Quote,
    gradient: 'from-purple-500 to-pink-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    glow: 'shadow-purple-500/50',
    iconColor: 'text-purple-400'
  },
  tip: {
    icon: Lightbulb,
    gradient: 'from-cyan-500 to-blue-500',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    glow: 'shadow-cyan-500/50',
    iconColor: 'text-cyan-400'
  },
  error: {
    icon: AlertCircle,
    gradient: 'from-red-500 to-pink-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/50',
    iconColor: 'text-red-400'
  }
};

export default function CalloutBox({
  variant = 'info',
  title,
  content,
  icon,
  borderGlow = true
}: CalloutBoxProps) {
  const config = variantConfig[variant];
  const IconComponent = icon && variantConfig[icon as keyof typeof variantConfig] 
    ? variantConfig[icon as keyof typeof variantConfig].icon 
    : config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="relative my-8"
    >
      {/* Glow effect */}
      {borderGlow && (
        <div 
          className={`absolute inset-0 blur-xl opacity-50 rounded-2xl ${config.glow}`}
          style={{ 
            background: `radial-gradient(circle at center, var(--tw-shadow-color), transparent 70%)` 
          }}
        />
      )}

      {/* Callout Box */}
      <div className={`relative ${config.bg} backdrop-blur-sm border-2 ${config.border} rounded-2xl 
                      overflow-hidden group hover:border-opacity-70 transition-all duration-300`}>
        {/* Accent Bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.gradient}`} />

        {/* Content */}
        <div className="p-6 pl-8">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`${config.bg} p-3 rounded-xl flex-shrink-0 ring-1 ${config.border}`}>
              <IconComponent className={`w-6 h-6 ${config.iconColor}`} />
            </div>

            {/* Text Content */}
            <div className="flex-1">
              <h4 className={`text-xl font-bold mb-2 bg-gradient-to-r ${config.gradient} 
                              bg-clip-text text-transparent`}>
                {title}
              </h4>
              <p className="text-gray-300 leading-relaxed">
                {content}
              </p>
            </div>
          </div>
        </div>

        {/* Decorative corner element */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${config.gradient} 
                         opacity-5 rounded-bl-full`} />
      </div>
    </motion.div>
  );
}

