'use client';

/**
 * Dynamic Layout Renderer
 * Converts AI-generated layout JSON into actual React components
 */

import React from 'react';
import {
  StatCard,
  StatsGrid,
  CalloutBox,
  TwoColumnLayout,
  NumberedSteps,
  ComparisonTable,
  Timeline,
  HighlightBox,
} from './TemplateBlocks';
import {
  BlogBarChart,
  BlogLineChart,
  BlogPieChart,
  HorizontalBarChart,
  MultiSeriesBarChart,
} from './ChartComponents';

interface LayoutSection {
  type: string;
  content: any;
  style?: any;
}

interface DynamicLayoutProps {
  layout: LayoutSection[];
  theme?: {
    primary_color?: string;
    style?: string;
  };
}

export function DynamicLayoutRenderer({ layout, theme }: DynamicLayoutProps) {
  if (!layout || layout.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No layout data available
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {layout.map((section, index) => (
        <SectionRenderer key={index} section={section} theme={theme} />
      ))}
    </div>
  );
}

function SectionRenderer({ section, theme }: { section: LayoutSection; theme?: any }) {
  const { type, content, style } = section;

  switch (type) {
    case 'hero':
      return (
        <div className={`bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl p-12 ${
          style?.height === 'large' ? 'min-h-[500px]' : style?.height === 'medium' ? 'min-h-[350px]' : 'min-h-[250px]'
        }`}>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl font-extrabold mb-6">{content.title}</h1>
            {content.subtitle && (
              <p className="text-2xl text-blue-100">{content.subtitle}</p>
            )}
          </div>
        </div>
      );

    case 'stats_grid':
      return <StatsGrid stats={content.stats} columns={style?.columns || 4} />;

    case 'text':
      return (
        <div
          className={`prose prose-lg max-w-none ${
            style?.columns === 2 ? 'md:columns-2' : ''
          }`}
          dangerouslySetInnerHTML={{ __html: content.html || content.text }}
        />
      );

    case 'chart':
      return renderChart(content);

    case 'callout':
      return (
        <CalloutBox type={content.type || 'info'} title={content.title}>
          <div dangerouslySetInnerHTML={{ __html: content.text || content.html }} />
        </CalloutBox>
      );

    case 'timeline':
      return <Timeline events={content.events} />;

    case 'numbered_steps':
      return <NumberedSteps steps={content.steps} columns={style?.columns || 2} />;

    case 'comparison_table':
      return <ComparisonTable title={content.title} items={content.items} />;

    case 'two_column':
      return (
        <TwoColumnLayout
          left={<div dangerouslySetInnerHTML={{ __html: content.left }} />}
          right={<div dangerouslySetInnerHTML={{ __html: content.right }} />}
          leftWidth={style?.leftWidth || 60}
        />
      );

    case 'highlight_box':
      return (
        <HighlightBox
          value={content.value}
          label={content.label}
          description={content.description}
          color={content.color || 'blue'}
          size={style?.size || 'md'}
        />
      );

    case 'table':
      return (
        <div className="overflow-x-auto my-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                {content.headers?.map((header: string, i: number) => (
                  <th key={i} className="border border-gray-300 p-3 text-left font-bold">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {content.rows?.map((row: any[], i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  {row.map((cell, j) => (
                    <td key={j} className="border border-gray-300 p-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    default:
      console.warn(`Unknown section type: ${type}`);
      return (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
          <p className="text-amber-900">
            Unknown section type: <strong>{type}</strong>
          </p>
        </div>
      );
  }
}

function renderChart(content: any) {
  const { type, title, description, data } = content;

  switch (type) {
    case 'bar':
      return (
        <BlogBarChart
          data={data}
          title={title}
          description={description}
          color={content.color || '#3b82f6'}
        />
      );

    case 'line':
      return (
        <BlogLineChart
          data={data}
          title={title}
          description={description}
          lines={content.lines || [{ key: 'value', color: '#3b82f6', name: 'Value' }]}
        />
      );

    case 'pie':
    case 'donut':
      return (
        <BlogPieChart
          data={data}
          title={title}
          description={description}
          isDonut={type === 'donut'}
        />
      );

    case 'horizontal-bar':
      return (
        <HorizontalBarChart
          data={data}
          title={title}
          description={description}
          color={content.color || '#3b82f6'}
        />
      );

    case 'multi-series':
      return (
        <MultiSeriesBarChart
          data={data}
          title={title}
          description={description}
          series={content.series || []}
        />
      );

    default:
      return (
        <BlogBarChart
          data={data}
          title={title}
          description={description}
        />
      );
  }
}

