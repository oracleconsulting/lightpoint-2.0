'use client';

import React from 'react';

/**
 * LetterTemplate - Displays formal letter/document templates
 * 
 * Renders content in a document-like container with:
 * - Paper-like background with subtle shadow
 * - Preserved line breaks and formatting
 * - Highlighted placeholder fields [like this]
 */

export interface LetterTemplateProps {
  content?: string;
  text?: string; // AI compatibility
  title?: string;
  className?: string;
}

export function LetterTemplate({
  content,
  text,
  title,
  className = '',
}: LetterTemplateProps) {
  // Normalize props
  const normalizedContent = content || text || '';
  
  if (!normalizedContent) {
    return null;
  }

  // Split content into lines for processing
  const lines = normalizedContent.split('\n');

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-2xl font-bold text-slate-800 mb-4">{title}</h3>
      )}
      
      {/* Document container with code-editor style header */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        {/* Header bar - looks like a code editor/document */}
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
          <span className="ml-3 text-xs text-slate-500 font-medium">Template</span>
        </div>
        
        {/* Content with preserved formatting */}
        <div className="p-6 md:p-8 bg-white">
          <pre className="text-sm md:text-base text-slate-700 whitespace-pre-wrap font-mono leading-relaxed">
            {lines.map((line, index) => {
              // Highlight template placeholders [like this]
              const parts = line.split(/(\[[^\]]+\])/g);
              return (
                <React.Fragment key={index}>
                  {parts.map((part, partIndex) => {
                    if (part.startsWith('[') && part.endsWith(']')) {
                      return (
                        <span 
                          key={partIndex}
                          className="bg-amber-100 text-amber-800 px-1 rounded"
                        >
                          {part}
                        </span>
                      );
                    }
                    return part;
                  })}
                  {index < lines.length - 1 && '\n'}
                </React.Fragment>
              );
            })}
          </pre>
        </div>
      </div>
    </div>
  );
}

/**
 * FormalLetter - Alternative styling for formal correspondence
 * More elegant, document-like appearance
 */
export function FormalLetter({
  content,
  text,
  title,
  className = '',
}: LetterTemplateProps) {
  const normalizedContent = content || text || '';
  
  if (!normalizedContent) {
    return null;
  }

  // Process content to highlight placeholders
  const processLine = (line: string) => {
    const parts = line.split(/(\[[^\]]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith('[') && part.endsWith(']')) {
        return (
          <span 
            key={index}
            className="bg-amber-50 text-amber-700 px-1 rounded border border-amber-200 font-mono text-sm"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-2xl font-bold text-slate-800 mb-4">{title}</h3>
      )}
      
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-6 md:p-8">
        {/* Decorative header */}
        <div className="border-b-2 border-slate-800 pb-4 mb-6">
          <div className="h-1 w-16 bg-slate-800"></div>
        </div>
        
        {/* Letter content */}
        <div className="text-slate-700 leading-relaxed font-serif">
          {normalizedContent.split('\n').map((line, index) => (
            <p key={index} className={line.trim() === '' ? 'h-4' : 'mb-2'}>
              {line.trim() !== '' && processLine(line)}
            </p>
          ))}
        </div>
        
        {/* Decorative footer */}
        <div className="mt-8 pt-4 border-t border-slate-200">
          <div className="h-0.5 w-12 bg-slate-300"></div>
        </div>
      </div>
    </div>
  );
}

export default LetterTemplate;

