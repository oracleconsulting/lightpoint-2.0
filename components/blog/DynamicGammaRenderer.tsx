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
  // Early return if no layout
  if (!layout) {
    console.warn('DynamicGammaRenderer: No layout provided');
    return null;
  }

  // Handle both direct array and wrapped object
  const layoutArray = Array.isArray(layout) ? layout : (layout?.layout || []);
  const theme = Array.isArray(layout) ? null : layout?.theme;

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
    
    // DEBUG: Log the actual type value and props
    console.log(`🔍 Rendering component at index ${index}:`, {
      rawType: section.type,
      rawLayoutType: section.layoutType,
      finalType: type,
      props: props // Show full props to debug color issues
    });

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
              className="prose prose-xl prose-invert max-w-4xl mx-auto my-6
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
          return <StatCard key={index} {...props} animationDelay={index * 0.05} />;

        case 'grid':
          // Grid layout - constrained to content width
          return (
            <div key={index} className={`max-w-4xl mx-auto grid grid-cols-1 gap-4 my-8`}>
              {section.components?.map((comp, i) => renderComponent(comp, i))}
            </div>
          );

        case 'ProcessFlow':
        case 'process':
          return (
            <div key={index} className="max-w-4xl mx-auto my-8">
              <ProcessFlow {...props} />
            </div>
          );

        case 'Timeline':
        case 'timeline':
          return (
            <div key={index} className="max-w-4xl mx-auto my-8">
              <Timeline {...props} />
            </div>
          );

        case 'ComparisonChart':
        case 'chart':
          return (
            <div key={index} className="max-w-4xl mx-auto my-8">
              <ComparisonChart {...props} />
            </div>
          );

        case 'CalloutBox':
        case 'callout':
          return (
            <div key={index} className="max-w-4xl mx-auto my-6">
              <CalloutBox {...props} />
            </div>
          );

        case 'ChecklistCard':
        case 'checklist':
          return (
            <div key={index} className="max-w-4xl mx-auto my-8">
              <ChecklistCard {...props} />
            </div>
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
          // Unknown component - show warning in dev only
          if (process.env.NODE_ENV === 'development') {
            console.warn(`Unknown component type: ${type}`, section);
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
            <p className="text-sm text-gray-400 mt-2">{String(error)}</p>
          </div>
        );
      }
      return null;
    }
  };

  return (
    <div className="w-full">
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

      {/* Render all sections - no extra wrapper padding */}
      {layoutArray.map((section, index) => renderComponent(section, index))}
    </div>
  );
}

