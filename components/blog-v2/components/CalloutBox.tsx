'use client';

import React from 'react';
import type { CalloutBoxProps } from '../types';

/**
 * CalloutBox - Highlighted callout with icon and label
 * 
 * Matches Gamma page 9:
 * - Blue background variant
 * - Left border variant
 * - Icon + bold label + text
 */
export function CalloutBox({
  icon = '💡',
  label,
  text,
  variant = 'blue',
  className = '',
}: CalloutBoxProps) {
  const variantStyles = {
    blue: 'bg-blue-100 rounded-lg',
    border: 'border-l-4 border-blue-500 bg-gray-50 rounded-r-lg',
    gold: 'bg-amber-50 border-l-4 border-amber-500 rounded-r-lg',
  };

  return (
    <div className={`p-5 ${variantStyles[variant]} ${className}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <span className="text-xl flex-shrink-0" role="img" aria-label="icon">
            {icon}
          </span>
        )}
        <div className="flex-1">
          <span className="font-bold text-slate-800">{label}</span>{' '}
          <span className="text-gray-700 leading-relaxed">{text}</span>
        </div>
      </div>
    </div>
  );
}

export default CalloutBox;

