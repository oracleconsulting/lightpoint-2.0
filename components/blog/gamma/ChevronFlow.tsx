'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Hammer, DollarSign, ChevronRight, Target, CheckCircle } from 'lucide-react';

interface FlowStep {
  readonly title: string;
  readonly icon?: 'document' | 'build' | 'money' | 'target' | 'check';
}

interface ChevronFlowProps {
  readonly title?: string;
  readonly steps: readonly FlowStep[];
  readonly accent?: 'blue' | 'cyan' | 'green' | 'purple';
}

const iconMap = {
  document: FileText,
  build: Hammer,
  money: DollarSign,
  target: Target,
  check: CheckCircle
};

const accentConfig = {
  blue: {
    gradient: 'from-blue-500 to-blue-600',
    glow: 'shadow-blue-500/30',
    arrow: 'text-blue-400'
  },
  cyan: {
    gradient: 'from-cyan-500 to-cyan-600',
    glow: 'shadow-cyan-500/30',
    arrow: 'text-cyan-400'
  },
  green: {
    gradient: 'from-green-500 to-green-600',
    glow: 'shadow-green-500/30',
    arrow: 'text-green-400'
  },
  purple: {
    gradient: 'from-purple-500 to-purple-600',
    glow: 'shadow-purple-500/30',
    arrow: 'text-purple-400'
  }
};

export default function ChevronFlow({ 
  title, 
  steps, 
  accent = 'blue' 
}: ChevronFlowProps) {
  const config = accentConfig[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto my-10 px-4"
    >
      {title && (
        <h3 className="text-xl font-bold text-white mb-6 text-center">
          {title}
        </h3>
      )}
      
      {/* Chevron flow container */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {steps.map((step, index) => {
          const IconComponent = step.icon ? iconMap[step.icon] : FileText;
          const stepKey = `chevron-${step.title}-${index}`;
          
          return (
            <React.Fragment key={stepKey}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`
                  flex items-center gap-3
                  px-6 py-4
                  bg-gradient-to-r ${config.gradient}
                  rounded-lg
                  shadow-lg ${config.glow}
                  transform hover:scale-105
                  transition-transform duration-200
                `}
              >
                <IconComponent className="w-6 h-6 text-white" />
                <span className="text-white font-semibold text-lg">
                  {step.title}
                </span>
              </motion.div>
              
              {/* Chevron arrow */}
              {index < steps.length - 1 && (
                <ChevronRight className={`w-8 h-8 ${config.arrow} flex-shrink-0`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </motion.div>
  );
}

