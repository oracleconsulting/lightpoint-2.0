/**
 * Content Extraction Pipeline V6.2
 * 
 * Key fix: Smart paragraph detection for continuous text
 * - Detects sentence boundaries
 * - Groups 2-4 sentences per paragraph
 * - Inserts visuals every 2-3 paragraphs for better flow
 */

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface ExtractedStat {
  value: string;
  prefix?: string;
  suffix?: string;
  label: string;
  context?: string;
  category: 'volume' | 'percentage' | 'money' | 'time' | 'comparison';
  sentiment: 'positive' | 'negative' | 'neutral';
  sourceQuote: string;
  groupId: string;
}

export interface ExtractedQuote {
  text: string;
  attribution?: string;
  type: 'charter' | 'guidance' | 'example' | 'callout' | 'closing';
  emphasis: 'high' | 'medium' | 'low';
}

export interface ExtractedListItem {
  title: string;
  description?: string;
}

export interface ExtractedList {
  title: string;
  items: ExtractedListItem[];
  type: 'checklist' | 'bullet' | 'numbered' | 'process';
  actionable: boolean;
}

export interface ExtractedTimelineEvent {
  date: string;
  description: string;
  type: 'action' | 'delay' | 'failure' | 'success' | 'neutral';
}

export interface ExtractedTimeline {
  title: string;
  events: ExtractedTimelineEvent[];
}

export interface ExtractedSection {
  heading: string;
  content: string;
  wordCount: number;
  keyPoints: string[];
  position: 'opening' | 'middle' | 'closing';
}

export interface ExtractedProcess {
  title: string;
  steps: {
    number: string;
    title: string;
    description: string;
  }[];
}

export interface ExtractionResult {
  stats: ExtractedStat[];
  quotes: ExtractedQuote[];
  lists: ExtractedList[];
  timeline: ExtractedTimeline | null;
  sections: ExtractedSection[];
  processes: ExtractedProcess[];
  metadata: {
    totalWords: number;
    statCount: number;
    hasTimeline: boolean;
    hasChecklist: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// SMART TEXT PROCESSING
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Split continuous text into sentences
 */
function splitIntoSentences(text: string): string[] {
  // Handle common abbreviations that shouldn't be split
  const protectedText = text
    .replace(/Mr\./g, 'Mr##')
    .replace(/Mrs\./g, 'Mrs##')
    .replace(/Dr\./g, 'Dr##')
    .replace(/Ms\./g, 'Ms##')
    .replace(/vs\./g, 'vs##')
    .replace(/etc\./g, 'etc##')
    .replace(/i\.e\./g, 'i##e##')
    .replace(/e\.g\./g, 'e##g##')
    .replace(/gov\.uk/g, 'gov##uk');
  
  // Split on sentence endings
  const sentences = protectedText
    .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    .map(s => s
      .replace(/##/g, '.')
      .trim()
    )
    .filter(s => s.length > 10);
  
  return sentences;
}

/**
 * Detect if a sentence looks like a heading
 */
function isLikelyHeading(sentence: string): boolean {
  // Short, no period at end, starts with capital
  if (sentence.length > 80) return false;
  if (sentence.endsWith('.')) return false;
  
  // Common heading patterns
  const headingPatterns = [
    /^The\s+\w+\s+(trap|problem|solution|answer|question)/i,
    /^Why\s+/i,
    /^How\s+to\s+/i,
    /^What\s+/i,
    /^(Making|Building|Creating|Getting)\s+/i,
    /\s+(that works|that fails|you need)/i,
    /^Professional\s+fee/i,
    /^The\s+October\s+\d{4}/i,
  ];
  
  return headingPatterns.some(p => p.test(sentence));
}

/**
 * Group sentences into paragraphs (2-3 sentences each for readability)
 * 
 * CRITICAL: Creates smaller, more digestible paragraphs
 */
function groupIntoParagraphs(sentences: string[]): { type: 'heading' | 'paragraph'; text: string }[] {
  const result: { type: 'heading' | 'paragraph'; text: string }[] = [];
  let currentParagraph: string[] = [];
  let currentCharCount = 0;
  
  sentences.forEach((sentence, idx) => {
    // Check if this looks like a heading
    if (isLikelyHeading(sentence)) {
      // Flush current paragraph first
      if (currentParagraph.length > 0) {
        result.push({ type: 'paragraph', text: currentParagraph.join(' ') });
        currentParagraph = [];
        currentCharCount = 0;
      }
      result.push({ type: 'heading', text: sentence });
      return;
    }
    
    currentParagraph.push(sentence);
    currentCharCount += sentence.length;
    
    // Create paragraph based on multiple conditions:
    const nextSentence = sentences[idx + 1];
    const isNaturalBreak = nextSentence && /^(But|However|Yet|So|The|This|That|If|When|After|Before|While|Although|Because|Since|Therefore|Meanwhile|Additionally|Furthermore|Moreover|In\s+fact|For\s+example|In\s+other\s+words)\s/i.test(nextSentence);
    
    const shouldBreak = 
      // Max 3 sentences per paragraph
      currentParagraph.length >= 3 ||
      // Or 2 sentences if char count is high
      (currentParagraph.length >= 2 && currentCharCount > 300) ||
      // Or at natural transition points
      (currentParagraph.length >= 2 && isNaturalBreak) ||
      // Or after a question
      (currentParagraph.length >= 2 && sentence.endsWith('?')) ||
      // Or if single sentence is very long
      (currentParagraph.length === 1 && sentence.length > 250);
    
    if (shouldBreak) {
      result.push({ type: 'paragraph', text: currentParagraph.join(' ') });
      currentParagraph = [];
      currentCharCount = 0;
    }
  });
  
  // Flush remaining
  if (currentParagraph.length > 0) {
    result.push({ type: 'paragraph', text: currentParagraph.join(' ') });
  }
  
  console.log(`📝 groupIntoParagraphs: ${sentences.length} sentences → ${result.length} blocks`);
  
  return result;
}

/**
 * Smart paragraph splitting - handles ALL content formats
 * 
 * Key fix: Properly handles HTML content, markdown, and continuous text
 * CRITICAL: Always splits long text into multiple paragraphs
 */
function smartSplitContent(content: string): { type: 'heading' | 'paragraph'; text: string }[] {
  console.log(`📝 smartSplitContent input: ${content.length} chars`);
  
  // Step 1: Normalize the content
  let normalized = content
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Convert HTML paragraph tags to double newlines
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/p>/gi, '\n\n')
    // Convert <br> tags to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    // Convert HTML headings to markdown-style
    .replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (_, level, text) => `\n\n${'#'.repeat(parseInt(level))} ${text.trim()}\n\n`)
    // Remove other HTML tags but keep content
    .replace(/<[^>]+>/g, '')
    // Normalize multiple newlines to exactly two
    .replace(/\n{3,}/g, '\n\n')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
  
  const paragraphBreakCount = (normalized.match(/\n\n/g) || []).length;
  console.log(`📝 After normalization: ${normalized.length} chars, ${paragraphBreakCount} paragraph breaks`);
  
  // CRITICAL: If content is long but has NO paragraph breaks, force sentence-based splitting
  if (normalized.length > 500 && paragraphBreakCount < 3) {
    console.log(`⚠️ Long content (${normalized.length} chars) with only ${paragraphBreakCount} breaks - forcing sentence split`);
    const sentences = splitIntoSentences(normalized);
    console.log(`📝 Sentence split: ${sentences.length} sentences`);
    if (sentences.length >= 3) {
      return groupIntoParagraphs(sentences);
    }
  }
  
  // Step 2: Split on paragraph boundaries
  const rawParts = normalized.split(/\n\n+/);
  console.log(`📝 Raw split: ${rawParts.length} parts`);
  
  const result: { type: 'heading' | 'paragraph'; text: string }[] = [];
  
  for (const part of rawParts) {
    const trimmed = part.trim();
    if (trimmed.length < 10) continue; // Skip very short fragments
    
    // Check for markdown headings
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      result.push({ type: 'heading', text: headingMatch[2].trim() });
      continue;
    }
    
    // Check if it looks like a heading (short, no period, title-case)
    if (isLikelyHeading(trimmed)) {
      result.push({ type: 'heading', text: trimmed });
      continue;
    }
    
    // Check if this "paragraph" is actually multiple paragraphs joined by single newlines
    if (trimmed.includes('\n') && trimmed.length > 200) {
      const subParts = trimmed.split(/\n/).filter(s => s.trim().length > 20);
      
      if (subParts.length >= 2) {
        for (const subPart of subParts) {
          const subTrimmed = subPart.trim();
          if (isLikelyHeading(subTrimmed)) {
            result.push({ type: 'heading', text: subTrimmed });
          } else if (subTrimmed.length > 20) {
            // If sub-part is still long, split it further
            if (subTrimmed.length > 400) {
              const sentences = splitIntoSentences(subTrimmed);
              const grouped = groupIntoParagraphs(sentences);
              result.push(...grouped);
            } else {
              result.push({ type: 'paragraph', text: subTrimmed });
            }
          }
        }
        continue;
      }
    }
    
    // CRITICAL: Any paragraph over 300 chars should be split by sentences
    if (trimmed.length > 300) {
      const sentences = splitIntoSentences(trimmed);
      if (sentences.length >= 2) {
        const grouped = groupIntoParagraphs(sentences);
        result.push(...grouped);
        continue;
      }
    }
    
    // Regular paragraph
    result.push({ type: 'paragraph', text: trimmed });
  }
  
  // CRITICAL: If we still have very few blocks, ALWAYS fall back to sentence splitting
  if (result.length < 8 && content.length > 800) {
    console.log(`⚠️ Only ${result.length} blocks from ${content.length} chars - forcing sentence splitting`);
    const sentences = splitIntoSentences(normalized);
    console.log(`📝 Sentence fallback: ${sentences.length} sentences`);
    if (sentences.length >= 5) {
      return groupIntoParagraphs(sentences);
    }
  }
  
  console.log(`📝 Final result: ${result.length} blocks (${result.filter(b => b.type === 'heading').length} headings, ${result.filter(b => b.type === 'paragraph').length} paragraphs)`);
  
  return result;
}

/**
 * Apply Gamma-style inline highlighting
 */
function applyInlineHighlighting(text: string): string {
  return text
    // Currency values
    .replace(/(£\d{1,3}(?:,\d{3})*(?:\.\d+)?)/g, '<span class="text-emerald-400 font-semibold">$1</span>')
    // Percentages
    .replace(/(\d{1,3}(?:\.\d+)?%)/g, '<span class="text-cyan-400 font-semibold">$1</span>')
    // Large numbers with commas
    .replace(/(\d{1,3}(?:,\d{3})+)/g, '<span class="text-cyan-400 font-semibold">$1</span>')
    // Time durations
    .replace(/(\d+)\s+(days?|weeks?|months?|years?|hours?|minutes?)/gi, '<span class="text-amber-400 font-semibold">$1 $2</span>');
}

// ═══════════════════════════════════════════════════════════════════════════
// AI EXTRACTION PROMPT
// ═══════════════════════════════════════════════════════════════════════════

export const EXTRACTION_PROMPT = `You are a content extraction system. Extract structured data from a blog post.

## EXTRACT THESE ELEMENTS

### STATS
Find ALL numbers:
- value: exact number (keep commas)
- prefix: £, $ etc.
- suffix: %, K, minutes etc.
- label: what it measures
- context: surrounding context
- category: volume | percentage | money | time | comparison
- sentiment: positive | negative | neutral
- groupId: opening | middle | closing | adjudicator | success | ungrouped

### QUOTES
Find quotes, Charter references, guidance citations:
- text: exact quote
- attribution: source
- type: charter | guidance | example | callout
- emphasis: high | medium | low

### LISTS
Find ALL lists:
- title: list heading
- items: [{ title: "text", description: "detail" }]
- type: checklist | bullet | numbered | process

### TIMELINE
Sequential dates:
- title: heading
- events: [{ date, description, type: action|delay|failure|success }]

### PROCESSES
Multi-step explanations (MUST have real titles from text):
- title: process name
- steps: [{ number: "01", title: "Real Title Here", description: "explanation" }]

Example: "Why most complaints fail" with steps like:
- "Missing the target entirely" (not "Step 1")
- "No evidence trail" (not "Step 2")
- "Wrong resolution request" (not "Step 3")

## OUTPUT

Return ONLY valid JSON:
{
  "stats": [...],
  "quotes": [...],
  "lists": [...],
  "timeline": {...} or null,
  "processes": [...]
}

CRITICAL: Never use placeholder text. Extract actual content.`;

// ═══════════════════════════════════════════════════════════════════════════
// AI EXTRACTION
// ═══════════════════════════════════════════════════════════════════════════

export async function extractContent(
  content: string,
  apiKey: string
): Promise<ExtractionResult> {
  
  console.log('🔍 Starting AI extraction...');
  
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'https://lightpoint.uk',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: `Extract from:\n\n${content}` },
      ],
      temperature: 0.1,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    throw new Error(`Extraction API failed: ${response.statusText}`);
  }

  const data = await response.json();
  const aiOutput = data.choices[0].message.content;

  try {
    const cleaned = aiOutput.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);
    
    console.log(`✅ AI extracted: ${result.stats?.length || 0} stats, ${result.quotes?.length || 0} quotes, ${result.lists?.length || 0} lists`);
    
    return validateExtractionResult(result);
  } catch (e) {
    console.error('Parse error:', e);
    return {
      stats: [], quotes: [], lists: [], timeline: null, sections: [], processes: [],
      metadata: { totalWords: 0, statCount: 0, hasTimeline: false, hasChecklist: false }
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

function validateExtractionResult(result: any): ExtractionResult {
  return {
    stats: (result.stats || []).filter((s: any) => s?.value && s?.label).map((s: any) => ({
      value: String(s.value),
      prefix: s.prefix,
      suffix: s.suffix,
      label: String(s.label),
      context: s.context,
      category: s.category || 'volume',
      sentiment: s.sentiment || 'neutral',
      sourceQuote: s.sourceQuote || '',
      groupId: s.groupId || 'ungrouped',
    })),
    quotes: (result.quotes || []).filter((q: any) => q?.text?.length > 10).map((q: any) => ({
      text: String(q.text),
      attribution: q.attribution,
      type: q.type || 'callout',
      emphasis: q.emphasis || 'medium',
    })),
    lists: (result.lists || []).filter((l: any) => l?.items?.length > 0).map((l: any) => ({
      title: String(l.title || 'List'),
      items: l.items.map((i: any) => ({
        title: String(i.title || i || ''),
        description: i.description,
      })).filter((i: any) => i.title.length > 2 && !/^(step|item)\s*\d*$/i.test(i.title)),
      type: l.type || 'bullet',
      actionable: l.actionable ?? false,
    })).filter((l: any) => l.items.length > 0),
    timeline: result.timeline?.events?.length > 0 ? {
      title: String(result.timeline.title || 'Timeline'),
      events: result.timeline.events.filter((e: any) => e?.date && e?.description).map((e: any) => ({
        date: String(e.date),
        description: String(e.description),
        type: e.type || 'neutral',
      })),
    } : null,
    sections: [],
    processes: (result.processes || []).filter((p: any) => {
      const validSteps = (p.steps || []).filter((s: any) => 
        s?.title?.length > 3 && !/^(step|item)\s*\d*$/i.test(s.title)
      );
      return validSteps.length >= 2;
    }).map((p: any) => ({
      title: String(p.title || ''),
      steps: p.steps.filter((s: any) => s?.title?.length > 3).map((s: any, i: number) => ({
        number: s.number || String(i + 1).padStart(2, '0'),
        title: String(s.title),
        description: String(s.description || ''),
      })),
    })),
    metadata: {
      totalWords: result.metadata?.totalWords || 0,
      statCount: result.stats?.length || 0,
      hasTimeline: !!result.timeline?.events?.length,
      hasChecklist: (result.lists || []).some((l: any) => l.type === 'checklist'),
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT MAPPING
// ═══════════════════════════════════════════════════════════════════════════

export interface MappedComponent {
  type: string;
  props: Record<string, any>;
}

function sentimentToColor(sentiment: string): string {
  return sentiment === 'positive' ? 'green' : sentiment === 'negative' ? 'red' : 'blue';
}

export function mapToComponents(
  extraction: ExtractionResult,
  contentBlocks: { type: 'heading' | 'paragraph'; text: string }[]
): MappedComponent[] {
  const components: MappedComponent[] = [];
  
  // Organize stats by group
  const statGroups = new Map<string, ExtractedStat[]>();
  extraction.stats.forEach(stat => {
    const group = statGroups.get(stat.groupId) || [];
    group.push(stat);
    statGroups.set(stat.groupId, group);
  });
  
  const usedGroups = new Set<string>();
  const usedQuotes = new Set<number>();
  const usedLists = new Set<number>();
  
  // Visual insertion points (after every N paragraphs)
  let paragraphCount = 0;
  let visualsInserted = 0;
  const totalParagraphs = contentBlocks.filter(b => b.type === 'paragraph').length;
  
  // Calculate optimal visual insertion points
  const visualInsertionInterval = Math.max(2, Math.floor(totalParagraphs / 8));

  console.log(`📦 Mapping ${contentBlocks.length} blocks (${totalParagraphs} paragraphs) with ${extraction.stats.length} stats`);
  console.log(`📦 Visual insertion interval: every ${visualInsertionInterval} paragraphs`);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Opening stats
  // ─────────────────────────────────────────────────────────────────────────
  const openingStats = statGroups.get('opening') || [];
  if (openingStats.length >= 2) {
    usedGroups.add('opening');
    components.push({
      type: 'HorizontalStatRow',
      props: {
        stats: openingStats.slice(0, 3).map(s => ({
          metric: s.value, prefix: s.prefix, suffix: s.suffix,
          label: s.label, sublabel: s.context, color: sentimentToColor(s.sentiment),
        })),
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Content blocks with interleaved visuals
  // ─────────────────────────────────────────────────────────────────────────
  
  // Pre-calculate visual insertion schedule
  const visualSchedule: Map<number, string> = new Map();
  visualSchedule.set(2, 'process');      // After 2nd paragraph: process flow
  visualSchedule.set(4, 'quote');        // After 4th: first quote
  visualSchedule.set(6, 'timeline');     // After 6th: timeline
  visualSchedule.set(9, 'quote');        // After 9th: second quote
  visualSchedule.set(12, 'checklist');   // After 12th: checklist
  visualSchedule.set(15, 'stats');       // After 15th: middle stats
  visualSchedule.set(18, 'quote');       // After 18th: third quote
  visualSchedule.set(22, 'list');        // After 22nd: bullet list
  visualSchedule.set(26, 'stats');       // After 26th: closing stats
  
  contentBlocks.forEach((block) => {
    // Headings
    if (block.type === 'heading') {
      components.push({
        type: 'SectionHeading',
        props: { text: block.text },
      });
      return;
    }
    
    // Paragraph - apply inline highlighting
    const highlightedText = applyInlineHighlighting(block.text);
    components.push({
      type: 'TextSection',
      props: {
        content: `<p>${highlightedText}</p>`,
      },
    });
    
    paragraphCount++;
    
    // ─────────────────────────────────────────────────────────────────────
    // Insert visuals at scheduled points
    // ─────────────────────────────────────────────────────────────────────
    const scheduledVisual = visualSchedule.get(paragraphCount);
    
    if (scheduledVisual === 'process' && extraction.processes.length > 0) {
      const process = extraction.processes[0];
      components.push({
        type: 'NumberedProcessFlowV6',
        props: { title: process.title, steps: process.steps },
      });
      visualsInserted++;
    }
    
    if (scheduledVisual === 'quote') {
      const quote = extraction.quotes.find((_, i) => !usedQuotes.has(i));
      if (quote) {
        usedQuotes.add(extraction.quotes.indexOf(quote));
        components.push({
          type: 'QuoteCalloutV6',
          props: {
            text: quote.text,
            attribution: quote.attribution,
            accent: quote.type === 'charter' ? 'cyan' : 'purple',
          },
        });
        visualsInserted++;
      }
    }
    
    if (scheduledVisual === 'timeline' && extraction.timeline) {
      components.push({
        type: 'TableTimeline',
        props: {
          title: extraction.timeline.title,
          events: extraction.timeline.events,
        },
      });
      visualsInserted++;
    }
    
    if (scheduledVisual === 'checklist') {
      const checklist = extraction.lists.find((l, i) => l.type === 'checklist' && !usedLists.has(i));
      if (checklist) {
        usedLists.add(extraction.lists.indexOf(checklist));
        components.push({
          type: 'GridChecklist',
          props: {
            title: checklist.title,
            items: checklist.items.map((item, i) => ({
              number: i + 1,
              title: item.title,
              description: item.description || '',
            })),
          },
        });
        visualsInserted++;
      }
    }
    
    if (scheduledVisual === 'list') {
      const bulletList = extraction.lists.find((l, i) => l.type === 'bullet' && !usedLists.has(i));
      if (bulletList) {
        usedLists.add(extraction.lists.indexOf(bulletList));
        components.push({
          type: 'BulletList',
          props: {
            title: bulletList.title,
            items: bulletList.items.map(item => item.title),
          },
        });
        visualsInserted++;
      }
    }
    
    if (scheduledVisual === 'stats') {
      // Try different stat groups
      const statGroupNames = ['middle', 'adjudicator', 'closing', 'success', 'ungrouped'];
      for (const groupName of statGroupNames) {
        const stats = statGroups.get(groupName);
        if (stats && stats.length >= 2 && !usedGroups.has(groupName)) {
          usedGroups.add(groupName);
          components.push({
            type: 'HorizontalStatRow',
            props: {
              stats: stats.slice(0, 3).map(s => ({
                metric: s.value, prefix: s.prefix, suffix: s.suffix,
                label: s.label, sublabel: s.context, color: sentimentToColor(s.sentiment),
              })),
            },
          });
          visualsInserted++;
          break;
        }
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Remaining visuals at end
  // ─────────────────────────────────────────────────────────────────────────
  
  // Timeline if not added
  if (extraction.timeline && !components.some(c => c.type === 'TableTimeline')) {
    components.push({
      type: 'TableTimeline',
      props: { title: extraction.timeline.title, events: extraction.timeline.events },
    });
  }
  
  // Checklist if not added
  const checklist = extraction.lists.find(l => l.type === 'checklist');
  if (checklist && !components.some(c => c.type === 'GridChecklist')) {
    components.push({
      type: 'GridChecklist',
      props: {
        title: checklist.title,
        items: checklist.items.map((item, i) => ({
          number: i + 1, title: item.title, description: item.description || '',
        })),
      },
    });
  }
  
  // Closing stats
  const closingStats = statGroups.get('closing') || statGroups.get('success') || [];
  if (closingStats.length >= 2 && !usedGroups.has('closing')) {
    components.push({
      type: 'HorizontalStatRow',
      props: {
        stats: closingStats.slice(0, 3).map(s => ({
          metric: s.value, prefix: s.prefix, suffix: s.suffix,
          label: s.label, sublabel: s.context, color: 'green',
        })),
      },
    });
  }

  console.log(`✅ Generated ${components.length} components (${paragraphCount} paragraphs, ${visualsInserted} visuals)`);
  
  return components;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

export async function transformContentV6(
  title: string,
  content: string,
  excerpt: string,
  apiKey: string
): Promise<{ layout: any; extraction: ExtractionResult }> {
  
  console.log('🚀 Starting V6.2 transformation...');
  console.log(`📝 Content: ${content.length} chars`);
  
  // Stage 1: Smart paragraph splitting
  console.log('📊 Stage 1: Smart content splitting...');
  const contentBlocks = smartSplitContent(content);
  console.log(`✅ Created ${contentBlocks.length} blocks (${contentBlocks.filter(b => b.type === 'heading').length} headings, ${contentBlocks.filter(b => b.type === 'paragraph').length} paragraphs)`);
  
  // Stage 2: AI extraction
  console.log('📊 Stage 2: AI extraction...');
  const extraction = await extractContent(content, apiKey);
  
  // Stage 3: Component mapping
  console.log('🔧 Stage 3: Mapping components...');
  const components = mapToComponents(extraction, contentBlocks);
  
  // Assemble layout
  const layout = {
    theme: { name: 'lightpoint', mode: 'dark' },
    layout: [
      {
        type: 'HeroGradient',
        props: { headline: title, subheadline: excerpt },
      },
      ...components,
    ],
  };

  // Log breakdown
  const types: Record<string, number> = {};
  layout.layout.forEach(c => { types[c.type] = (types[c.type] || 0) + 1; });
  console.log('📊 Component breakdown:', types);
  console.log(`🎉 V6.2 complete: ${layout.layout.length} total components`);

  return { layout, extraction };
}
