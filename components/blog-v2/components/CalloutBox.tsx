'use client';

import React from 'react';

// ============================================================================
// CALLOUT BOX
// Highlighted tip, warning, or note with icon
// ============================================================================

interface CalloutBoxProps {
  icon?: string;
  label: string;
  text: string;
  variant?: 'blue' | 'border' | 'gold' | 'green';
}

export function CalloutBox({
  icon,
  label,
  text,
  variant = 'blue',
}: CalloutBoxProps) {
  const variants = {
    blue: {
      container: 'bg-blue-50 border-blue-200',
      icon: 'bg-blue-500 text-white',
      label: 'text-blue-700',
      text: 'text-blue-900',
    },
    border: {
      container: 'bg-white border-slate-200 border-l-4 border-l-blue-500',
      icon: 'bg-slate-100 text-slate-600',
      label: 'text-slate-700',
      text: 'text-slate-600',
    },
    gold: {
      container: 'bg-amber-50 border-amber-200',
      icon: 'bg-amber-500 text-white',
      label: 'text-amber-700',
      text: 'text-amber-900',
    },
    green: {
      container: 'bg-emerald-50 border-emerald-200',
      icon: 'bg-emerald-500 text-white',
      label: 'text-emerald-700',
      text: 'text-emerald-900',
    },
  };

  const style = variants[variant];

  return (
    <div className={`
      rounded-xl border p-10 lg:p-12 my-10
      ${style.container}
    `}>
      <div className="flex items-start gap-5">
        {/* Icon */}
        {icon && (
          <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
            ${style.icon}
          `}>
            <span className="text-2xl">{icon}</span>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1">
          <div className={`font-bold text-sm uppercase tracking-wider mb-3 ${style.label}`}>
            {label}
          </div>
          <p className={`text-[22px] lg:text-[24px] leading-[1.8] ${style.text}`}>
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}

export default CalloutBox;
