/**
 * Content Extraction Pipeline V6.1 - FIXED
 * 
 * Key fixes:
 * 1. Programmatic paragraph splitting (don't rely on AI for text)
 * 2. Validation before mapping (reject empty content)
 * 3. Guaranteed TextSection generation
 * 4. Better error handling and logging
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
// EXTRACTION PROMPT (Simplified - focus on structured data, not paragraphs)
// ═══════════════════════════════════════════════════════════════════════════

export const EXTRACTION_PROMPT = `You are a content extraction system. Extract structured data from a blog post.

## WHAT TO EXTRACT

### STATS (Every number)
Find ALL numbers. For each:
- value: exact number (keep commas)
- prefix: £, $, etc.
- suffix: %, K, minutes, etc.
- label: what it measures
- context: surrounding info
- category: volume | percentage | money | time | comparison
- sentiment: positive | negative | neutral
- groupId: group related stats (opening, middle, closing, adjudicator, success)

### QUOTES
Find important quotes, Charter references, guidance citations:
- text: exact quote
- attribution: source name
- type: charter | guidance | example | callout
- emphasis: high | medium | low

### LISTS
Find ALL lists (formatted or inline):
- title: list heading
- items: [{ title: "item text", description: "optional detail" }]
- type: checklist | bullet | numbered | process
- actionable: true/false

CRITICAL: Extract ACTUAL TEXT, never "Step 1", "Item 1", etc.

### TIMELINE
If sequential dates exist:
- title: timeline heading
- events: [{ date, description, type: action|delay|failure|success }]

### PROCESSES
Find multi-step explanations with clear titles:
- title: process name (e.g., "Why Most Complaints Fail")
- steps: [{ number: "01", title: "Clear Title Here", description: "explanation" }]

CRITICAL for processes: Each step MUST have a real title extracted from the content.
Example from text "Missing the target entirely - Most complaints read like general frustration":
{ number: "01", title: "Missing the target entirely", description: "Most complaints read like general frustration rather than specific breaches" }

Another example from "No evidence trail - Vague timelines kill complaints":
{ number: "02", title: "No evidence trail", description: "Vague timelines kill complaints" }

### SECTION HEADINGS
Find all headings/subheadings in the document:
- Just list them as strings

## OUTPUT FORMAT

Return ONLY valid JSON:
{
  "stats": [...],
  "quotes": [...],
  "lists": [...],
  "timeline": {...} or null,
  "processes": [...],
  "sectionHeadings": ["heading1", "heading2", ...],
  "metadata": {
    "totalWords": number,
    "statCount": number,
    "hasTimeline": boolean,
    "hasChecklist": boolean
  }
}

## CRITICAL RULES
1. Extract EVERY number as a stat
2. NEVER use placeholder text - use actual content
3. Process steps MUST have real titles from the content
4. Return valid JSON only`;

// ═══════════════════════════════════════════════════════════════════════════
// TEXT PROCESSING UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Split content into paragraphs programmatically
 * This is the GUARANTEED fallback - never trust AI for text content
 */
function splitIntoParagraphs(content: string): string[] {
  return content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 30) // Skip tiny fragments
    .filter(p => !p.match(/^#{1,3}\s/)) // Skip markdown headings (handled separately)
    .filter(p => !p.match(/^[-*]\s/)); // Skip list items (handled separately)
}

/**
 * Extract headings from content
 */
function extractHeadings(content: string): { text: string; level: number; position: number }[] {
  const headings: { text: string; level: number; position: number }[] = [];
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Markdown headings
    const mdMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (mdMatch) {
      headings.push({
        text: mdMatch[2].trim(),
        level: mdMatch[1].length,
        position: index,
      });
      return;
    }
    
    // Bold text at start of line (common heading pattern)
    const boldMatch = line.match(/^\*\*(.+?)\*\*\s*$/);
    if (boldMatch && boldMatch[1].length < 80) {
      headings.push({
        text: boldMatch[1].trim(),
        level: 2,
        position: index,
      });
    }
    
    // Title case lines that look like headings
    if (line.length < 80 && line.length > 10 && !line.includes('.')) {
      const words = line.trim().split(/\s+/);
      const capitalizedWords = words.filter(w => /^[A-Z]/.test(w));
      // If most words are capitalized and line is short, might be a heading
      if (words.length >= 3 && words.length <= 10 && capitalizedWords.length >= words.length * 0.5) {
        // Check common heading patterns
        const headingPatterns = [
          /^(The|Why|How|What|When|Where|Which)\s/i,
          /\s(That|Which|Works?|Fails?|Recovery|Resolution|Process|Step)/i,
        ];
        if (headingPatterns.some(p => p.test(line))) {
          headings.push({
            text: line.trim(),
            level: 2,
            position: index,
          });
        }
      }
    }
  });
  
  // Deduplicate headings
  const seen = new Set<string>();
  return headings.filter(h => {
    if (seen.has(h.text.toLowerCase())) return false;
    seen.add(h.text.toLowerCase());
    return true;
  });
}

/**
 * Apply Gamma-style inline highlighting to text
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
// AI EXTRACTION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════

export async function extractContent(
  content: string,
  apiKey: string
): Promise<ExtractionResult> {
  
  console.log('🔍 Starting content extraction...');
  
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
        { 
          role: 'user', 
          content: `Extract structured content from this blog post:\n\n${content}` 
        },
      ],
      temperature: 0.1,
      max_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Extraction API failed:', errorData);
    throw new Error(`Extraction API failed: ${response.statusText}`);
  }

  const data = await response.json();
  const aiOutput = data.choices[0].message.content;

  console.log('📄 Extraction response received, parsing...');

  try {
    const cleanedOutput = aiOutput
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const result = JSON.parse(cleanedOutput);
    
    // Debug log
    console.log('🔍 AI Extraction result:', JSON.stringify({
      statsCount: result.stats?.length || 0,
      quotesCount: result.quotes?.length || 0,
      listsCount: result.lists?.length || 0,
      processesCount: result.processes?.length || 0,
      firstProcess: result.processes?.[0],
    }, null, 2));
    
    const validated = validateExtractionResult(result);
    
    console.log(`✅ Extraction complete: ${validated.stats.length} stats, ${validated.lists.length} lists, ${validated.quotes.length} quotes`);
    
    return validated;
  } catch (e) {
    console.error('Failed to parse extraction result:', e);
    console.error('AI output:', aiOutput.substring(0, 1000));
    
    // Return empty but valid structure on parse failure
    return {
      stats: [],
      quotes: [],
      lists: [],
      timeline: null,
      sections: [],
      processes: [],
      metadata: {
        totalWords: content.split(/\s+/).length,
        statCount: 0,
        hasTimeline: false,
        hasChecklist: false,
      },
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function validateExtractionResult(result: any): ExtractionResult {
  return {
    stats: (result.stats || []).map(validateStat).filter(Boolean) as ExtractedStat[],
    quotes: (result.quotes || []).map(validateQuote).filter(Boolean) as ExtractedQuote[],
    lists: (result.lists || []).map(validateList).filter(Boolean) as ExtractedList[],
    timeline: result.timeline ? validateTimeline(result.timeline) : null,
    sections: [], // We'll fill this programmatically
    processes: (result.processes || []).map(validateProcess).filter(Boolean) as ExtractedProcess[],
    metadata: {
      totalWords: result.metadata?.totalWords || 0,
      statCount: result.stats?.length || 0,
      hasTimeline: !!result.timeline,
      hasChecklist: (result.lists || []).some((l: any) => l.type === 'checklist'),
    },
  };
}

function validateStat(stat: any): ExtractedStat | null {
  if (!stat || !stat.value || !stat.label) return null;
  
  return {
    value: String(stat.value || ''),
    prefix: stat.prefix || undefined,
    suffix: stat.suffix || undefined,
    label: String(stat.label || 'Statistic'),
    context: stat.context || undefined,
    category: stat.category || 'volume',
    sentiment: stat.sentiment || 'neutral',
    sourceQuote: stat.sourceQuote || '',
    groupId: stat.groupId || 'ungrouped',
  };
}

function validateQuote(quote: any): ExtractedQuote | null {
  if (!quote || !quote.text || quote.text.length < 10) return null;
  
  return {
    text: String(quote.text || ''),
    attribution: quote.attribution || undefined,
    type: quote.type || 'callout',
    emphasis: quote.emphasis || 'medium',
  };
}

function validateList(list: any): ExtractedList | null {
  if (!list || !list.items || list.items.length === 0) return null;
  
  const validItems = (list.items || [])
    .map((item: any) => ({
      title: String(item.title || item || ''),
      description: item.description || undefined,
    }))
    .filter((item: any) => {
      // Reject placeholder patterns
      const title = item.title.toLowerCase();
      if (/^(step|item|action|point)\s*\d*$/i.test(title)) return false;
      if (title.length < 3) return false;
      return true;
    });
  
  if (validItems.length === 0) return null;
  
  return {
    title: String(list.title || 'List'),
    items: validItems,
    type: list.type || 'bullet',
    actionable: list.actionable ?? false,
  };
}

function validateTimeline(timeline: any): ExtractedTimeline | null {
  if (!timeline || !timeline.events || timeline.events.length === 0) return null;
  
  const validEvents = (timeline.events || [])
    .map((event: any) => ({
      date: String(event.date || ''),
      description: String(event.description || event.title || ''),
      type: event.type || 'neutral',
    }))
    .filter((e: any) => e.date && e.description);
  
  if (validEvents.length === 0) return null;
  
  return {
    title: String(timeline.title || 'Timeline'),
    events: validEvents,
  };
}

function validateProcess(process: any): ExtractedProcess | null {
  if (!process || !process.steps || process.steps.length === 0) return null;
  
  const validSteps = (process.steps || [])
    .map((step: any, i: number) => ({
      number: step.number || String(i + 1).padStart(2, '0'),
      title: String(step.title || '').trim(),
      description: String(step.description || '').trim(),
    }))
    .filter((step: any) => {
      // CRITICAL: Reject steps with empty or placeholder titles
      if (!step.title || step.title.length < 3) {
        console.warn(`⚠️ Rejecting step with empty title`);
        return false;
      }
      if (/^(step|item|action|point)\s*\d*$/i.test(step.title)) {
        console.warn(`⚠️ Rejecting placeholder step: "${step.title}"`);
        return false;
      }
      return true;
    });
  
  // Only return process if we have at least 2 valid steps
  if (validSteps.length < 2) {
    console.warn(`⚠️ Rejecting process "${process.title}" - only ${validSteps.length} valid steps`);
    return null;
  }
  
  return {
    title: String(process.title || ''),
    steps: validSteps,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT MAPPING
// ═══════════════════════════════════════════════════════════════════════════

export interface MappedComponent {
  type: string;
  props: Record<string, any>;
  sourceText?: string;
}

function sentimentToColor(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return 'green';
    case 'negative': return 'red';
    default: return 'blue';
  }
}

export function mapToComponents(
  extraction: ExtractionResult,
  paragraphs: string[],
  headings: { text: string; level: number; position: number }[]
): MappedComponent[] {
  const components: MappedComponent[] = [];
  
  // Group stats by groupId
  const statGroups = new Map<string, ExtractedStat[]>();
  extraction.stats.forEach(stat => {
    const group = statGroups.get(stat.groupId) || [];
    group.push(stat);
    statGroups.set(stat.groupId, group);
  });
  
  const usedStatGroups = new Set<string>();
  const usedQuotes = new Set<number>();
  const usedHeadings = new Set<string>();
  
  // Track paragraph index for interleaving visuals
  let paragraphIndex = 0;
  const totalParagraphs = paragraphs.length;
  console.log(`📝 Mapping ${totalParagraphs} paragraphs with ${extraction.stats.length} stats, ${extraction.quotes.length} quotes`);

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Opening Stats (first stat group)
  // ─────────────────────────────────────────────────────────────────────────
  const openingStats = statGroups.get('opening') || [];
  if (openingStats.length >= 2) {
    usedStatGroups.add('opening');
    components.push({
      type: 'HorizontalStatRow',
      props: {
        stats: openingStats.slice(0, 3).map(s => ({
          metric: s.value,
          prefix: s.prefix,
          suffix: s.suffix,
          label: s.label,
          sublabel: s.context,
          color: sentimentToColor(s.sentiment),
        })),
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Process all paragraphs with interleaved visuals
  // ─────────────────────────────────────────────────────────────────────────
  let processAdded = false;
  let timelineAdded = false;
  let middleStatsAdded = false;
  let checklistAdded = false;
  
  paragraphs.forEach((para, idx) => {
    // Check if this paragraph looks like a heading itself (short, no period)
    if (para.length < 80 && !para.includes('.') && para.split(/\s+/).length <= 10) {
      // Might be a heading we should surface
      const isLikelyHeading = /^(The|Why|How|What|When)\s/i.test(para) ||
                             /\s(Process|Structure|Recovery|Resolution|Works?|Fails?)$/i.test(para);
      if (isLikelyHeading && !usedHeadings.has(para.toLowerCase())) {
        usedHeadings.add(para.toLowerCase());
        components.push({
          type: 'SectionHeading',
          props: { text: para },
        });
        paragraphIndex++;
        return; // Don't also add as TextSection
      }
    }
    
    // Check for pre-detected headings
    const matchingHeading = headings.find(h => 
      !usedHeadings.has(h.text.toLowerCase()) &&
      (para.toLowerCase().includes(h.text.toLowerCase()) || 
       h.text.toLowerCase().includes(para.toLowerCase().substring(0, 30)))
    );
    
    if (matchingHeading && para.length < 100) {
      usedHeadings.add(matchingHeading.text.toLowerCase());
      components.push({
        type: 'SectionHeading',
        props: { text: matchingHeading.text },
      });
      paragraphIndex++;
      return;
    }
    
    // Add the paragraph as TextSection with highlighting
    components.push({
      type: 'TextSection',
      props: { 
        content: `<p class="text-lg text-slate-300 leading-relaxed mb-6">${applyInlineHighlighting(para)}</p>` 
      },
      sourceText: para.substring(0, 100),
    });
    
    paragraphIndex++;
    
    // ─────────────────────────────────────────────────────────────────────
    // Interleave visuals at natural break points
    // ─────────────────────────────────────────────────────────────────────
    
    // After ~3rd paragraph: Add process flow (if valid)
    if (paragraphIndex === 3 && !processAdded && extraction.processes.length > 0) {
      const process = extraction.processes[0];
      console.log(`✅ Adding process: "${process.title}" with ${process.steps.length} steps`);
      components.push({
        type: 'NumberedProcessFlowV6',
        props: {
          title: process.title,
          steps: process.steps,
        },
      });
      processAdded = true;
    }
    
    // After ~5th paragraph: Add timeline (if exists)
    if (paragraphIndex === 5 && !timelineAdded && extraction.timeline) {
      console.log(`✅ Adding timeline with ${extraction.timeline.events.length} events`);
      components.push({
        type: 'TableTimeline',
        props: {
          title: extraction.timeline.title,
          events: extraction.timeline.events,
        },
      });
      timelineAdded = true;
    }
    
    // After ~6th paragraph: Add a relevant quote
    if (paragraphIndex === 6 && extraction.quotes.length > 0) {
      const highEmphasisQuote = extraction.quotes.find((q, i) => 
        (q.emphasis === 'high' || q.type === 'charter') && !usedQuotes.has(i)
      );
      if (highEmphasisQuote) {
        const quoteIndex = extraction.quotes.indexOf(highEmphasisQuote);
        usedQuotes.add(quoteIndex);
        console.log(`✅ Adding quote: "${highEmphasisQuote.text.substring(0, 50)}..."`);
        components.push({
          type: 'QuoteCalloutV6',
          props: {
            text: highEmphasisQuote.text,
            attribution: highEmphasisQuote.attribution,
            accent: highEmphasisQuote.type === 'charter' ? 'cyan' : 'purple',
          },
        });
      }
    }
    
    // After ~8th paragraph: Add middle stats
    if (paragraphIndex === 8 && !middleStatsAdded) {
      const middleStats = statGroups.get('middle') || statGroups.get('adjudicator') || [];
      if (middleStats.length >= 2) {
        usedStatGroups.add('middle');
        usedStatGroups.add('adjudicator');
        console.log(`✅ Adding middle stats: ${middleStats.length} stats`);
        components.push({
          type: 'HorizontalStatRow',
          props: {
            stats: middleStats.slice(0, 3).map(s => ({
              metric: s.value,
              prefix: s.prefix,
              suffix: s.suffix,
              label: s.label,
              sublabel: s.context,
              color: sentimentToColor(s.sentiment),
            })),
          },
        });
        middleStatsAdded = true;
      }
    }
    
    // After ~10th paragraph: Add checklist if available
    if (paragraphIndex === 10 && !checklistAdded) {
      const checklists = extraction.lists.filter(l => l.type === 'checklist');
      if (checklists.length > 0) {
        const checklist = checklists[0];
        console.log(`✅ Adding checklist: "${checklist.title}" with ${checklist.items.length} items`);
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
        checklistAdded = true;
      }
    }
    
    // After ~12th paragraph: Add another quote if available
    if (paragraphIndex === 12) {
      const unusedQuote = extraction.quotes.find((_, i) => !usedQuotes.has(i));
      if (unusedQuote) {
        const quoteIndex = extraction.quotes.indexOf(unusedQuote);
        usedQuotes.add(quoteIndex);
        components.push({
          type: 'QuoteCalloutV6',
          props: {
            text: unusedQuote.text,
            attribution: unusedQuote.attribution,
            accent: unusedQuote.type === 'guidance' ? 'purple' : 'cyan',
          },
        });
      }
    }
  });

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Add remaining visuals that weren't interleaved
  // ─────────────────────────────────────────────────────────────────────────
  
  // Timeline (if not added yet)
  if (!timelineAdded && extraction.timeline) {
    console.log(`✅ Adding remaining timeline`);
    components.push({
      type: 'TableTimeline',
      props: {
        title: extraction.timeline.title,
        events: extraction.timeline.events,
      },
    });
  }
  
  // Remaining high-emphasis quotes
  extraction.quotes.forEach((quote, idx) => {
    if (!usedQuotes.has(idx) && quote.emphasis === 'high') {
      components.push({
        type: 'QuoteCalloutV6',
        props: {
          text: quote.text,
          attribution: quote.attribution,
          accent: quote.type === 'charter' ? 'cyan' : 'purple',
        },
      });
    }
  });
  
  // Remaining checklists
  if (!checklistAdded) {
    const checklists = extraction.lists.filter(l => l.type === 'checklist');
    checklists.forEach(checklist => {
      if (checklist.items.length > 0 && checklist.items.length <= 6) {
        console.log(`✅ Adding remaining checklist: "${checklist.title}"`);
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
      }
    });
  }
  
  // Bullet lists
  const bulletLists = extraction.lists.filter(l => l.type === 'bullet');
  bulletLists.forEach(list => {
    if (list.items.length > 0) {
      components.push({
        type: 'BulletList',
        props: {
          title: list.title,
          items: list.items.map(i => i.title),
          icon: 'bullet',
          accent: 'cyan',
        },
      });
    }
  });
  
  // Closing stats
  const closingStats = statGroups.get('closing') || statGroups.get('success') || [];
  if (closingStats.length >= 2 && !usedStatGroups.has('closing') && !usedStatGroups.has('success')) {
    console.log(`✅ Adding closing stats: ${closingStats.length} stats`);
    components.push({
      type: 'HorizontalStatRow',
      props: {
        stats: closingStats.slice(0, 3).map(s => ({
          metric: s.value,
          prefix: s.prefix,
          suffix: s.suffix,
          label: s.label,
          sublabel: s.context,
          color: 'green',
        })),
      },
    });
  }
  
  // Ungrouped stats (if any remain and we don't have many stats shown)
  const ungroupedStats = statGroups.get('ungrouped') || [];
  if (ungroupedStats.length >= 2 && usedStatGroups.size < 2) {
    components.push({
      type: 'HorizontalStatRow',
      props: {
        stats: ungroupedStats.slice(0, 3).map(s => ({
          metric: s.value,
          prefix: s.prefix,
          suffix: s.suffix,
          label: s.label,
          sublabel: s.context,
          color: sentimentToColor(s.sentiment),
        })),
      },
    });
  }

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
  
  console.log('🚀 Starting V6.1 transformation pipeline...');
  console.log(`📝 Content length: ${content.length} characters`);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Stage 1: Programmatically extract paragraphs and headings (GUARANTEED)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📊 Stage 1: Splitting content programmatically...');
  
  const paragraphs = splitIntoParagraphs(content);
  const headings = extractHeadings(content);
  
  console.log(`✅ Found ${paragraphs.length} paragraphs, ${headings.length} headings`);
  console.log(`📌 Headings: ${headings.map(h => h.text).join(', ')}`);
  
  // Fallback if no paragraphs found
  const finalParagraphs = paragraphs.length > 0 ? paragraphs : [content];
  
  // ─────────────────────────────────────────────────────────────────────────
  // Stage 2: AI extraction for structured content (stats, quotes, lists)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('📊 Stage 2: AI extraction for structured content...');
  
  const extraction = await extractContent(content, apiKey);
  
  console.log(`✅ AI extracted: ${extraction.stats.length} stats, ${extraction.lists.length} lists, ${extraction.quotes.length} quotes, ${extraction.processes.length} valid processes`);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Stage 3: Map to components (deterministic)
  // ─────────────────────────────────────────────────────────────────────────
  console.log('🔧 Stage 3: Mapping to components...');
  
  const components = mapToComponents(extraction, finalParagraphs, headings);
  
  console.log(`✅ Mapped to ${components.length} components`);
  
  // Debug: Log component types
  const typeCounts: Record<string, number> = {};
  components.forEach(c => {
    typeCounts[c.type] = (typeCounts[c.type] || 0) + 1;
  });
  console.log('📊 Component breakdown:', typeCounts);
  
  // ─────────────────────────────────────────────────────────────────────────
  // Stage 4: Assemble final layout
  // ─────────────────────────────────────────────────────────────────────────
  const hero = {
    type: 'HeroGradient',
    props: {
      headline: title,
      subheadline: excerpt,
    },
  };

  const layout = {
    theme: { name: 'lightpoint', mode: 'dark' },
    layout: [hero, ...components],
  };

  console.log(`🎉 V6.1 transformation complete: ${layout.layout.length} total sections`);

  return { layout, extraction };
}
