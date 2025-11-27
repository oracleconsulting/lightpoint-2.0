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

  return (
    <div 
      className="gamma-blog-container w-full min-h-screen py-8"
      style={{
        background: backgroundStyle,
        color: '#FFFFFF'
      }}
    >
      <div className="max-w-5xl mx-auto">
        {processedLayout.map((item, index) => (
          <ComponentRenderer 
            key={`${item.type}-${index}`} 
            item={item}
            index={index}
          />
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
        return (
          <HorizontalStatRow 
            stats={props?.stats || []} 
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
        return (
          <div className="max-w-4xl mx-auto my-8 px-4">
            <ChecklistCard 
              title={props?.title || 'Checklist'} 
              items={props?.items || []}
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
