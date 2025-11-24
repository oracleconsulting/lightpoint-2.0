'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Dynamically import Gamma components
const HeroGradient = dynamic(() => import('@/components/blog/gamma/HeroGradient'), {
  loading: () => <div className="h-[600px] bg-gray-900/50 animate-pulse rounded-3xl" />
});

const StatCard = dynamic(() => import('@/components/blog/gamma/StatCard'), {
  loading: () => <div className="h-48 bg-gray-900/50 animate-pulse rounded-2xl" />
});

const ProcessFlow = dynamic(() => import('@/components/blog/gamma/ProcessFlow'), {
  loading: () => <div className="h-96 bg-gray-900/50 animate-pulse rounded-2xl" />
});

const Timeline = dynamic(() => import('@/components/blog/gamma/Timeline'), {
  loading: () => <div className="h-96 bg-gray-900/50 animate-pulse rounded-2xl" />
});

const ComparisonChart = dynamic(() => import('@/components/blog/gamma/ComparisonChart'), {
  loading: () => <div className="h-[500px] bg-gray-900/50 animate-pulse rounded-2xl" />
});

const CalloutBox = dynamic(() => import('@/components/blog/gamma/CalloutBox'), {
  loading: () => <div className="h-48 bg-gray-900/50 animate-pulse rounded-2xl" />
});

const ChecklistCard = dynamic(() => import('@/components/blog/gamma/ChecklistCard'), {
  loading: () => <div className="h-96 bg-gray-900/50 animate-pulse rounded-2xl" />
});

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

interface DynamicGammaRendererProps {
  layout: GammaLayout[] | { layout: GammaLayout[]; theme?: any };
}

export default function DynamicGammaRenderer({ layout }: DynamicGammaRendererProps) {
  // Handle both direct array and wrapped object
  const layoutArray = Array.isArray(layout) ? layout : layout?.layout || [];
  const theme = Array.isArray(layout) ? null : layout?.theme;

  const renderComponent = (section: GammaLayout, index: number) => {
    const type = section.type || section.layoutType;
    const props = section.props || {};

    try {
      switch (type) {
        case 'HeroGradient':
        case 'hero':
          return (
            <Suspense key={index} fallback={<div className="h-[600px] bg-gray-900/50 animate-pulse" />}>
              <HeroGradient {...props} />
            </Suspense>
          );

        case 'StatCard':
          return (
            <Suspense key={index} fallback={<div className="h-48 bg-gray-900/50 animate-pulse" />}>
              <StatCard {...props} animationDelay={index * 0.1} />
            </Suspense>
          );

        case 'grid':
          // Render grid of components (usually StatCards)
          return (
            <div key={index} className={`grid grid-cols-1 md:grid-cols-${section.columns || 3} gap-6 my-12`}>
              {section.components?.map((comp, i) => renderComponent(comp, i))}
            </div>
          );

        case 'ProcessFlow':
        case 'process':
          return (
            <Suspense key={index} fallback={<div className="h-96 bg-gray-900/50 animate-pulse" />}>
              <ProcessFlow {...props} />
            </Suspense>
          );

        case 'Timeline':
        case 'timeline':
          return (
            <Suspense key={index} fallback={<div className="h-96 bg-gray-900/50 animate-pulse" />}>
              <Timeline {...props} />
            </Suspense>
          );

        case 'ComparisonChart':
        case 'chart':
          return (
            <Suspense key={index} fallback={<div className="h-[500px] bg-gray-900/50 animate-pulse" />}>
              <ComparisonChart {...props} />
            </Suspense>
          );

        case 'CalloutBox':
        case 'callout':
          return (
            <Suspense key={index} fallback={<div className="h-48 bg-gray-900/50 animate-pulse" />}>
              <CalloutBox {...props} />
            </Suspense>
          );

        case 'ChecklistCard':
        case 'checklist':
          return (
            <Suspense key={index} fallback={<div className="h-96 bg-gray-900/50 animate-pulse" />}>
              <ChecklistCard {...props} />
            </Suspense>
          );

        case 'text':
          // Plain text section
          return (
            <div key={index} className="my-8 max-w-4xl mx-auto">
              <div 
                className="text-gray-300 text-lg leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: section.content || '' }}
              />
            </div>
          );

        default:
          // Unknown component - show warning
          console.warn(`Unknown component type: ${type}`, section);
          return (
            <div key={index} className="my-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
              <p className="text-yellow-400">
                Unknown section type: <code className="font-mono">{type}</code>
              </p>
              <pre className="text-xs text-gray-400 mt-2 overflow-auto">
                {JSON.stringify(section, null, 2)}
              </pre>
            </div>
          );
      }
    } catch (error) {
      console.error(`Error rendering component ${type}:`, error);
      return (
        <div key={index} className="my-8 p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400">
            Error rendering component: <code className="font-mono">{type}</code>
          </p>
          <p className="text-sm text-gray-400 mt-2">{String(error)}</p>
        </div>
      );
    }
  };

  return (
    <div className="gamma-blog-content">
      {/* Apply theme if provided */}
      {theme && (
        <style jsx>{`
          .gamma-blog-content {
            --primary: ${theme.colors?.primary || '#4F86F9'};
            --secondary: ${theme.colors?.secondary || '#00D4FF'};
            --success: ${theme.colors?.success || '#00FF88'};
          }
        `}</style>
      )}

      {/* Render all sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {layoutArray.map((section, index) => renderComponent(section, index))}
      </div>
    </div>
  );
}

