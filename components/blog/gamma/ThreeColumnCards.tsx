'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Target, FileText, XCircle, CheckCircle, Info } from 'lucide-react';

interface CardItem {
  readonly title: string;
  readonly description: string;
  readonly icon?: 'alert' | 'target' | 'document' | 'error' | 'success' | 'info';
  readonly accent?: 'blue' | 'cyan' | 'red' | 'amber' | 'green' | 'purple';
}

interface ThreeColumnCardsProps {
  readonly title?: string;
  readonly cards: readonly CardItem[];
  readonly style?: 'default' | 'numbered' | 'icon';
}

const iconMap = {
  alert: AlertTriangle,
  target: Target,
  document: FileText,
  error: XCircle,
  success: CheckCircle,
  info: Info
};

const accentConfig = {
  blue: {
    border: 'border-l-blue-500',
    bg: 'from-blue-500/10 to-blue-500/5',
    icon: 'text-blue-400',
    glow: 'group-hover:shadow-blue-500/20'
  },
  cyan: {
    border: 'border-l-cyan-500',
    bg: 'from-cyan-500/10 to-cyan-500/5',
    icon: 'text-cyan-400',
    glow: 'group-hover:shadow-cyan-500/20'
  },
  red: {
    border: 'border-l-red-500',
    bg: 'from-red-500/10 to-red-500/5',
    icon: 'text-red-400',
    glow: 'group-hover:shadow-red-500/20'
  },
  amber: {
    border: 'border-l-amber-500',
    bg: 'from-amber-500/10 to-amber-500/5',
    icon: 'text-amber-400',
    glow: 'group-hover:shadow-amber-500/20'
  },
  green: {
    border: 'border-l-green-500',
    bg: 'from-green-500/10 to-green-500/5',
    icon: 'text-green-400',
    glow: 'group-hover:shadow-green-500/20'
  },
  purple: {
    border: 'border-l-purple-500',
    bg: 'from-purple-500/10 to-purple-500/5',
    icon: 'text-purple-400',
    glow: 'group-hover:shadow-purple-500/20'
  }
};

export default function ThreeColumnCards({ 
  title, 
  cards, 
  style = 'default' 
}: ThreeColumnCardsProps) {
  // Determine grid columns based on card count
  const gridCols = cards.length === 2 
    ? 'md:grid-cols-2' 
    : cards.length >= 3 
    ? 'md:grid-cols-3' 
    : 'md:grid-cols-1';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto my-10 px-4"
    >
      {title && (
        <h3 className="text-2xl font-bold text-white mb-8 text-center">
          {title}
        </h3>
      )}
      
      <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
        {cards.map((card, index) => {
          const accent = card.accent || 'blue';
          const config = accentConfig[accent];
          const IconComponent = card.icon ? iconMap[card.icon] : null;
          const cardKey = `card-${card.title}-${index}`;
          
          return (
            <motion.div
              key={cardKey}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={`
                group
                relative
                bg-gradient-to-br ${config.bg}
                border-l-4 ${config.border}
                rounded-r-xl
                p-6
                backdrop-blur-sm
                transition-all duration-300
                hover:translate-y-[-2px]
                hover:shadow-lg
                ${config.glow}
              `}
            >
              {/* Number badge for numbered style */}
              {style === 'numbered' && (
                <div className={`
                  absolute -top-3 -left-3
                  w-8 h-8 rounded-full
                  bg-gradient-to-br from-blue-500 to-cyan-500
                  flex items-center justify-center
                  text-white text-sm font-bold
                  shadow-lg
                `}>
                  {index + 1}
                </div>
              )}
              
              {/* Icon for icon style */}
              {style === 'icon' && IconComponent && (
                <div className={`mb-4 ${config.icon}`}>
                  <IconComponent className="w-8 h-8" />
                </div>
              )}
              
              <h4 className="text-lg font-bold text-white mb-2">
                {card.title}
              </h4>
              
              <p className="text-sm text-white/70 leading-relaxed">
                {card.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

