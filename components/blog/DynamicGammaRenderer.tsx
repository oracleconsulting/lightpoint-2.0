'use client';

import React from 'react';
import HeroGradient from '@/components/blog/gamma/HeroGradient';
import StatCard from '@/components/blog/gamma/StatCard';
import StatCardGroup from '@/components/blog/gamma/StatCardGroup';
import ProcessFlow from '@/components/blog/gamma/ProcessFlow';
import Timeline from '@/components/blog/gamma/Timeline';
import ComparisonChart from '@/components/blog/gamma/ComparisonChart';
import CalloutBox from '@/components/blog/gamma/CalloutBox';
import ChecklistCard from '@/components/blog/gamma/ChecklistCard';
import SectionDivider from '@/components/blog/gamma/SectionDivider';

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
  mode: 'dark';
  colors: {
    background?: string;
    backgroundGradient?: string;
    primary?: string;
    secondary?: string;
    text?: string;
    textSecondary?: string;
  };
}

interface DynamicGammaRendererProps {
  layout: GammaLayout[] | { layout: GammaLayout[]; theme?: GammaTheme };
}

export default function DynamicGammaRenderer({ layout }: DynamicGammaRendererProps) {
  // Early return if no layout
  if (!layout) {
    console.warn('DynamicGammaRenderer: No layout provided');
    return null;
  }

  // Handle both direct array and wrapped object
  const layoutArray = Array.isArray(layout) ? layout : (layout?.layout || []);
  const theme = Array.isArray(layout) ? null : layout?.theme;

  // Validate dark theme
  if (theme && theme.mode !== 'dark') {
    console.error('THEME VIOLATION: mode must be "dark"');
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
          return (
            <div 
              key={index} 
              className="prose prose-xl prose-invert max-w-4xl mx-auto my-6 px-4
                prose-headings:font-bold prose-headings:text-white prose-headings:mb-4 prose-headings:text-2xl
                prose-p:text-white prose-p:leading-relaxed prose-p:mb-4 prose-p:text-lg
                prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-white prose-strong:font-semibold
                prose-ul:list-disc prose-ul:ml-6 prose-ul:text-lg prose-ol:list-decimal prose-ol:ml-6
                prose-li:text-white prose-li:mb-2
                prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-200 prose-blockquote:text-lg
                prose-code:bg-gray-800 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-base prose-code:text-cyan-400"
              dangerouslySetInnerHTML={{ __html: props.content || section.content || '' }}
            />
          );

        case 'StatCard':
          return (
            <div key={index} className="max-w-4xl mx-auto px-4">
              <StatCard {...props} animationDelay={index * 0.05} />
            </div>
          );

        case 'StatCardGroup':
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

  // V3: Enforce dark theme background
  const backgroundStyle = theme?.colors?.backgroundGradient || 
    'linear-gradient(180deg, #0a0a1a 0%, #0f0f23 50%, #1a1a2e 100%)';

  return (
    <div 
      className="gamma-blog-container w-full min-h-screen"
      style={{
        background: backgroundStyle,
        color: theme?.colors?.text || '#FFFFFF'
      }}
    >
      {layoutArray.map((section, index) => renderComponent(section, index))}
    </div>
  );
}
