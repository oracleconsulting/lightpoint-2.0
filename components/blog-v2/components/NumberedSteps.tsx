'use client';

import React from 'react';

// ============================================================================
// NUMBERED STEPS - Gamma-quality process visualization
// Features:
// - Navy number circles with brand consistency
// - Connector lines between steps
// - Multiple layout variants
// - Smooth hover animations
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
  items?: Step[]; // AI compatibility
  conclusion?: string;
  variant?: 'vertical' | 'grid' | 'timeline';
}

export function NumberedSteps({
  title,
  intro,
  steps,
  items,
  conclusion,
  variant = 'vertical',
}: NumberedStepsProps) {
  // Normalize: accept both 'steps' and 'items'
  const normalizedSteps = steps || items || [];
  
  if (normalizedSteps.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {/* Header */}
      {(title || intro) && (
        <div className="mb-8">
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
      ) : variant === 'timeline' ? (
        <TimelineSteps steps={normalizedSteps} />
      ) : (
        <VerticalSteps steps={normalizedSteps} />
      )}

      {/* Conclusion */}
      {conclusion && (
        <div className="mt-8 pt-6 border-t border-slate-200">
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
      {/* Vertical connector line */}
      <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-[#1e3a5f] via-slate-300 to-slate-200" />
      
      <div className="space-y-0">
        {steps.map((step, index) => (
          <div key={index} className="relative flex gap-6">
            {/* Number circle with connector */}
            <div className="flex flex-col items-center z-10">
              <div className="w-10 h-10 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-bold text-lg shadow-lg shadow-slate-900/10">
                {step.number || index + 1}
              </div>
              {/* Mini connector line */}
              {index < steps.length - 1 && (
                <div className="w-0.5 flex-1 min-h-[2rem] bg-slate-200" />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 pb-8">
              <h3 className="text-xl lg:text-2xl font-bold text-slate-800 mb-2 leading-tight">
                {cleanText(step.title)}
              </h3>
              <p className="text-base lg:text-lg text-slate-600 leading-relaxed">
                {cleanText(step.description)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineSteps({ steps }: { steps: Step[] }) {
  return (
    <div className="relative">
      {/* Horizontal connector line (on desktop) */}
      <div className="hidden md:block absolute top-5 left-0 right-0 h-0.5 bg-gradient-to-r from-[#1e3a5f] via-slate-300 to-slate-200" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {steps.map((step, index) => (
          <div key={index} className="relative text-center">
            {/* Number circle */}
            <div className="relative z-10 mx-auto mb-4">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#1e3a5f] text-white flex items-center justify-center font-bold shadow-lg shadow-slate-900/10">
                {step.number || index + 1}
              </div>
            </div>
            
            {/* Content */}
            <h3 className="text-lg font-bold text-slate-800 mb-2">
              {cleanText(step.title)}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {cleanText(step.description)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function GridSteps({ steps }: { steps: Step[] }) {
  // Determine grid columns based on step count
  const gridCols = 
    steps.length === 2 ? 'md:grid-cols-2' :
    steps.length === 3 ? 'md:grid-cols-3' :
    steps.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
    'md:grid-cols-2 lg:grid-cols-3';
  
  return (
    <div className={`grid grid-cols-1 ${gridCols} gap-6`}>
      {steps.map((step, index) => (
        <div 
          key={index}
          className="bg-white rounded-xl p-6 border border-slate-200 hover:border-[#1e3a5f]/30 hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
        >
          {/* Accent stripe */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8f] opacity-0 group-hover:opacity-100 transition-opacity" />
          
          {/* Large number */}
          <div className="text-5xl font-bold text-slate-100 group-hover:text-[#1e3a5f]/10 transition-colors mb-4">
            {step.number || String(index + 1).padStart(2, '0')}
          </div>
          
          {/* Title */}
          <h3 className="text-lg font-bold text-slate-800 mb-3 leading-tight">
            {cleanText(step.title)}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed">
            {cleanText(step.description)}
          </p>
        </div>
      ))}
    </div>
  );
}

// Helper function to clean markdown artifacts
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^\.\s+/, '')
    .trim();
}

export default NumberedSteps;
