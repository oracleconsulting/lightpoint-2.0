'use client';

import React from 'react';
import type { BlogLayout, LayoutComponent, ComponentType, SectionGroup } from './types';
import { SectionWrapper, ComponentSpacer } from './components/SectionWrapper';
import { smartGroupIntoSections } from './utils/sectionGrouper';

// ============================================================================
// WORLD-CLASS BLOG RENDERER V2
// Magazine-quality layout with section grouping, alternating backgrounds,
// and optimal reading typography
// ============================================================================

// BlogLayout already supports sections from types.ts

interface BlogRendererProps {
  layout: BlogLayout;
  className?: string;
}

export function BlogRenderer({ layout, className = '' }: BlogRendererProps) {
  // Get sections - either pre-defined or auto-generated from components
  let sections: SectionGroup[] = [];
  
  if (layout.sections && layout.sections.length > 0) {
    // Use pre-defined sections
    sections = layout.sections;
  } else if (layout.components && layout.components.length > 0) {
    // Auto-group components into sections
    sections = smartGroupIntoSections(layout.components);
  }

  if (sections.length === 0) {
    return null;
  }

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
      {sections.map((section, sectionIndex) => (
        <SectionWrapper
          key={section.id || `section-${sectionIndex}`}
          id={section.id}
          background={section.background}
          spacing={section.spacing}
        >
          {section.components.map((component, componentIndex) => (
            <React.Fragment key={`${section.id}-${component.type}-${componentIndex}`}>
              <ComponentRenderer component={component} />
              {/* Add spacing between components, but not after the last one */}
              {componentIndex < section.components.length - 1 && (
                <ComponentSpacer size="medium" />
              )}
            </React.Fragment>
          ))}
        </SectionWrapper>
      ))}
    </article>
  );
}

// ============================================================================
// COMPONENT RENDERER - With error boundary and prop normalization
// ============================================================================

interface ComponentRendererProps {
  component: LayoutComponent;
}

function ComponentRenderer({ component }: ComponentRendererProps) {
  const { type, props } = component;

  // Normalize props for AI compatibility
  const normalizedProps = normalizeProps(type, props);

  const Component = componentRegistry[type as ComponentType];

  if (!Component) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Unknown component type: ${type}`);
      return (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
          <p className="text-yellow-800 text-sm">
            Unknown component type: <code>{type}</code>
          </p>
        </div>
      );
    }
    return null; // Silently skip unknown components in production
  }

  try {
    return <Component {...normalizedProps} />;
  } catch (error) {
    console.error(`Error rendering ${type}:`, error);
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="bg-red-50 border border-red-200 p-4 rounded">
          <p className="text-red-800 text-sm">
            Error rendering: <code>{type}</code>
          </p>
        </div>
      );
    }
    return null; // Fail gracefully in production
  }
}

// ============================================================================
// PROP NORMALIZER - Handles AI naming variations
// ============================================================================

function normalizeProps(type: string, props: Record<string, unknown>): Record<string, unknown> {
  const normalized = { ...props };

  switch (type) {
    case 'stats':
      // Accept both 'stats' and 'items'
      if (!normalized.stats && normalized.items) {
        normalized.stats = normalized.items;
        delete normalized.items;
      }
      break;

    case 'callout':
      // Map AI props to component props
      if (!normalized.text && normalized.content) {
        normalized.text = normalized.content;
        delete normalized.content;
      }
      if (!normalized.label && normalized.title) {
        normalized.label = normalized.title;
        delete normalized.title;
      }
      // Map type to variant
      if (normalized.type && !normalized.variant) {
        const typeMap: Record<string, string> = {
          info: 'blue',
          warning: 'gold',
          tip: 'border',
          success: 'green',
          error: 'gold',
        };
        normalized.variant = typeMap[normalized.type as string] || 'border';
      }
      break;

    case 'paragraph':
      // Accept both 'text' and 'content'
      if (!normalized.text && normalized.content) {
        normalized.text = normalized.content;
        delete normalized.content;
      }
      break;

    case 'textWithImage':
      // Handle nested image object
      if (normalized.image && typeof normalized.image === 'object') {
        const img = normalized.image as Record<string, unknown>;
        if (!normalized.imageSrc) normalized.imageSrc = img.url || img.src;
        if (!normalized.imageAlt) normalized.imageAlt = img.alt;
        if (!normalized.imageCaption) normalized.imageCaption = img.caption;
        delete normalized.image;
      }
      // Convert content string to paragraphs array
      if (!normalized.paragraphs && normalized.content) {
        const content = normalized.content as string;
        normalized.paragraphs = content.split('\n\n').filter(Boolean);
        delete normalized.content;
      }
      break;

    case 'comparisonCards':
      // Handle items array format in leftCard/rightCard
      if (normalized.leftCard && typeof normalized.leftCard === 'object') {
        const leftCard = normalized.leftCard as Record<string, unknown>;
        if (!leftCard.content && leftCard.items && Array.isArray(leftCard.items)) {
          leftCard.content = (leftCard.items as string[]).map(item => `• ${item}`).join('\n');
          delete leftCard.items;
        }
      }
      if (normalized.rightCard && typeof normalized.rightCard === 'object') {
        const rightCard = normalized.rightCard as Record<string, unknown>;
        if (!rightCard.content && rightCard.items && Array.isArray(rightCard.items)) {
          rightCard.content = (rightCard.items as string[]).map(item => `• ${item}`).join('\n');
          delete rightCard.items;
        }
      }
      break;

    case 'quote':
      // Accept both 'text' and 'quote'
      if (!normalized.text && normalized.quote) {
        normalized.text = normalized.quote;
        delete normalized.quote;
      }
      // Accept 'author' as 'attribution'
      if (!normalized.attribution && normalized.author) {
        normalized.attribution = normalized.author;
        delete normalized.author;
      }
      break;

    case 'cta':
      // Handle nested button object
      if (normalized.primaryButton && typeof normalized.primaryButton === 'object') {
        const btn = normalized.primaryButton as Record<string, unknown>;
        if (!normalized.buttonText) normalized.buttonText = btn.text;
        if (!normalized.buttonHref) normalized.buttonHref = btn.href;
        delete normalized.primaryButton;
      }
      break;

    case 'threeColumnCards':
      // Ensure cards array exists
      if (!normalized.cards && normalized.items) {
        normalized.cards = normalized.items;
        delete normalized.items;
      }
      break;

    case 'numberedSteps':
      // Ensure steps array exists
      if (!normalized.steps && normalized.items) {
        normalized.steps = normalized.items;
        delete normalized.items;
      }
      break;

    case 'timeline':
      // Ensure events array exists
      if (!normalized.events && normalized.items) {
        normalized.events = normalized.items;
        delete normalized.items;
      }
      break;

    case 'bulletList':
      // Ensure items array exists
      if (!normalized.items) {
        normalized.items = [];
      }
      break;

    case 'donutChart':
      // Ensure segments array exists
      if (!normalized.segments && normalized.items) {
        normalized.segments = normalized.items;
        delete normalized.items;
      }
      break;

    case 'sectionHeading':
      // Accept 'heading' as 'title'
      if (!normalized.title && normalized.heading) {
        normalized.title = normalized.heading;
        delete normalized.heading;
      }
      break;
  }

  return normalized;
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
