'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Target, FileText, CheckCircle, AlertTriangle, XCircle,
  Clock, TrendingUp, Shield, Zap, Award, Scale, ArrowRight,
  LucideIcon
} from 'lucide-react';

// Icon mapping
const iconMap: Record<string, LucideIcon> = {
  'target': Target,
  'file-text': FileText,
  'check-circle': CheckCircle,
  'alert-triangle': AlertTriangle,
  'x-circle': XCircle,
  'clock': Clock,
  'trending-up': TrendingUp,
  'shield': Shield,
  'zap': Zap,
  'award': Award,
  'scale': Scale,
  'arrow-right': ArrowRight,
};

interface ComparisonCard {
  title: string;
  description: string;
  example?: string;
  icon?: string;
  color?: 'red' | 'amber' | 'green' | 'cyan' | 'purple' | 'blue';
}

interface ComparisonCardsProps {
  readonly title?: string;
  readonly cards: readonly ComparisonCard[];
  readonly columns?: 2 | 3 | 4;
}

/**
 * ComparisonCards - Multi-column comparison layout
 * 
 * Perfect for parallel concepts like "Three failures" or "Before vs After".
 * Matches Gamma's comparison card layouts.
 */
export default function ComparisonCards({ 
  title, 
  cards,
  columns = 3 
}: ComparisonCardsProps) {
  const colorStyles: Record<string, { bg: string; border: string; icon: string; text: string }> = {
    red: {
      bg: 'bg-red-500/5',
      border: 'border-red-500/20 hover:border-red-500/40',
      icon: 'text-red-400 bg-red-500/10',
      text: 'text-red-400',
    },
    amber: {
      bg: 'bg-amber-500/5',
      border: 'border-amber-500/20 hover:border-amber-500/40',
      icon: 'text-amber-400 bg-amber-500/10',
      text: 'text-amber-400',
    },
    green: {
      bg: 'bg-emerald-500/5',
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      icon: 'text-emerald-400 bg-emerald-500/10',
      text: 'text-emerald-400',
    },
    cyan: {
      bg: 'bg-cyan-500/5',
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      icon: 'text-cyan-400 bg-cyan-500/10',
      text: 'text-cyan-400',
    },
    purple: {
      bg: 'bg-purple-500/5',
      border: 'border-purple-500/20 hover:border-purple-500/40',
      icon: 'text-purple-400 bg-purple-500/10',
      text: 'text-purple-400',
    },
    blue: {
      bg: 'bg-blue-500/5',
      border: 'border-blue-500/20 hover:border-blue-500/40',
      icon: 'text-blue-400 bg-blue-500/10',
      text: 'text-blue-400',
    },
  };

  const gridCols = {
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-2 lg:grid-cols-3',
    4: 'md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {title && (
        <h3 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8">
          {title}
        </h3>
      )}
      
      <div className={`grid grid-cols-1 ${gridCols[columns]} gap-4 md:gap-6`}>
        {cards.map((card, index) => {
          const color = card.color || 'cyan';
          const styles = colorStyles[color];
          const IconComponent = card.icon ? iconMap[card.icon] : null;
          
          return (
            <motion.div
              key={`${card.title}-${index}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`
                relative p-5 md:p-6 rounded-xl border
                ${styles.bg} ${styles.border}
                transition-all duration-300
              `}
            >
              {/* Icon */}
              {IconComponent && (
                <div className={`w-10 h-10 rounded-lg ${styles.icon} flex items-center justify-center mb-4`}>
                  <IconComponent className="w-5 h-5" />
                </div>
              )}
              
              {/* Card number indicator */}
              {!IconComponent && (
                <div className={`
                  w-8 h-8 rounded-full ${styles.icon} 
                  flex items-center justify-center mb-4
                  text-sm font-bold
                `}>
                  {index + 1}
                </div>
              )}
              
              {/* Title */}
              <h4 className="text-lg md:text-xl font-semibold text-white mb-2">
                {card.title}
              </h4>
              
              {/* Description */}
              <p className="text-slate-400 text-base leading-relaxed mb-3">
                {card.description}
              </p>
              
              {/* Example quote */}
              {card.example && (
                <div className={`
                  mt-4 pt-4 border-t border-white/10
                  text-sm ${styles.text} italic
                `}>
                  {card.example}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

