/**
 * Content Extraction Pipeline V6
 * 
 * Stage 1 of the new architecture: Extract ALL structured content
 * before attempting to create any layout.
 * 
 * This solves the core problem: AI generating placeholders instead of real content.
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
// EXTRACTION PROMPT
// ═══════════════════════════════════════════════════════════════════════════

export const EXTRACTION_PROMPT = `You are a content extraction system. Your job is to find and extract ALL structured content from a blog post.

## EXTRACTION RULES

### STATS
Find EVERY number in the text. For each:
- Extract the exact numeric value (keep commas for readability)
- Note any prefix (£, $) or suffix (%, K, minutes)
- Identify what it measures (label)
- Note surrounding context
- Categorize: volume, percentage, money, time, comparison
- Sentiment: positive (success, good), negative (problem, failure), neutral
- Group related stats with same groupId

Example extractions:
"92,000 people complained" → { value: "92,000", label: "Complaints", category: "volume", groupId: "opening" }
"98% resolved internally" → { value: "98", suffix: "%", label: "Internal Resolution", category: "percentage", groupId: "opening" }
"£6,174 in professional costs" → { value: "6,174", prefix: "£", label: "Professional Costs", category: "money", groupId: "closing" }

### QUOTES
Find all notable quotes, Charter references, guidance citations:
- The exact quote text
- Attribution if present ("Taxpayers' Charter", "CRG5275")
- Type: charter (official rules), guidance (HMRC internal), example (case study), callout (emphasis)
- Emphasis: high (key message), medium, low

### LISTS
Find ALL lists, whether formatted or inline:
- Bullet points → type: "bullet"
- Numbered items → type: "numbered"  
- Checklist items (things to do/include) → type: "checklist"
- Process steps → type: "process"

For inline lists like "Include: itemised time records, clear causation, professional hourly rate":
Extract as:
{
  "title": "What to Include",
  "items": [
    { "title": "Itemised time records", "description": "" },
    { "title": "Clear causation", "description": "" },
    { "title": "Professional hourly rate", "description": "" }
  ],
  "type": "checklist"
}

CRITICAL: Extract the ACTUAL TEXT from the source. Never use "Step 1", "Item 1", etc.

### TIMELINE
If dates are mentioned in sequence, extract as timeline:
- Each date with description
- Type: action (submitted), delay (waited), failure (no response), success (resolved)

### SECTIONS
Break content into logical sections:
- heading: Section title or summary
- content: Full paragraph text
- wordCount: Number of words
- keyPoints: 2-3 bullet summary
- position: opening (first 20%), middle, closing (last 20%)

### PROCESSES
Find any process flows or multi-step explanations:
- "Why Most Complaints Fail" → 3 failure reasons
- Step-by-step guides → numbered steps

## OUTPUT FORMAT

Return ONLY valid JSON matching this structure:
{
  "stats": [...],
  "quotes": [...],
  "lists": [...],
  "timeline": {...} or null,
  "sections": [...],
  "processes": [...],
  "metadata": {
    "totalWords": number,
    "statCount": number,
    "hasTimeline": boolean,
    "hasChecklist": boolean
  }
}

## CRITICAL RULES

1. NEVER skip a number - every statistic must be extracted
2. NEVER use placeholder text like "Step 1" - use actual content
3. Extract FULL text from source, don't summarize
4. Group related stats with matching groupId
5. Return valid JSON only - no markdown, no explanations`;

// ═══════════════════════════════════════════════════════════════════════════
// EXTRACTION FUNCTION
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
          content: `Extract all structured content from this blog post:\n\n${content}` 
        },
      ],
      temperature: 0.1,  // Low temperature for accuracy
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

  // Parse and validate
  try {
    const cleanedOutput = aiOutput
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    const result = JSON.parse(cleanedOutput);
    const validated = validateExtractionResult(result);
    
    console.log(`✅ Extraction complete: ${validated.stats.length} stats, ${validated.lists.length} lists, ${validated.quotes.length} quotes`);
    
    return validated;
  } catch (e) {
    console.error('Failed to parse extraction result:', e);
    console.error('AI output:', aiOutput.substring(0, 1000));
    throw new Error('Extraction returned invalid JSON');
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION
// ═══════════════════════════════════════════════════════════════════════════

function validateExtractionResult(result: any): ExtractionResult {
  return {
    stats: (result.stats || []).map(validateStat),
    quotes: (result.quotes || []).map(validateQuote),
    lists: (result.lists || []).map(validateList),
    timeline: result.timeline ? validateTimeline(result.timeline) : null,
    sections: (result.sections || []).map(validateSection),
    processes: (result.processes || []).map(validateProcess),
    metadata: {
      totalWords: result.metadata?.totalWords || 0,
      statCount: result.stats?.length || 0,
      hasTimeline: !!result.timeline,
      hasChecklist: (result.lists || []).some((l: any) => l.type === 'checklist'),
    },
  };
}

function validateStat(stat: any): ExtractedStat {
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

function validateQuote(quote: any): ExtractedQuote {
  return {
    text: String(quote.text || ''),
    attribution: quote.attribution || undefined,
    type: quote.type || 'callout',
    emphasis: quote.emphasis || 'medium',
  };
}

function validateList(list: any): ExtractedList {
  return {
    title: String(list.title || 'List'),
    items: (list.items || []).map((item: any) => ({
      title: String(item.title || item || ''),
      description: item.description || undefined,
    })),
    type: list.type || 'bullet',
    actionable: list.actionable ?? false,
  };
}

function validateTimeline(timeline: any): ExtractedTimeline {
  return {
    title: String(timeline.title || 'Timeline'),
    events: (timeline.events || []).map((event: any) => ({
      date: String(event.date || ''),
      description: String(event.description || event.title || ''),
      type: event.type || 'neutral',
    })),
  };
}

function validateSection(section: any): ExtractedSection {
  return {
    heading: String(section.heading || ''),
    content: String(section.content || ''),
    wordCount: section.wordCount || 0,
    keyPoints: section.keyPoints || [],
    position: section.position || 'middle',
  };
}

function validateProcess(process: any): ExtractedProcess {
  return {
    title: String(process.title || ''),
    steps: (process.steps || []).map((step: any, i: number) => ({
      number: step.number || String(i + 1).padStart(2, '0'),
      title: String(step.title || ''),
      description: String(step.description || ''),
    })),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT MAPPING (Deterministic - no AI creativity)
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

export function mapToComponents(extraction: ExtractionResult): MappedComponent[] {
  const components: MappedComponent[] = [];
  
  // Group stats by groupId
  const statGroups = new Map<string, ExtractedStat[]>();
  extraction.stats.forEach(stat => {
    const group = statGroups.get(stat.groupId) || [];
    group.push(stat);
    statGroups.set(stat.groupId, group);
  });
  
  // Track which stats have been used
  const usedStatGroups = new Set<string>();

  // 1. Opening stats (if grouped)
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
      sourceText: openingStats.map(s => s.sourceQuote).join(' '),
    });
  }

  // 2. Opening section text
  const openingSections = extraction.sections.filter(s => s.position === 'opening');
  openingSections.forEach(section => {
    if (section.heading) {
      components.push({
        type: 'SectionHeading',
        props: { text: section.heading },
      });
    }
    if (section.content) {
      components.push({
        type: 'TextSection',
        props: { content: `<p>${section.content}</p>` },
        sourceText: section.content,
      });
    }
  });

  // 3. Processes → NumberedProcessFlow
  extraction.processes.forEach(process => {
    if (process.steps.length >= 2 && process.steps.length <= 5) {
      components.push({
        type: 'NumberedProcessFlowV6',
        props: {
          title: process.title,
          steps: process.steps,
        },
      });
    }
  });

  // 4. Middle sections with interleaved visuals
  const middleSections = extraction.sections.filter(s => s.position === 'middle');
  middleSections.forEach((section, index) => {
    if (section.heading) {
      components.push({
        type: 'SectionHeading',
        props: { text: section.heading },
      });
    }
    if (section.content) {
      components.push({
        type: 'TextSection',
        props: { content: `<p>${section.content}</p>` },
        sourceText: section.content,
      });
    }
    
    // Add a visual after every 2 sections
    if (index % 2 === 1) {
      // Check for middle stats
      const middleStats = statGroups.get('middle') || statGroups.get('adjudicator') || [];
      if (middleStats.length >= 2 && !usedStatGroups.has('middle') && !usedStatGroups.has('adjudicator')) {
        usedStatGroups.add('middle');
        usedStatGroups.add('adjudicator');
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
      }
    }
  });

  // 5. Timeline → TableTimeline
  if (extraction.timeline && extraction.timeline.events.length > 0) {
    components.push({
      type: 'TableTimeline',
      props: {
        title: extraction.timeline.title,
        events: extraction.timeline.events.map(e => ({
          date: e.date,
          description: e.description,
          type: e.type,
        })),
      },
    });
  }

  // 6. Quotes → QuoteCalloutV6
  extraction.quotes.forEach(quote => {
    if (quote.emphasis === 'high' || quote.type === 'charter') {
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

  // 7. Checklists → GridChecklist
  const checklists = extraction.lists.filter(l => l.type === 'checklist');
  checklists.forEach(checklist => {
    if (checklist.items.length > 0 && checklist.items.length <= 6) {
      // Validate items have real content
      const hasRealContent = checklist.items.every(item => 
        item.title && 
        item.title.length > 3 && 
        !/^(step|item|action)\s*\d*$/i.test(item.title)
      );
      
      if (hasRealContent) {
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
    }
  });

  // 8. Bullet lists → BulletList
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

  // 9. Numbered lists → NumberedList
  const numberedLists = extraction.lists.filter(l => l.type === 'numbered');
  numberedLists.forEach(list => {
    if (list.items.length > 0) {
      components.push({
        type: 'NumberedList',
        props: {
          title: list.title,
          items: list.items.map(i => i.title),
          accent: 'cyan',
        },
      });
    }
  });

  // 10. Closing sections
  const closingSections = extraction.sections.filter(s => s.position === 'closing');
  closingSections.forEach(section => {
    if (section.heading) {
      components.push({
        type: 'SectionHeading',
        props: { text: section.heading },
      });
    }
    if (section.content) {
      components.push({
        type: 'TextSection',
        props: { content: `<p>${section.content}</p>` },
        sourceText: section.content,
      });
    }
  });

  // 11. Closing stats (success metrics)
  const closingStats = statGroups.get('closing') || statGroups.get('success') || [];
  if (closingStats.length >= 2 && !usedStatGroups.has('closing') && !usedStatGroups.has('success')) {
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

  // 12. Any remaining ungrouped stats
  const ungroupedStats = statGroups.get('ungrouped') || [];
  if (ungroupedStats.length >= 2) {
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
// FULL PIPELINE
// ═══════════════════════════════════════════════════════════════════════════

export async function transformContentV6(
  title: string,
  content: string,
  excerpt: string,
  apiKey: string
): Promise<{ layout: any; extraction: ExtractionResult }> {
  
  console.log('🚀 Starting V6 transformation pipeline...');
  
  // Stage 1: Extract content
  console.log('📊 Stage 1: Extracting content...');
  const extraction = await extractContent(content, apiKey);
  console.log(`✅ Extracted: ${extraction.metadata.statCount} stats, ${extraction.lists.length} lists`);
  
  // Stage 2: Map to components (deterministic)
  console.log('🔧 Stage 2: Mapping to components...');
  const components = mapToComponents(extraction);
  console.log(`✅ Mapped to ${components.length} components`);

  // Add hero at beginning
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

  console.log(`🎉 V6 transformation complete: ${layout.layout.length} total sections`);

  return { layout, extraction };
}

