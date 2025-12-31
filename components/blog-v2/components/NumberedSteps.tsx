'use client';

import React from 'react';

// ============================================================================
// NUMBERED STEPS
// Process visualization with vertical or grid layouts
// ============================================================================

interface Step {
  number?: string;
  title: string;
  description: string;
}

interface NumberedStepsProps {
  title?: string;
  intro?: string;
  steps?: Step[];
  conclusion?: string;
  variant?: 'vertical' | 'grid';
}

export function NumberedSteps({
  title,
  intro,
  steps,
  conclusion,
  variant = 'vertical',
}: NumberedStepsProps) {
  // Defensive: ensure steps is an array
  const normalizedSteps = steps || [];
  if (normalizedSteps.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      {(title || intro) && (
        <div className="mb-6">
          {title && (
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-3 tracking-tight">
              {title}
            </h2>
          )}
          {intro && (
            <p className="text-lg lg:text-xl text-slate-600 leading-relaxed max-w-3xl">
              {intro}
            </p>
          )}
        </div>
      )}

      {/* Steps */}
      {variant === 'grid' ? (
        <GridSteps steps={normalizedSteps} />
      ) : (
        <VerticalSteps steps={normalizedSteps} />
      )}

      {/* Conclusion */}
      {conclusion && (
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-lg text-slate-700 leading-relaxed max-w-3xl">
            {conclusion}
          </p>
        </div>
      )}
    </div>
  );
}

function VerticalSteps({ steps }: { steps: Step[] }) {
  return (
    <div className="relative">
      {/* Connector line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-blue-400 to-blue-300 hidden md:block" />
      
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="relative flex gap-6 md:gap-8">
            {/* Number circle */}
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-blue-500/25 z-10">
              {step.number || String(index + 1).padStart(2, '0')}
            </div>
            
            {/* Content */}
            <div className="flex-1 pt-2 pb-4">
              <h3 className="text-[24px] lg:text-[26px] font-bold text-slate-800 mb-2 leading-[1.3]">
                {step.title.replace(/\*\*/g, '').replace(/\*/g, '').trim()}
              </h3>
              <p className="text-[19px] lg:text-[20px] text-slate-600 leading-[1.75]">
                {step.description.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^\.\s+/, '').trim()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GridSteps({ steps }: { steps: Step[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {steps.map((step, index) => (
        <div 
          key={index}
          className="bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all duration-200 group"
        >
          {/* Large number */}
          <div className="text-5xl font-bold text-slate-200 group-hover:text-blue-100 transition-colors mb-4">
            {step.number || String(index + 1).padStart(2, '0')}
          </div>
          
          {/* Title */}
          <h3 className="text-[19px] font-bold text-slate-800 mb-3 leading-[1.3]">
            {step.title.replace(/\*\*/g, '').replace(/\*/g, '').trim()}
          </h3>
          
          {/* Description */}
          <p className="text-[16px] text-slate-600 leading-[1.7]">
            {step.description.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^\.\s+/, '').trim()}
          </p>
        </div>
      ))}
    </div>
  );
}

export default NumberedSteps;
