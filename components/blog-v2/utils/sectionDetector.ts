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
    
    let text = content;
    
    // Convert block-level HTML tags to paragraph breaks
    text = text.replace(/<\/?(p|div|br|h[1-6]|li|tr|blockquote)[^>]*>/gi, '\n\n');
    
    // Strip remaining HTML tags
    text = text.replace(/<[^>]*>/g, ' ');
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    
    // Normalize whitespace but preserve paragraph breaks
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n /g, '\n');
    text = text.replace(/ \n/g, '\n');
    
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
    
    console.log('🔬 [SectionDetector] Normalized content length:', this.content.length);
    console.log('🔬 [SectionDetector] Content preview:', this.content.substring(0, 300));
    
    // Split into paragraphs - try multiple strategies
    let paragraphs = this.content.split(/\n\n+/).filter(p => p.trim());
    
    // If we only got 1-2 paragraphs, try splitting by sentences for long content
    if (paragraphs.length <= 2 && this.content.length > 500) {
      console.log('🔬 [SectionDetector] Few paragraphs detected, trying sentence split');
      // Split long content into chunks of ~3-4 sentences
      const sentences = this.content.split(/(?<=[.!?])\s+/);
      paragraphs = [];
      let chunk = '';
      for (const sentence of sentences) {
        chunk += sentence + ' ';
        if (chunk.length > 300) {
          paragraphs.push(chunk.trim());
          chunk = '';
        }
      }
      if (chunk.trim()) paragraphs.push(chunk.trim());
    }
    
    console.log('🔬 [SectionDetector] Paragraphs found:', paragraphs.length);
    
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
    
    console.log('🔬 [SectionDetector] Sections before post-process:', this.sections.length);
    
    // Post-process: merge adjacent stats, group numbered steps
    this.postProcess();
    
    console.log('🔬 [SectionDetector] Final sections:', this.sections.length);
    
    return this.sections;
  }

  /**
   * Detect the type of a single paragraph
   * Uses precise patterns to detect special components while preserving text
   */
  private detectParagraphType(text: string, startIndex: number): DetectedSection | null {
    const endIndex = startIndex + text.length;
    const trimmed = text.trim();
    
    // Check for explicit callout markers (must start with marker)
    if (/^(?:💡|⚠️|✅|❌|📌|🔑)\s*(?:Pro Tip|Note|Warning|Important|Key Point|Remember|Tip):/i.test(trimmed)) {
      PATTERNS.callout.lastIndex = 0;
      const match = PATTERNS.callout.exec(trimmed);
      return {
        type: 'callout',
        content: text,
        data: { text: match?.[1] || text, variant: this.detectCalloutVariant(text) },
        confidence: 0.9,
        startIndex,
        endIndex,
      };
    }
    
    // Check for blockquote (must start with >)
    if (trimmed.startsWith('>')) {
      return {
        type: 'quote',
        content: text,
        data: { text: trimmed.replace(/^>\s*/g, '') },
        confidence: 0.85,
        startIndex,
        endIndex,
      };
    }
    
    // Check for markdown header (must start with #)
    if (/^#{1,3}\s+/.test(trimmed)) {
      return {
        type: 'sectionHeading',
        content: text,
        data: { title: trimmed.replace(/^#{1,3}\s+/, '') },
        confidence: 0.9,
        startIndex,
        endIndex,
      };
    }
    
    // Check for bold-only line as heading (short, all bold, no other text)
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 100 && !trimmed.includes('\n')) {
      const inner = trimmed.replace(/^\*\*|\*\*$/g, '');
      // Only if it doesn't contain other bold markers inside
      if (!inner.includes('**')) {
        return {
          type: 'sectionHeading',
          content: text,
          data: { title: inner },
          confidence: 0.9,
          startIndex,
          endIndex,
        };
      }
    }
    
    // Check for section heading patterns (The X trap, Why X fails, How to X, etc.)
    const headingPatterns = [
      /^The\s+\w+\s+(?:trap|problem|issue|challenge|solution|answer|key|secret)/i,
      /^Why\s+(?:most|your|the)?\s*\w+\s+(?:fail|work|matter)/i,
      /^How\s+to\s+/i,
      /^What\s+(?:actually|really)\s+works/i,
      /^Making\s+\w+\s+worth/i,
      /^Professional\s+fee\s+recovery/i,
      /^The\s+October\s+2024\s+change/i,
      /^The\s+structure\s+that\s+(?:actually\s+)?works/i,
    ];
    
    for (const pattern of headingPatterns) {
      if (pattern.test(trimmed) && trimmed.length < 100) {
        return {
          type: 'sectionHeading',
          content: text,
          data: { title: trimmed },
          confidence: 0.85,
          startIndex,
          endIndex,
        };
      }
    }
    
    // Check for numbered step (must start with number or "Step")
    // Only if it's a SHORT item, not a full paragraph
    if (/^(?:\d+\.|Step\s+\d+:)/i.test(trimmed) && trimmed.length < 400) {
      return {
        type: 'numberedSteps',
        content: text,
        data: this.parseNumberedStep(trimmed),
        confidence: 0.8,
        startIndex,
        endIndex,
      };
    }
    
    // Check for bullet list (must start with bullet)
    if (/^[-•*]\s+/.test(trimmed)) {
      return {
        type: 'bulletList',
        content: text,
        data: { items: text.split('\n').map(line => line.replace(/^[-•*]\s+/, '').trim()).filter(Boolean) },
        confidence: 0.85,
        startIndex,
        endIndex,
      };
    }
    
    // Check for stats-heavy paragraph (multiple stats in a short block)
    // Only for SHORT paragraphs that are mostly numbers/stats
    if (trimmed.length < 200) {
      const statMatches = [
        ...trimmed.matchAll(/\d+(?:,\d{3})*\s*%/g),
        ...trimmed.matchAll(/£\d+(?:,\d{3})*/g),
        ...trimmed.matchAll(/\d+(?:,\d{3})+\s+(?:cases?|complaints?|people)/gi),
      ];
      
      if (statMatches.length >= 3) {
        const stats = this.extractStats(trimmed);
        if (stats.length >= 3) {
          return {
            type: 'stats',
            content: text,
            data: { stats, variant: 'flat', columns: Math.min(stats.length, 4) },
            confidence: 0.8,
            startIndex,
            endIndex,
          };
        }
      }
    }
    
    // Check for "three failures" or similar numbered list patterns
    const failurePatterns = [
      /(?:three|3)\s+(?:critical\s+)?failures?/i,
      /(?:three|3)\s+(?:key\s+)?(?:reasons?|issues?|problems?)/i,
      /(?:first|second|third)\s+(?:failure|reason|issue)/i,
    ];
    
    for (const pattern of failurePatterns) {
      if (pattern.test(trimmed)) {
        // This might be introducing a comparison or cards section
        // Mark it as a sectionHeading to introduce the next section
        return {
          type: 'sectionHeading',
          content: text,
          data: { title: trimmed.split(/[:.]/)[0] || trimmed },
          confidence: 0.75,
          startIndex,
          endIndex,
        };
      }
    }
    
    // Check for comparison patterns (Old Way vs New Way, Before/After)
    // Only for paragraphs that explicitly contain comparison structure
    if (trimmed.length < 300) {
      const hasVs = /\bvs\.?\b/i.test(trimmed);
      const hasBeforeAfter = /\b(?:before|after)\b.*\b(?:before|after)\b/i.test(trimmed);
      const hasOldNew = /\b(?:old|traditional)\s+(?:way|approach)\b.*\b(?:new|better|modern)\s+(?:way|approach)\b/i.test(trimmed);
      
      if (hasVs || hasBeforeAfter || hasOldNew) {
        return {
          type: 'comparisonCards',
          content: text,
          data: this.extractComparison(trimmed),
          confidence: 0.75,
          startIndex,
          endIndex,
        };
      }
    }
    
    // Check for timeline patterns (dates with events)
    const datePattern = /(?:\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|Day\s+\d+|Week\s+\d+)/gi;
    const dateMatches = [...trimmed.matchAll(datePattern)];
    
    if (dateMatches.length >= 2 && trimmed.length < 500) {
      const events = this.extractTimelineEvents(trimmed);
      if (events.length >= 2) {
        return {
          type: 'timeline',
          content: text,
          data: { events },
          confidence: 0.8,
          startIndex,
          endIndex,
        };
      }
    }
    
    // Default: paragraph - PRESERVE ALL TEXT
    return {
      type: 'paragraph',
      content: text,
      data: { text: trimmed },
      confidence: 0.5,
      startIndex,
      endIndex,
    };
  }

  /**
   * Post-process sections to merge and group related items
   */
  private postProcess(): void {
    const grouped: DetectedSection[] = [];
    let currentSteps: DetectedSection[] = [];
    let currentStats: DetectedSection[] = [];
    
    for (const section of this.sections) {
      // Handle numbered steps grouping
      if (section.type === 'numberedSteps') {
        // Flush stats first
        if (currentStats.length > 0) {
          grouped.push(this.mergeStats(currentStats));
          currentStats = [];
        }
        currentSteps.push(section);
      } 
      // Handle stats grouping (consecutive stats)
      else if (section.type === 'stats') {
        // Flush steps first
        if (currentSteps.length > 0) {
          grouped.push(this.mergeNumberedSteps(currentSteps));
          currentSteps = [];
        }
        currentStats.push(section);
      }
      else {
        // Flush any pending groups
        if (currentSteps.length > 0) {
          grouped.push(this.mergeNumberedSteps(currentSteps));
          currentSteps = [];
        }
        if (currentStats.length > 0) {
          grouped.push(this.mergeStats(currentStats));
          currentStats = [];
        }
        grouped.push(section);
      }
    }
    
    // Flush remaining groups
    if (currentSteps.length > 0) {
      grouped.push(this.mergeNumberedSteps(currentSteps));
    }
    if (currentStats.length > 0) {
      grouped.push(this.mergeStats(currentStats));
    }
    
    this.sections = grouped;
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
    const seenValues = new Set<string>();
    
    // Known stat patterns with better labels
    const knownPatterns = [
      { regex: /92[,.]?000|92K/i, value: '92K', label: 'Annual Complaints' },
      { regex: /98\s*%/i, value: '98%', label: 'Internal Resolution' },
      { regex: /88\s*%/i, value: '88%', label: 'Call Answering' },
      { regex: /34\s*%/i, value: '34%', label: 'Actually Resolved' },
      { regex: /41\s*%/i, value: '41%', label: 'Appeals Upheld' },
      { regex: /65\s*%/i, value: '65%', label: 'Year-on-Year Increase' },
      { regex: /15\s*(?:working\s+)?days?/i, value: '15 Days', label: 'Response Target' },
      { regex: /23\s*minutes?/i, value: '23 min', label: 'Average Wait' },
      { regex: /£103[,.]?063/i, value: '£103K', label: 'Compensation Paid' },
      { regex: /35[,.]?000/i, value: '35K', label: 'Processing Delays' },
    ];
    
    // Check for known patterns first
    for (const pattern of knownPatterns) {
      if (pattern.regex.test(text) && !seenValues.has(pattern.value)) {
        stats.push({ value: pattern.value, label: pattern.label });
        seenValues.add(pattern.value);
      }
    }
    
    // If we found known patterns, return them
    if (stats.length >= 2) {
      return stats.slice(0, 4);
    }
    
    // Fallback: Extract percentages with context
    const percentages = [...text.matchAll(/(\d+(?:\.\d+)?)\s*%\s*(?:of\s+)?([^,.]{3,30})/gi)];
    for (const match of percentages) {
      const value = `${match[1]}%`;
      if (!seenValues.has(value)) {
        stats.push({
          value,
          label: this.cleanLabel(match[2]),
        });
        seenValues.add(value);
      }
    }
    
    // Extract money values
    const money = [...text.matchAll(/£(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:in\s+)?([^,.]{3,30})?/gi)];
    for (const match of money) {
      const value = `£${match[1]}`;
      if (!seenValues.has(value)) {
        stats.push({
          value,
          label: this.cleanLabel(match[2] || 'Amount'),
        });
        seenValues.add(value);
      }
    }
    
    // Extract large numbers with units
    const numbers = [...text.matchAll(/(\d{1,3}(?:,\d{3})+|\d+(?:,\d{3})*)\s+(cases?|complaints?|people|calls?|days?|hours?|minutes?)/gi)];
    for (const match of numbers) {
      const value = match[1];
      if (!seenValues.has(value)) {
        stats.push({
          value,
          label: this.cleanLabel(match[2]),
        });
        seenValues.add(value);
      }
    }
    
    return stats.slice(0, 4); // Max 4 stats
  }

  private cleanLabel(text: string): string {
    if (!text) return 'Value';
    
    // Remove common filler words
    let cleaned = text
      .replace(/^(the|a|an|of|get|are|is|was|were|be|been|have|has|had)\s+/gi, '')
      .replace(/\s+(the|a|an|of)\s+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Capitalize first letter of each word
    cleaned = cleaned
      .split(' ')
      .slice(0, 4) // Max 4 words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return cleaned || 'Value';
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

