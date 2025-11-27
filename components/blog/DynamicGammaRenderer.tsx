'use client';

import React from 'react';
// Import all Gamma components
import HeroGradient from '@/components/blog/gamma/HeroGradient';
import StatCard from '@/components/blog/gamma/StatCard';
import TextSection from '@/components/blog/gamma/TextSection';
import ProcessFlow from '@/components/blog/gamma/ProcessFlow';
import Timeline from '@/components/blog/gamma/Timeline';
import ComparisonChart from '@/components/blog/gamma/ComparisonChart';
import CalloutBox from '@/components/blog/gamma/CalloutBox';
import ChecklistCard from '@/components/blog/gamma/ChecklistCard';
import SectionDivider from '@/components/blog/gamma/SectionDivider';
// V5 New components
import HorizontalStatRow from '@/components/blog/gamma/HorizontalStatRow';
import DonutChart from '@/components/blog/gamma/DonutChart';
import TableTimeline from '@/components/blog/gamma/TableTimeline';
// V5.1 Additional components
import NumberedProcessFlow from '@/components/blog/gamma/NumberedProcessFlow';
import ThreeColumnCards from '@/components/blog/gamma/ThreeColumnCards';
import QuoteCallout from '@/components/blog/gamma/QuoteCallout';
import ChevronFlow from '@/components/blog/gamma/ChevronFlow';
// V6 Gamma-parity components
import {
  GridChecklist,
  ThreeColumnCardsV6,
  QuoteCalloutV6,
  NumberedProcessFlowV6,
  ChevronFlowV6,
  TeaserCallout,
  HorizontalBarChart,
  ContentImage,
  BulletList,
  NumberedList,
} from '@/components/blog/gamma/GammaComponentsV6';
// Theme system
import { getTheme, defaultTheme, type ThemeConfig } from '@/lib/blog/themes';

// ============================================
// TYPES
// ============================================

interface LayoutItem {
  type: string;
  props?: Record<string, any>;
  content?: string;
  sourceText?: string;
}

interface GammaTheme {
  name?: string;
  mode?: 'dark' | 'medium' | 'light';
  colors?: {
    background?: string;
    backgroundGradient?: string;
    primary?: string;
  };
}

interface GammaLayout {
  theme?: GammaTheme;
  layout: LayoutItem[];
}

interface DynamicGammaRendererProps {
  readonly layout: LayoutItem[] | GammaLayout;
  readonly themeName?: string;
  readonly enablePostProcessing?: boolean;
}

// ============================================
// POST-PROCESSOR: Auto-group adjacent stats
// ============================================

function postProcessLayout(layout: LayoutItem[]): LayoutItem[] {
  const result: LayoutItem[] = [];
  let statBuffer: any[] = [];
  
  const flushStatBuffer = () => {
    if (statBuffer.length >= 2) {
      // Convert to HorizontalStatRow (V5 preferred)
      result.push({
        type: 'HorizontalStatRow',
        props: {
          stats: statBuffer.map(s => ({
            metric: s.metric,
            label: s.label,
            sublabel: s.context,
            prefix: s.prefix,
            suffix: s.suffix,
            color: s.color || 'blue',
          }))
        },
        sourceText: statBuffer.map((s: any) => s?.sourceText || '').join(' ')
      });
    } else if (statBuffer.length === 1) {
      // Single stat remains as StatCard
      result.push({
        type: 'StatCard',
        props: { ...statBuffer[0], standalone: true },
        sourceText: statBuffer[0]?.sourceText
      });
    }
    statBuffer = [];
  };
  
  for (const item of layout) {
    if (item.type === 'StatCard') {
      statBuffer.push(item.props);
    } else if (item.type === 'StatCardGroup' || item.type === 'HorizontalStatRow' || item.type === 'DonutChart') {
      // Convert StatCardGroup to HorizontalStatRow or pass through V5 components
      flushStatBuffer();
      if (item.type === 'StatCardGroup') {
        result.push({
          type: 'HorizontalStatRow',
          props: {
            stats: (item.props?.stats || []).map((s: any) => ({
              metric: s.metric,
              label: s.label,
              sublabel: s.context,
              prefix: s.prefix,
              suffix: s.suffix,
              color: s.color || 'blue',
            })),
            title: item.props?.title
          },
          sourceText: item.sourceText
        });
      } else {
        result.push(item);
      }
    } else if (item.type === 'Timeline' && item.props?.events?.length > 0) {
      // Convert Timeline to TableTimeline for cleaner look
      flushStatBuffer();
      const timelineProps = item.props;
      result.push({
        type: 'TableTimeline',
        props: {
          title: timelineProps?.title || 'Timeline',
          events: (timelineProps?.events || []).map((e: any) => ({
            date: e.date,
            title: e.title,
            description: e.description || e.title,
            type: e.type,
          }))
        },
        sourceText: item.sourceText
      });
    } else {
      // Non-stat item, flush buffer first
      flushStatBuffer();
      result.push(item);
    }
  }
  
  // Flush any remaining stats
  flushStatBuffer();
  
  return result;
}

// ============================================
// MAIN RENDERER
// ============================================

export default function DynamicGammaRenderer({ 
  layout, 
  themeName,
  enablePostProcessing = true 
}: DynamicGammaRendererProps) {
  // Early return if no layout
  if (!layout) {
    console.warn('DynamicGammaRenderer: No layout provided');
    return null;
  }

  // Handle both direct array and wrapped object
  const layoutArray = Array.isArray(layout) ? layout : (layout?.layout || []);
  const layoutTheme = Array.isArray(layout) ? null : layout?.theme;

  // V5: Get theme from props, layout, or default
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

  // V5: Post-process layout to convert stats to HorizontalStatRow
  const processedLayout = enablePostProcessing 
    ? postProcessLayout(layoutArray) 
    : layoutArray;

  // Apply theme background
  const backgroundStyle = layoutTheme?.colors?.backgroundGradient || 
    resolvedTheme.colors.pageBgGradient;

  // Component-specific width classes for optimal reading
  const getContainerClass = (type: string): string => {
    switch (type) {
      case 'HeroGradient':
      case 'hero':
        return 'w-full px-4 sm:px-6 lg:px-8'; // Full bleed for hero
      case 'HorizontalStatRow':
      case 'StatCardGroup':
        return 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8'; // Wide for stats
      case 'TableTimeline':
      case 'Timeline':
      case 'NumberedProcessFlowV6':
      case 'ProcessFlow':
      case 'GridChecklist':
      case 'ChevronFlow':
      case 'ChevronFlowV6':
      case 'ComparisonChart':
      case 'DonutChart':
      case 'HorizontalBarChart':
        return 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'; // Wide for visual elements
      case 'TextSection':
      case 'text':
        return 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'; // Optimal reading width (~896px)
      case 'QuoteCalloutV6':
      case 'QuoteCallout':
      case 'CalloutBox':
        return 'max-w-3xl mx-auto px-4 sm:px-6 lg:px-8'; // Narrower for emphasis
      case 'SectionHeading':
        return 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'; // Match text width
      default:
        return 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8'; // Default
    }
  };

  // Component-specific spacing for natural flow - MORE GENEROUS
  const getSpacingClass = (type: string, index: number): string => {
    switch (type) {
      case 'HeroGradient':
      case 'hero':
        return 'mb-12 md:mb-16'; // Big gap after hero
      case 'SectionHeading':
        return 'mt-12 md:mt-16 mb-4 md:mb-6'; // Space before new sections
      case 'HorizontalStatRow':
      case 'StatCardGroup':
        return 'my-10 md:my-14'; // Medium gap around stats
      case 'TextSection':
      case 'text':
        return index === 0 ? 'mb-6 md:mb-8' : 'my-4 md:my-6'; // Tighter for text flow
      case 'QuoteCalloutV6':
      case 'QuoteCallout':
        return 'my-8 md:my-12'; // Pull quotes get breathing room
      case 'TableTimeline':
      case 'Timeline':
      case 'NumberedProcessFlowV6':
      case 'ProcessFlow':
      case 'GridChecklist':
        return 'my-10 md:my-14'; // Special components get space
      default:
        return 'my-6 md:my-8';
    }
  };

  return (
    <div 
      className="gamma-blog-container w-full min-h-screen"
      style={{
        background: backgroundStyle,
        color: '#FFFFFF'
      }}
    >
      {/* Unified container - components control their own widths */}
      <div className="py-8">
        {processedLayout.map((item, index) => (
          <div 
            key={`${item.type}-${index}`}
            className={`${getContainerClass(item.type)} ${getSpacingClass(item.type, index)}`}
          >
            <ComponentRenderer 
              item={item}
              index={index}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMPONENT ROUTER
// ============================================

interface ComponentRendererProps {
  readonly item: LayoutItem;
  readonly index: number;
}

function ComponentRenderer({ item, index }: ComponentRendererProps) {
  const { type, props, content } = item;

  try {
    switch (type) {
      // ========== V5 NEW COMPONENTS ==========
      
      case 'HorizontalStatRow':
        // Normalize stats - AI might send different formats
        const horizontalStats = (props?.stats || []).map((s: any) => ({
          metric: s.metric || s.value || s.number || '0',
          label: s.label || s.title || s.name || '',
          sublabel: s.sublabel || s.context || s.description || '',
          prefix: s.prefix || '',
          suffix: s.suffix || '',
          color: s.color || 'blue'
        }));
        
        if (process.env.NODE_ENV === 'development') {
          console.log('HorizontalStatRow stats:', horizontalStats);
        }
        
        return (
          <HorizontalStatRow 
            stats={horizontalStats} 
            title={props?.title}
          />
        );
      
      case 'DonutChart':
        return (
          <DonutChart 
            title={props?.title}
            data={props?.data || []}
            centerValue={props?.centerValue}
            centerLabel={props?.centerLabel}
            showLegend={props?.showLegend}
            showTooltip={props?.showTooltip}
            size={props?.size}
          />
        );
      
      case 'TableTimeline':
        return (
          <TableTimeline 
            title={props?.title || 'Timeline'}
            events={props?.events || []}
            compact={props?.compact}
          />
        );

      case 'NumberedProcessFlow':
        return (
          <NumberedProcessFlow 
            title={props?.title}
            steps={(props?.steps || []).map((s: any, idx: number) => ({
              number: s.number || s.step || idx + 1,
              title: s.title || s.name || '',
              description: s.description || s.text || ''
            }))}
            accent={props?.accent}
          />
        );

      case 'ThreeColumnCards':
      case 'ColumnCards':
        return (
          <ThreeColumnCards 
            title={props?.title}
            cards={(props?.cards || props?.items || []).map((c: any) => ({
              title: c.title || c.name || '',
              description: c.description || c.text || c.content || '',
              icon: c.icon,
              accent: c.accent || c.color
            }))}
            style={props?.style}
          />
        );

      case 'QuoteCallout':
      case 'Quote':
        return (
          <QuoteCallout 
            text={props?.text || props?.quote || props?.content || ''}
            attribution={props?.attribution || props?.author}
            source={props?.source}
            accent={props?.accent}
          />
        );

      case 'ChevronFlow':
        return (
          <ChevronFlow 
            title={props?.title}
            steps={(props?.steps || []).map((s: any) => ({
              title: s.title || s.name || s.label || '',
              icon: s.icon
            }))}
            accent={props?.accent}
          />
        );

      // ========== V6 GAMMA-PARITY COMPONENTS ==========
      
      case 'GridChecklist':
        return (
          <GridChecklist 
            title={props?.title || 'Checklist'}
            items={(props?.items || []).map((item: any, idx: number) => ({
              number: item.number || idx + 1,
              title: item.title || '',
              description: item.description || ''
            }))}
          />
        );

      case 'ThreeColumnCardsV6':
        return (
          <ThreeColumnCardsV6 
            title={props?.title}
            cards={(props?.cards || []).map((c: any) => ({
              title: c.title || '',
              description: c.description || '',
              accent: c.accent || 'cyan'
            }))}
          />
        );

      case 'QuoteCalloutV6':
        return (
          <QuoteCalloutV6 
            text={props?.text || ''}
            attribution={props?.attribution}
            accent={props?.accent || 'cyan'}
          />
        );

      case 'NumberedProcessFlowV6':
        return (
          <NumberedProcessFlowV6 
            title={props?.title}
            steps={(props?.steps || []).map((s: any, idx: number) => ({
              number: s.number || String(idx + 1).padStart(2, '0'),
              title: s.title || '',
              description: s.description || ''
            }))}
          />
        );

      case 'ChevronFlowV6':
        return (
          <ChevronFlowV6 
            steps={(props?.steps || []).map((s: any) => ({
              icon: s.icon || 'document',
              title: s.title || '',
              description: s.description
            }))}
          />
        );

      case 'TeaserCallout':
        return (
          <TeaserCallout 
            label={props?.label || 'Coming Soon'}
            title={props?.title || ''}
            description={props?.description || ''}
          />
        );

      case 'HorizontalBarChart':
        return (
          <HorizontalBarChart 
            title={props?.title}
            data={(props?.data || []).map((d: any) => ({
              label: d.label || '',
              value: d.value || 0,
              color: d.color
            }))}
            showValues={props?.showValues}
            suffix={props?.suffix}
          />
        );

      case 'ContentImage':
        return (
          <ContentImage 
            src={props?.src || ''}
            alt={props?.alt || ''}
            caption={props?.caption}
            position={props?.position}
            aspectRatio={props?.aspectRatio}
          />
        );

      case 'BulletList':
        return (
          <BulletList 
            title={props?.title}
            items={props?.items || []}
            icon={props?.icon}
            accent={props?.accent}
          />
        );

      case 'NumberedList':
        return (
          <NumberedList 
            title={props?.title}
            items={props?.items || []}
            accent={props?.accent}
          />
        );

      case 'SectionHeading':
        return (
          <h2 className="
            text-2xl sm:text-3xl md:text-4xl lg:text-[2.5rem]
            font-bold text-white 
            leading-tight tracking-tight
            w-full
          ">
            {props?.text || ''}
          </h2>
        );

      // ========== EXISTING COMPONENTS ==========
      
      case 'HeroGradient':
      case 'hero':
        return (
          <HeroGradient 
            headline={props?.headline || ''} 
            subheadline={props?.subheadline || ''}
            ctaText={props?.ctaText}
            onCtaClick={props?.onCtaClick}
          />
        );

      case 'TextSection':
      case 'text':
        return (
          <TextSection 
            content={props?.content || content || ''} 
          />
        );

      case 'StatCard':
        // V5: Standalone stat - narrower width
        return (
          <div className="max-w-xl mx-auto px-4 my-6">
            <StatCard 
              metric={props?.metric || '0'} 
              label={props?.label || ''}
              context={props?.context}
              color={props?.color}
              prefix={props?.prefix}
              suffix={props?.suffix}
              icon={props?.icon}
              compact={props?.compact}
              animationDelay={index * 0.05} 
            />
          </div>
        );

      case 'StatCardGroup':
        // V5: Convert to HorizontalStatRow for consistency
        return (
          <HorizontalStatRow 
            stats={(props?.stats || []).map((s: any) => ({
              metric: s.metric,
              label: s.label,
              sublabel: s.context,
              prefix: s.prefix,
              suffix: s.suffix,
              color: s.color || 'blue',
            }))}
            title={props?.title}
          />
        );

      case 'grid':
        return (
          <div className="max-w-4xl mx-auto grid grid-cols-1 gap-4 my-8 px-4">
            {props?.components?.map((comp: LayoutItem, i: number) => {
              const gridKey = `grid-${comp.type}-${i}`;
              return <ComponentRenderer key={gridKey} item={comp} index={i} />;
            })}
          </div>
        );

      case 'ProcessFlow':
      case 'process':
        return (
          <div className="max-w-4xl mx-auto my-8 px-4">
            <ProcessFlow 
              title={props?.title || 'Process'} 
              steps={props?.steps || []}
            />
          </div>
        );

      case 'Timeline':
      case 'timeline':
        // V5: Prefer TableTimeline for cleaner look
        if (props?.events && props.events.length > 0) {
          return (
            <TableTimeline 
              title={props.title || 'Timeline'}
              events={props.events.map((e: any) => ({
                date: e.date,
                title: e.title,
                description: e.description || e.title,
                type: e.type,
              }))}
            />
          );
        }
        return (
          <div className="max-w-4xl mx-auto my-8 px-4">
            <Timeline 
              title={props?.title || 'Timeline'} 
              events={props?.events || []}
            />
          </div>
        );

      case 'ComparisonChart':
      case 'chart':
        return (
          <div className="max-w-4xl mx-auto my-8 px-4">
            <ComparisonChart 
              title={props?.title || 'Chart'} 
              data={props?.data || []}
              chartType={props?.type || props?.chartType}
              showPercentages={props?.showValues || props?.showPercentages}
            />
          </div>
        );

      case 'CalloutBox':
      case 'callout':
        return (
          <div className="max-w-4xl mx-auto my-6 px-4">
            <CalloutBox 
              title={props?.title || ''} 
              content={props?.content || props?.text || ''}
              variant={props?.variant}
              icon={props?.icon}
            />
          </div>
        );

      case 'ChecklistCard':
      case 'checklist':
        // Normalize items - AI might send different formats
        const checklistItems = (props?.items || []).map((item: any, idx: number) => {
          // Handle string items (V6 format from database)
          if (typeof item === 'string') {
            return {
              number: idx + 1,
              title: item,
              description: ''
            };
          }
          // Handle object items
          return {
            number: item.number || item.step || idx + 1,
            title: item.title || item.name || item.heading || `Step ${idx + 1}`,
            description: item.description || item.text || item.content || ''
          };
        });
        
        console.log('📋 ChecklistCard items:', checklistItems); // DEBUG LINE
        
        return (
          <div className="max-w-4xl mx-auto my-8 px-4">
            <ChecklistCard 
              title={props?.title || 'Checklist'} 
              items={checklistItems}
            />
          </div>
        );

      case 'SectionDivider':
      case 'divider':
        return <SectionDivider />;

      default:
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Unknown component type: ${type}`);
        }
        return null;
    }
  } catch (error) {
    console.error(`Error rendering component ${type}:`, error);
    return null;
  }
}

// Export types and utilities
export { postProcessLayout };
export type { GammaLayout, LayoutItem };
