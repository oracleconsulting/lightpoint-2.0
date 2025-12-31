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

const spacingStyles: Record<string, string> = {
  tight: 'py-8 md:py-12',
  normal: 'py-12 md:py-16',
  relaxed: 'py-16 md:py-24',
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

const spacerSizes: Record<string, string> = {
  small: 'h-4 md:h-6',
  medium: 'h-8 md:h-12',
  large: 'h-12 md:h-16',
};

export function ComponentSpacer({ size = 'medium' }: ComponentSpacerProps) {
  return <div className={spacerSizes[size]} aria-hidden="true" />;
}

export default SectionWrapper;

