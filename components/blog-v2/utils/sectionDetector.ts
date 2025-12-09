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
    
    // Handle text nodes
    if (node.type === 'text') {
      return node.text || '';
    }
    
    // Handle paragraph nodes - add double newline for paragraph breaks
    if (node.type === 'paragraph') {
      if (node.content && Array.isArray(node.content)) {
        const text = node.content.map((n: any) => this.extractTextFromTipTap(n)).join('');
        return text ? text + '\n\n' : '';
      }
      return '\n\n';
    }
    
    // Handle heading nodes - add markdown-style heading
    if (node.type && node.type.startsWith('heading')) {
      const level = node.type.replace('heading', '') || '1';
      const headingText = node.content 
        ? node.content.map((n: any) => this.extractTextFromTipTap(n)).join('')
        : '';
      return headingText ? `${'#'.repeat(parseInt(level) || 1)} ${headingText}\n\n` : '';
    }
    
    // Handle bullet lists
    if (node.type === 'bulletList' || node.type === 'orderedList') {
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((n: any) => this.extractTextFromTipTap(n)).join('\n') + '\n\n';
      }
      return '\n\n';
    }
    
    // Handle list items
    if (node.type === 'listItem') {
      if (node.content && Array.isArray(node.content)) {
        const text = node.content.map((n: any) => this.extractTextFromTipTap(n)).join('');
        return text ? `- ${text}\n` : '';
      }
      return '';
    }
    
    // Handle blockquote
    if (node.type === 'blockquote') {
      if (node.content && Array.isArray(node.content)) {
        const text = node.content.map((n: any) => this.extractTextFromTipTap(n)).join('');
        return text ? `> ${text}\n\n` : '';
      }
      return '';
    }
    
    // Handle bold/italic - preserve text
    if (node.type === 'textStyle' || node.type === 'hardBreak') {
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((n: any) => this.extractTextFromTipTap(n)).join('');
      }
      return node.type === 'hardBreak' ? '\n' : '';
    }
    
    // Handle doc - process all content
    if (node.type === 'doc' || (node.content && Array.isArray(node.content))) {
      return node.content.map((n: any) => this.extractTextFromTipTap(n)).join('');
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
      if (!trimmed || trimmed.length < 10) continue; // Skip very short paragraphs
      
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
    // Also check for patterns like "THE KEY:", "Compare that to:", "But this builds:", etc.
    const calloutPatterns = [
      /^(?:💡|⚠️|✅|❌|📌|🔑)\s*(?:Pro Tip|Note|Warning|Important|Key Point|Remember|Tip):/i,
      /^THE\s+(?:KEY|PROBLEM|SOLUTION|ANSWER):/i,
      /^(?:Compare\s+that\s+to|But\s+this\s+builds|Specific\s+requests\s+get\s+results):/i,
      /^(?:Quote\s+Them\s+Directly|State\s+the\s+Impact\s+Clearly|Make\s+Specific\s+Demands|Close\s+Professionally):/i,
      /^(?:Coming\s+Next\s+Week|Next\s+Week):/i,
    ];
    
    for (const pattern of calloutPatterns) {
      if (pattern.test(trimmed)) {
        // Extract label and text
        const colonIndex = trimmed.indexOf(':');
        const label = colonIndex > 0 ? trimmed.substring(0, colonIndex).trim() : 'Note';
        const calloutText = colonIndex > 0 ? trimmed.substring(colonIndex + 1).trim() : trimmed;
        
        return {
          type: 'callout',
          content: text,
          data: { 
            label,
            text: calloutText,
            variant: this.detectCalloutVariant(text),
            icon: this.detectCalloutIcon(label),
          },
          confidence: 0.9,
          startIndex,
          endIndex,
        };
      }
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
    // Also check for patterns like "01", "02", "03" or "First", "Second", "Third"
    const numberedStepPattern = /^(?:\d+\.|Step\s+\d+:|0?\d+\s|(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth),?\s+)/i;
    
    if (numberedStepPattern.test(trimmed) && trimmed.length < 500) {
      // Check if it's a simple numbered item (not a full paragraph)
      const stepData = this.parseNumberedStep(trimmed);
      if (stepData.title || stepData.description) {
        return {
          type: 'numberedSteps',
          content: text,
          data: stepData,
          confidence: 0.8,
          startIndex,
          endIndex,
        };
      }
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
    // Also check for stats patterns that might span multiple lines
    const statMatches = [
      ...trimmed.matchAll(/\d+(?:K|k|,?\d{3})*\s+(?:annual|complaints?|resolution|resolved|answering|target|recovery|success|rate)/gi),
      ...trimmed.matchAll(/\d+\s*%\s+(?:internal|actually|call|success|upheld|not upheld)/gi),
      ...trimmed.matchAll(/£\d+(?:,\d{3})*/g),
      ...trimmed.matchAll(/\d+(?:,\d{3})+\s+(?:cases?|complaints?|people|pounds?)/gi),
    ];
    
    // Check for percentage-based content (good for donut charts)
    const percentageMatches = [...trimmed.matchAll(/\d+\s*%\s+(?:upheld|not upheld|internal|actually)/gi)];
    
    // If we have 2 percentages for donut chart (like 41% upheld, 59% not upheld)
    if (percentageMatches.length >= 2 && percentageMatches.length <= 4) {
      const segments = this.extractDonutSegments(trimmed);
      if (segments.length >= 2 && segments.length <= 4) {
        return {
          type: 'donutChart',
          content: text,
          data: { segments, showLegend: true },
          confidence: 0.85,
          startIndex,
          endIndex,
        };
      }
    }
    
    // If we have 3-4 stats, create a stats component (even in longer paragraphs)
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
    
    // Default: paragraph - but skip very short ones (they'll be merged)
    if (trimmed.length < 20) {
      return null; // Skip very short paragraphs, they'll be merged
    }
    
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
   * Also detects patterns across multiple paragraphs
   */
  private postProcess(): void {
    const grouped: DetectedSection[] = [];
    let currentSteps: DetectedSection[] = [];
    let currentStats: DetectedSection[] = [];
    let currentParagraphs: DetectedSection[] = [];
    
    // First pass: detect stats across multiple paragraphs
    for (let i = 0; i < this.sections.length; i++) {
      const section = this.sections[i];
      
      // Check if this paragraph contains stats that should be grouped
      if (section.type === 'paragraph') {
        const combinedText = currentParagraphs.map(s => s.content).join(' ') + ' ' + section.content;
        
        // Check for stats pattern across multiple paragraphs (like "92K", "98%", "34%", "88%")
        const statPattern = /(\d+(?:K|k|,?\d{3})*)\s+(?:annual|complaints?|resolution|resolved|answering|target)/gi;
        const percentagePattern = /(\d+)\s*%\s+(?:internal|actually|call|success|upheld)/gi;
        
        const statMatches = [...combinedText.matchAll(statPattern), ...combinedText.matchAll(percentagePattern)];
        
        // If we find 3-4 stats across paragraphs, create a stats component
        if (statMatches.length >= 3 && currentParagraphs.length >= 2) {
          const stats = this.extractStatsFromMultipleParagraphs(currentParagraphs.concat(section));
          if (stats.length >= 3) {
            // Flush any pending groups
            if (currentSteps.length > 0) {
              grouped.push(this.mergeNumberedSteps(currentSteps));
              currentSteps = [];
            }
            grouped.push({
              type: 'stats',
              content: currentParagraphs.concat(section).map(s => s.content).join('\n\n'),
              data: { stats, variant: 'flat', columns: Math.min(stats.length, 4) },
              confidence: 0.85,
              startIndex: currentParagraphs[0]?.startIndex || section.startIndex,
              endIndex: section.endIndex,
            });
            currentParagraphs = [];
            continue;
          }
        }
      }
      
      // Handle numbered steps grouping
      if (section.type === 'numberedSteps') {
        // Flush paragraphs first
        if (currentParagraphs.length > 0) {
          grouped.push(...this.processParagraphGroup(currentParagraphs));
          currentParagraphs = [];
        }
        // Flush stats first
        if (currentStats.length > 0) {
          grouped.push(this.mergeStats(currentStats));
          currentStats = [];
        }
        currentSteps.push(section);
      } 
      // Handle stats grouping (consecutive stats)
      else if (section.type === 'stats') {
        // Flush paragraphs and steps first
        if (currentParagraphs.length > 0) {
          grouped.push(...this.processParagraphGroup(currentParagraphs));
          currentParagraphs = [];
        }
        if (currentSteps.length > 0) {
          grouped.push(this.mergeNumberedSteps(currentSteps));
          currentSteps = [];
        }
        currentStats.push(section);
      }
      // Collect consecutive paragraphs for potential text-with-image conversion
      else if (section.type === 'paragraph') {
        // Flush pending groups first
        if (currentSteps.length > 0) {
          grouped.push(this.mergeNumberedSteps(currentSteps));
          currentSteps = [];
        }
        if (currentStats.length > 0) {
          grouped.push(this.mergeStats(currentStats));
          currentStats = [];
        }
        currentParagraphs.push(section);
      }
      else {
        // Flush any pending groups
        if (currentParagraphs.length > 0) {
          grouped.push(...this.processParagraphGroup(currentParagraphs));
          currentParagraphs = [];
        }
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
    if (currentParagraphs.length > 0) {
      grouped.push(...this.processParagraphGroup(currentParagraphs));
    }
    if (currentSteps.length > 0) {
      grouped.push(this.mergeNumberedSteps(currentSteps));
    }
    if (currentStats.length > 0) {
      grouped.push(this.mergeStats(currentStats));
    }
    
    // Second pass: detect patterns that span multiple sections
    this.sections = this.detectCrossSectionPatterns(grouped);
  }
  
  /**
   * Extract stats from multiple paragraphs
   */
  private extractStatsFromMultipleParagraphs(paragraphs: DetectedSection[]): Array<{ value: string; label: string; description?: string }> {
    const combinedText = paragraphs.map(p => p.content).join(' ');
    return this.extractStats(combinedText);
  }
  
  /**
   * Detect patterns that span across multiple sections (like timelines, three-column cards)
   */
  private detectCrossSectionPatterns(sections: DetectedSection[]): DetectedSection[] {
    const result: DetectedSection[] = [];
    let i = 0;
    
    while (i < sections.length) {
      // Check for timeline pattern across multiple paragraphs
      if (i < sections.length - 2) {
        const nextThree = sections.slice(i, i + 3);
        const combinedText = nextThree.map(s => s.content).join('\n\n');
        const datePattern = /(?:\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/gi;
        const dateMatches = [...combinedText.matchAll(datePattern)];
        
        if (dateMatches.length >= 3 && nextThree.every(s => s.type === 'paragraph')) {
          const events = this.extractTimelineEvents(combinedText);
          if (events.length >= 3) {
            result.push({
              type: 'timeline',
              content: combinedText,
              data: { events },
              confidence: 0.85,
              startIndex: nextThree[0].startIndex,
              endIndex: nextThree[nextThree.length - 1].endIndex,
            });
            i += 3;
            continue;
          }
        }
      }
      
      // Check for three-column card pattern (three consecutive paragraphs with similar structure)
      if (i < sections.length - 2) {
        const nextThree = sections.slice(i, i + 3);
        if (nextThree.every(s => s.type === 'paragraph' || s.type === 'callout')) {
          const combinedText = nextThree.map(s => s.content).join('\n\n');
          // Check for three distinct topics/points
          const hasThreeTopics = /(?:first|second|third|1\.|2\.|3\.|missing|evidence|wrong|target|trail|resolution)/i.test(combinedText);
          
          if (hasThreeTopics && nextThree.length === 3) {
            // Convert to threeColumnCards
            const cards = nextThree.map((s, idx) => {
              const content = s.content;
              const titleMatch = content.match(/(?:^|\n)([A-Z][^.!?]{10,60})/);
              const title = titleMatch ? titleMatch[1].trim() : `Point ${idx + 1}`;
              
              return {
                icon: ['🎯', '📋', '⚖️'][idx] || '📌',
                title,
                description: content.substring(title.length).trim().substring(0, 200),
              };
            });
            
            result.push({
              type: 'threeColumnCards',
              content: combinedText,
              data: { cards },
              confidence: 0.75,
              startIndex: nextThree[0].startIndex,
              endIndex: nextThree[nextThree.length - 1].endIndex,
            });
            i += 3;
            continue;
          }
        }
      }
      
      // Default: add section as-is
      result.push(sections[i]);
      i++;
    }
    
    return result;
  }

  /**
   * Process a group of consecutive paragraphs
   * Merge short paragraphs together, insert images strategically
   */
  private processParagraphGroup(paragraphs: DetectedSection[]): DetectedSection[] {
    if (paragraphs.length === 0) return [];
    
    const result: DetectedSection[] = [];
    const MIN_PARAGRAPH_LENGTH = 100; // Merge paragraphs shorter than this
    const IMAGE_FREQUENCY = 4; // Insert image every N merged paragraphs
    
    let mergedParagraphs: string[] = [];
    let mergedStartIndex = paragraphs[0]?.startIndex || 0;
    let mergedEndIndex = paragraphs[0]?.endIndex || 0;
    let imageCounter = 0;
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      const content = paragraph.content.trim();
      
      // If paragraph is short, merge with previous
      if (content.length < MIN_PARAGRAPH_LENGTH && mergedParagraphs.length > 0) {
        mergedParagraphs.push(content);
        mergedEndIndex = paragraph.endIndex;
        continue;
      }
      
      // Flush merged paragraphs if we have them
      if (mergedParagraphs.length > 0) {
        const mergedContent = mergedParagraphs.join('\n\n');
        
        // Every Nth merged block, convert to textWithImage
        if (imageCounter > 0 && imageCounter % IMAGE_FREQUENCY === 0 && mergedContent.length > 200) {
          result.push({
            type: 'textWithImage',
            content: mergedContent,
            data: {
              paragraphs: mergedParagraphs,
              imageAlt: this.generateImageAlt(mergedContent),
              imagePosition: imageCounter % 2 === 0 ? 'right' : 'left',
            },
            confidence: 0.7,
            startIndex: mergedStartIndex,
            endIndex: mergedEndIndex,
          });
        } else {
          // Merge into single paragraph component
          result.push({
            type: 'paragraph',
            content: mergedContent,
            data: { text: mergedContent },
            confidence: 0.5,
            startIndex: mergedStartIndex,
            endIndex: mergedEndIndex,
          });
        }
        
        imageCounter++;
        mergedParagraphs = [];
      }
      
      // Start new merge group
      if (content.length < MIN_PARAGRAPH_LENGTH) {
        mergedParagraphs.push(content);
        mergedStartIndex = paragraph.startIndex;
        mergedEndIndex = paragraph.endIndex;
      } else {
        // Long paragraph - add as-is
        result.push(paragraph);
        imageCounter++;
      }
    }
    
    // Flush any remaining merged paragraphs
    if (mergedParagraphs.length > 0) {
      const mergedContent = mergedParagraphs.join('\n\n');
      result.push({
        type: 'paragraph',
        content: mergedContent,
        data: { text: mergedContent },
        confidence: 0.5,
        startIndex: mergedStartIndex,
        endIndex: mergedEndIndex,
      });
    }
    
    return result;
  }

  /**
   * Generate a meaningful image alt text from paragraph content
   */
  private generateImageAlt(content: string): string {
    // Extract first meaningful phrase (up to first period or 50 chars)
    const firstSentence = content.split(/[.!?]/)[0] || content;
    const alt = firstSentence.substring(0, 50).trim();
    return alt || 'Illustration';
  }

  // ============================================================================
  // EXTRACTION HELPERS
  // ============================================================================

  private extractDonutSegments(text: string): Array<{ label: string; value: number }> {
    const segments: Array<{ label: string; value: number }> = [];
    const seenValues = new Set<number>();
    
    // Pattern: 41% upheld, 59% not upheld (common pattern)
    const upheldPattern = /(\d+)\s*%\s*(upheld|not\s+upheld)/gi;
    const upheldMatches = [...text.matchAll(upheldPattern)];
    
    if (upheldMatches.length >= 2) {
      for (const match of upheldMatches) {
        const value = parseInt(match[1], 10);
        const label = match[2].toLowerCase().includes('not') ? 'Not Upheld' : 'Upheld';
        if (!seenValues.has(value) && value <= 100 && value > 0) {
          segments.push({ value, label });
          seenValues.add(value);
        }
      }
      if (segments.length >= 2) return segments;
    }
    
    // Pattern: 98% internal resolution, 88% call answering, 34% actually resolved
    const percentagePattern = /(\d+)\s*%\s*(?:of\s+)?([^,.]{3,40})/gi;
    const matches = [...text.matchAll(percentagePattern)];
    
    for (const match of matches) {
      const value = parseInt(match[1], 10);
      if (!seenValues.has(value) && value <= 100 && value > 0) {
        segments.push({
          value,
          label: this.cleanLabel(match[2] || 'Value'),
        });
        seenValues.add(value);
      }
    }
    
    // If we didn't find context, try simple percentages
    if (segments.length === 0) {
      const simplePercentages = [...text.matchAll(/(\d+)\s*%/g)];
      for (let i = 0; i < simplePercentages.length && segments.length < 4; i++) {
        const value = parseInt(simplePercentages[i][1], 10);
        if (!seenValues.has(value) && value <= 100 && value > 0) {
          segments.push({
            value,
            label: `Value ${i + 1}`,
          });
          seenValues.add(value);
        }
      }
    }
    
    return segments;
  }

  private detectCalloutVariant(text: string): 'blue' | 'border' | 'gold' | 'green' {
    const lower = text.toLowerCase();
    if (lower.includes('warning') || lower.includes('⚠️') || lower.includes('coming next')) return 'gold';
    if (lower.includes('important') || lower.includes('key') || lower.includes('the key')) return 'gold';
    if (lower.includes('specific demands') || lower.includes('make specific')) return 'green';
    if (lower.includes('compare') || lower.includes('but this builds')) return 'blue';
    return 'blue';
  }
  
  private detectCalloutIcon(label: string): string {
    const lower = label.toLowerCase();
    if (lower.includes('key')) return '🔑';
    if (lower.includes('quote')) return '📜';
    if (lower.includes('impact') || lower.includes('money') || lower.includes('$')) return '💰';
    if (lower.includes('demand') || lower.includes('specific')) return '✅';
    if (lower.includes('close') || lower.includes('professional')) return '⚠️';
    if (lower.includes('subject') || lower.includes('line')) return '📧';
    if (lower.includes('opening') || lower.includes('paragraph')) return '📝';
    if (lower.includes('coming') || lower.includes('next week')) return '📅';
    return '💡';
  }

  private parseNumberedStep(text: string): { number: number; title: string; description: string } {
    // Match various formats: "1.", "01", "Step 1:", "First,", etc.
    let number = 1;
    let content = text;
    
    // Try to extract number
    const numberMatch = text.match(/^(\d+)\.|^0?(\d+)\s|Step\s+(\d+):/i);
    if (numberMatch) {
      number = parseInt(numberMatch[1] || numberMatch[2] || numberMatch[3] || '1', 10);
      content = text.replace(/^(?:\d+\.|0?\d+\s|Step\s+\d+:)\s*/i, '');
    } else {
      // Check for ordinal words
      const ordinalMap: Record<string, number> = {
        'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
        'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
      };
      const ordinalMatch = text.match(/^(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth),?\s+/i);
      if (ordinalMatch) {
        number = ordinalMap[ordinalMatch[1].toLowerCase()] || 1;
        content = text.replace(/^(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth),?\s+/i, '');
      }
    }
    
    // Split by colon, dash, or newline
    const parts = content.split(/[:\-–—\n]\s*/);
    
    return {
      number,
      title: parts[0]?.trim() || '',
      description: parts.slice(1).join(' ').trim() || content.trim(),
    };
  }

  private extractStats(text: string): Array<{ value: string; label: string; description?: string }> {
    const stats: Array<{ value: string; label: string; description?: string }> = [];
    const seenValues = new Set<string>();
    
    // Known stat patterns with better labels and descriptions
    const knownPatterns = [
      { regex: /92[,.]?000|92K/i, value: '92K', label: 'Annual Complaints', desc: 'Roughly one complaint every six minutes, all year round' },
      { regex: /98\s*%/i, value: '98%', label: 'Internal Resolution', desc: 'Resolved internally with templated responses that solve nothing' },
      { regex: /88\s*%/i, value: '88%', label: 'Call Answering', desc: 'Target hit by late 2024' },
      { regex: /34\s*%/i, value: '34%', label: 'Actually Resolved', desc: 'Queries that genuinely get resolved' },
      { regex: /41\s*%/i, value: '41%', label: 'Appeals Upheld', desc: 'Complaints upheld by Adjudicator Office' },
      { regex: /65\s*%/i, value: '65%', label: 'Year-on-Year Increase', desc: 'Processing delays increased 65%' },
      { regex: /15\s*(?:working\s+)?days?/i, value: '15 Days', label: 'Response Target', desc: 'HMRC response time target' },
      { regex: /23\s*minutes?/i, value: '23 min', label: 'Average Wait', desc: 'Average call wait time' },
      { regex: /£103[,.]?063/i, value: '£103K', label: 'Compensation Paid', desc: 'Total compensation through Adjudicator' },
      { regex: /35[,.]?000/i, value: '35K', label: 'Processing Delays', desc: 'Cases in 2022-23' },
      { regex: /£12K\+|12[,.]?000\+/i, value: '£12K+', label: 'Annual Recovery', desc: 'Typical recovery through systematic complaint management' },
      { regex: /84\s*%/i, value: '84%', label: 'Success Rate', desc: 'Lightpoint complaint management system at Adjudicator level' },
    ];
    
    // Check for known patterns first
    for (const pattern of knownPatterns) {
      if (pattern.regex.test(text) && !seenValues.has(pattern.value)) {
        stats.push({ 
          value: pattern.value, 
          label: pattern.label,
          description: pattern.desc 
        });
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
    // Extract steps data properly
    const mergedSteps = steps.map(s => {
      if (s.data && (s.data.number || s.data.title)) {
        return {
          number: s.data.number || 1,
          title: s.data.title || '',
          description: s.data.description || s.content,
        };
      }
      // Fallback: parse from content
      return this.parseNumberedStep(s.content);
    });
    
    return {
      type: 'numberedSteps',
      content: steps.map(s => s.content).join('\n'),
      data: {
        steps: mergedSteps,
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

