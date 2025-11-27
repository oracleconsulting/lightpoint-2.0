'use client';

/**
 * Intelligent Layout Weaver
 * Smartly interweaves visual elements (stats, charts, callouts) within the written content
 * Analyzes content to find optimal insertion points for visual enhancements
 */

import React from 'react';
import DynamicGammaRenderer from './DynamicGammaRenderer';

interface LayoutSection {
  type: string;
  content: any;
  style?: any;
}

interface ContentBlock {
  type: 'text' | 'visual';
  content: any;
  id: string;
}

interface IntelligentLayoutWeaverProps {
  textContent: any; // TipTap JSON or HTML string
  visualLayout: {
    layout: LayoutSection[];
    theme?: any;
  };
  manualPlacements?: {
    [visualIndex: number]: number; // Map visual index to text paragraph index
  };
}

export function IntelligentLayoutWeaver({
  textContent,
  visualLayout,
  manualPlacements = {},
}: IntelligentLayoutWeaverProps) {
  // Parse text content into paragraphs
  const parseParagraphs = (content: any): string[] => {
    if (!content) return [];

    // If it's TipTap JSON
    if (typeof content === 'object' && content.type === 'doc') {
      const paragraphs: string[] = [];
      
      const extractParagraphs = (node: any) => {
        if (!node) return;

        if (node.type === 'paragraph' && node.content) {
          const text = node.content
            .map((n: any) => n.text || '')
            .join('')
            .trim();
          if (text) paragraphs.push(text);
        }

        if (node.content && Array.isArray(node.content)) {
          node.content.forEach(extractParagraphs);
        }
      };

      extractParagraphs(content);
      return paragraphs;
    }

    // If it's HTML string
    if (typeof content === 'string') {
      const div = document.createElement('div');
      div.innerHTML = content;
      const pElements = div.querySelectorAll('p');
      return Array.from(pElements)
        .map(p => p.textContent?.trim() || '')
        .filter(Boolean);
    }

    return [];
  };

  // Intelligently place visual elements
  const interweavenContent = (): ContentBlock[] => {
    const paragraphs = parseParagraphs(textContent);
    const visuals = visualLayout.layout || [];
    const blocks: ContentBlock[] = [];

    if (paragraphs.length === 0) {
      // No text content, just return visuals
      visuals.forEach((visual, i) => {
        blocks.push({
          type: 'visual',
          content: visual,
          id: `visual-${i}`,
        });
      });
      return blocks;
    }

    // Categorize visuals by type
    const categorizedVisuals = {
      hero: [] as number[],
      stats: [] as number[],
      charts: [] as number[],
      callouts: [] as number[],
      timelines: [] as number[],
      steps: [] as number[],
      other: [] as number[],
    };

    visuals.forEach((visual, i) => {
      if (visual.type === 'hero') categorizedVisuals.hero.push(i);
      else if (visual.type === 'stats_grid') categorizedVisuals.stats.push(i);
      else if (visual.type === 'chart') categorizedVisuals.charts.push(i);
      else if (visual.type === 'callout') categorizedVisuals.callouts.push(i);
      else if (visual.type === 'timeline') categorizedVisuals.timelines.push(i);
      else if (visual.type === 'numbered_steps') categorizedVisuals.steps.push(i);
      else categorizedVisuals.other.push(i);
    });

    // Smart placement strategy:
    // 1. Hero at top
    // 2. Stats after first paragraph (intro)
    // 3. Charts after 2-3 paragraphs
    // 4. Callouts scattered throughout
    // 5. Timeline/Steps after relevant content
    // 6. Other elements fill remaining gaps

    let visualIndex = 0;
    const usedVisuals = new Set<number>();

    // Apply manual placements first
    const manualInsertions = new Map<number, number[]>(); // paragraph index -> visual indices
    Object.entries(manualPlacements).forEach(([vIdx, pIdx]) => {
      const visualIdx = parseInt(vIdx);
      const paragraphIdx = parseInt(pIdx.toString());
      if (!manualInsertions.has(paragraphIdx)) {
        manualInsertions.set(paragraphIdx, []);
      }
      manualInsertions.get(paragraphIdx)!.push(visualIdx);
      usedVisuals.add(visualIdx);
    });

    // 1. Hero at very top (before any text)
    categorizedVisuals.hero.forEach(i => {
      if (!usedVisuals.has(i)) {
        blocks.push({
          type: 'visual',
          content: visuals[i],
          id: `visual-${i}`,
        });
        usedVisuals.add(i);
      }
    });

    // Now interweave paragraphs and auto-placed visuals
    paragraphs.forEach((paragraph, pIdx) => {
      // Add paragraph
      blocks.push({
        type: 'text',
        content: paragraph,
        id: `text-${pIdx}`,
      });

      // Check for manual placements after this paragraph
      if (manualInsertions.has(pIdx)) {
        manualInsertions.get(pIdx)!.forEach(vIdx => {
          blocks.push({
            type: 'visual',
            content: visuals[vIdx],
            id: `visual-${vIdx}`,
          });
        });
      }

      // Auto-placement logic (only for unused visuals)
      // After first paragraph: Stats
      if (pIdx === 0 && categorizedVisuals.stats.length > 0) {
        const statsIdx = categorizedVisuals.stats.find(i => !usedVisuals.has(i));
        if (statsIdx !== undefined) {
          blocks.push({
            type: 'visual',
            content: visuals[statsIdx],
            id: `visual-${statsIdx}`,
          });
          usedVisuals.add(statsIdx);
        }
      }

      // After 2-3 paragraphs: First chart
      if (pIdx === 2 && categorizedVisuals.charts.length > 0) {
        const chartIdx = categorizedVisuals.charts.find(i => !usedVisuals.has(i));
        if (chartIdx !== undefined) {
          blocks.push({
            type: 'visual',
            content: visuals[chartIdx],
            id: `visual-${chartIdx}`,
          });
          usedVisuals.add(chartIdx);
        }
      }

      // Scatter callouts every 3-4 paragraphs
      if (pIdx > 0 && pIdx % 3 === 0 && categorizedVisuals.callouts.length > 0) {
        const calloutIdx = categorizedVisuals.callouts.find(i => !usedVisuals.has(i));
        if (calloutIdx !== undefined) {
          blocks.push({
            type: 'visual',
            content: visuals[calloutIdx],
            id: `visual-${calloutIdx}`,
          });
          usedVisuals.add(calloutIdx);
        }
      }

      // Mid-content: Timeline or Steps
      const midPoint = Math.floor(paragraphs.length / 2);
      if (pIdx === midPoint) {
        const timelineIdx = categorizedVisuals.timelines.find(i => !usedVisuals.has(i));
        if (timelineIdx !== undefined) {
          blocks.push({
            type: 'visual',
            content: visuals[timelineIdx],
            id: `visual-${timelineIdx}`,
          });
          usedVisuals.add(timelineIdx);
        } else {
          const stepsIdx = categorizedVisuals.steps.find(i => !usedVisuals.has(i));
          if (stepsIdx !== undefined) {
            blocks.push({
              type: 'visual',
              content: visuals[stepsIdx],
              id: `visual-${stepsIdx}`,
            });
            usedVisuals.add(stepsIdx);
          }
        }
      }

      // Remaining charts scattered
      if (pIdx > 4 && pIdx % 5 === 0 && categorizedVisuals.charts.length > 0) {
        const chartIdx = categorizedVisuals.charts.find(i => !usedVisuals.has(i));
        if (chartIdx !== undefined) {
          blocks.push({
            type: 'visual',
            content: visuals[chartIdx],
            id: `visual-${chartIdx}`,
          });
          usedVisuals.add(chartIdx);
        }
      }
    });

    // Append any remaining unused visuals at the end
    visuals.forEach((visual, i) => {
      if (!usedVisuals.has(i)) {
        blocks.push({
          type: 'visual',
          content: visual,
          id: `visual-${i}`,
        });
      }
    });

    return blocks;
  };

  const blocks = interweavenContent();

  return (
    <div className="space-y-8">
      {blocks.map((block) => {
        if (block.type === 'visual') {
          return (
            <div key={block.id} className="my-12">
              <DynamicGammaRenderer
                layout={{ layout: [block.content], theme: visualLayout.theme }}
              />
            </div>
          );
        } else {
          return (
            <div
              key={block.id}
              className="prose prose-lg prose-blue max-w-none
                prose-headings:font-bold prose-headings:text-gray-900
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900 prose-strong:font-semibold"
            >
              <p>{block.content}</p>
            </div>
          );
        }
      })}
    </div>
  );
}

