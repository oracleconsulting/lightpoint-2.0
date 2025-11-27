'use client';

import React from 'react';
import HeroGradient from '@/components/blog/gamma/HeroGradient';
import StatCard from '@/components/blog/gamma/StatCard';
import StatCardGroup from '@/components/blog/gamma/StatCardGroup';
import TextSection from '@/components/blog/gamma/TextSection';
import ProcessFlow from '@/components/blog/gamma/ProcessFlow';
import Timeline from '@/components/blog/gamma/Timeline';
import ComparisonChart from '@/components/blog/gamma/ComparisonChart';
import CalloutBox from '@/components/blog/gamma/CalloutBox';
import ChecklistCard from '@/components/blog/gamma/ChecklistCard';
import SectionDivider from '@/components/blog/gamma/SectionDivider';
import { getTheme, defaultTheme, type ThemeConfig } from '@/lib/blog/themes';

interface GammaLayout {
  id?: string;
  type?: string;
  layoutType?: string;
  columns?: number;
  components?: any[];
  content?: string;
  style?: string;
  props?: any;
}

interface GammaTheme {
  name?: string;
  mode?: 'dark' | 'medium' | 'light';
  colors?: {
    background?: string;
    backgroundGradient?: string;
    primary?: string;
    secondary?: string;
    text?: string;
    textSecondary?: string;
  };
}

interface DynamicGammaRendererProps {
  readonly layout: GammaLayout[] | { layout: GammaLayout[]; theme?: GammaTheme };
  readonly themeName?: string;
}

export default function DynamicGammaRenderer({ layout, themeName }: DynamicGammaRendererProps) {
  // Early return if no layout
  if (!layout) {
    console.warn('DynamicGammaRenderer: No layout provided');
    return null;
  }

  // Handle both direct array and wrapped object
  const layoutArray = Array.isArray(layout) ? layout : (layout?.layout || []);
  const layoutTheme = Array.isArray(layout) ? null : layout?.theme;

  // V4: Get theme from props, layout, or default
  let resolvedTheme: ThemeConfig;
  if (themeName) {
    resolvedTheme = getTheme(themeName);
  } else if (layoutTheme?.name) {
    resolvedTheme = getTheme(layoutTheme.name);
  } else {
    resolvedTheme = defaultTheme;
  }

  // If no components to render, return null
  if (!layoutArray || layoutArray.length === 0) {
    console.warn('DynamicGammaRenderer: Empty layout array');
    return null;
  }

  const renderComponent = (section: GammaLayout, index: number) => {
    if (!section) {
      console.warn(`DynamicGammaRenderer: Null section at index ${index}`);
      return null;
    }

    const type = section.type || section.layoutType;
    const props = section.props || {};

    try {
      switch (type) {
        case 'HeroGradient':
        case 'hero':
          return <HeroGradient key={index} {...props} />;

        case 'TextSection':
        case 'text':
          // V4: Use dedicated TextSection component with larger text
          return (
            <TextSection 
              key={index} 
              content={props.content || section.content || ''} 
            />
          );

        case 'StatCard':
          // V4: Standalone stat - narrower width
          return (
            <div key={index} className="max-w-xl mx-auto px-4 my-6">
              <StatCard {...props} animationDelay={index * 0.05} />
            </div>
          );

        case 'StatCardGroup':
          // V4: Grouped stats - horizontal layout enforced
          return (
            <StatCardGroup key={index} {...props} />
          );

        case 'grid':
          // Grid layout - constrained to content width
          return (
            <div key={index} className="max-w-4xl mx-auto grid grid-cols-1 gap-4 my-8 px-4">
              {section.components?.map((comp, i) => renderComponent(comp, i))}
            </div>
          );

        case 'ProcessFlow':
        case 'process':
          return (
            <div key={index} className="max-w-4xl mx-auto my-8 px-4">
              <ProcessFlow {...props} />
            </div>
          );

        case 'Timeline':
        case 'timeline':
          return (
            <div key={index} className="max-w-4xl mx-auto my-8 px-4">
              <Timeline {...props} />
            </div>
          );

        case 'ComparisonChart':
        case 'chart':
          return (
            <div key={index} className="max-w-4xl mx-auto my-8 px-4">
              <ComparisonChart {...props} />
            </div>
          );

        case 'CalloutBox':
        case 'callout':
          return (
            <div key={index} className="max-w-4xl mx-auto my-6 px-4">
              <CalloutBox {...props} />
            </div>
          );

        case 'ChecklistCard':
        case 'checklist':
          return (
            <div key={index} className="max-w-4xl mx-auto my-8 px-4">
              <ChecklistCard {...props} />
            </div>
          );

        case 'SectionDivider':
        case 'divider':
          return <SectionDivider key={index} />;

        default:
          // Unknown component - show warning in dev only
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Unknown component type: ${type}`, section);
          }
          return null;
      }
    } catch (error) {
      console.error(`Error rendering component ${type}:`, error);
      return null;
    }
  };

  // V4: Apply theme background - support both gradient and solid
  const backgroundStyle = layoutTheme?.colors?.backgroundGradient || 
    resolvedTheme.colors.pageBgGradient;

  // V4: Determine text color based on theme mode
  const textColor = resolvedTheme.mode === 'light' 
    ? resolvedTheme.colors.textPrimary 
    : '#FFFFFF';

  return (
    <div 
      className="gamma-blog-container w-full min-h-screen py-8"
      style={{
        background: backgroundStyle,
        color: textColor
      }}
    >
      <div className="max-w-5xl mx-auto">
        {layoutArray.map((section, index) => renderComponent(section, index))}
      </div>
    </div>
  );
}
