'use client';

import React from 'react';

// ============================================================================
// LETTER TEMPLATE
// Document-style container for formal letters, templates, and sample text
// Matches Gamma's polished document preview style
// ============================================================================

interface LetterTemplateProps {
  title?: string;
  heading?: string; // AI compatibility alias
  subtitle?: string;
  content?: string;
  text?: string; // AI compatibility alias
  variant?: 'letter' | 'document' | 'code';
  className?: string;
}

// Highlight placeholders like [Client Reference] with amber background
function highlightPlaceholders(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]]+\])/g);
  
  return parts.map((part, index) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return (
        <span 
          key={index}
          className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-medium"
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export function LetterTemplate({
  title,
  heading,
  subtitle,
  content,
  text,
  variant = 'letter',
  className = '',
}: LetterTemplateProps) {
  // Normalize props for AI compatibility
  const normalizedTitle = title || heading || 'Template';
  const normalizedContent = content || text || '';
  
  if (!normalizedContent) return null;

  // Code variant for technical/code snippets
  if (variant === 'code') {
    return (
      <div className={`rounded-xl overflow-hidden border border-slate-200 shadow-sm ${className}`}>
        {/* Header bar - macOS style */}
        <div className="bg-slate-800 px-4 py-2.5 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
          </div>
          <span className="text-slate-400 text-sm ml-2">{normalizedTitle}</span>
        </div>
        {/* Content */}
        <div className="bg-slate-900 p-5">
          <pre className="text-slate-300 text-sm font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
            {normalizedContent}
          </pre>
        </div>
      </div>
    );
  }

  // Letter variant - formal correspondence style
  return (
    <div className={`rounded-xl overflow-hidden border border-slate-200 shadow-md bg-white ${className}`}>
      {/* Document header bar */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-5 py-3 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Document icon in navy container */}
          <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">{normalizedTitle}</div>
            {subtitle && (
              <div className="text-xs text-slate-500">{subtitle}</div>
            )}
          </div>
        </div>
        
        {/* Decorative dots */}
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
        </div>
      </div>

      {/* Document body with paper styling */}
      <div className="relative">
        {/* Subtle lined paper effect */}
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to bottom, transparent calc(1.8rem - 1px), #e2e8f0 calc(1.8rem - 1px), #e2e8f0 1.8rem)',
            backgroundSize: '100% 1.8rem',
          }}
        />
        
        <div className="p-6 md:p-8 relative">
          <div className="font-mono text-[13px] md:text-[14px] text-slate-700 whitespace-pre-wrap leading-[1.8] tracking-tight">
            {highlightPlaceholders(normalizedContent)}
          </div>
        </div>
      </div>

      {/* Footer with tip */}
      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100">
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <span className="inline-flex w-4 h-4 rounded-full bg-amber-100 text-amber-600 text-[10px] font-bold items-center justify-center">!</span>
          Replace <span className="bg-amber-100 text-amber-800 px-1 rounded text-[11px]">[bracketed text]</span> with your specific details
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// FORMAL LETTER - Simplified alias with sensible defaults
// ============================================================================

export function FormalLetter({ 
  content, 
  text,
  title,
  heading,
  className = '',
}: LetterTemplateProps) {
  // Normalize props for AI compatibility
  const normalizedTitle = title || heading || 'Professional Cost Claim Letter';
  const normalizedContent = content || text || '';
  
  if (!normalizedContent) return null;
  
  return (
    <LetterTemplate
      title={normalizedTitle}
      subtitle="Copy and customize for your claim"
      content={normalizedContent}
      variant="letter"
      className={className}
    />
  );
}

export default LetterTemplate;
