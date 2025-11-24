'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ArrowDown } from 'lucide-react';

interface ProcessStep {
  number: number;
  title: string;
  description: string;
  duration?: string;
}

interface ProcessFlowProps {
  title: string;
  steps: ProcessStep[];
  style?: 'horizontal' | 'vertical' | 'snake';
  showConnectors?: boolean;
}

export default function ProcessFlow({
  title,
  steps,
  style = 'horizontal',
  showConnectors = true
}: ProcessFlowProps) {
  const isHorizontal = style === 'horizontal';
  const isSnake = style === 'snake';
  
  // Auto-select optimal layout: 5-6 steps = 2x3 or 3x2 grid for better visual balance
  const useGridLayout = steps.length >= 5;
  const gridCols = steps.length === 5 ? 3 : steps.length >= 6 ? 3 : 2;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className="my-12"
    >
      {/* Title */}
      <h3 className="text-3xl font-bold text-white mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
        {title}
      </h3>

      {/* Steps Container */}
      <div className={useGridLayout 
        ? `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${gridCols} gap-6`
        : `flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-6`
      }>
        {steps.map((step, index) => (
          <div
            key={index}
            className="relative"
          >
            {/* Step Card */}
            <motion.div
              initial={{ opacity: 0, x: isHorizontal ? -20 : 0, y: !isHorizontal ? 20 : 0 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 
                         rounded-xl p-6 hover:border-cyan-500/50 transition-all duration-300
                         hover:transform hover:-translate-y-1 group h-full"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 
                              rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Step number badge */}
              <div className="absolute -top-3 -left-3 w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 
                              rounded-full flex items-center justify-center text-white font-bold text-lg
                              shadow-lg shadow-blue-500/50 z-10">
                {step.number}
              </div>

              {/* Content */}
              <div className="relative ml-4">
                <h4 className="text-xl font-semibold text-white mb-2 mt-1">
                  {step.title}
                </h4>
                <p className="text-gray-400 leading-relaxed">
                  {step.description}
                </p>
                {step.duration && (
                  <span className="inline-block mt-3 px-3 py-1 bg-blue-500/20 text-blue-400 
                                   text-sm rounded-full font-medium">
                    {step.duration}
                  </span>
                )}
              </div>
            </motion.div>

            {/* Connector arrow - only show if NOT using grid layout */}
            {showConnectors && !useGridLayout && index < steps.length - 1 && (
              <div className={`absolute ${
                isHorizontal 
                  ? 'left-full top-1/2 -translate-y-1/2 w-6 h-0.5 ml-3' 
                  : isSnake
                    ? index % 2 === 0
                      ? 'left-full top-1/2 -translate-y-1/2 w-6 h-0.5 ml-3'
                      : 'right-full top-1/2 -translate-y-1/2 w-6 h-0.5 mr-3'
                    : 'left-6 top-full h-6 w-0.5 mt-3'
              } bg-gradient-to-r ${isHorizontal || (isSnake && index % 2 === 0) ? 'from-blue-500 to-cyan-500' : 'from-cyan-500 to-blue-500'} z-0`}>
                {isHorizontal || isSnake ? (
                  <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                ) : (
                  <ArrowDown className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 text-cyan-400" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
