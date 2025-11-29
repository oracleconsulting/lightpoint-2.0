'use client';

import React from 'react';
import type { 
  ParagraphProps, 
  SectionHeadingProps, 
  BulletListProps,
  CTASectionProps 
} from '../types';

// ============================================================================
// PARAGRAPH - Simple text paragraph
// ============================================================================

export function Paragraph({
  text,
  highlight = false,
  className = '',
}: ParagraphProps) {
  return (
    <p className={`
      text-lg text-gray-600 leading-relaxed
      ${highlight ? 'bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500' : ''}
      ${className}
    `}>
      {text}
    </p>
  );
}

// ============================================================================
// SECTION HEADING - Title for content sections
// ============================================================================

export function SectionHeading({
  title,
  subtitle,
  icon,
  centered = false,
  className = '',
}: SectionHeadingProps) {
  return (
    <div className={`mb-8 ${centered ? 'text-center' : ''} ${className}`}>
      <div className={`flex items-center gap-3 ${centered ? 'justify-center' : ''}`}>
        {icon && (
          <span className="text-2xl" role="img" aria-label="section icon">
            {icon}
          </span>
        )}
        <h2 className="text-3xl md:text-4xl font-bold text-slate-800">
          {title}
        </h2>
      </div>
      {subtitle && (
        <p className={`mt-2 text-lg text-gray-600 ${centered ? '' : 'max-w-2xl'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// BULLET LIST - List with various bullet styles
// ============================================================================

export function BulletList({
  title,
  items,
  variant = 'bullet',
  className = '',
}: BulletListProps) {
  const bulletStyles = {
    bullet: '•',
    check: '✓',
    arrow: '→',
  };

  const bulletColors = {
    bullet: 'text-slate-400',
    check: 'text-green-500',
    arrow: 'text-blue-500',
  };

  return (
    <div className={className}>
      {title && (
        <h3 className="font-bold text-slate-800 text-lg mb-4">{title}</h3>
      )}
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className={`${bulletColors[variant]} flex-shrink-0 font-bold`}>
              {bulletStyles[variant]}
            </span>
            <span className="text-gray-600 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// CTA SECTION - Call to action with button
// ============================================================================

export function CTASection({
  title,
  description,
  buttonText,
  buttonHref,
  variant = 'default',
  className = '',
}: CTASectionProps) {
  const bgStyles = {
    default: 'bg-gray-50',
    highlight: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white',
  };

  const textStyles = {
    default: {
      title: 'text-slate-800',
      description: 'text-gray-600',
    },
    highlight: {
      title: 'text-white',
      description: 'text-blue-100',
    },
  };

  return (
    <div className={`py-16 px-8 ${bgStyles[variant]} ${className}`}>
      <div className="max-w-3xl mx-auto text-center">
        <h2 className={`text-3xl font-bold mb-4 ${textStyles[variant].title}`}>
          {title}
        </h2>
        <p className={`text-lg mb-8 ${textStyles[variant].description}`}>
          {description}
        </p>
        {buttonText && (
          <a
            href={buttonHref || '#'}
            className={`
              inline-block px-8 py-4 rounded-lg font-semibold transition-colors
              ${variant === 'highlight' 
                ? 'bg-white text-blue-600 hover:bg-blue-50' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
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

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  Paragraph,
  SectionHeading,
  BulletList,
  CTASection,
};

