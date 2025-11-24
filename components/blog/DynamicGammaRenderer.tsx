'use client';

import HeroGradient from '@/components/blog/gamma/HeroGradient';
import StatCard from '@/components/blog/gamma/StatCard';
import ProcessFlow from '@/components/blog/gamma/ProcessFlow';
import Timeline from '@/components/blog/gamma/Timeline';
import ComparisonChart from '@/components/blog/gamma/ComparisonChart';
import CalloutBox from '@/components/blog/gamma/CalloutBox';
import ChecklistCard from '@/components/blog/gamma/ChecklistCard';

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
          return <HeroGradient key={index} {...props} />;

        case 'StatCard':
          return <StatCard key={index} {...props} animationDelay={index * 0.1} />;

        case 'grid':
          // Render grid of components (usually StatCards)
          return (
            <div key={index} className={`grid grid-cols-1 md:grid-cols-${section.columns || 3} gap-6 my-12`}>
              {section.components?.map((comp, i) => renderComponent(comp, i))}
            </div>
          );

        case 'ProcessFlow':
        case 'process':
          return <ProcessFlow key={index} {...props} />;

        case 'Timeline':
        case 'timeline':
          return <Timeline key={index} {...props} />;

        case 'ComparisonChart':
        case 'chart':
          return <ComparisonChart key={index} {...props} />;

        case 'CalloutBox':
        case 'callout':
          return <CalloutBox key={index} {...props} />;

        case 'ChecklistCard':
        case 'checklist':
          return <ChecklistCard key={index} {...props} />;

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
          // Unknown component - show warning in dev only
          if (process.env.NODE_ENV === 'development') {
            return (
              <div key={index} className="my-8 p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-yellow-400">
                  Unknown section type: <code className="font-mono">{type}</code>
                </p>
              </div>
            );
          }
          return null;
      }
    } catch (error) {
      console.error(`Error rendering component ${type}:`, error);
      // Silent failure in production
      if (process.env.NODE_ENV === 'development') {
        return (
          <div key={index} className="my-8 p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400">
              Error rendering: <code className="font-mono">{type}</code>
            </p>
          </div>
        );
      }
      return null;
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

