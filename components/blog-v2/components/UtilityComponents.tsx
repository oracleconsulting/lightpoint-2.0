'use client';

import React from 'react';

// ============================================================================
// PARAGRAPH
// Optimized for long-form reading with proper line height and spacing
// ============================================================================

interface ParagraphProps {
  text: string;
  highlight?: boolean;
  dropcap?: boolean;
  className?: string;
}

export function Paragraph({
  text,
  highlight = false,
  dropcap = false,
  className = '',
}: ParagraphProps) {
  if (highlight) {
    return (
      <p className={`
        text-lg leading-relaxed text-slate-700
        bg-blue-50 border-l-4 border-blue-500
        px-6 py-4 rounded-r-lg
        ${className}
      `}>
        {text}
      </p>
    );
  }

  if (dropcap) {
    const firstLetter = text.charAt(0);
    const restOfText = text.slice(1);
    
    return (
      <p className={`text-lg lg:text-xl leading-[1.8] text-slate-700 ${className}`}>
        <span className="float-left text-6xl font-bold text-slate-800 leading-[0.8] mr-3 mt-1">
          {firstLetter}
        </span>
        {restOfText}
      </p>
    );
  }

  return (
    <p className={`
      text-[22px] lg:text-[24px]
      leading-[1.85] lg:leading-[1.9]
      text-slate-700 
      font-['Georgia',_'Times_New_Roman',_serif]
      mb-8 lg:mb-10
      max-w-[720px]
      ${className}
    `}>
      {text}
    </p>
  );
}

// ============================================================================
// SECTION HEADING
// Clear visual hierarchy with optional decorative elements
// ============================================================================

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  icon?: string;
  centered?: boolean;
  decorated?: boolean;
}

export function SectionHeading({
  title,
  subtitle,
  icon,
  centered = false,
  decorated = false,
}: SectionHeadingProps) {
  return (
    <div className={`mt-20 mb-12 ${centered ? 'text-center' : ''}`}>
      {/* Optional decorative line */}
      {decorated && (
        <div className={`w-24 h-1.5 bg-blue-500 mb-8 ${centered ? 'mx-auto' : ''}`} />
      )}
      
      {/* Icon + Title */}
      <div className={`flex items-center gap-4 ${centered ? 'justify-center' : ''}`}>
        {icon && (
          <span className="text-5xl" role="img" aria-label="section icon">
            {icon}
          </span>
        )}
        <h2 className="text-[42px] lg:text-[48px] font-bold text-slate-900 tracking-tight leading-[1.15]">
          {title}
        </h2>
      </div>
      
      {/* Subtitle */}
      {subtitle && (
        <p className={`
          mt-6 text-xl lg:text-[24px] text-slate-600 leading-[1.6]
          ${centered ? '' : 'max-w-3xl'}
        `}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// BULLET LIST
// Clean list presentation with multiple bullet styles
// ============================================================================

interface BulletListProps {
  title?: string;
  items: string[];
  variant?: 'bullet' | 'check' | 'arrow' | 'number';
}

export function BulletList({
  title,
  items,
  variant = 'bullet',
}: BulletListProps) {
  const getBullet = (index: number) => {
    switch (variant) {
      case 'check':
        return (
          <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0 mt-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </span>
        );
      case 'arrow':
        return (
          <span className="text-blue-500 flex-shrink-0 mt-1">→</span>
        );
      case 'number':
        return (
          <span className="w-6 h-6 rounded-full bg-slate-800 text-white text-sm font-medium flex items-center justify-center flex-shrink-0 mt-1">
            {index + 1}
          </span>
        );
      default:
        return (
          <span className="w-2 h-2 rounded-full bg-slate-400 flex-shrink-0 mt-3" />
        );
    }
  };

  return (
    <div className="my-12">
      {title && (
        <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-8">{title}</h3>
      )}
      <ul className="space-y-6">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-4">
            {getBullet(index)}
            <span className="text-[22px] lg:text-[24px] text-slate-700 leading-[1.8]">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// CTA SECTION
// Call-to-action with optional gradient background
// ============================================================================

interface CTASectionProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
  variant?: 'default' | 'highlight';
}

export function CTASection({
  title,
  description,
  buttonText,
  buttonHref,
  variant = 'default',
}: CTASectionProps) {
  const isHighlight = variant === 'highlight';

  return (
    <div className={`
      py-20 px-8
      ${isHighlight 
        ? 'bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900' 
        : 'bg-slate-50'
      }
    `}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className={`
          text-3xl lg:text-4xl font-bold mb-4
          ${isHighlight ? 'text-white' : 'text-slate-800'}
        `}>
          {title}
        </h2>
        
        <p className={`
          text-lg lg:text-xl mb-8 leading-relaxed
          ${isHighlight ? 'text-slate-300' : 'text-slate-600'}
        `}>
          {description}
        </p>
        
        {buttonText && (
          <a
            href={buttonHref || '#'}
            className={`
              inline-block px-8 py-4 rounded-lg font-semibold text-lg
              transition-all duration-200 hover:scale-105
              ${isHighlight 
                ? 'bg-white text-slate-800 hover:bg-blue-50 shadow-xl' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
              }
            `}
          >
            {buttonText}
          </a>
        )}
      </div>
    </div>
  );
}

export default { Paragraph, SectionHeading, BulletList, CTASection };
