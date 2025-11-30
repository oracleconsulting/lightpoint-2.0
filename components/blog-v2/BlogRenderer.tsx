'use client';

import React from 'react';
import type { BlogLayout, LayoutComponent, ComponentType } from './types';

// ============================================================================
// WORLD-CLASS BLOG RENDERER
// Magazine-quality layout with full-width sections, generous whitespace,
// and optimal reading typography
// ============================================================================

interface BlogRendererProps {
  layout: BlogLayout;
  className?: string;
}

export function BlogRenderer({ layout, className = '' }: BlogRendererProps) {
  const { theme, components } = layout;

  return (
    <article 
      className={`
        min-h-screen 
        bg-white 
        font-['Georgia',_'Times_New_Roman',_serif]
        antialiased
        ${className}
      `}
    >
      {/* Render each component with proper section wrapping */}
      {components.map((component, index) => (
        <ComponentRenderer 
          key={`${component.type}-${index}`} 
          component={component}
          index={index}
          isFirst={index === 0}
          isLast={index === components.length - 1}
        />
      ))}
    </article>
  );
}

// ============================================================================
// COMPONENT RENDERER
// Intelligently wraps components with appropriate section styling
// ============================================================================

interface ComponentRendererProps {
  component: LayoutComponent;
  index: number;
  isFirst: boolean;
  isLast: boolean;
}

function ComponentRenderer({ component, index, isFirst, isLast }: ComponentRendererProps) {
  const { type, props } = component;

  // Get the component from registry
  const Component = componentRegistry[type as ComponentType];

  if (!Component) {
    console.warn(`Unknown component type: ${type}`);
    return null;
  }

  // Determine section styling based on component type
  const sectionStyle = getSectionStyle(type as ComponentType, index);

  return (
    <section 
      className={`
        ${sectionStyle.background}
        ${sectionStyle.padding}
        ${isFirst ? 'pt-0' : ''}
        ${isLast ? 'pb-24' : ''}
      `}
    >
      <div className={sectionStyle.container}>
        <Component {...props} />
      </div>
    </section>
  );
}

// ============================================================================
// SECTION STYLING LOGIC
// Returns appropriate styling based on component type
// ============================================================================

interface SectionStyle {
  background: string;
  padding: string;
  container: string;
}

function getSectionStyle(type: ComponentType, index: number): SectionStyle {
  // Full-width components (hero, stats with ring)
  const fullWidthTypes = ['hero', 'cta'];
  
  // Wide components (stats, comparison, charts)
  const wideTypes = ['stats', 'comparisonCards', 'threeColumnCards', 'numberedSteps', 'timeline', 'donutChart'];
  
  // Reading-width components (text-heavy)
  const readingTypes = ['paragraph', 'textWithImage', 'quote', 'callout', 'bulletList', 'sectionHeading'];

  if (fullWidthTypes.includes(type)) {
    return {
      background: '',
      padding: '',
      container: 'w-full',
    };
  }

  if (wideTypes.includes(type)) {
    return {
      background: index % 2 === 0 ? 'bg-white' : 'bg-slate-50',
      padding: 'py-8 lg:py-10',  // Compact spacing
      container: 'max-w-7xl mx-auto px-6 lg:px-12',  // MAXIMUM WIDTH
    };
  }

  // Default: WIDE container with MINIMAL padding
  return {
    background: 'bg-white',
    padding: 'py-1 lg:py-2',  // MINIMAL - almost no gap
    container: 'max-w-6xl mx-auto px-6 lg:px-10',  // WIDE (1152px)
  };
}

// ============================================================================
// COMPONENT REGISTRY
// All available components mapped by type
// ============================================================================

import { HeroSection } from './components/HeroSection';
import { StatsRow } from './components/StatsRow';
import { TextWithImage } from './components/TextWithImage';
import { NumberedSteps } from './components/NumberedSteps';
import { ThreeColumnCards } from './components/ThreeColumnCards';
import { Timeline } from './components/Timeline';
import { ComparisonCards } from './components/ComparisonCards';
import { DonutChart } from './components/DonutChart';
import { CalloutBox } from './components/CalloutBox';
import { QuoteBlock } from './components/QuoteBlock';
import { Paragraph, SectionHeading, BulletList, CTASection } from './components/UtilityComponents';

export const componentRegistry: Record<string, React.ComponentType<any>> = {
  hero: HeroSection,
  stats: StatsRow,
  textWithImage: TextWithImage,
  numberedSteps: NumberedSteps,
  threeColumnCards: ThreeColumnCards,
  timeline: Timeline,
  comparisonCards: ComparisonCards,
  donutChart: DonutChart,
  callout: CalloutBox,
  quote: QuoteBlock,
  paragraph: Paragraph,
  sectionHeading: SectionHeading,
  bulletList: BulletList,
  cta: CTASection,
};

export default BlogRenderer;
