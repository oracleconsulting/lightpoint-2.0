'use client';

import React from 'react';
import type { NumberedStepsProps, Step } from '../types';

/**
 * NumberedSteps - Vertical connected steps or grid layout
 * 
 * Matches Gamma pages 3 and 6:
 * - Vertical: Connected chevron flow with numbers
 * - Grid: 3-column numbered grid
 */
export function NumberedSteps({
  title,
  intro,
  steps,
  conclusion,
  variant = 'vertical',
  className = '',
}: NumberedStepsProps) {
  return (
    <div className={`bg-white py-16 px-8 ${className}`}>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        {title && (
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            {title}
          </h2>
        )}
        {intro && (
          <p className="text-lg text-gray-600 mb-10 max-w-3xl">
            {intro}
          </p>
        )}

        {/* Steps */}
        {variant === 'vertical' ? (
          <VerticalSteps steps={steps} />
        ) : (
          <GridSteps steps={steps} />
        )}

        {/* Conclusion */}
        {conclusion && (
          <p className="text-lg text-gray-600 mt-10 max-w-3xl">
            {conclusion}
          </p>
        )}
      </div>
    </div>
  );
}

interface StepsProps {
  steps: Step[];
}

function VerticalSteps({ steps }: StepsProps) {
  return (
    <div className="space-y-0">
      {steps.map((step, index) => {
        const stepNumber = step.number || String(index + 1).padStart(2, '0');
        const isLast = index === steps.length - 1;

        return (
          <div key={index} className="relative">
            <div className="flex gap-6">
              {/* Number and connector */}
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg font-bold text-blue-600">
                    {stepNumber}
                  </span>
                </div>
                {!isLast && (
                  <div className="w-0.5 flex-1 bg-gray-200 my-2 min-h-[20px]" />
                )}
              </div>

              {/* Content */}
              <div className="bg-gray-50 rounded-lg p-5 flex-1 mb-4">
                <h3 className="font-bold text-slate-800 text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GridSteps({ steps }: StepsProps) {
  // Split into rows of 3
  const rows: Step[][] = [];
  for (let i = 0; i < steps.length; i += 3) {
    rows.push(steps.slice(i, i + 3));
  }

  return (
    <div className="space-y-8">
      {rows.map((row, rowIndex) => (
        <div 
          key={rowIndex} 
          className={`grid gap-6 ${
            row.length === 1 
              ? 'grid-cols-1' 
              : row.length === 2 
                ? 'grid-cols-1 md:grid-cols-2' 
                : 'grid-cols-1 md:grid-cols-3'
          }`}
        >
          {row.map((step, colIndex) => {
            const globalIndex = rowIndex * 3 + colIndex;
            const stepNumber = step.number || String(globalIndex + 1).padStart(2, '0');
            const isFullWidth = row.length === 1 && steps.length > 1;

            return (
              <div 
                key={colIndex} 
                className={`${isFullWidth ? 'border-t-4 border-blue-500 pt-4' : ''}`}
              >
                <div className="text-sm text-gray-400 mb-1">{stepNumber}</div>
                <h3 className="font-bold text-slate-800 text-lg mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default NumberedSteps;

