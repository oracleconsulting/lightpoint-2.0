/**
 * Section Detector - Pattern-based content analysis
 * Detects content patterns and maps them to appropriate V2 components
 * No AI required - deterministic and fast
 */

import type { ComponentType, LayoutComponent } from '../types';

// ============================================================================
// PATTERN DEFINITIONS
// ============================================================================

const PATTERNS = {
  // Stats: **92%**, £1,200, 15 days, 35,000 cases
  stat: /\*\*(\d+(?:,\d{3})*(?:\.\d+)?%?)\*\*|£(\d+(?:,\d{3})*(?:\.\d+)?)|(\d+(?:,\d{3})*)\s*(days?|weeks?|months?|years?|cases?|complaints?|hours?|minutes?)/gi,
  
  // Numbered steps: 1. Step one, Step 1:, First,
  numberedStep: /^(?:\d+\.|Step\s+\d+:|(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth),?)\s+(.+)/gim,
  
  // Timeline dates: 12 May 2024, Day 1, Week 3
  timelineDate: /(?:Day\s+\d+|Week\s+\d+|\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi,
  
  // Callouts: Pro Tip:, Note:, Warning:, 💡
  callout: /^(?:💡|⚠️|✅|❌|📌|🔑)?\s*(?:Pro Tip|Note|Warning|Important|Key Point|Remember|Tip):\s*(.+)/gim,
  
  // Quotes: "quoted text" or > blockquote
  quote: /^>\s*(.+)|"([^"]{30,})"/gm,
  
  // Comparison: Old Way vs New Way, Before/After
  comparison: /(?:old way|new way|before|after|instead of|rather than|traditional|modern)/gi,
  
  // Headers: ## Header or **Bold Header**
  header: /^#{1,3}\s+(.+)|^\*\*([^*]+)\*\*$/gm,
  
  // Bullet lists
  bulletList: /^[-•*]\s+(.+)/gm,
  
  // Percentages for donut charts
  percentage: /(\d+(?:\.\d+)?)\s*%/g,
};

// ============================================================================
// SECTION DETECTOR CLASS
// ============================================================================

export interface DetectedSection {
  type: ComponentType;
  content: string;
  data?: any;
  confidence: number; // 0-1 score
  startIndex: number;
  endIndex: number;
}

export class SectionDetector {
  private content: string;
  private sections: DetectedSection[] = [];

  constructor(content: string) {
    this.content = this.normalizeContent(content);
  }

  /**
   * Normalize content - strip HTML, normalize whitespace
   */
  private normalizeContent(content: string): string {
    if (!content) return '';
    
    // If TipTap JSON, extract text
    if (typeof content === 'object') {
      return this.extractTextFromTipTap(content);
    }
    
    // Strip HTML tags
    let text = content.replace(/<[^>]*>/g, '\n');
    
    // Normalize whitespace but preserve paragraph breaks
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]+/g, ' ');
    
    return text.trim();
  }

  private extractTextFromTipTap(node: any): string {
    if (!node) return '';
    if (node.type === 'text') return node.text || '';
    if (node.content && Array.isArray(node.content)) {
      return node.content.map((n: any) => this.extractTextFromTipTap(n)).join('\n');
    }
    return '';
  }

  /**
   * Run all detectors and return sections
   */
  detect(): DetectedSection[] {
    this.sections = [];
    
    // Split into paragraphs
    const paragraphs = this.content.split(/\n\n+/).filter(p => p.trim());
    
    let currentIndex = 0;
    
    for (const paragraph of paragraphs) {
      const trimmed = paragraph.trim();
      if (!trimmed) continue;
      
      const section = this.detectParagraphType(trimmed, currentIndex);
      if (section) {
        this.sections.push(section);
      }
      
      currentIndex += paragraph.length + 2; // +2 for \n\n
    }
    
    // Post-process: merge adjacent stats, group numbered steps
    this.postProcess();
    
    return this.sections;
  }

  /**
   * Detect the type of a single paragraph
   */
  private detectParagraphType(text: string, startIndex: number): DetectedSection | null {
    const endIndex = startIndex + text.length;
    
    // Check for callout first (highest priority)
    if (PATTERNS.callout.test(text)) {
      PATTERNS.callout.lastIndex = 0;
      const match = PATTERNS.callout.exec(text);
      return {
        type: 'callout',
        content: text,
        data: { text: match?.[1] || text, variant: this.detectCalloutVariant(text) },
        confidence: 0.9,
        startIndex,
        endIndex,
      };
    }
    
    // Check for quote
    if (text.startsWith('>') || (text.startsWith('"') && text.endsWith('"') && text.length > 50)) {
      return {
        type: 'quote',
        content: text,
        data: { text: text.replace(/^>\s*|^"|"$/g, '') },
        confidence: 0.85,
        startIndex,
        endIndex,
      };
    }
    
    // Check for numbered step
    if (/^(?:\d+\.|Step\s+\d+:)/i.test(text)) {
      return {
        type: 'numberedSteps',
        content: text,
        data: this.parseNumberedStep(text),
        confidence: 0.8,
        startIndex,
        endIndex,
      };
    }
    
    // Check for header (section heading)
    if (/^#{1,3}\s+/.test(text) || (text.startsWith('**') && text.endsWith('**') && text.length < 100)) {
      return {
        type: 'sectionHeading',
        content: text,
        data: { title: text.replace(/^#{1,3}\s+|\*\*/g, '') },
        confidence: 0.9,
        startIndex,
        endIndex,
      };
    }
    
    // Check for bullet list
    if (/^[-•*]\s+/.test(text)) {
      return {
        type: 'bulletList',
        content: text,
        data: { items: text.split('\n').map(line => line.replace(/^[-•*]\s+/, '').trim()) },
        confidence: 0.85,
        startIndex,
        endIndex,
      };
    }
    
    // Check for stats-heavy paragraph (3+ stats)
    const statMatches = text.match(PATTERNS.stat);
    if (statMatches && statMatches.length >= 3) {
      return {
        type: 'stats',
        content: text,
        data: { stats: this.extractStats(text) },
        confidence: 0.75,
        startIndex,
        endIndex,
      };
    }
    
    // Check for timeline content
    const dateMatches = text.match(PATTERNS.timelineDate);
    if (dateMatches && dateMatches.length >= 2) {
      return {
        type: 'timeline',
        content: text,
        data: { events: this.extractTimelineEvents(text) },
        confidence: 0.7,
        startIndex,
        endIndex,
      };
    }
    
    // Check for comparison content
    if (PATTERNS.comparison.test(text) && text.length > 100) {
      return {
        type: 'comparisonCards',
        content: text,
        data: this.extractComparison(text),
        confidence: 0.6,
        startIndex,
        endIndex,
      };
    }
    
    // Default: paragraph
    return {
      type: 'paragraph',
      content: text,
      data: { text },
      confidence: 0.5,
      startIndex,
      endIndex,
    };
  }

  /**
   * Post-process sections to merge and group
   */
  private postProcess(): void {
    // Group consecutive numbered steps
    const grouped: DetectedSection[] = [];
    let currentSteps: DetectedSection[] = [];
    
    for (const section of this.sections) {
      if (section.type === 'numberedSteps') {
        currentSteps.push(section);
      } else {
        if (currentSteps.length > 0) {
          grouped.push(this.mergeNumberedSteps(currentSteps));
          currentSteps = [];
        }
        grouped.push(section);
      }
    }
    
    if (currentSteps.length > 0) {
      grouped.push(this.mergeNumberedSteps(currentSteps));
    }
    
    // Merge consecutive stats
    const finalSections: DetectedSection[] = [];
    let currentStats: DetectedSection[] = [];
    
    for (const section of grouped) {
      if (section.type === 'stats') {
        currentStats.push(section);
      } else {
        if (currentStats.length > 0) {
          finalSections.push(this.mergeStats(currentStats));
          currentStats = [];
        }
        finalSections.push(section);
      }
    }
    
    if (currentStats.length > 0) {
      finalSections.push(this.mergeStats(currentStats));
    }
    
    this.sections = finalSections;
  }

  // ============================================================================
  // EXTRACTION HELPERS
  // ============================================================================

  private detectCalloutVariant(text: string): 'blue' | 'border' | 'gold' {
    const lower = text.toLowerCase();
    if (lower.includes('warning') || lower.includes('⚠️')) return 'gold';
    if (lower.includes('important') || lower.includes('key')) return 'border';
    return 'blue';
  }

  private parseNumberedStep(text: string): { number: number; title: string; description: string } {
    const match = text.match(/^(\d+)\.|Step\s+(\d+):/i);
    const number = parseInt(match?.[1] || match?.[2] || '1', 10);
    const content = text.replace(/^(?:\d+\.|Step\s+\d+:)\s*/i, '');
    const parts = content.split(/[:\-–—]\s*/);
    
    return {
      number,
      title: parts[0]?.trim() || '',
      description: parts.slice(1).join(' ').trim() || content,
    };
  }

  private extractStats(text: string): Array<{ value: string; label: string; description?: string }> {
    const stats: Array<{ value: string; label: string; description?: string }> = [];
    
    // Extract percentages
    const percentages = [...text.matchAll(/(\d+(?:\.\d+)?)\s*%\s*(?:of\s+)?([^,.]+)/gi)];
    for (const match of percentages) {
      stats.push({
        value: `${match[1]}%`,
        label: this.cleanLabel(match[2]),
      });
    }
    
    // Extract money values
    const money = [...text.matchAll(/£(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:in\s+)?([^,.]+)?/gi)];
    for (const match of money) {
      stats.push({
        value: `£${match[1]}`,
        label: this.cleanLabel(match[2] || 'Value'),
      });
    }
    
    // Extract large numbers
    const numbers = [...text.matchAll(/(\d{1,3}(?:,\d{3})+|\d+(?:,\d{3})*)\s+(cases?|complaints?|people|calls?|days?)/gi)];
    for (const match of numbers) {
      stats.push({
        value: match[1],
        label: this.cleanLabel(match[2]),
      });
    }
    
    return stats.slice(0, 4); // Max 4 stats
  }

  private cleanLabel(text: string): string {
    if (!text) return 'Value';
    return text
      .replace(/^(the|a|an)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .slice(0, 3)
      .join(' ')
      .replace(/^./, c => c.toUpperCase());
  }

  private extractTimelineEvents(text: string): Array<{ date: string; title: string; description: string }> {
    const events: Array<{ date: string; title: string; description: string }> = [];
    const lines = text.split('\n');
    
    let currentEvent: { date: string; title: string; description: string } | null = null;
    
    for (const line of lines) {
      const dateMatch = line.match(/^(Day\s+\d+|Week\s+\d+|\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i);
      
      if (dateMatch) {
        if (currentEvent) events.push(currentEvent);
        const rest = line.substring(dateMatch[0].length).replace(/^[:\-–—]\s*/, '');
        currentEvent = {
          date: dateMatch[1],
          title: rest.split(/[:\-–—]/)[0]?.trim() || '',
          description: rest.split(/[:\-–—]/).slice(1).join(' ').trim() || '',
        };
      } else if (currentEvent) {
        currentEvent.description += ' ' + line.trim();
      }
    }
    
    if (currentEvent) events.push(currentEvent);
    
    return events;
  }

  private extractComparison(text: string): { leftCard: any; rightCard: any } {
    const lower = text.toLowerCase();
    
    // Simple split on "vs", "instead of", etc.
    let leftContent = '';
    let rightContent = '';
    
    if (lower.includes(' vs ')) {
      const parts = text.split(/\s+vs\s+/i);
      leftContent = parts[0] || '';
      rightContent = parts[1] || '';
    } else if (lower.includes('instead of')) {
      const parts = text.split(/instead of/i);
      rightContent = parts[0] || '';
      leftContent = parts[1] || '';
    } else {
      // Default split
      const mid = Math.floor(text.length / 2);
      leftContent = text.substring(0, mid);
      rightContent = text.substring(mid);
    }
    
    return {
      leftCard: {
        title: 'Traditional Approach',
        content: leftContent.trim(),
        variant: 'negative',
      },
      rightCard: {
        title: 'Better Approach',
        content: rightContent.trim(),
        variant: 'positive',
      },
    };
  }

  private mergeNumberedSteps(steps: DetectedSection[]): DetectedSection {
    return {
      type: 'numberedSteps',
      content: steps.map(s => s.content).join('\n'),
      data: {
        steps: steps.map(s => s.data),
        variant: steps.length > 4 ? 'grid' : 'vertical',
      },
      confidence: 0.85,
      startIndex: steps[0].startIndex,
      endIndex: steps[steps.length - 1].endIndex,
    };
  }

  private mergeStats(statSections: DetectedSection[]): DetectedSection {
    const allStats = statSections.flatMap(s => s.data?.stats || []);
    return {
      type: 'stats',
      content: statSections.map(s => s.content).join('\n'),
      data: {
        stats: allStats.slice(0, 4),
        variant: 'flat',
        columns: Math.min(allStats.length, 4),
      },
      confidence: 0.8,
      startIndex: statSections[0].startIndex,
      endIndex: statSections[statSections.length - 1].endIndex,
    };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export function detectSections(content: string): DetectedSection[] {
  const detector = new SectionDetector(content);
  return detector.detect();
}

