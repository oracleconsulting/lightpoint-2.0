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
    .replaceAll('Mr.', 'Mr##')
    .replaceAll('Mrs.', 'Mrs##')
    .replaceAll('Dr.', 'Dr##')
    .replaceAll('Ms.', 'Ms##')
    .replaceAll('vs.', 'vs##')
    .replaceAll('etc.', 'etc##')
    .replaceAll('i.e.', 'i##e##')
    .replaceAll('e.g.', 'e##g##')
    .replaceAll('gov.uk', 'gov##uk');
  
  // Split on sentence endings
  const sentences = protectedText
    .split(/(?<=[.!?])\s+(?=[A-Z"'])/)
    .map(s => s
      .replaceAll('##', '.')
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
 * Group sentences into paragraphs (2-4 sentences each)
 */
function groupIntoParagraphs(sentences: string[]): { type: 'heading' | 'paragraph'; text: string }[] {
  const result: { type: 'heading' | 'paragraph'; text: string }[] = [];
  let currentParagraph: string[] = [];
  
  sentences.forEach((sentence, idx) => {
    // Check if this looks like a heading
    if (isLikelyHeading(sentence)) {
      // Flush current paragraph first
      if (currentParagraph.length > 0) {
        result.push({ type: 'paragraph', text: currentParagraph.join(' ') });
        currentParagraph = [];
      }
      result.push({ type: 'heading', text: sentence });
      return;
    }
    
    currentParagraph.push(sentence);
    
    // Create paragraph every 3-4 sentences, or at natural break points
    const nextSentence = sentences[idx + 1];
    const shouldBreak = 
      currentParagraph.length >= 4 ||
      (currentParagraph.length >= 2 && sentence.endsWith('?')) ||
      (currentParagraph.length >= 3 && /\.$/.test(sentence) && nextSentence && /^(But|However|Yet|So|The|This|That|If|When)\s/.test(nextSentence));
    
    if (shouldBreak) {
      result.push({ type: 'paragraph', text: currentParagraph.join(' ') });
      currentParagraph = [];
    }
  });
  
  // Flush remaining
  if (currentParagraph.length > 0) {
    result.push({ type: 'paragraph', text: currentParagraph.join(' ') });
  }
  
  return result;
}

/**
 * Smart paragraph splitting - handles continuous text
 */
function smartSplitContent(content: string): { type: 'heading' | 'paragraph'; text: string }[] {
  // First try normal paragraph splitting (if content has \n\n)
  const hasExplicitParagraphs = content.includes('\n\n');
  
  if (hasExplicitParagraphs) {
    const parts = content.split(/\n\n+/).filter(p => p.trim().length > 20);
    return parts.map(p => {
      const trimmed = p.trim();
      if (isLikelyHeading(trimmed)) {
        return { type: 'heading' as const, text: trimmed };
      }
      return { type: 'paragraph' as const, text: trimmed };
    });
  }
  
  // Otherwise, split by sentences and group
  const sentences = splitIntoSentences(content);
  console.log(`📝 Split into ${sentences.length} sentences`);
  
  return groupIntoParagraphs(sentences);
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
  
  // Visual insertion points (after every N paragraphs)
  let paragraphCount = 0;
  let visualsInserted = 0;

  console.log(`📦 Mapping ${contentBlocks.length} blocks with ${extraction.stats.length} stats`);

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
  contentBlocks.forEach((block) => {
    // Headings
    if (block.type === 'heading') {
      components.push({
        type: 'SectionHeading',
        props: { text: block.text },
      });
      return;
    }
    
    // Paragraph
    components.push({
      type: 'TextSection',
      props: {
        content: `<p class="text-xl text-slate-300 leading-relaxed">${applyInlineHighlighting(block.text)}</p>`,
      },
    });
    
    paragraphCount++;
    
    // ─────────────────────────────────────────────────────────────────────
    // Insert visuals every 2-3 paragraphs
    // ─────────────────────────────────────────────────────────────────────
    
    // After paragraph 2: Process flow
    if (paragraphCount === 2 && extraction.processes.length > 0) {
      const process = extraction.processes[0];
      components.push({
        type: 'NumberedProcessFlowV6',
        props: { title: process.title, steps: process.steps },
      });
      visualsInserted++;
    }
    
    // After paragraph 4: Quote
    if (paragraphCount === 4 && extraction.quotes.length > 0) {
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
    
    // After paragraph 6: Timeline
    if (paragraphCount === 6 && extraction.timeline) {
      components.push({
        type: 'TableTimeline',
        props: {
          title: extraction.timeline.title,
          events: extraction.timeline.events,
        },
      });
      visualsInserted++;
    }
    
    // After paragraph 8: Another quote
    if (paragraphCount === 8 && extraction.quotes.length > 1) {
      const quote = extraction.quotes.find((_, i) => !usedQuotes.has(i));
      if (quote) {
        usedQuotes.add(extraction.quotes.indexOf(quote));
        components.push({
          type: 'QuoteCalloutV6',
          props: {
            text: quote.text,
            attribution: quote.attribution,
            accent: 'purple',
          },
        });
        visualsInserted++;
      }
    }
    
    // After paragraph 10: Checklist
    if (paragraphCount === 10) {
      const checklist = extraction.lists.find(l => l.type === 'checklist');
      if (checklist) {
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
    
    // After paragraph 12: Middle stats
    if (paragraphCount === 12) {
      const middleStats = statGroups.get('middle') || statGroups.get('adjudicator') || [];
      if (middleStats.length >= 2 && !usedGroups.has('middle')) {
        usedGroups.add('middle');
        usedGroups.add('adjudicator');
        components.push({
          type: 'HorizontalStatRow',
          props: {
            stats: middleStats.slice(0, 3).map(s => ({
              metric: s.value, prefix: s.prefix, suffix: s.suffix,
              label: s.label, sublabel: s.context, color: sentimentToColor(s.sentiment),
            })),
          },
        });
        visualsInserted++;
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
