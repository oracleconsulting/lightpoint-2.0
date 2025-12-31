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

  // Brand-consistent styling with Lightpoint navy (#1e3a5f)
  const variants = {
    blue: {
      container: 'bg-slate-50 border-[#1e3a5f]/20',
      icon: 'bg-[#1e3a5f]',
      label: 'text-[#1e3a5f]',
      text: 'text-slate-700',
    },
    border: {
      container: 'bg-white border-slate-200 border-l-4 border-l-[#1e3a5f]',
      icon: 'bg-slate-100',
      label: 'text-slate-700',
      text: 'text-slate-600',
    },
    gold: {
      container: 'bg-amber-50/50 border-amber-200/50',
      icon: 'bg-amber-600',
      label: 'text-amber-700',
      text: 'text-slate-700',
    },
    green: {
      container: 'bg-emerald-50/50 border-emerald-200/50',
      icon: 'bg-emerald-600',
      label: 'text-emerald-700',
      text: 'text-slate-700',
    },
  };

  const style = variants[normalizedVariant];

  return (
    <div className={`
      rounded-xl border p-8 lg:p-10 my-6
      ${style.container}
    `}>
      <div className="flex items-start gap-5">
        {/* Icon - wrapped in brand container with white/monochrome emoji */}
        {normalizedIcon && (
          <div className={`
            w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
            ${style.icon}
          `}>
            <span className="text-xl filter brightness-0 invert">{normalizedIcon}</span>
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
