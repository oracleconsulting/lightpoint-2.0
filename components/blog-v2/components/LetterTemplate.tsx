'use client';

import React from 'react';

/**
 * LetterTemplate - Document preview component for formal letters/templates
 * 
 * Features:
 * - Header bar with document icon (navy background)
 * - Paper-like body with monospace font
 * - Highlights [placeholder text] with amber background
 * - Subtle shadow and border for depth
 */

interface LetterTemplateProps {
  title?: string;
  content?: string;
  text?: string; // AI compatibility alias
  heading?: string; // AI compatibility alias
  className?: string;
}

function highlightPlaceholders(text: string): React.ReactNode {
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, i) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return (
        <span 
          key={i} 
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
  content, 
  text, 
  heading,
  className = '' 
}: LetterTemplateProps) {
  // Normalize props for AI compatibility
  const normalizedContent = content || text || '';
  const normalizedTitle = title || heading || 'Template';
  
  if (!normalizedContent) return null;

  return (
    <div className={`rounded-xl overflow-hidden border border-slate-200 shadow-md bg-white ${className}`}>
      {/* Header bar - looks like a document viewer */}
      <div className="bg-gradient-to-r from-slate-100 to-slate-50 px-5 py-3 border-b border-slate-200 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <span className="font-semibold text-slate-800 text-sm">{normalizedTitle}</span>
        
        {/* Decorative dots */}
        <div className="ml-auto flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
        </div>
      </div>
      
      {/* Document body */}
      <div className="p-6 md:p-8 bg-white">
        <div className="font-mono text-[14px] md:text-[15px] text-slate-700 whitespace-pre-wrap leading-[1.9]">
          {highlightPlaceholders(normalizedContent)}
        </div>
      </div>
      
      {/* Footer tip */}
      <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-slate-500">
          Replace <span className="bg-amber-100 text-amber-800 px-1 rounded text-[11px]">[bracketed text]</span> with your details
        </p>
      </div>
    </div>
  );
}

/**
 * FormalLetter - Alternative elegant styling for formal correspondence
 */
export function FormalLetter({ 
  title, 
  content, 
  text, 
  heading,
  className = '' 
}: LetterTemplateProps) {
  const normalizedContent = content || text || '';
  const normalizedTitle = title || heading;
  
  if (!normalizedContent) return null;

  return (
    <div className={`rounded-xl overflow-hidden border border-slate-200 shadow-lg bg-white ${className}`}>
      {/* Decorative header stripe */}
      <div className="h-2 bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8f]" />
      
      <div className="p-8 md:p-10">
        {normalizedTitle && (
          <h3 className="text-xl font-bold text-slate-800 mb-6">{normalizedTitle}</h3>
        )}
        
        {/* Letter content with serif font */}
        <div className="font-serif text-[16px] text-slate-700 whitespace-pre-wrap leading-[1.9] border-l-4 border-slate-200 pl-6">
          {highlightPlaceholders(normalizedContent)}
        </div>
      </div>
      
      {/* Decorative footer */}
      <div className="px-8 py-4 bg-slate-50 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="h-0.5 w-12 bg-slate-300 rounded" />
          <span className="text-xs text-slate-400 uppercase tracking-wider">Template</span>
        </div>
      </div>
    </div>
  );
}

export default LetterTemplate;
