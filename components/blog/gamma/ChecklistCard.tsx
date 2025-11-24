'use client';

import { motion } from 'framer-motion';
import { Check, Square, Circle } from 'lucide-react';

interface ChecklistItem {
  number: number;
  title: string;
  description: string;
}

interface ChecklistCardProps {
  title: string;
  items: ChecklistItem[];
  style?: 'numbered' | 'checkbox' | 'icon';
  accent?: 'blue' | 'cyan' | 'purple' | 'green';
}

const accentConfig = {
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    border: 'border-blue-500/30'
  },
  cyan: {
    gradient: 'from-cyan-500 to-cyan-600',
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-400',
    border: 'border-cyan-500/30'
  },
  purple: {
    gradient: 'from-purple-500 to-purple-600',
    bg: 'bg-purple-500/20',
    text: 'text-purple-400',
    border: 'border-purple-500/30'
  },
  green: {
    gradient: 'from-green-500 to-green-600',
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    border: 'border-green-500/30'
  }
};

export default function ChecklistCard({
  title,
  items,
  style = 'numbered',
  accent = 'cyan'
}: ChecklistCardProps) {
  const config = accentConfig[accent];

  const renderMarker = (number: number) => {
    switch (style) {
      case 'checkbox':
        return (
          <div className={`w-6 h-6 ${config.bg} ${config.border} border-2 rounded-md 
                          flex items-center justify-center`}>
            <Check className={`w-4 h-4 ${config.text}`} />
          </div>
        );
      case 'icon':
        return (
          <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center`}>
            <Circle className={`w-4 h-4 ${config.text} fill-current`} />
          </div>
        );
      default: // 'numbered'
        return (
          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${config.gradient} 
                          flex items-center justify-center text-white font-bold shadow-lg`}
               style={{ boxShadow: `0 4px 12px ${config.bg.replace('bg-', 'rgba(').replace('/20', ', 0.3)')}` }}>
            {number}
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className="my-12"
    >
      {/* Title */}
      <h3 className={`text-3xl font-bold mb-8 bg-gradient-to-r ${config.gradient} 
                      bg-clip-text text-transparent`}>
        {title}
      </h3>

      {/* Checklist Container */}
      <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-8
                      hover:border-opacity-70 transition-all duration-300 group">
        {/* Glow effect */}
        <div className={`absolute inset-0 ${config.bg} rounded-2xl blur-xl opacity-0 
                        group-hover:opacity-100 transition-opacity`} />

        {/* Items */}
        <div className="relative space-y-6">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="flex items-start gap-4 group/item"
            >
              {/* Marker */}
              <div className="flex-shrink-0 mt-1">
                {renderMarker(item.number)}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h4 className="text-xl font-semibold text-white mb-2 group-hover/item:text-cyan-400 
                               transition-colors duration-200">
                  {item.title}
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Connector line (except for last item) */}
              {index < items.length - 1 && (
                <div className="absolute left-5 w-0.5 h-6 bg-gradient-to-b from-gray-700 to-transparent"
                     style={{ top: `${(index + 1) * (100 / items.length)}%` }} />
              )}
            </motion.div>
          ))}
        </div>

        {/* Optional: Progress indicator */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">{items.length} Action Steps</span>
            <span className={config.text}>Ready to implement</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

