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
  
  // Numbered steps: 1. Step one, Step 1:, First, (ordinals must have comma)
  numberedStep: /^(?:\d+\.|Step\s+\d+:|(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth),)\s+(.+)/gim,
  
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
    // 🔴🔴🔴 CRITICAL: Check content at VERY FIRST entry point
    const hasProperSpaces = content.includes('sent debt collectors');
    const hasBrokenWords = content.includes('sentdebtcollectors');
    console.log('🔴🔴🔴 [SectionDetector] CONSTRUCTOR ENTRY:', {
      hasProperSpaces,
      hasBrokenWords,
      spaceCount: (content.match(/ /g) || []).length,
      newlineCount: (content.match(/\n/g) || []).length,
      first100: content.substring(0, 100),
    });
    
    if (hasBrokenWords || !hasProperSpaces) {
      console.log('🔴🔴🔴🔴🔴 CONTENT ALREADY BROKEN AT CONSTRUCTOR! 🔴🔴🔴🔴🔴');
    }
    
    const normalized = this.normalizeContent(content);
    
    // Check after normalization
    const normalizedHasSpaces = normalized.includes('sent debt collectors');
    const normalizedBroken = normalized.includes('sentdebtcollectors');
    if (normalizedBroken || !normalizedHasSpaces) {
      console.log('🔴🔴🔴 [SectionDetector] CONTENT BROKEN AFTER NORMALIZATION:', {
        hadSpaces: hasProperSpaces,
        nowHasSpaces: normalizedHasSpaces,
        wasBroken: hasBrokenWords,
        nowBroken: normalizedBroken,
      });
    }
    
    this.content = this.preprocessContent(normalized);
    
    // Check after preprocessing
    const preprocessedHasSpaces = this.content.includes('sent debt collectors');
    const preprocessedBroken = this.content.includes('sentdebtcollectors');
    if (preprocessedBroken || !preprocessedHasSpaces) {
      console.log('🔴🔴🔴 [SectionDetector] CONTENT BROKEN AFTER PREPROCESSING:', {
        hadSpaces: normalizedHasSpaces,
        nowHasSpaces: preprocessedHasSpaces,
        wasBroken: normalizedBroken,
        nowBroken: preprocessedBroken,
      });
    }
  }

  /**
   * Preprocess content - merge short consecutive lines into paragraphs
   * This prevents the "card explosion" bug where every 3 lines becomes a card
   * Also handles "list context" - lines following a colon header become list items
   */
  private preprocessContent(content: string): string {
    const lines = content.split('\n');
    const processed: string[] = [];
    let currentParagraph: string[] = [];
    let inListContext = false; // Track if we're after a colon header
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Empty line = paragraph break, exit list context
      if (!trimmed) {
        if (currentParagraph.length > 0) {
          processed.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
        inListContext = false;
        continue;
      }
      
      // Check if this line is a "continuation" or a "new section"
      const isHeader = trimmed.match(/^#+\s/);
      const isColonHeader = trimmed.match(/^(?:\*\*)?[A-Za-z][^:]{0,60}:(?:\*\*)?$/); // "Claimable:", "**Title:**"
      const isListItem = trimmed.match(/^[-•*]\s/) || trimmed.match(/^\d+[.)]\s/);
      const isMonthHeader = trimmed.match(/^(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec):/i);
      const isDateLine = trimmed.match(/^(?:Day\s+\d+|Week\s+\d+|\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i);
      const isCardMarker = trimmed.match(/^[-•*]?\s*\*\*[^*]+\*\*[:\s]/) || trimmed.match(/^[🎯📋⚖️🔑💡✅❌📧📝📜💰⚠️📅]\s/);
      
      // Colon headers start list context
      if (isColonHeader && !isMonthHeader) {
        if (currentParagraph.length > 0) {
          processed.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
        processed.push(trimmed);
        inListContext = true;
        continue;
      }
      
      // These start new sections, exit list context
      if (isHeader || isMonthHeader || isDateLine || isCardMarker) {
        if (currentParagraph.length > 0) {
          processed.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
        processed.push(trimmed);
        inListContext = false;
        continue;
      }
      
      // Explicit list items stay as-is
      if (isListItem) {
        if (currentParagraph.length > 0) {
          processed.push(currentParagraph.join(' '));
          currentParagraph = [];
        }
        processed.push(trimmed);
        continue;
      }
      
      // If in list context (after colon header), treat short lines as list items
      if (inListContext && trimmed.length < 150 && !trimmed.match(/^#+\s/)) {
        // Add as bullet item if not already a bullet
        if (!trimmed.startsWith('-') && !trimmed.startsWith('•') && !trimmed.startsWith('*')) {
          processed.push('- ' + trimmed);
        } else {
          processed.push(trimmed);
        }
        continue;
      }
      
      // Short lines (under 60 chars, no ending punctuation that suggests completion)
      // should be merged with the next line
      const endsWithCompletePunctuation = trimmed.match(/[.!?]$/);
      const isShortLine = trimmed.length < 60;
      
      currentParagraph.push(trimmed);
      
      // If it's a complete sentence and not short, consider it a paragraph
      if (endsWithCompletePunctuation && !isShortLine) {
        processed.push(currentParagraph.join(' '));
        currentParagraph = [];
      }
    }
    
    // Don't forget the last paragraph
    if (currentParagraph.length > 0) {
      processed.push(currentParagraph.join(' '));
    }
    
    return processed.join('\n\n');
  }

  /**
   * Normalize content - PRESERVE detection markers (bold, etc.) until after detection
   */
  private normalizeContent(content: string): string {
    if (!content) return '';
    
    // 🔴 DIAGNOSTIC: Log input to normalizeContent
    console.log('🔴 [normalizeContent] Input type:', typeof content);
    if (typeof content === 'string') {
      console.log('🔴 [normalizeContent] Input (first 500 chars):', content.substring(0, 500));
      if (content.includes('sentdebtcollectorsforit')) {
        console.log('🔴🔴🔴 [normalizeContent] CONTENT ALREADY BROKEN AT INPUT! 🔴🔴🔴');
      }
    }
    
    // If TipTap JSON, extract text (preserving bold markers)
    if (typeof content === 'object') {
      return this.extractTextFromTipTap(content);
    }
    
    let text = content;
    
    // Check if content is already plain text (no HTML tags) - skip HTML processing
    const hasHtmlTags = /<[^>]+>/.test(text);
    console.log('🔴 [normalizeContent] Has HTML tags:', hasHtmlTags);
    
    if (hasHtmlTags) {
      // Content still has HTML - process it
      // Convert block-level HTML tags to paragraph breaks
      text = text.replace(/<\/?(p|div|h[1-6]|li|tr|blockquote)[^>]*>/gi, '\n\n');
      // Convert <br> tags to newlines (preserve structure)
      text = text.replace(/<br\s*\/?>/gi, '\n');
      
      // 🔴 DIAGNOSTIC: Check after HTML tag replacement
      if (text.includes('sentdebtcollectorsforit')) {
        console.log('🔴🔴🔴 [normalizeContent] CONTENT BROKEN AFTER HTML TAG REPLACEMENT! 🔴🔴🔴');
      }
      
      // Strip remaining HTML tags - REPLACE WITH SPACE to preserve word boundaries
      text = text.replace(/<[^>]*>/g, ' ');
      
      // 🔴 DIAGNOSTIC: Check after stripping HTML
      if (text.includes('sentdebtcollectorsforit')) {
        console.log('🔴🔴🔴 [normalizeContent] CONTENT BROKEN AFTER STRIPPING HTML! 🔴🔴🔴');
      }
      
      // Decode HTML entities
      text = text.replace(/&nbsp;/g, ' ');
      text = text.replace(/&amp;/g, '&');
      text = text.replace(/&lt;/g, '<');
      text = text.replace(/&gt;/g, '>');
      text = text.replace(/&quot;/g, '"');
      text = text.replace(/&#39;/g, "'");
    } else {
      // Content is already plain text - just normalize whitespace
      console.log('🔴 [normalizeContent] Content is already plain text, skipping HTML processing');
    }
    
    // 🔴 DIAGNOSTIC: Check after stripping HTML
    if (text.includes('sentdebtcollectorsforit')) {
      console.log('🔴🔴🔴 [normalizeContent] CONTENT BROKEN AFTER STRIPPING HTML! 🔴🔴🔴');
    }
    
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&#39;/g, "'");
    
    // DO NOT remove markdown formatting markers here - they're needed for detection
    // Bold markers (**) will be preserved until after detection
    // Only remove them in component rendering
    
    // Fix sentences starting with periods (shouldn't happen)
    text = text.replace(/\n\s*\.\s+/g, '. '); // Move period to end of previous sentence
    text = text.replace(/\.\s+\./g, '.'); // Remove double periods
    
    // Fix sentences starting with periods (shouldn't happen)
    text = text.replace(/\n\s*\.\s+/g, '. '); // Move period to end of previous sentence
    text = text.replace(/\.\s+\./g, '.'); // Remove double periods
    
    // Normalize whitespace but preserve paragraph breaks
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n /g, '\n');
    text = text.replace(/ \n/g, '\n');
    
    // Remove leading/trailing spaces from each line (but preserve spaces within lines!)
    text = text.split('\n').map(line => line.trim()).join('\n');
    
    // CRITICAL: Fix words that got stuck together (common when HTML/structure is removed)
    // Pattern: lowercase letter followed by uppercase letter = missing space
    // But be careful - don't break acronyms or proper nouns
    text = text.replace(/([a-z]{2,})([A-Z][a-z]{2,})/g, '$1 $2');
    // Pattern: word ending with lowercase followed by word starting with capital = missing space
    text = text.replace(/([a-z])([A-Z][a-z])/g, '$1 $2');
    
    // Fix broken sentences - if a line ends without punctuation and next line starts lowercase, merge with SPACE
    text = text.replace(/([a-z])\n([a-z])/g, '$1 $2');
    
    // REMOVED: The "broken words" fix was too aggressive and was stripping spaces!
    // It was matching "sent \nfor " and turning it into "sentfor " (missing space)
    // This was causing the word concatenation bug.
    
    // Fix sentences that were broken mid-word (like "collectors for it\n. The money")
    text = text.replace(/([a-z])\s*\n\s*\.\s+([A-Z])/g, '$1. $2');
    
    // Remove duplicate consecutive lines (but be less aggressive)
    const lines = text.split('\n');
    const deduped: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (!trimmed) {
        // Keep empty lines if they're not consecutive
        if (deduped[deduped.length - 1]?.trim()) {
          deduped.push(lines[i]);
        }
        continue;
      }
      
      // Only skip if it's exactly the same as the previous line
      const lastLine = deduped[deduped.length - 1]?.trim();
      if (lastLine !== trimmed) {
        deduped.push(lines[i]);
      }
    }
    text = deduped.join('\n');
    
    // 🔴 DIAGNOSTIC: Check final output
    if (text.includes('sentdebtcollectorsforit')) {
      console.log('🔴🔴🔴 [normalizeContent] CONTENT BROKEN IN FINAL OUTPUT! 🔴🔴🔴');
    }
    console.log('🔴 [normalizeContent] Final output (first 500 chars):', text.substring(0, 500));
    
    return text.trim();
  }

  private extractTextFromTipTap(node: any): string {
    if (!node) return '';
    
    // Handle text nodes - PRESERVE bold markers for detection
    if (node.type === 'text') {
      let text = node.text || '';
      // Preserve bold markers - they're needed for detection
      // Check if this text has bold marks
      if (node.marks && Array.isArray(node.marks)) {
        const hasBold = node.marks.some((m: any) => m.type === 'bold');
        if (hasBold) {
          text = `**${text}**`;
        }
      }
      return text;
    }
    
    // Handle paragraph nodes - add double newline for paragraph breaks
    // CRITICAL: Preserve spaces between text nodes
    if (node.type === 'paragraph') {
      if (node.content && Array.isArray(node.content)) {
        // Join text nodes with spaces to preserve word boundaries
        let text = '';
        for (let i = 0; i < node.content.length; i++) {
          const childText = this.extractTextFromTipTap(node.content[i]);
          if (childText) {
            // Add space before if previous node was text and this is text
            if (text && !text.endsWith(' ') && !text.endsWith('\n') && 
                node.content[i]?.type === 'text' && 
                (i === 0 || node.content[i-1]?.type === 'text')) {
              text += ' ';
            }
            text += childText;
          }
        }
        return text.trim() ? text.trim() + '\n\n' : '';
      }
      return '';
    }
    
    // Handle heading nodes - add markdown-style heading
    if (node.type && node.type.startsWith('heading')) {
      const level = node.type.replace('heading', '') || '1';
      const headingText = node.content 
        ? node.content.map((n: any) => this.extractTextFromTipTap(n)).join(' ').trim()
        : '';
      return headingText ? `${'#'.repeat(parseInt(level) || 1)} ${headingText}\n\n` : '';
    }
    
    // Handle bullet lists
    if (node.type === 'bulletList' || node.type === 'orderedList') {
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((n: any) => this.extractTextFromTipTap(n)).join('\n') + '\n\n';
      }
      return '';
    }
    
    // Handle list items
    if (node.type === 'listItem') {
      if (node.content && Array.isArray(node.content)) {
        const text = node.content.map((n: any) => this.extractTextFromTipTap(n)).join(' ').trim();
        return text ? `- ${text}\n` : '';
      }
      return '';
    }
    
    // Handle blockquote
    if (node.type === 'blockquote') {
      if (node.content && Array.isArray(node.content)) {
        const text = node.content.map((n: any) => this.extractTextFromTipTap(n)).join(' ').trim();
        return text ? `> ${text}\n\n` : '';
      }
      return '';
    }
    
    // Handle bold/italic - preserve bold markers for detection
    if (node.type === 'bold') {
      if (node.content && Array.isArray(node.content)) {
        const content = node.content.map((n: any) => this.extractTextFromTipTap(n)).join(' ');
        return `**${content}**`;
      }
      return '';
    }
    
    // Handle textStyle (may contain bold)
    if (node.type === 'textStyle') {
      if (node.content && Array.isArray(node.content)) {
        const content = node.content.map((n: any) => this.extractTextFromTipTap(n)).join(' ');
        // Check if textStyle has bold attribute
        if (node.attrs?.bold) {
          return `**${content}**`;
        }
        return content;
      }
      return '';
    }
    
    // Handle italic - just return content without markers
    if (node.type === 'italic') {
      if (node.content && Array.isArray(node.content)) {
        return node.content.map((n: any) => this.extractTextFromTipTap(n)).join(' ');
      }
      return '';
    }
    
    // Handle hard breaks - convert to space (don't break sentences)
    if (node.type === 'hardBreak') {
      return ' '; // Convert to space instead of newline to preserve sentence flow
    }
    
    // Handle doc - process all content, preserve spaces
    if (node.type === 'doc' || (node.content && Array.isArray(node.content))) {
      let result = '';
      for (let i = 0; i < node.content.length; i++) {
        const childText = this.extractTextFromTipTap(node.content[i]);
        if (childText) {
          result += childText;
        }
      }
      return result;
    }
    
    return '';
  }

  /**
   * Run all detectors and return sections
   * NEW APPROACH: Group paragraphs first, then detect component types
   */
  detect(): DetectedSection[] {
    this.sections = [];
    
    console.log('🔍 [SectionDetector] Starting detection...');
    console.log('🔍 [SectionDetector] Content length:', this.content.length);
    console.log('🔍 [SectionDetector] First 200 chars:', this.content.substring(0, 200));
    
    // Split into paragraphs - preserve sentence boundaries
    let paragraphs = this.content.split(/\n\n+/).filter(p => p.trim());
    
    // Clean up paragraphs - ensure they don't break mid-sentence
    paragraphs = paragraphs.map(p => {
      let cleaned = p.trim();
      
      // Remove leading periods (sentences shouldn't start with periods)
      cleaned = cleaned.replace(/^\.\s+/, '');
      
      // Remove trailing periods that are alone on a line
      cleaned = cleaned.replace(/\n\.\s*$/g, '');
      
      // REMOVED: This "broken words" fix was stripping ALL spaces between words!
      // The regex /([a-z])\s+([a-z])/g matches any two letters with space between
      // and was joining them without space, causing "sent debt" → "sentdebt"
      
      // Remove duplicate sentences within paragraph (but be less aggressive)
      // Only remove if sentence appears multiple times in a row
      const sentences = cleaned.split(/(?<=[.!?])\s+/);
      const dedupedSentences: string[] = [];
      for (let i = 0; i < sentences.length; i++) {
        const trimmed = sentences[i].trim();
        if (!trimmed) continue;
        
        // Only skip if it's the same as the immediately previous sentence
        if (i > 0 && dedupedSentences[dedupedSentences.length - 1] === trimmed) {
          continue; // Skip consecutive duplicates
        }
        dedupedSentences.push(trimmed);
      }
      cleaned = dedupedSentences.join(' ');
      
      return cleaned;
    }).filter(p => p.length > 0);
    
    // If we only got 1-2 paragraphs, try splitting by sentences for long content
    if (paragraphs.length <= 2 && this.content.length > 500) {
      console.log('🔬 [SectionDetector] Few paragraphs detected, trying sentence split');
      // Split long content into chunks of ~3-4 sentences
      const sentences = this.content.split(/(?<=[.!?])\s+/).filter(s => s.trim());
      paragraphs = [];
      let chunk = '';
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed) continue;
        
        chunk += trimmed + ' ';
        // Create paragraph every 3-4 sentences or when chunk gets long
        if (chunk.split(/[.!?]/).length > 3 || chunk.length > 400) {
          paragraphs.push(chunk.trim());
          chunk = '';
        }
      }
      if (chunk.trim()) paragraphs.push(chunk.trim());
    }
    
    console.log('🔬 [SectionDetector] Paragraphs found:', paragraphs.length);
    console.log('🔬 [SectionDetector] First 3 paragraphs preview:', paragraphs.slice(0, 3).map(p => p.substring(0, 100)));
    
    // NEW APPROACH: Group paragraphs first, then detect
    const groupedSections = this.groupAndDetect(paragraphs);
    
    console.log('🔬 [SectionDetector] Total sections detected:', groupedSections.length);
    
    // Post-process: merge adjacent stats, group numbered steps
    this.sections = groupedSections;
    this.postProcess();
    
    console.log('🔍 [SectionDetector] Sections detected:', this.sections.length);
    console.log('🔍 [SectionDetector] Section types:', this.sections.map(s => s.type));
    console.log('🔍 [SectionDetector] Three-column cards count:', this.sections.filter(s => s.type === 'threeColumnCards').length);
    
    return this.sections;
  }
  
  /**
   * Group paragraphs intelligently before detecting component types
   * This ensures related content is grouped together (e.g., 3 paragraphs = threeColumnCards)
   */
  private groupAndDetect(paragraphs: string[]): DetectedSection[] {
    const sections: DetectedSection[] = [];
    let currentIndex = 0;
    let i = 0;
    
    while (i < paragraphs.length) {
      const trimmed = paragraphs[i].trim();
      if (!trimmed || trimmed.length < 5) {
        i++;
        currentIndex += paragraphs[i]?.length + 2 || 0;
        continue;
      }
      
      // Skip paragraphs that are just punctuation or formatting artifacts
      if (/^[\.\*\s\-]+$/.test(trimmed)) {
        i++;
        currentIndex += paragraphs[i]?.length + 2 || 0;
        continue;
      }
      
      // Check for special single-paragraph components first (headings, callouts, etc.)
      const singleSection = this.detectParagraphType(trimmed, currentIndex);
      if (singleSection && singleSection.type !== 'paragraph') {
        // It's a special component (heading, callout, etc.) - add it
        sections.push(singleSection);
        i++;
        currentIndex += trimmed.length + 2;
        continue;
      }
      
      // CRITICAL: Check for timeline FIRST (month headers like "May:", "June:")
      // This must come BEFORE three-column cards to prevent false positives
      const timeline = this.detectTimelineGroup(paragraphs, i, currentIndex);
      if (timeline && timeline.count >= 3) {
        sections.push(timeline.section);
        i += timeline.count;
        currentIndex += timeline.totalLength;
        continue;
      }
      
      // Check for comparison cards (Recoverable: vs Not recoverable:, Do vs Don't)
      const comparison = this.detectComparisonGroup(paragraphs, i, currentIndex);
      if (comparison) {
        sections.push(comparison.section);
        i += comparison.count;
        currentIndex += comparison.totalLength;
        continue;
      }
      
      // Check for implicit lists (colon header followed by short lines)
      // e.g., "Claimable:" followed by items without bullet markers
      const implicitList = this.detectImplicitList(paragraphs, i, currentIndex);
      if (implicitList) {
        sections.push(implicitList.section);
        i += implicitList.count;
        currentIndex += implicitList.totalLength;
        continue;
      }
      
      // Check for numbered steps BEFORE cards
      const numberedSteps = this.detectNumberedStepsGroup(paragraphs, i, currentIndex);
      if (numberedSteps && numberedSteps.count > 1) {
        sections.push(numberedSteps.section);
        i += numberedSteps.count;
        currentIndex += numberedSteps.totalLength;
        continue;
      }
      
      // Check for stats BEFORE cards
      const stats = this.detectStatsGroup(paragraphs, i, currentIndex);
      if (stats && stats.count >= 3) {
        sections.push(stats.section);
        i += stats.count;
        currentIndex += stats.totalLength;
        continue;
      }
      
      // LAST: Check for column cards (3 or 4) - ONLY if they have EXPLICIT card markers
      // This prevents the "card explosion" bug where every 3 lines becomes a card
      if (i + 2 < paragraphs.length) {
        // Helper to check if a paragraph has card markers
        const monthNames = /^(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec):/i;
        const hasCardMarker = (p: string) => {
          const trimmed = p.trim();
          if (monthNames.test(trimmed)) return false;
          return (
            trimmed.match(/^[-•*]?\s*\*\*[^*]+\*\*[:\s]/) || // Bold title pattern
            trimmed.match(/^[🎯📋⚖️🔑💡✅❌📧📝📜💰⚠️📅]\s/) // Emoji prefix
          );
        };
        
        // Try 4 cards first (2x2 grid), then fall back to 3 cards
        const nextFour = paragraphs.slice(i, i + 4);
        const nextThree = paragraphs.slice(i, i + 3);
        
        // Check if we have 4 consecutive paragraphs with card markers
        if (i + 3 < paragraphs.length && nextFour.every(p => hasCardMarker(p))) {
          console.log('🔬 [SectionDetector] Checking for 4-column cards at index', i);
          const fourColumnSection = this.detectThreeColumnCards(nextFour, currentIndex);
          if (fourColumnSection) {
            console.log('🔬 [SectionDetector] ✅ Detected 4 cards (2x2 grid)');
            sections.push(fourColumnSection);
            i += 4;
            currentIndex += nextFour.reduce((sum, p) => sum + p.length + 2, 0);
            continue;
          }
        }
        
        // Fall back to 3 cards
        if (nextThree.every(p => hasCardMarker(p))) {
          console.log('🔬 [SectionDetector] Checking for threeColumnCards at index', i, '- all have card markers');
          const threeColumnSection = this.detectThreeColumnCards(nextThree, currentIndex);
          if (threeColumnSection) {
            console.log('🔬 [SectionDetector] ✅ Detected threeColumnCards:', {
              cards: threeColumnSection.data?.cards?.map((c: any) => ({ 
                title: c.title?.substring(0, 40), 
                descriptionLength: c.description?.length || 0,
                hasCallout: !!c.callout,
              })),
            });
            sections.push(threeColumnSection);
            i += 3;
            currentIndex += nextThree.reduce((sum, p) => sum + p.length + 2, 0);
            continue;
          }
        }
      }
      
      
      // Default: process as single paragraph
      const section = this.detectParagraphType(trimmed, currentIndex);
      if (section) {
        sections.push(section);
      }
      
      i++;
      currentIndex += trimmed.length + 2;
    }
    
    return sections;
  }
  
  /**
   * Truncate text at word boundary
   */
  private truncateAtWordBoundary(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text || '';
    const truncated = text.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    // Only break at word boundary if we found a reasonable break point (at least 60% of maxLength)
    return lastSpace > maxLength * 0.6 ? truncated.substring(0, lastSpace) : truncated;
  }

  /**
   * Extract title from text, respecting word boundaries
   */
  private extractTitleFromText(text: string, maxLength: number = 60): string {
    const cleaned = text.replace(/\*\*/g, '').trim();
    
    // If text is short enough, use it all
    if (cleaned.length <= maxLength) {
      return cleaned;
    }
    
    // Find last space before maxLength
    const lastSpace = cleaned.lastIndexOf(' ', maxLength);
    if (lastSpace > maxLength * 0.5) {
      return cleaned.substring(0, lastSpace).trim();
    }
    
    // Fallback: break at maxLength but add ellipsis
    return cleaned.substring(0, maxLength - 3).trim() + '...';
  }

  /**
   * Detect three-column cards from 3 consecutive paragraphs
   * IMPROVED: Handles multiple content formats including TipTap output
   * Matches patterns: bold titles, emoji prefixes, colon-separated, numbered points
   */
  private detectThreeColumnCards(paragraphs: string[], startIndex: number): DetectedSection | null {
    console.log('🔬 [detectThreeColumnCards] Called with', paragraphs.length, 'paragraphs');
    if (paragraphs.length < 3) {
      console.log('🔬 [detectThreeColumnCards] ❌ Not enough paragraphs');
      return null;
    }
    
    // Process exactly 3 paragraphs
    const candidateParagraphs = paragraphs.slice(0, 3);
    const cards: Array<{ icon?: string; title: string; description: string; callout?: { label: string; text: string } }> = [];
    
    for (let i = 0; i < candidateParagraphs.length; i++) {
      const paragraph = candidateParagraphs[i];
      let content = paragraph.trim();
      
      // Skip empty paragraphs
      if (!content || content.length < 10) {
        continue;
      }
      
      let title = '';
      let description = '';
      let icon: string | undefined;
      let callout: { label: string; text: string } | undefined;
      
      // Split content into lines for multi-line processing
      const lines = content.split('\n').map(l => l.trim()).filter(l => l);
      
      // Pattern 1: Bold title - "**Title**: description" or "- **Title**: description"
      const boldPattern = content.match(/^[-•*]?\s*\*\*([^*]+)\*\*[:\s]*(.*)/s);
      
      // Pattern 2: Emoji prefix - "🎯 Title: description" or "📋 Title: description"
      const emojiPattern = content.match(/^([🎯📋⚖️🔑💡✅❌📧📝📜💰⚠️📅])\s*(.+?)(?::\s*(.*))?$/s);
      
      // Pattern 3: Simple numbered - "Point 1: description" - but extract better title
      const pointPattern = content.match(/^Point\s+\d+[:\s]*(.*)/is);
      
      // Pattern 4: Colon-separated - "Title: longer description text"
      // EXCLUDE month names - these should be detected as timeline, not cards!
      const isMonthStart = /^(?:January|February|March|April|May|June|July|August|September|October|November|December):/i.test(content);
      const colonPattern = !isMonthStart ? content.match(/^([A-Z][^:]{5,60}?):\s+(.+)/s) : null;
      
      // Pattern 5: Quoted title - "Title here" followed by response text
      // e.g., "This is normal agent work" → "No, it's not. When you have to..."
      const quotedPattern = content.match(/^"([^"]+)"\s*[→\-–:]\s*"?(.+)"?$/s) ||
                           content.match(/^"([^"]+)"\s+"?(.+)"?$/s);
      
      if (boldPattern) {
        title = boldPattern[1].trim();
        description = boldPattern[2]?.trim() || '';
        // Gather additional description from following lines
        for (let j = 1; j < lines.length; j++) {
          const line = lines[j];
          // Stop if we hit another card pattern
          if (line.match(/^[-•*]?\s*\*\*/) || line.match(/^[🎯📋⚖️]/) || line.match(/^[A-Z][^:]{5,60}:\s/)) {
            break;
          }
          // Check for "Instead:" callout
          if (line.match(/^(Instead:|Rather:|Better:|COMPARE THAT TO:)/i)) {
            const calloutMatch = line.match(/^(Instead:|Rather:|Better:|COMPARE THAT TO:)\s*(.*)/i);
            if (calloutMatch) {
              callout = {
                label: calloutMatch[1],
                text: calloutMatch[2] || '',
              };
              // Gather more callout text from following lines
              for (let k = j + 1; k < lines.length; k++) {
                const calloutLine = lines[k];
                if (!calloutLine || calloutLine.match(/^[-•*]?\s*\*\*/) || calloutLine.match(/^[🎯📋⚖️]/)) break;
                if (callout) {
                  callout.text += ' ' + calloutLine;
                }
              }
              break;
            }
          }
          description += (description ? ' ' : '') + line;
        }
      } else if (emojiPattern) {
        icon = emojiPattern[1];
        // Split by colon if present
        if (emojiPattern[3]) {
          title = emojiPattern[2].trim();
          description = emojiPattern[3].trim();
        } else {
          // Extract title from text (first sentence or first 50 chars)
          const extractedTitle = this.extractTitleFromText(emojiPattern[2], 50);
          title = extractedTitle;
          // Find the title in the original text to get correct substring position
          const titleIndex = emojiPattern[2].indexOf(extractedTitle);
          if (titleIndex >= 0) {
            description = emojiPattern[2].substring(titleIndex + extractedTitle.length).trim();
          } else {
            // Fallback: use split by words
            const words = emojiPattern[2].split(/\s+/);
            const titleWords = extractedTitle.split(/\s+/);
            const titleWordCount = titleWords.length;
            description = words.slice(titleWordCount).join(' ').trim();
          }
        }
        // Gather additional description from following lines
        for (let j = 1; j < lines.length; j++) {
          const line = lines[j];
          if (line.match(/^[🎯📋⚖️]/) || line.match(/^[-•*]?\s*\*\*/) || line.match(/^[A-Z][^:]{5,60}:\s/)) break;
          // Check for "Instead:" callout
          if (line.match(/^(Instead:|Rather:|Better:|COMPARE THAT TO:)/i)) {
            const calloutMatch = line.match(/^(Instead:|Rather:|Better:|COMPARE THAT TO:)\s*(.*)/i);
            if (calloutMatch) {
              callout = {
                label: calloutMatch[1],
                text: calloutMatch[2] || '',
              };
              for (let k = j + 1; k < lines.length; k++) {
                const calloutLine = lines[k];
                if (!calloutLine || calloutLine.match(/^[-•*]?\s*\*\*/) || calloutLine.match(/^[🎯📋⚖️]/)) break;
                if (callout) {
                  callout.text += ' ' + calloutLine;
                }
              }
              break;
            }
          }
          description += (description ? ' ' : '') + line;
        }
      } else if (colonPattern && !pointPattern) {
        title = colonPattern[1].trim();
        description = colonPattern[2].trim();
        // Gather additional description from following lines
        for (let j = 1; j < lines.length; j++) {
          const line = lines[j];
          if (line.match(/^[A-Z][^:]{5,60}:\s/) || line.match(/^[🎯📋⚖️]/) || line.match(/^[-•*]?\s*\*\*/)) break;
          // Check for "Instead:" callout
          if (line.match(/^(Instead:|Rather:|Better:|COMPARE THAT TO:)/i)) {
            const calloutMatch = line.match(/^(Instead:|Rather:|Better:|COMPARE THAT TO:)\s*(.*)/i);
            if (calloutMatch) {
              callout = {
                label: calloutMatch[1],
                text: calloutMatch[2] || '',
              };
              for (let k = j + 1; k < lines.length; k++) {
                const calloutLine = lines[k];
                if (!calloutLine || calloutLine.match(/^[-•*]?\s*\*\*/) || calloutLine.match(/^[🎯📋⚖️]/)) break;
                if (callout) {
                  callout.text += ' ' + calloutLine;
                }
              }
              break;
            }
          }
          description += (description ? ' ' : '') + line;
        }
      } else if (pointPattern) {
        // For "Point X:" patterns, extract meaningful title from description
        const desc = pointPattern[1].trim();
        // Look for first sentence or meaningful phrase
        const firstSentence = desc.split(/[.!?]/)[0] || desc;
        if (firstSentence.length > 10 && firstSentence.length < 60) {
          title = firstSentence.trim();
          description = desc.substring(firstSentence.length).trim();
        } else {
          // Use first meaningful words (respect word boundaries)
          const extractedTitle = this.extractTitleFromText(desc, 50);
          title = extractedTitle;
          // Find the title in the original text to get correct substring position
          const titleIndex = desc.indexOf(extractedTitle);
          if (titleIndex >= 0) {
            description = desc.substring(titleIndex + extractedTitle.length).trim();
          } else {
            // Fallback: use split by words
            const words = desc.split(/\s+/);
            const titleWords = extractedTitle.split(/\s+/);
            const titleWordCount = titleWords.length;
            description = words.slice(titleWordCount).join(' ').trim();
          }
        }
        // Gather additional description
        for (let j = 1; j < lines.length; j++) {
          const line = lines[j];
          if (line.match(/^Point\s+\d+/i) || line.match(/^[🎯📋⚖️]/) || line.match(/^[-•*]?\s*\*\*/)) break;
          // Check for "Instead:" callout
          if (line.match(/^(Instead:|Rather:|Better:|COMPARE THAT TO:)/i)) {
            const calloutMatch = line.match(/^(Instead:|Rather:|Better:|COMPARE THAT TO:)\s*(.*)/i);
            if (calloutMatch) {
              callout = {
                label: calloutMatch[1],
                text: calloutMatch[2] || '',
              };
              for (let k = j + 1; k < lines.length; k++) {
                const calloutLine = lines[k];
                if (!calloutLine || calloutLine.match(/^[-•*]?\s*\*\*/) || calloutLine.match(/^[🎯📋⚖️]/)) break;
                if (callout) {
                  callout.text += ' ' + calloutLine;
                }
              }
              break;
            }
          }
          description += (description ? ' ' : '') + line;
        }
      } else if (quotedPattern) {
        // Handle quoted title pattern like "This is normal agent work" → "No, it's not..."
        title = quotedPattern[1].trim();
        description = quotedPattern[2]?.replace(/^"/, '').replace(/"$/, '').trim() || '';
        // Gather additional description from following lines
        for (let j = 1; j < lines.length; j++) {
          const line = lines[j];
          if (line.match(/^"[^"]+"\s/) || line.match(/^[🎯📋⚖️]/) || line.match(/^[-•*]?\s*\*\*/)) break;
          // Check for "Instead:" callout
          if (line.match(/^(Instead:|Rather:|Better:|COMPARE THAT TO:)/i)) {
            const calloutMatch = line.match(/^(Instead:|Rather:|Better:|COMPARE THAT TO:)\s*(.*)/i);
            if (calloutMatch) {
              callout = {
                label: calloutMatch[1],
                text: calloutMatch[2] || '',
              };
              for (let k = j + 1; k < lines.length; k++) {
                const calloutLine = lines[k];
                if (!calloutLine || calloutLine.match(/^[-•*]?\s*\*\*/) || calloutLine.match(/^[🎯📋⚖️]/)) break;
                if (callout) {
                  callout.text += ' ' + calloutLine;
                }
              }
              break;
            }
          }
          description += (description ? ' ' : '') + line;
        }
      } else {
        // Try to extract title from first sentence or phrase
        const firstSentence = content.split(/[.!?]/)[0] || content;
        if (firstSentence.length > 10 && firstSentence.length < 80) {
          title = firstSentence.trim();
          description = content.substring(firstSentence.length).trim();
          description = description.replace(/^[.!?]\s*/, '');
        } else {
          // Use first meaningful words as title (respect word boundaries)
          const extractedTitle = this.extractTitleFromText(content, 60);
          title = extractedTitle;
          // Find the title in the original text to get correct substring position
          const titleIndex = content.indexOf(extractedTitle);
          if (titleIndex >= 0) {
            description = content.substring(titleIndex + extractedTitle.length).trim();
          } else {
            // Fallback: use split by words
            const words = content.split(/\s+/);
            const titleWords = extractedTitle.split(/\s+/);
            const titleWordCount = titleWords.length;
            description = words.slice(titleWordCount).join(' ').trim();
          }
        }
        // Check for "Instead:" callout in description
        const insteadMatch = description.match(/(?:Instead|Rather|Better|COMPARE THAT TO):\s*(.+)/is);
        if (insteadMatch) {
          callout = {
            label: 'Instead:',
            text: insteadMatch[1] || '',
          };
          description = description.replace(/(?:Instead|Rather|Better|COMPARE THAT TO):\s*.+/is, '').trim();
        }
      }
      
      // Clean up title and description - remove markdown artifacts
      title = title.replace(/\*\*/g, '').replace(/\*/g, '').trim();
      description = description.replace(/\*\*/g, '').replace(/\*/g, '').trim();
      description = description.replace(/^[:\-–—\.]\s*/, '');
      
      // Truncate description at word boundary if too long
      if (description.length > 250) {
        description = this.truncateAtWordBoundary(description, 250);
      }
      
      // Ensure title is meaningful - NEVER use "Point X" fallback
      if (!title || title.length < 5 || /^Point\s+\d+$/i.test(title)) {
        // Extract from description instead
        const descTitle = this.extractTitleFromText(description, 50);
        if (descTitle && descTitle.length > 5) {
          title = descTitle;
          // Find the title in the original description to get correct substring position
          const titleIndex = description.indexOf(descTitle);
          if (titleIndex >= 0) {
            description = description.substring(titleIndex + descTitle.length).trim();
          } else {
            // Fallback: use split by words
            const words = description.split(/\s+/);
            const titleWords = descTitle.split(/\s+/);
            const titleWordCount = titleWords.length;
            description = words.slice(titleWordCount).join(' ').trim();
          }
        } else {
          // Last resort: use first words of description
          const words = description.split(/\s+/).slice(0, 5).join(' ');
          if (words.length > 5) {
            title = words;
            // Find the words in the original description
            const wordsIndex = description.indexOf(words);
            if (wordsIndex >= 0) {
              description = description.substring(wordsIndex + words.length).trim();
            } else {
              // Fallback: use split
              const descWords = description.split(/\s+/);
              description = descWords.slice(5).join(' ').trim();
            }
          }
        }
      }
      
      // Skip if we still don't have a good title
      if (!title || title.length < 5) {
        console.log('🔬 [detectThreeColumnCards] Skipping paragraph', i, '- no good title found');
        continue;
      }
      
      cards.push({
        icon: icon || ['🎯', '📋', '⚖️'][i] || '📌',
        title: title,
        description: description || '',
        callout,
      });
    }
    
    // Require exactly 3 cards for three-column layout
    if (cards.length === 3) {
      console.log('🔬 [detectThreeColumnCards] ✅ Found 3 cards:', cards.map(c => ({ 
        title: c.title?.substring(0, 40), 
        descLength: c.description?.length || 0,
        hasCallout: !!c.callout,
      })));
      const combinedText = candidateParagraphs.join('\n\n');
      return {
        type: 'threeColumnCards',
        content: combinedText,
        data: { cards },
        confidence: 0.85,
        startIndex,
        endIndex: startIndex + combinedText.length,
      };
    }
    
    console.log('🔬 [detectThreeColumnCards] ❌ Only found', cards.length, 'cards, need 3');
    if (cards.length > 0) {
      console.log('🔬 [detectThreeColumnCards] Cards found:', cards.map(c => ({ title: c.title?.substring(0, 30) || 'NO TITLE' })));
    }
    return null;
  }
  
  /**
   * Detect numbered steps group
   */
  private detectNumberedStepsGroup(paragraphs: string[], startIndex: number, currentIndex: number): { section: DetectedSection; count: number; totalLength: number } | null {
    const steps: Array<{ title: string; description: string }> = [];
    let i = startIndex;
    let totalLength = 0;
    
    while (i < paragraphs.length && steps.length < 10) {
      const trimmed = paragraphs[i].trim();
      // For ordinals, require comma to avoid matching narrative like "First letter sent"
      const numberedPattern = /^(?:\d+\.|Step\s+\d+:|0?\d+\s|(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth),\s+)/i;
      
      if (numberedPattern.test(trimmed)) {
        const stepData = this.parseNumberedStep(trimmed);
        if (stepData.title || stepData.description) {
          steps.push({
            title: stepData.title || `Step ${steps.length + 1}`,
            description: stepData.description || '',
          });
          totalLength += trimmed.length + 2;
          i++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    if (steps.length >= 2) {
      return {
        section: {
          type: 'numberedSteps',
          content: paragraphs.slice(startIndex, i).join('\n\n'),
          data: { steps },
          confidence: 0.85,
          startIndex: currentIndex,
          endIndex: currentIndex + totalLength,
        },
        count: steps.length,
        totalLength,
      };
    }
    
    return null;
  }
  
  /**
   * Detect timeline group - handles both date patterns and month headers (May:, June:, etc.)
   */
  private detectTimelineGroup(paragraphs: string[], startIndex: number, currentIndex: number): { section: DetectedSection; count: number; totalLength: number } | null {
    const events: Array<{ date: string; title: string; description: string }> = [];
    let i = startIndex;
    let totalLength = 0;
    
    // Pattern 1: Month headers like "May:", "June:", "July:"
    const monthPattern = /^(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec):/i;
    
    // Pattern 2: Full dates like "12 May 2024", "Day 1", "Week 3"
    const datePattern = /(?:\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|Day\s+\d+|Week\s+\d+)/gi;
    
    while (i < paragraphs.length && events.length < 15) {
      const trimmed = paragraphs[i].trim();
      
      // Check for month header pattern first (most common in user's content)
      const monthMatch = trimmed.match(monthPattern);
      if (monthMatch) {
        const month = monthMatch[1];
        const description = trimmed.substring(monthMatch[0].length).trim();
        
        // Extract title from first sentence or phrase
        const firstSentence = description.split(/[.!?]/)[0] || description;
        const title = firstSentence.length > 60 ? firstSentence.substring(0, 60).trim() : firstSentence.trim();
        const desc = description.substring(title.length).trim();
        
        events.push({
          date: month,
          title: title || '',
          description: desc || description,
        });
        
        totalLength += trimmed.length + 2;
        i++;
        
        // Gather continuation lines (until next month header or section break)
        while (i < paragraphs.length) {
          const nextLine = paragraphs[i]?.trim();
          if (!nextLine) {
            i++;
            continue;
          }
          
          // Stop conditions
          if (nextLine.match(monthPattern)) break; // Next month
          if (nextLine.match(/^#+\s/)) break; // Header
          if (nextLine.match(/^[-•*]?\s*\*\*[^*]+\*\*[:\s]/)) break; // Card marker
          if (nextLine.match(/^[🎯📋⚖️🔑💡✅❌📧📝📜💰⚠️📅]\s/)) break; // Emoji marker
          
          // Add to description
          if (events.length > 0) {
            events[events.length - 1].description += ' ' + nextLine;
          }
          totalLength += nextLine.length + 2;
          i++;
        }
        continue;
      }
      
      // Check for date pattern
      const dateMatches = [...trimmed.matchAll(datePattern)];
      if (dateMatches.length > 0) {
        const eventData = this.extractTimelineEvents(trimmed);
        if (eventData.length > 0) {
          events.push(...eventData);
          totalLength += trimmed.length + 2;
          i++;
        } else {
          break;
        }
      } else {
        break;
      }
    }
    
    // Need at least 3 events for a timeline
    if (events.length >= 3) {
      return {
        section: {
          type: 'timeline',
          content: paragraphs.slice(startIndex, i).join('\n\n'),
          data: { events },
          confidence: 0.9,
          startIndex: currentIndex,
          endIndex: currentIndex + totalLength,
        },
        count: events.length,
        totalLength,
      };
    }
    
    return null;
  }
  
  /**
   * Detect comparison cards group (Recoverable vs Not recoverable, Do vs Don't, etc.)
   */
  private detectComparisonGroup(paragraphs: string[], startIndex: number, currentIndex: number): { section: DetectedSection; count: number; totalLength: number } | null {
    // Look for patterns like:
    // "Recoverable:" followed by bullet list
    // "Not recoverable:" followed by bullet list
    const comparisonHeaders = [
      { positive: /^(?:\*\*)?Claimable(?:\*\*)?:?$/i, negative: /^(?:\*\*)?Not\s+claimable(?:\*\*)?:?$/i },
      { positive: /^(?:\*\*)?Recoverable(?:\*\*)?:?$/i, negative: /^(?:\*\*)?Not\s+recoverable(?:\*\*)?:?$/i },
      { positive: /^(?:\*\*)?Do(?:\*\*)?:?$/i, negative: /^(?:\*\*)?Don'?t(?:\*\*)?:?$/i },
      { positive: /^(?:\*\*)?Yes(?:\*\*)?:?$/i, negative: /^(?:\*\*)?No(?:\*\*)?:?$/i },
      { positive: /^(?:\*\*)?(?:The\s+)?New\s+Way(?:\*\*)?:?$/i, negative: /^(?:\*\*)?(?:The\s+)?Old\s+Way(?:\*\*)?:?$/i },
      { positive: /^(?:\*\*)?(?:Do\s+)?Claim(?:\*\*)?:?$/i, negative: /^(?:\*\*)?(?:Don'?t\s+)?Claim(?:\*\*)?:?$/i },
    ];
    
    if (startIndex >= paragraphs.length) return null;
    
    const firstPara = paragraphs[startIndex]?.trim();
    if (!firstPara) return null;
    
    // Check if first paragraph is a comparison header
    for (const { positive, negative } of comparisonHeaders) {
      const isPositiveHeader = positive.test(firstPara);
      const isNegativeHeader = negative.test(firstPara);
      
      if (isPositiveHeader || isNegativeHeader) {
        // Found a comparison header! Now gather the list items
        let i = startIndex + 1;
        let totalLength = firstPara.length + 2;
        const firstItems: string[] = [];
        
        // Collect bullet items for first section
        while (i < paragraphs.length) {
          const line = paragraphs[i]?.trim();
          if (!line) { i++; continue; }
          
          // Check if it's a bullet item
          if (/^[-•*]\s+/.test(line)) {
            firstItems.push(line.replace(/^[-•*]\s+/, '').trim());
            totalLength += line.length + 2;
            i++;
          } else {
            break; // Not a bullet, stop collecting
          }
        }
        
        // Now look for the opposite header
        if (i < paragraphs.length && firstItems.length > 0) {
          const secondHeader = paragraphs[i]?.trim();
          const expectedPattern = isPositiveHeader ? negative : positive;
          
          if (expectedPattern.test(secondHeader)) {
            totalLength += secondHeader.length + 2;
            i++;
            
            const secondItems: string[] = [];
            
            // Collect bullet items for second section
            while (i < paragraphs.length) {
              const line = paragraphs[i]?.trim();
              if (!line) { i++; continue; }
              
              if (/^[-•*]\s+/.test(line)) {
                secondItems.push(line.replace(/^[-•*]\s+/, '').trim());
                totalLength += line.length + 2;
                i++;
              } else {
                break;
              }
            }
            
            if (secondItems.length > 0) {
              // Check for optional footer (paragraph after the lists)
              let footer: string | undefined;
              if (i < paragraphs.length) {
                const nextLine = paragraphs[i]?.trim();
                if (nextLine && !nextLine.match(/^[-•*]\s+/) && nextLine.length < 200) {
                  footer = nextLine;
                  totalLength += nextLine.length + 2;
                  i++;
                }
              }
              
              return {
                section: {
                  type: 'comparisonCards',
                  content: paragraphs.slice(startIndex, i).join('\n\n'),
                  data: {
                    leftCard: {
                      title: isPositiveHeader ? firstPara.replace(/[*:]/g, '').trim() : secondHeader.replace(/[*:]/g, '').trim(),
                      items: isPositiveHeader ? firstItems : secondItems,
                      variant: 'positive',
                    },
                    rightCard: {
                      title: isNegativeHeader ? firstPara.replace(/[*:]/g, '').trim() : secondHeader.replace(/[*:]/g, '').trim(),
                      items: isNegativeHeader ? firstItems : secondItems,
                      variant: 'negative',
                    },
                    footer,
                  },
                  confidence: 0.85,
                  startIndex: currentIndex,
                  endIndex: currentIndex + totalLength,
                },
                count: i - startIndex,
                totalLength,
              };
            }
          }
        }
      }
    }
    
    return null;
  }
  
  /**
   * Detect implicit list - short lines following a header that ends with colon
   * Handles patterns like:
   *   Claimable:
   *   Time spent correcting HMRC errors
   *   Chasing progress on stuck applications
   */
  private detectImplicitList(paragraphs: string[], startIndex: number, currentIndex: number): { section: DetectedSection; count: number; totalLength: number } | null {
    const firstPara = paragraphs[startIndex]?.trim();
    if (!firstPara) return null;
    
    // Check if first line ends with colon (could be bold)
    // Matches: "Claimable:", "**Claimable:**", "Not claimable:", etc.
    const headerMatch = firstPara.match(/^(?:\*\*)?([A-Za-z][^:]{0,60}):(?:\*\*)?$/);
    if (!headerMatch) return null;
    
    const headerText = headerMatch[1].replace(/\*\*/g, '').trim();
    
    // Collect following lines as list items
    const items: string[] = [];
    let i = startIndex + 1;
    let totalLength = firstPara.length + 2;
    
    while (i < paragraphs.length && items.length < 20) {
      const line = paragraphs[i]?.trim();
      if (!line) { i++; continue; }
      
      // Stop conditions - we've hit a new section
      if (line.match(/^(?:\*\*)?[A-Za-z][^:]{0,60}:(?:\*\*)?$/)) break; // Another colon header
      if (line.match(/^#+\s/)) break; // Markdown header
      if (line.match(/^[🎯📋⚖️🔑💡✅❌📧📝📜💰⚠️📅]\s/)) break; // Emoji marker
      if (line.match(/^[-•*]\s*\*\*[^*]+\*\*[:\s]/)) break; // Card marker
      if (line.length > 200) break; // Too long for list item
      
      // Check if it looks like a list item (relatively short, typically no period at end)
      // Or starts with typical list-item patterns
      const isListLike = 
        line.length < 120 ||
        !line.match(/[.!?]\s*$/) ||
        line.match(/^[A-Z][a-z]+\s+(and|or|with|for|about|to)\s/i);
      
      if (isListLike) {
        items.push(line);
        totalLength += line.length + 2;
        i++;
      } else {
        break;
      }
    }
    
    // Need at least 3 items for a meaningful list
    if (items.length >= 3) {
      return {
        section: {
          type: 'bulletList',
          content: paragraphs.slice(startIndex, i).join('\n'),
          data: { 
            title: headerText,
            items,
            variant: 'bullet'
          },
          confidence: 0.8,
          startIndex: currentIndex,
          endIndex: currentIndex + totalLength,
        },
        count: i - startIndex,
        totalLength,
      };
    }
    
    return null;
  }
  
  /**
   * Detect stats group
   */
  private detectStatsGroup(paragraphs: string[], startIndex: number, currentIndex: number): { section: DetectedSection; count: number; totalLength: number } | null {
    const statMatches: Array<{ value: string; label: string; description?: string }> = [];
    let i = startIndex;
    let totalLength = 0;
    
    while (i < paragraphs.length && statMatches.length < 6) {
      const trimmed = paragraphs[i].trim();
      const stats = this.extractStats(trimmed);
      
      if (stats.length >= 1) {
        statMatches.push(...stats);
        totalLength += trimmed.length + 2;
        i++;
      } else {
        break;
      }
    }
    
    if (statMatches.length >= 3) {
      return {
        section: {
          type: 'stats',
          content: paragraphs.slice(startIndex, i).join('\n\n'),
          data: { stats: statMatches, variant: 'flat', columns: Math.min(statMatches.length, 4) },
          confidence: 0.8,
          startIndex: currentIndex,
          endIndex: currentIndex + totalLength,
        },
        count: statMatches.length,
        totalLength,
      };
    }
    
    return null;
  }

  /**
   * Detect the type of a single paragraph
   * Uses precise patterns to detect special components while preserving text
   */
  private detectParagraphType(text: string, startIndex: number): DetectedSection | null {
    const endIndex = startIndex + text.length;
    const trimmed = text.trim();
    
    // Check for explicit callout markers (must start with marker)
    // Also check for patterns like "THE KEY:", "Compare that to:", quotes, etc.
    const calloutPatterns = [
      /^(?:💡|⚠️|✅|❌|📌|🔑|📋|💰)\s*(?:Pro Tip|Note|Warning|Important|Key Point|Remember|Tip)?:?/i,
      /^THE\s+(?:KEY|PROBLEM|SOLUTION|ANSWER):/i,
      /^(?:Compare\s+that\s+to|But\s+this\s+builds|Specific\s+requests\s+get\s+results):/i,
      /^(?:Quote\s+Them\s+Directly|State\s+the\s+Impact\s+Clearly|Make\s+Specific\s+Demands|Close\s+Professionally):/i,
      /^(?:Coming\s+Next\s+Week|Next\s+Week):/i,
      /^Final\s+settlement:/i,
      /^That'?s\s+what\s+CRG\d+\s+exists\s+for/i,
      /^CRG\d+:/i,
      /^HMRC'?s\s+internal\s+guidance/i,
      /^Both\s+applied[.:]?$/i,
      /^Not\s+anger[.:]?\s*(?:Evidence)?[.:]?$/i,
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
    
    // Check for bold-only line as heading
    // Handles: "**Title here**" or fragmented "**word1** **word2**" or partial "The **key** point"
    const boldPattern = /\*\*([^*]+)\*\*/g;
    const boldMatches = [...trimmed.matchAll(boldPattern)];
    const trimmedNoBold = trimmed.replace(/\*\*/g, '').trim();
    
    // If line is short and contains bold markers
    if (trimmed.length < 150 && boldMatches.length > 0 && !trimmed.includes('\n')) {
      // Calculate how much of the line is bold
      const boldTextLength = boldMatches.reduce((sum, m) => sum + m[1].length, 0);
      const totalTextLength = trimmedNoBold.length;
      const boldRatio = totalTextLength > 0 ? boldTextLength / totalTextLength : 0;
      
      // If more than 60% of the text is bold, treat as heading
      // OR if it's entirely wrapped in bold markers
      const isFullyBold = trimmed.match(/^\*\*[^*]+\*\*$/) || 
                          (trimmed.match(/^\*\*.*\*\*$/) && !trimmed.match(/\*\*[^*]+\*\*[^*]+/));
      
      if (boldRatio > 0.6 || isFullyBold) {
        return {
          type: 'sectionHeading',
          content: text,
          data: { title: trimmedNoBold },
          confidence: 0.85,
          startIndex,
          endIndex,
        };
      }
    }
    
    // Check for section heading patterns (The X trap, Why X fails, How to X, etc.)
    const headingPatterns = [
      /^The\s+\w+\s+(?:trap|problem|issue|challenge|solution|answer|key|secret)/i,
      /^Why\s+(?:most|your|the|this)?\s*\w+\s*(?:fail|work|matter|was|were)/i,
      /^How\s+to\s+/i,
      /^What\s+(?:actually|really)\s+(?:works|happened|matters)/i,
      /^Making\s+\w+\s+worth/i,
      /^Professional\s+fee\s+recovery/i,
      /^The\s+October\s+2024\s+change/i,
      /^The\s+structure\s+that\s+(?:actually\s+)?works/i,
      /^Documentation\s+that\s+/i,
      /^The\s+language\s+that\s+/i,
      /^The\s+Economics/i,
      /^The\s+Real\s+Figure/i,
      /^Start\s+Now/i,
      /^Counter-strategy/i,
      // Additional patterns for HMRC content
      /^The\s+£[\d,]+(?:\.\d+)?\s+(?:that|which|recovery)/i,  // "The £48.40 that became £3,750"
      /^What'?s\s+actually\s+/i,  // "What's actually claimable"
      /^The\s+documentation\s+that\s+/i,  // "The documentation that wins"
      /^The\s+template\s+that\s+/i,  // "The template that gets paid"
      /^When\s+HMRC\s+/i,  // "When HMRC says no"
      /^The\s+escalation\s+that\s+/i,  // "The escalation that doubles your chances"
      /^The\s+practice-?wide\s+/i,  // "The practice-wide opportunity"
      /^Start\s+a\s+simple\s+/i,  // "Start a simple system"
      /^HMRC'?s\s+common\s+/i,  // "HMRC's common pushbacks"
      /^The\s+pushback\s+/i,  // "The pushback playbook"
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
    // For ordinals like "First", "Second", require a COMMA after to avoid matching narrative like "First letter sent"
    // Pattern: "1.", "01 ", "Step 1:", or "First, ..." (with comma)
    const numberedStepPattern = /^(?:\d+\.|Step\s+\d+:|0?\d+\s|(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth),\s+)/i;
    
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
    // Reduced threshold to be less aggressive
    if (trimmed.length < 10) {
      return null; // Skip very short paragraphs, they'll be merged
    }
    
    // Clean up the text - remove any remaining markdown artifacts
    let cleanText = trimmed;
    
    // Remove any remaining asterisks
    cleanText = cleanText.replace(/\*\*/g, '').replace(/\*/g, '');
    
    // Fix sentences that start with periods
    cleanText = cleanText.replace(/^\.\s+/, '');
    
    // Remove only consecutive duplicate sentences (not all duplicates)
    const sentences = cleanText.split(/(?<=[.!?])\s+/);
    const dedupedSentences: string[] = [];
    for (let i = 0; i < sentences.length; i++) {
      const trimmed = sentences[i].trim();
      if (!trimmed) continue;
      
      // Only skip if it's the same as the immediately previous sentence
      if (i > 0 && dedupedSentences[dedupedSentences.length - 1] === trimmed) {
        continue; // Skip consecutive duplicates only
      }
      dedupedSentences.push(trimmed);
    }
    cleanText = dedupedSentences.join(' ');
    
    // Skip if text is now empty or just punctuation
    if (!cleanText.trim() || /^[\.\*\s\-]+$/.test(cleanText.trim())) {
      return null;
    }
    
    // Removed per-paragraph logging to avoid Railway rate limits
    // Issue is traced to constructor/normalization level
    
    return {
      type: 'paragraph',
      content: cleanText,
      data: { text: cleanText },
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
    // DISABLED: Second-pass card detection was too aggressive - converted normal paragraphs to cards
    console.log('🔍 [SectionDetector] postProcess: Skipping detectCrossSectionPatterns (disabled)');
    console.log('🔍 [SectionDetector] postProcess: Using grouped sections directly, count:', grouped.length);
    // this.sections = this.detectCrossSectionPatterns(grouped);
    this.sections = grouped;
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
              let content = s.content.trim();
              
              // Clean up content
              content = content.replace(/\*\*/g, '').replace(/\*/g, '');
              
              // Try to extract a meaningful title
              // Look for patterns like "Missing the Target", "No Evidence Trail", etc.
              const titlePatterns = [
                /(?:^|\n)([A-Z][^.!?]{10,60}?)(?:\.|:|\n)/,
                /(?:^|\n)(Missing|No|Wrong|The|Why|How|What|Making|Professional|States|Unreasonable|Mistake)/i,
              ];
              
              let title = '';
              for (const pattern of titlePatterns) {
                const match = content.match(pattern);
                if (match && match[1]) {
                  title = match[1].trim();
                  // Extract up to first sentence or 50 chars
                  if (title.length > 50) {
                    title = title.substring(0, 50).split(/[.!?]/)[0].trim();
                  }
                  break;
                }
              }
              
              // Fallback: use first sentence or first 40 chars
              if (!title) {
                const firstSentence = content.split(/[.!?]/)[0] || content;
                title = firstSentence.substring(0, 40).trim();
                if (title.length < 10) {
                  title = content.substring(0, 40).trim();
                }
              }
              
              // Remove title from description
              let description = content;
              if (title && content.startsWith(title)) {
                description = content.substring(title.length).trim();
              }
              // Remove leading punctuation
              description = description.replace(/^[:\-–—\.]\s*/, '');
              
              return {
                icon: ['🎯', '📋', '⚖️'][idx] || '📌',
                title: title || `Point ${idx + 1}`,
                description: description.substring(0, 200),
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
   * Ensures sentences aren't broken
   */
  private processParagraphGroup(paragraphs: DetectedSection[]): DetectedSection[] {
    if (paragraphs.length === 0) return [];
    
    const result: DetectedSection[] = [];
    const IMAGE_FREQUENCY = 4; // Insert image every N paragraphs
    let imageCounter = 0;
    
    // NEW APPROACH: Respect author's paragraph structure!
    // Short paragraphs that end with punctuation are INTENTIONAL for emphasis
    // Only merge paragraphs that are clearly incomplete (no ending punctuation)
    
    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      let content = paragraph.content.trim();
      
      // Clean up content - PRESERVE bold markers for rendering!
      // Bold markers (**text**) will be rendered as <strong> by the Paragraph component
      content = content.replace(/^\.\s+/, ''); // Remove leading periods only
      
      // Fix broken sentences (like "collectors for it\n. The money")
      content = content.replace(/([a-z])\s*\n\s*\.\s+([A-Z])/g, '$1. $2');
      
      // Skip empty or artifact-only paragraphs
      if (!content || /^[\.\*\s\-]+$/.test(content)) continue;
      
      // Check if this is a complete sentence/paragraph (ends with . ! ?)
      const isCompleteParagraph = /[.!?]$/.test(content.trim());
      
      // If incomplete, try to merge with next paragraph (preserve bold markers)
      if (!isCompleteParagraph && i + 1 < paragraphs.length) {
        let nextContent = paragraphs[i + 1].content.trim();
        content = content + ' ' + nextContent;
        i++; // Skip next paragraph since we merged it
      }
      
      // Skip if too short after cleaning
      if (content.length < 10) continue;
      
      // Every Nth paragraph, convert to textWithImage (if long enough)
      if (imageCounter > 0 && imageCounter % IMAGE_FREQUENCY === 0 && content.length > 200) {
        result.push({
          type: 'textWithImage',
          content: content,
          data: {
            paragraphs: [content],
            imageAlt: this.generateImageAlt(content),
            imagePosition: imageCounter % 2 === 0 ? 'right' : 'left',
          },
          confidence: 0.7,
          startIndex: paragraph.startIndex,
          endIndex: paragraph.endIndex,
        });
      } else {
        // Add each paragraph as-is - respect author's intentional structure!
        result.push({
          type: 'paragraph',
          content: content,
          data: { text: content },
          confidence: 0.5,
          startIndex: paragraph.startIndex,
          endIndex: paragraph.endIndex,
        });
      }
      
      imageCounter++;
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
    // Clean text first
    let cleanText = text
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/^\.\s+/, '')
      .trim();
    
    // Match various formats: "1.", "01", "Step 1:", "First,", etc.
    let number = 1;
    let content = cleanText;
    
    // Try to extract number
    const numberMatch = cleanText.match(/^(\d+)\.|^0?(\d+)\s|Step\s+(\d+):/i);
    if (numberMatch) {
      number = parseInt(numberMatch[1] || numberMatch[2] || numberMatch[3] || '1', 10);
      content = cleanText.replace(/^(?:\d+\.|0?\d+\s|Step\s+\d+:)\s*/i, '');
    } else {
      // Check for ordinal words
      const ordinalMap: Record<string, number> = {
        'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
        'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
      };
      // Only match ordinals followed by comma (e.g., "First, submit..." not "First letter sent")
      const ordinalMatch = cleanText.match(/^(First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth),\s+/i);
      if (ordinalMatch) {
        number = ordinalMap[ordinalMatch[1].toLowerCase()] || 1;
        content = cleanText.replace(/^(?:First|Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth|Tenth),\s+/i, '');
      }
    }
    
    // Split by colon, dash, or newline - but preserve sentence structure
    const colonIndex = content.indexOf(':');
    const dashIndex = content.search(/[–—\-]\s/);
    
    let title = '';
    let description = '';
    
    if (colonIndex > 0 && colonIndex < 100) {
      // Has a colon - use it as separator
      title = content.substring(0, colonIndex).trim();
      description = content.substring(colonIndex + 1).trim();
    } else if (dashIndex > 0 && dashIndex < 100) {
      // Has a dash - use it as separator
      title = content.substring(0, dashIndex).trim();
      description = content.substring(dashIndex + 1).trim();
    } else {
      // No clear separator - use first sentence as title, rest as description
      const firstSentenceMatch = content.match(/^([^.!?]+[.!?])/);
      if (firstSentenceMatch) {
        title = firstSentenceMatch[1].trim();
        description = content.substring(firstSentenceMatch[0].length).trim();
      } else {
        // Fallback: first 50 chars as title
        title = content.substring(0, 50).trim();
        description = content.substring(50).trim();
      }
    }
    
    // Clean up title and description
    title = title.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^\.\s+/, '').trim();
    description = description.replace(/\*\*/g, '').replace(/\*/g, '').replace(/^\.\s+/, '').trim();
    
    return {
      number,
      title: title || 'Step',
      description: description || content.trim(),
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
    
    // STRICT: Only match stat-like patterns (not narrative prose)
    // Pattern must be at START of line and have explicit separator (-, –, :)
    // This prevents "£48.40 supposedly owed" in narrative from matching
    
    // Fallback: Extract percentages ONLY if in stat-like format at line start
    // e.g., "92% - success rate" but NOT "about 92% of cases"
    const percentages = [...text.matchAll(/^[-•*]?\s*(\d+(?:\.\d+)?)\s*%\s*[-–:]\s*(.+)/gim)];
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
    
    // Extract money values ONLY if in explicit format at line start
    // e.g., "£1,200 - Professional fees" or "**£1,200**: Settlement"
    // NOT "for £48.40 supposedly owed" in middle of sentence
    const money = [...text.matchAll(/^[-•*]?\s*\*?\*?(£\d+(?:,\d{3})*(?:\.\d+)?)\*?\*?\s*[-–:]\s*(.+)/gim)];
    for (const match of money) {
      const value = match[1];
      if (!seenValues.has(value)) {
        stats.push({
          value,
          label: this.cleanLabel(match[2]),
        });
        seenValues.add(value);
      }
    }
    
    // Extract large numbers ONLY if in explicit format at line start
    // e.g., "17 - Hours spent" NOT "spent 17 hours on the phone"
    const numbers = [...text.matchAll(/^[-•*]?\s*\*?\*?(\d{1,3}(?:,\d{3})+)\*?\*?\s*[-–:]\s*(.+)/gim)];
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

