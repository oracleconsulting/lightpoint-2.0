'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight, Circle, ArrowRight } from 'lucide-react';

interface BulletListProps {
  readonly title?: string;
  readonly items: readonly string[];
  readonly style?: 'check' | 'bullet' | 'number' | 'arrow' | 'chevron';
  readonly accent?: 'cyan' | 'purple' | 'amber' | 'emerald';
  readonly columns?: 1 | 2;
}

/**
 * BulletList - Styled list component with multiple icon styles
 * 
 * Converts inline lists into proper visual lists with icons.
 * Matches Gamma's styled list components.
 */
export default function BulletList({ 
  title, 
  items, 
  style = 'check',
  accent = 'cyan',
  columns = 1
}: BulletListProps) {
  const accentColors = {
    cyan: {
      icon: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
    },
    purple: {
      icon: 'text-purple-400',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/20',
    },
    amber: {
      icon: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    emerald: {
      icon: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
  };

  const colors = accentColors[accent];

  const renderIcon = (index: number) => {
    const iconClass = `w-5 h-5 ${colors.icon} flex-shrink-0`;
    
    switch (style) {
      case 'check':
        return <Check className={iconClass} />;
      case 'arrow':
        return <ArrowRight className={iconClass} />;
      case 'chevron':
        return <ChevronRight className={iconClass} />;
      case 'number':
        return (
          <span className={`
            w-6 h-6 rounded-full ${colors.bg} ${colors.icon}
            flex items-center justify-center text-sm font-semibold flex-shrink-0
          `}>
            {index + 1}
          </span>
        );
      case 'bullet':
      default:
        return <Circle className={`w-2 h-2 ${colors.icon} fill-current flex-shrink-0`} />;
    }
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
        <h3 className="text-lg md:text-xl font-semibold text-white mb-4 md:mb-5">
          {title}
        </h3>
      )}
      
      <ul className={`
        grid gap-3 md:gap-4
        ${columns === 2 ? 'md:grid-cols-2' : 'grid-cols-1'}
      `}>
        {items.map((item, index) => (
          <motion.li
            key={`${item.slice(0, 20)}-${index}`}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex items-start gap-3"
          >
            <span className="mt-1">
              {renderIcon(index)}
            </span>
            <span className="text-slate-300 text-base md:text-lg leading-relaxed">
              {item}
            </span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

