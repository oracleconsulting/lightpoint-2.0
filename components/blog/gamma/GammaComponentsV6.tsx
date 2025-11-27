'use client';

/**
 * Gamma-Parity Components V6
 * 
 * New components to match Gamma's visual density and variety.
 */

import React from 'react';
import { motion } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════
// 1. GRID CHECKLIST (2x2 Layout - matches Gamma Image 4)
// ═══════════════════════════════════════════════════════════════════════════

interface GridChecklistItem {
  number: number;
  title: string;
  description: string;
}

interface GridChecklistProps {
  title: string;
  items: GridChecklistItem[];
}

export function GridChecklist({ title, items }: GridChecklistProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="my-10 max-w-4xl mx-auto px-4"
    >
      <h3 className="text-3xl font-bold text-white mb-8">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {items.map((item) => (
          <motion.div 
            key={item.number}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: item.number * 0.1 }}
            className="relative bg-slate-800/60 border border-slate-600 rounded-xl p-6 pt-8 hover:border-cyan-500/50 transition-colors"
          >
            {/* Numbered badge - cyan circle */}
            <div className="absolute -top-4 left-6 w-9 h-9 bg-cyan-500 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <span className="text-white font-bold text-sm">{item.number}</span>
            </div>
            
            <h4 className="text-xl font-semibold text-white mb-2">
              {item.title}
            </h4>
            <p className="text-slate-400 text-base leading-relaxed">
              {item.description}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. THREE COLUMN CARDS V6 (matches Gamma Image 2 "Critical Failures")
// ═══════════════════════════════════════════════════════════════════════════

interface ThreeColumnCardV6 {
  title: string;
  description: string;
  accent?: 'red' | 'amber' | 'cyan' | 'green' | 'purple';
}

interface ThreeColumnCardsV6Props {
  title?: string;
  cards: ThreeColumnCardV6[];
}

export function ThreeColumnCardsV6({ title, cards }: ThreeColumnCardsV6Props) {
  const accentBorders: Record<string, string> = {
    red: 'border-t-red-500',
    amber: 'border-t-amber-500',
    cyan: 'border-t-cyan-500',
    green: 'border-t-emerald-500',
    purple: 'border-t-purple-500',
  };

  const accentGlows: Record<string, string> = {
    red: 'hover:shadow-red-500/20',
    amber: 'hover:shadow-amber-500/20',
    cyan: 'hover:shadow-cyan-500/20',
    green: 'hover:shadow-emerald-500/20',
    purple: 'hover:shadow-purple-500/20',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="my-10 max-w-4xl mx-auto px-4"
    >
      {title && (
        <h3 className="text-2xl font-bold text-white mb-6">{title}</h3>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card, index) => {
          const accent = card.accent || 'cyan';
          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className={`
                bg-slate-800/50 border border-slate-700 border-t-4 
                ${accentBorders[accent]} 
                rounded-lg p-5
                transition-all duration-300
                hover:bg-slate-800/70 hover:shadow-lg ${accentGlows[accent]}
              `}
            >
              <h4 className="text-lg font-semibold text-white mb-3">
                {card.title}
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                {card.description}
              </p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. QUOTE CALLOUT V6 (matches Gamma Image 2 & 3 quote boxes)
// ═══════════════════════════════════════════════════════════════════════════

interface QuoteCalloutV6Props {
  text: string;
  attribution?: string;
  accent?: 'cyan' | 'purple' | 'amber' | 'blue';
  icon?: boolean;
}

export function QuoteCalloutV6({ text, attribution, accent = 'cyan', icon = true }: QuoteCalloutV6Props) {
  const colors: Record<string, { border: string; bg: string; text: string; icon: string }> = {
    cyan: {
      border: 'border-l-cyan-500',
      bg: 'bg-cyan-500/5',
      text: 'text-cyan-400',
      icon: 'text-cyan-500',
    },
    purple: {
      border: 'border-l-purple-500',
      bg: 'bg-purple-500/5',
      text: 'text-purple-400',
      icon: 'text-purple-500',
    },
    amber: {
      border: 'border-l-amber-500',
      bg: 'bg-amber-500/5',
      text: 'text-amber-400',
      icon: 'text-amber-500',
    },
    blue: {
      border: 'border-l-blue-500',
      bg: 'bg-blue-500/5',
      text: 'text-blue-400',
      icon: 'text-blue-500',
    },
  };

  const c = colors[accent];

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className={`my-8 p-6 border-l-4 ${c.border} ${c.bg} rounded-r-lg max-w-4xl mx-auto`}
    >
      <div className="flex gap-4">
        {icon && (
          <div className={`${c.icon} text-2xl flex-shrink-0 mt-1`}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 4h6v6H4V4zm0 10h6v6H4v-6zm10-10h6v6h-6V4zm0 10h6v6h-6v-6z" opacity="0.3"/>
              <path d="M3 3v8h8V3H3zm6 6H5V5h4v4zm-6 4v8h8v-8H3zm6 6H5v-4h4v4zm4-16v8h8V3h-8zm6 6h-4V5h4v4zm-6 4v8h8v-8h-8zm6 6h-4v-4h4v4z"/>
            </svg>
          </div>
        )}
        <div>
          <p className="text-slate-200 text-lg leading-relaxed">
            &ldquo;{text}&rdquo;
          </p>
          {attribution && (
            <p className={`${c.text} text-sm mt-4 font-medium`}>
              — {attribution}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. NUMBERED PROCESS FLOW V6 (matches Gamma Image 2 "01 → 02 → 03")
// ═══════════════════════════════════════════════════════════════════════════

interface ProcessStepV6 {
  number: string;
  title: string;
  description: string;
}

interface NumberedProcessFlowV6Props {
  title?: string;
  steps: ProcessStepV6[];
}

export function NumberedProcessFlowV6({ title, steps }: NumberedProcessFlowV6Props) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="my-10 max-w-4xl mx-auto px-4"
    >
      {title && (
        <h3 className="text-2xl font-bold text-white mb-6">{title}</h3>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        {steps.map((step, index) => (
          <div key={index} className="relative">
            {/* Connecting arrow between cards */}
            {index < steps.length - 1 && (
              <div className="hidden md:block absolute top-1/2 -right-4 w-8 z-20">
                <svg width="32" height="24" viewBox="0 0 32 24" fill="none">
                  <path 
                    d="M0 12h24M24 12l-6-6M24 12l-6 6" 
                    stroke="#06B6D4" 
                    strokeWidth="2" 
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.15 }}
              className="relative z-10 bg-slate-800 border border-slate-700 rounded-lg p-5 h-full mx-1 hover:border-cyan-500/50 transition-colors"
            >
              {/* Number badge */}
              <div className="text-xs text-slate-500 font-mono mb-3 pb-3 border-b border-slate-700/50">
                {step.number}
              </div>
              
              <h4 className="text-lg font-semibold text-white mb-2">
                {step.title}
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. CHEVRON FLOW V6 (matches Gamma Image 4 "Document → Build → Recover")
// ═══════════════════════════════════════════════════════════════════════════

interface ChevronStepV6 {
  icon: 'document' | 'build' | 'money' | 'check' | 'search' | 'send';
  title: string;
  description?: string;
}

interface ChevronFlowV6Props {
  steps: ChevronStepV6[];
}

export function ChevronFlowV6({ steps }: ChevronFlowV6Props) {
  const iconSvgs: Record<string, React.ReactNode> = {
    document: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    build: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    money: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    check: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    search: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
    send: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="my-10 max-w-4xl mx-auto px-4"
    >
      <div className="flex items-stretch flex-wrap md:flex-nowrap">
        {steps.map((step, index) => (
          <motion.div 
            key={index} 
            className="flex-1 flex items-stretch min-w-0"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div 
              className={`
                relative flex-1 bg-gradient-to-r from-slate-700 to-slate-600
                py-5 px-6 flex flex-col items-center justify-center text-center
                ${index === 0 ? 'rounded-l-lg' : ''}
                ${index === steps.length - 1 ? 'rounded-r-lg' : ''}
              `}
              style={{
                clipPath: index === steps.length - 1 
                  ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 8% 50%)'
                  : index === 0
                  ? 'polygon(0 0, calc(100% - 8%) 0, 100% 50%, calc(100% - 8%) 100%, 0 100%)'
                  : 'polygon(0 0, calc(100% - 8%) 0, 100% 50%, calc(100% - 8%) 100%, 0 100%, 8% 50%)'
              }}
            >
              <div className="text-cyan-400 mb-2">
                {iconSvgs[step.icon]}
              </div>
              <div className="text-white font-semibold text-sm">{step.title}</div>
              {step.description && (
                <div className="text-slate-400 text-xs mt-1">{step.description}</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. TEASER CALLOUT (matches Gamma Image 4 "Next week:" box)
// ═══════════════════════════════════════════════════════════════════════════

interface TeaserCalloutProps {
  label: string;
  title: string;
  description: string;
}

export function TeaserCallout({ label, title, description }: TeaserCalloutProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="my-10 bg-slate-800/70 border border-slate-600 rounded-xl p-6 max-w-4xl mx-auto"
    >
      <div className="flex items-start gap-5">
        <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg className="w-6 h-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <span className="text-cyan-400 text-sm font-semibold uppercase tracking-wide">
            {label}
          </span>
          <h4 className="text-white font-bold text-xl mt-1">{title}</h4>
          <p className="text-slate-400 text-base mt-2 leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. HORIZONTAL BAR CHART (matches Gamma Image 5 stats bars)
// ═══════════════════════════════════════════════════════════════════════════

interface BarDataItem {
  label: string;
  value: number;
  maxValue?: number;
  color?: string;
}

interface HorizontalBarChartProps {
  title?: string;
  data: BarDataItem[];
  showValues?: boolean;
  suffix?: string;
}

export function HorizontalBarChart({ title, data, showValues = true, suffix = '%' }: HorizontalBarChartProps) {
  const maxValue = Math.max(...data.map(d => d.maxValue || d.value), 100);
  const defaultColors = ['#3B82F6', '#06B6D4', '#10B981', '#F59E0B'];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="my-10 max-w-4xl mx-auto px-4"
    >
      {title && (
        <h3 className="text-xl font-bold text-white mb-6">{title}</h3>
      )}
      <div className="space-y-5">
        {data.map((item, index) => {
          const barColor = item.color || defaultColors[index % defaultColors.length];
          const percentage = (item.value / maxValue) * 100;
          
          return (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">{item.label}</span>
                {showValues && (
                  <span className="text-sm text-white font-medium">
                    {item.value}{suffix}
                  </span>
                )}
              </div>
              <div className="h-8 bg-slate-800 rounded-lg overflow-hidden">
                <motion.div 
                  className="h-full rounded-lg"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${percentage}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  style={{ 
                    backgroundColor: barColor,
                    boxShadow: `0 0 20px ${barColor}40`
                  }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. CONTENT IMAGE (for AI-generated images)
// ═══════════════════════════════════════════════════════════════════════════

interface ContentImageProps {
  src: string;
  alt: string;
  caption?: string;
  position?: 'full' | 'left' | 'right';
  aspectRatio?: '16:9' | '4:3' | '1:1' | 'auto';
}

export function ContentImage({ 
  src, 
  alt, 
  caption, 
  position = 'full',
  aspectRatio = '16:9'
}: ContentImageProps) {
  const positionClasses: Record<string, string> = {
    full: 'w-full',
    left: 'float-left w-full md:w-1/2 mr-0 md:mr-6 mb-4',
    right: 'float-right w-full md:w-1/2 ml-0 md:ml-6 mb-4',
  };

  const aspectClasses: Record<string, string> = {
    '16:9': 'aspect-video',
    '4:3': 'aspect-[4/3]',
    '1:1': 'aspect-square',
    'auto': '',
  };

  return (
    <figure className={`my-8 max-w-4xl mx-auto px-4 ${positionClasses[position]}`}>
      <div className={`rounded-xl overflow-hidden border border-slate-700 ${aspectClasses[aspectRatio]}`}>
        <img 
          src={src} 
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      {caption && (
        <figcaption className="text-sm text-slate-500 mt-3 text-center italic">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. STYLED BULLET LIST (matches Gamma Image 3 "State Impact")
// ═══════════════════════════════════════════════════════════════════════════

interface BulletListProps {
  title?: string;
  items: string[];
  icon?: 'bullet' | 'check' | 'x' | 'arrow';
  accent?: 'cyan' | 'green' | 'red' | 'amber';
}

export function BulletList({ title, items, icon = 'bullet', accent = 'cyan' }: BulletListProps) {
  const accentColors: Record<string, string> = {
    cyan: 'text-cyan-400',
    green: 'text-emerald-400',
    red: 'text-red-400',
    amber: 'text-amber-400',
  };

  const icons: Record<string, string> = {
    bullet: '•',
    check: '✓',
    x: '✕',
    arrow: '→',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="my-6 max-w-4xl mx-auto px-4"
    >
      {title && (
        <h4 className="text-lg font-semibold text-white mb-4">{title}</h4>
      )}
      <ul className="space-y-3">
        {items.map((item, index) => (
          <motion.li 
            key={index} 
            className="flex items-start gap-3"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <span className={`${accentColors[accent]} font-bold flex-shrink-0 mt-0.5`}>
              {icons[icon]}
            </span>
            <span className="text-slate-300 text-base leading-relaxed">
              {item}
            </span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. STYLED NUMBERED LIST (matches Gamma Image 3 "Make Demands")
// ═══════════════════════════════════════════════════════════════════════════

interface NumberedListProps {
  title?: string;
  items: string[];
  accent?: 'cyan' | 'blue' | 'purple';
}

export function NumberedList({ title, items, accent = 'cyan' }: NumberedListProps) {
  const accentColors: Record<string, string> = {
    cyan: 'bg-cyan-500 text-white',
    blue: 'bg-blue-500 text-white',
    purple: 'bg-purple-500 text-white',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="my-6 max-w-4xl mx-auto px-4"
    >
      {title && (
        <h4 className="text-lg font-semibold text-white mb-4">{title}</h4>
      )}
      <ol className="space-y-4">
        {items.map((item, index) => (
          <motion.li 
            key={index} 
            className="flex items-start gap-4"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <span className={`${accentColors[accent]} w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0`}>
              {index + 1}
            </span>
            <span className="text-slate-300 text-base leading-relaxed pt-0.5">
              {item}
            </span>
          </motion.li>
        ))}
      </ol>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORT ALL COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

export const GammaComponentsV6 = {
  GridChecklist,
  ThreeColumnCardsV6,
  QuoteCalloutV6,
  NumberedProcessFlowV6,
  ChevronFlowV6,
  TeaserCallout,
  HorizontalBarChart,
  ContentImage,
  BulletList,
  NumberedList,
};

export default GammaComponentsV6;

