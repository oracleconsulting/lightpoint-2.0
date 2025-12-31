'use client';

import React from 'react';

// ============================================================================
// SECTION WRAPPER
// Groups related components with consistent spacing and backgrounds
// ============================================================================

export interface SectionWrapperProps {
  children: React.ReactNode;
  background?: 'white' | 'gray' | 'dark' | 'gradient';
  spacing?: 'tight' | 'normal' | 'relaxed';
  maxWidth?: 'narrow' | 'normal' | 'wide' | 'full';
  className?: string;
  id?: string;
}

const backgroundStyles: Record<string, string> = {
  white: 'bg-white',
  gray: 'bg-slate-50',
  dark: 'bg-slate-800 text-white',
  gradient: 'bg-gradient-to-br from-slate-800 to-slate-900 text-white',
};

// TIGHTER spacing for better visual rhythm
const spacingStyles: Record<string, string> = {
  tight: 'py-3 md:py-4',
  normal: 'py-6 md:py-8',
  relaxed: 'py-8 md:py-12',
};

const maxWidthStyles: Record<string, string> = {
  narrow: 'max-w-3xl',
  normal: 'max-w-5xl',
  wide: 'max-w-6xl',
  full: 'max-w-full',
};

export function SectionWrapper({
  children,
  background = 'white',
  spacing = 'normal',
  maxWidth = 'normal',
  className = '',
  id,
}: SectionWrapperProps) {
  return (
    <section
      id={id}
      className={`
        ${backgroundStyles[background]}
        ${spacingStyles[spacing]}
        ${className}
      `}
    >
      <div className={`${maxWidthStyles[maxWidth]} mx-auto px-6 md:px-8`}>
        {children}
      </div>
    </section>
  );
}

// ============================================================================
// COMPONENT SPACER
// Adds consistent vertical spacing between components within a section
// ============================================================================

export interface ComponentSpacerProps {
  size?: 'small' | 'medium' | 'large';
}

// TIGHTER component spacing within sections
const spacerSizes: Record<string, string> = {
  small: 'h-2 md:h-3',
  medium: 'h-4 md:h-5',
  large: 'h-6 md:h-8',
};

export function ComponentSpacer({ size = 'medium' }: ComponentSpacerProps) {
  return <div className={spacerSizes[size]} aria-hidden="true" />;
}

export default SectionWrapper;

