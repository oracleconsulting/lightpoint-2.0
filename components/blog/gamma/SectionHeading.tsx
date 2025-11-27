'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, Target, FileText, CheckCircle, Clock, 
  TrendingUp, Shield, Zap, Award, BookOpen, Scale, 
  ArrowRight, LucideIcon
} from 'lucide-react';

// Icon mapping for dynamic icon selection
const iconMap: Record<string, LucideIcon> = {
  'alert-triangle': AlertTriangle,
  'target': Target,
  'file-text': FileText,
  'check-circle': CheckCircle,
  'clock': Clock,
  'trending-up': TrendingUp,
  'shield': Shield,
  'zap': Zap,
  'award': Award,
  'book-open': BookOpen,
  'scale': Scale,
  'arrow-right': ArrowRight,
};

interface SectionHeadingProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly icon?: string;
  readonly accent?: 'cyan' | 'purple' | 'amber' | 'emerald';
}

/**
 * SectionHeading - Large, bold H2 for major topic transitions
 * 
 * Creates clear visual breaks between major sections of content.
 * Matches Gamma's section heading style.
 */
export default function SectionHeading({ 
  title, 
  subtitle, 
  icon,
  accent = 'cyan' 
}: SectionHeadingProps) {
  const IconComponent = icon ? iconMap[icon] : null;
  
  const accentColors = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  };
  
  const accentLine = {
    cyan: 'from-cyan-500 to-transparent',
    purple: 'from-purple-500 to-transparent',
    amber: 'from-amber-500 to-transparent',
    emerald: 'from-emerald-500 to-transparent',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Accent line */}
      <div className={`h-1 w-24 mb-6 bg-gradient-to-r ${accentLine[accent]} rounded-full`} />
      
      <div className="flex items-start gap-4">
        {/* Optional icon */}
        {IconComponent && (
          <div className={`flex-shrink-0 p-3 rounded-xl border ${accentColors[accent]}`}>
            <IconComponent className="w-6 h-6" />
          </div>
        )}
        
        <div className="flex-1">
          {/* Main title */}
          <h2 className="
            text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem]
            font-bold text-white
            leading-tight tracking-tight
          ">
            {title}
          </h2>
          
          {/* Optional subtitle */}
          {subtitle && (
            <p className="
              mt-3 md:mt-4
              text-lg md:text-xl
              text-slate-400
              leading-relaxed
            ">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

