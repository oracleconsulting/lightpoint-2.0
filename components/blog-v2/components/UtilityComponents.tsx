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

  // Split text by double newlines to preserve paragraph structure
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim());
  
  if (paragraphs.length === 1) {
    // Single paragraph - render normally
    return (
      <p className={`
        text-[20px] lg:text-[22px]
        leading-[1.75] lg:leading-[1.8]
        text-slate-700 
        font-['Georgia',_'Times_New_Roman',_serif]
        mb-1
        ${className}
      `}>
        {text.replace(/\n/g, ' ')} {/* Replace single newlines with spaces */}
      </p>
    );
  }
  
  // Multiple paragraphs - render each as separate paragraph
  return (
    <div className={`space-y-1 ${className}`}>
      {paragraphs.map((para, index) => (
        <p 
          key={index}
          className="text-[20px] lg:text-[22px] leading-[1.75] lg:leading-[1.8] text-slate-700 font-['Georgia',_'Times_New_Roman',_serif]"
        >
          {para.replace(/\n/g, ' ')}
        </p>
      ))}
    </div>
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
    <div className={`mt-4 mb-3 ${centered ? 'text-center' : ''}`}>
      {/* Optional decorative line */}
      {decorated && (
        <div className={`w-24 h-1.5 bg-blue-500 mb-4 ${centered ? 'mx-auto' : ''}`} />
      )}
      
      {/* Icon + Title */}
      <div className={`flex items-center gap-4 ${centered ? 'justify-center' : ''}`}>
        {icon && (
          <span className="text-5xl" role="img" aria-label="section icon">
            {icon}
          </span>
        )}
        <h2 className="text-[36px] lg:text-[42px] font-bold text-slate-900 tracking-tight leading-[1.2]">
          {title}
        </h2>
      </div>
      
      {/* Subtitle */}
      {subtitle && (
        <p className={`
          mt-3 text-xl lg:text-[22px] text-slate-600 leading-[1.6]
          ${centered ? '' : 'max-w-4xl'}
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
    <div className="my-6">
      {title && (
        <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 mb-4">{title}</h3>
      )}
      <ul className="space-y-4">
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
// Call-to-action with optional gradient background and multiple buttons
// ============================================================================

interface CTAButton {
  text: string;
  href: string;
}

interface CTASectionProps {
  title: string;
  description: string;
  buttonText?: string;
  buttonHref?: string;
  primaryButton?: CTAButton;
  secondaryButton?: CTAButton;
  variant?: 'default' | 'highlight';
}

export function CTASection({
  title,
  description,
  buttonText,
  buttonHref,
  primaryButton,
  secondaryButton,
  variant = 'default',
}: CTASectionProps) {
  const isHighlight = variant === 'highlight';

  // Use primaryButton if provided, otherwise fall back to buttonText/buttonHref
  const mainButton = primaryButton || (buttonText ? { text: buttonText, href: buttonHref || '#' } : null);

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
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {mainButton && (
            <a
              href={mainButton.href}
              className={`
                inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg
                transition-all duration-200 hover:scale-105
                ${isHighlight 
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 hover:from-amber-300 hover:to-amber-400 shadow-xl' 
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-500 hover:to-blue-600 shadow-lg'
                }
              `}
            >
              {mainButton.text}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          )}
          
          {secondaryButton && (
            <a
              href={secondaryButton.href}
              className={`
                inline-flex items-center gap-2 px-8 py-4 rounded-lg font-semibold text-lg
                transition-all duration-200 hover:scale-105 border-2
                ${isHighlight 
                  ? 'border-white/30 text-white hover:bg-white/10' 
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                }
              `}
            >
              {secondaryButton.text}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default { Paragraph, SectionHeading, BulletList, CTASection };
