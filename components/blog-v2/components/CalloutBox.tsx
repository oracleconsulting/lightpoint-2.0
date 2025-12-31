'use client';

import React from 'react';

// ============================================================================
// CALLOUT BOX
// Highlighted tip, warning, or note with icon
// ============================================================================

interface CalloutBoxProps {
  icon?: string;
  label?: string;
  text?: string;
  variant?: 'blue' | 'border' | 'gold' | 'green';
  // AI compatibility props
  type?: 'info' | 'warning' | 'success' | 'tip';
  title?: string;
  content?: string;
}

// Map AI 'type' values to component 'variant' values
const typeToVariant: Record<string, 'blue' | 'border' | 'gold' | 'green'> = {
  info: 'blue',
  warning: 'gold',
  success: 'green',
  tip: 'border',
};

// Map AI 'type' values to default icons
const typeToIcon: Record<string, string> = {
  info: 'ℹ️',
  warning: '⚠️',
  success: '✅',
  tip: '💡',
};

export function CalloutBox({
  icon,
  label,
  text,
  variant,
  // AI compatibility props
  type,
  title,
  content,
}: CalloutBoxProps) {
  // Normalize props: accept both naming conventions
  const normalizedVariant = variant || (type ? typeToVariant[type] : 'blue') || 'blue';
  const normalizedIcon = icon || (type ? typeToIcon[type] : undefined);
  const normalizedLabel = label || title || '';
  const normalizedText = text || content || '';
  
  // Defensive: return null if no content
  if (!normalizedText && !normalizedLabel) {
    return null;
  }

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

  const style = variants[normalizedVariant];

  return (
    <div className={`
      rounded-xl border p-8 lg:p-10 my-6
      ${style.container}
    `}>
      <div className="flex items-start gap-5">
        {/* Icon */}
        {normalizedIcon && (
          <div className={`
            w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
            ${style.icon}
          `}>
            <span className="text-2xl">{normalizedIcon}</span>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1">
          {normalizedLabel && (
            <div className={`font-bold text-sm uppercase tracking-wider mb-3 ${style.label}`}>
              {normalizedLabel.replace(/\*\*/g, '').replace(/\*/g, '').trim()}
            </div>
          )}
          {normalizedText && (
            <p className={`text-[22px] lg:text-[24px] leading-[1.8] ${style.text}`}>
              {normalizedText.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^\.\s+/, '').trim()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalloutBox;
