'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';

interface ProcessStep {
  readonly number: string | number;
  readonly title: string;
  readonly description?: string;
}

interface NumberedProcessFlowProps {
  readonly title?: string;
  readonly steps: readonly ProcessStep[];
  readonly accent?: 'blue' | 'cyan' | 'purple' | 'green';
}

const accentConfig = {
  blue: {
    gradient: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/30',
    arrow: 'text-blue-400/60'
  },
  cyan: {
    gradient: 'from-cyan-500 to-blue-500',
    glow: 'shadow-cyan-500/30',
    arrow: 'text-cyan-400/60'
  },
  purple: {
    gradient: 'from-purple-500 to-pink-500',
    glow: 'shadow-purple-500/30',
    arrow: 'text-purple-400/60'
  },
  green: {
    gradient: 'from-green-500 to-emerald-500',
    glow: 'shadow-green-500/30',
    arrow: 'text-green-400/60'
  }
};

export default function NumberedProcessFlow({ 
  title, 
  steps, 
  accent = 'blue' 
}: NumberedProcessFlowProps) {
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
        <h3 className="text-2xl font-bold text-white mb-8 text-center">
          {title}
        </h3>
      )}
      
      {/* Horizontal process flow */}
      <div className="flex items-stretch justify-between gap-2">
        {steps.map((step, index) => {
          const stepKey = `step-${step.number}-${index}`;
          const stepNum = typeof step.number === 'number' 
            ? step.number.toString().padStart(2, '0') 
            : step.number;
          
          return (
            <React.Fragment key={stepKey}>
              {/* Step card */}
              <motion.div 
                className="flex-1 relative"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                {/* Number badge */}
                <div className={`
                  absolute -top-3 left-1/2 -translate-x-1/2
                  w-10 h-10 rounded-full
                  bg-gradient-to-br ${config.gradient}
                  flex items-center justify-center
                  text-white text-sm font-bold
                  shadow-lg ${config.glow}
                  z-10
                `}>
                  {stepNum}
                </div>
                
                {/* Card content */}
                <div className="
                  pt-10 pb-6 px-5
                  bg-slate-800/60
                  backdrop-blur-sm
                  border border-white/10
                  rounded-xl
                  h-full
                  hover:border-white/20
                  transition-colors duration-200
                ">
                  <h4 className="text-lg font-bold text-white mb-2 text-center">
                    {step.title}
                  </h4>
                  {step.description && (
                    <p className="text-sm text-white/70 leading-relaxed text-center">
                      {step.description}
                    </p>
                  )}
                  
                  {/* Underline accent */}
                  <div className={`
                    w-12 h-0.5 mx-auto mt-4
                    bg-gradient-to-r ${config.gradient}
                    rounded-full
                  `} />
                </div>
              </motion.div>
              
              {/* Arrow between steps */}
              {index < steps.length - 1 && (
                <div className="flex items-center px-2 self-center">
                  <ChevronRight className={`w-6 h-6 ${config.arrow}`} />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </motion.div>
  );
}

