# Blog V2 Layout System - Complete Overview

## System Architecture

### Flow Diagram
```
User Input (TipTap JSON/Markdown)
    ↓
[VisualTransformer.tsx] - UI Component
    ↓
[API Route: /api/blog/generate-layout-v2]
    ↓
[layoutGenerator.ts] - generateLayout()
    ↓
[sectionDetector.ts] - detectSections() → DetectedSection[]
    ↓
[layoutGenerator.ts] - sectionToComponent() → LayoutComponent[]
    ↓
[BlogRenderer.tsx] - Renders components
    ↓
Final Rendered Blog Post
```

---

## 1. Entry Point: VisualTransformer.tsx

**Location:** `components/blog/VisualTransformer.tsx`

**What it does:**
- UI component that triggers layout generation
- Calls `/api/blog/generate-layout-v2` with blog post content
- Receives layout JSON and displays preview
- User can "Apply This Layout" to save to database

**Key Code:**
```typescript
const response = await fetch('/api/blog/generate-layout-v2', {
  method: 'POST',
  body: JSON.stringify({
    title,
    content, // TipTap JSON or markdown
    excerpt,
    author,
    includeHero: true,
    includeCTA: true,
    slug,
    autoGenerateImages: true,
  }),
});
```

---

## 2. API Route: /api/blog/generate-layout-v2

**Location:** `app/api/blog/generate-layout-v2/route.ts`

**What it does:**
- Receives POST request with blog post data
- Calls `generateLayout()` from `layoutGenerator.ts`
- Returns layout JSON with component count and types
- Logs debug information

**Key Parameters:**
- `title`: Blog post title
- `content`: TipTap JSON or markdown text
- `excerpt`: Optional excerpt
- `author`: Author name
- `includeHero`: Add hero section (default: true)
- `includeCTA`: Add CTA section (default: true)
- `slug`: Post slug for image generation
- `autoGenerateImages`: Generate images automatically (default: true)

---

## 3. Layout Generator: layoutGenerator.ts

**Location:** `components/blog-v2/utils/layoutGenerator.ts`

**Main Function: `generateLayout()`**

**What it does:**
1. Calls `detectSections(content)` to analyze content
2. Converts each `DetectedSection` to `LayoutComponent` via `sectionToComponent()`
3. Adds hero section (if requested)
4. Adds CTA section (if requested)
5. Optionally generates images via `generateImagesForLayout()`
6. Returns complete `BlogLayout` object

**Key Function: `sectionToComponent()`**
- Maps `DetectedSection` types to `LayoutComponent` types
- Handles data transformation for each component type
- Returns `null` for invalid sections

**Component Type Mapping:**
- `stats` → `stats` component
- `donutChart` → `donutChart` component
- `numberedSteps` → `numberedSteps` component
- `timeline` → `timeline` component
- `callout` → `callout` component
- `quote` → `quote` component
- `comparisonCards` → `comparisonCards` component
- `threeColumnCards` → `threeColumnCards` component
- `bulletList` → `bulletList` component
- `sectionHeading` → `sectionHeading` component
- `textWithImage` → `textWithImage` component
- `paragraph` → `paragraph` component

---

## 4. Section Detector: sectionDetector.ts

**Location:** `components/blog-v2/utils/sectionDetector.ts`

**Main Function: `detectSections(content: string)`**

**What it does:**
1. Creates `SectionDetector` instance
2. Normalizes content (strips HTML, markdown, fixes broken text)
3. Extracts text from TipTap JSON if needed
4. Calls `detect()` method which:
   - Splits content into paragraphs
   - Calls `groupAndDetect()` to intelligently group paragraphs
   - Detects component types for each group
   - Post-processes to merge related sections

### Content Normalization Process

1. **TipTap JSON Extraction:**
   - If content is object, extracts text via `extractTextFromTipTap()`
   - Recursively processes TipTap node structure
   - Handles: paragraphs, headings, bold, italic, hard breaks, lists

2. **HTML/Markdown Stripping:**
   - Converts block-level HTML to paragraph breaks
   - Converts `<br>` to spaces (preserves sentences)
   - Strips HTML tags
   - Decodes HTML entities

3. **Markdown Artifact Removal:**
   - Removes `**` (bold markers)
   - Removes `*` (italic markers)
   - Removes `__` (underline markers)
   - Removes `_` (italic markers)

4. **Text Fixing:**
   - Fixes sentences starting with periods
   - Fixes broken words (word split across lines)
   - Fixes broken sentences
   - Removes duplicate consecutive lines
   - Normalizes whitespace

### Detection Process: `groupAndDetect()`

**NEW APPROACH (Group-First):**

1. **Process paragraphs one-by-one:**
   - Skip empty/artifact-only paragraphs
   - Check for special single-paragraph components first (headings, callouts)
   - Look ahead to group related paragraphs

2. **Group Detection (in order):**
   - **Three-Column Cards:** Check if next 3 paragraphs form cards
   - **Numbered Steps:** Check if consecutive paragraphs are numbered steps
   - **Timeline:** Check if consecutive paragraphs have dates
   - **Stats:** Check if consecutive paragraphs have statistics

3. **Individual Detection:**
   - If no group detected, process as single paragraph
   - Calls `detectParagraphType()` for individual detection

### Individual Detection: `detectParagraphType()`

**Checks in order:**
1. **Callouts:** Patterns like "Pro Tip:", "THE KEY:", etc.
2. **Blockquotes:** Lines starting with `>`
3. **Markdown Headers:** Lines starting with `#`
4. **Bold-Only Headers:** Short lines wrapped in `**`
5. **Section Headings:** Patterns like "The X trap", "Why X fails"
6. **Numbered Steps:** Patterns like "1.", "Step 1:", "First,"
7. **Bullet Lists:** Lines starting with `-`, `•`, `*`
8. **Stats:** Multiple stats in paragraph (3+ stats = stats component)
9. **Donut Charts:** 2-4 percentages in paragraph
10. **Comparison Cards:** "Old Way vs New Way" patterns
11. **Timeline:** 2+ dates in paragraph
12. **Default:** Regular paragraph

### Group Detection Functions

**`detectThreeColumnCards(paragraphs, startIndex)`**
- Checks if 3 paragraphs have similar structure
- Validates length variance, distinct topics, reasonable length
- Extracts titles (colon/dash separators, first sentence)
- Creates cards with icons, titles, descriptions

**`detectNumberedStepsGroup(paragraphs, startIndex, currentIndex)`**
- Finds consecutive numbered paragraphs
- Parses step data (number, title, description)
- Groups into single `numberedSteps` component

**`detectTimelineGroup(paragraphs, startIndex, currentIndex)`**
- Finds consecutive paragraphs with dates
- Extracts timeline events (date, title, description)
- Groups into single `timeline` component

**`detectStatsGroup(paragraphs, startIndex, currentIndex)`**
- Finds consecutive paragraphs with stats
- Extracts statistics (value, label, description)
- Groups into single `stats` component

### Post-Processing: `postProcess()`

**What it does:**
- Merges consecutive numbered steps
- Merges consecutive stats
- Groups paragraphs for text-with-image conversion
- Detects cross-section patterns (timelines, three-column cards)

---

## 5. Component Rendering: BlogRenderer.tsx

**Location:** `components/blog-v2/BlogRenderer.tsx`

**What it does:**
- Receives `BlogLayout` object
- Renders each component via `ComponentRenderer`
- Applies section styling based on component type
- Uses component registry to map types to React components

**Component Registry:**
```typescript
{
  hero: HeroSection,
  stats: StatsRow,
  textWithImage: TextWithImage,
  numberedSteps: NumberedSteps,
  threeColumnCards: ThreeColumnCards,
  timeline: Timeline,
  comparisonCards: ComparisonCards,
  donutChart: DonutChart,
  callout: CalloutBox,
  quote: QuoteBlock,
  paragraph: Paragraph,
  sectionHeading: SectionHeading,
  bulletList: BulletList,
  cta: CTASection,
}
```

**Section Styling:**
- **Full-width:** hero, cta
- **Wide:** stats, comparisonCards, threeColumnCards, numberedSteps, timeline, donutChart
- **Reading-width:** paragraph, textWithImage, quote, callout, bulletList, sectionHeading

---

## 6. Component Files

### ThreeColumnCards.tsx
**Location:** `components/blog-v2/components/ThreeColumnCards.tsx`

**Props:**
- `title?: string`
- `intro?: string`
- `cards: Card[]` - Array of 3 cards
- `background?: 'white' | 'gray'`

**Card Structure:**
```typescript
{
  icon?: string | boolean,
  title: string,
  description: string,
  callout?: { label: string, text: string }
}
```

**Rendering:**
- Cleans text: `replace(/\*\*/g, '').replace(/\*/g, '')`
- Removes leading periods: `replace(/^\.\s+/, '')`
- Displays icon, title, description
- Optional callout section at bottom

**ISSUE:** Title extraction in `detectThreeColumnCards()` may break mid-word

### Paragraph.tsx (UtilityComponents.tsx)
**Location:** `components/blog-v2/components/UtilityComponents.tsx`

**Props:**
- `text: string`
- `highlight?: boolean`
- `dropcap?: boolean`

**Rendering:**
- Cleans markdown artifacts
- Removes leading periods
- Fixes periods at start of lines
- Splits by double newlines for multiple paragraphs
- Replaces single newlines with spaces

### NumberedSteps.tsx
**Location:** `components/blog-v2/components/NumberedSteps.tsx`

**Props:**
- `title?: string`
- `intro?: string`
- `steps: Step[]`
- `conclusion?: string`
- `variant?: 'vertical' | 'grid'`

**Step Structure:**
```typescript
{
  number?: string,
  title: string,
  description: string
}
```

**Rendering:**
- Cleans text in titles and descriptions
- Displays numbered steps with titles and descriptions

### Timeline.tsx
**Location:** `components/blog-v2/components/Timeline.tsx`

**Props:**
- `title?: string`
- `intro?: string`
- `events: TimelineEvent[]`
- `quote?: string`
- `quoteAttribution?: string`

**Event Structure:**
```typescript
{
  date: string,
  title: string,
  description: string,
  type?: 'neutral' | 'positive' | 'negative'
}
```

**Rendering:**
- Cleans text in event descriptions
- Displays timeline with dates and events

### CalloutBox.tsx
**Location:** `components/blog-v2/components/CalloutBox.tsx`

**Props:**
- `icon?: string`
- `label: string`
- `text: string`
- `variant?: 'blue' | 'border' | 'gold' | 'green'`

**Rendering:**
- Cleans text
- Displays callout box with icon, label, and text

---

## 7. Data Types

### BlogLayout
```typescript
{
  theme?: {
    mode?: 'light' | 'dark',
    name?: string
  },
  components: LayoutComponent[]
}
```

### LayoutComponent
```typescript
{
  type: ComponentType,
  props: Record<string, any>
}
```

### DetectedSection
```typescript
{
  type: ComponentType,
  content: string,
  data?: any,
  confidence: number,
  startIndex: number,
  endIndex: number
}
```

---

## 8. Known Issues & Debugging

### Issue 1: Only 2 Components Detected (Hero + CTA)
**Symptoms:** Layout only shows hero and CTA, no content components

**Possible Causes:**
1. Content normalization too aggressive (removes all content)
2. Paragraph detection failing (no paragraphs found)
3. All paragraphs filtered out (too short, artifacts, duplicates)
4. Group detection not working (three-column cards, numbered steps not detected)

**Debug Steps:**
1. Check console logs: `🔬 [SectionDetector] Paragraphs found: X`
2. Check: `🔬 [SectionDetector] Total sections detected: X`
3. Check content after normalization: `🔬 [SectionDetector] Content preview: ...`
4. Check if paragraphs are being filtered: `🔬 [SectionDetector] No section detected for: ...`

### Issue 2: Text Breaking Mid-Word
**Symptoms:** Titles/descriptions break mid-word (e.g., "sever" → "al years")

**Possible Causes:**
1. Title extraction in `detectThreeColumnCards()` breaks at fixed length (60 chars)
2. Word boundary detection not working
3. Content normalization breaking words

**Debug Steps:**
1. Check title extraction logic in `detectThreeColumnCards()`
2. Check if content has hard breaks before normalization
3. Check word boundary detection: `lastSpace > 30`

### Issue 3: Leading Periods
**Symptoms:** Text starts with period: ". Not the tax."

**Possible Causes:**
1. Normalization not removing leading periods
2. Sentence splitting breaking incorrectly
3. Component rendering not cleaning text

**Debug Steps:**
1. Check normalization: `cleaned.replace(/^\.\s+/, '')`
2. Check component rendering: `replace(/^\.\s+/, '')`
3. Check if period is part of original content

### Issue 4: Duplicate Text
**Symptoms:** Same text appears twice (e.g., "gets paid. Second gets rejected." twice)

**Possible Causes:**
1. Duplicate removal too lenient (only removes consecutive exact matches)
2. Post-processing creating duplicates
3. Component rendering duplicating content

**Debug Steps:**
1. Check duplicate removal in normalization
2. Check post-processing merge logic
3. Check component rendering for duplication

### Issue 5: Poor Bolding/Split Sentences
**Symptoms:** Bold text split incorrectly (e.g., "collectors for it . The money")

**Possible Causes:**
1. Markdown removal happening after text is split
2. Sentence boundary detection incorrect
3. Component rendering not preserving sentence structure

**Debug Steps:**
1. Check when markdown is removed (should be early in normalization)
2. Check sentence splitting logic
3. Check component rendering for sentence preservation

### Issue 6: Generic "Point 1", "Point 2" Titles
**Symptoms:** Three-column cards have generic titles instead of meaningful ones

**Possible Causes:**
1. Title extraction failing in `detectThreeColumnCards()`
2. Fallback to `Point ${idx + 1}` being used
3. Content structure not matching expected patterns

**Debug Steps:**
1. Check title extraction patterns in `detectThreeColumnCards()`
2. Check if colon/dash separators are present
3. Check if first sentence extraction is working

### Issue 7: Messy Layout on Event Entries
**Symptoms:** Timeline events look messy, text broken up

**Possible Causes:**
1. Timeline event extraction not working correctly
2. Date/description parsing incorrect
3. Component rendering not handling events properly

**Debug Steps:**
1. Check `extractTimelineEvents()` function
2. Check date pattern matching
3. Check Timeline component rendering

---

## 9. Debugging Checklist

When layout generation fails or produces poor results:

1. **Check Input Content:**
   - Is content TipTap JSON or markdown?
   - What does raw content look like?
   - Are there markdown artifacts?

2. **Check Normalization:**
   - Console log: `🔬 [SectionDetector] Normalized content length: X`
   - Console log: `🔬 [SectionDetector] Content preview: ...`
   - Is content being stripped too aggressively?

3. **Check Paragraph Detection:**
   - Console log: `🔬 [SectionDetector] Paragraphs found: X`
   - Are paragraphs being detected?
   - Are they being filtered out?

4. **Check Section Detection:**
   - Console log: `🔬 [SectionDetector] Detected section: type, preview`
   - Console log: `🔬 [SectionDetector] Total sections detected: X`
   - Are sections being detected?
   - What types are detected?

5. **Check Component Conversion:**
   - Console log: `🔍 [V2 Layout] Detected sections: X`
   - Console log: `🔍 [V2 Layout] Section types: ...`
   - Are sections being converted to components?

6. **Check Final Layout:**
   - Console log: `✅ [V2 Layout] Generated X components`
   - Console log: `📄 [V2 Layout] Component types: ...`
   - What components are in final layout?

7. **Check Component Rendering:**
   - Are components rendering correctly?
   - Is text being cleaned in components?
   - Are titles/descriptions correct?

---

## 10. Key Files Reference

| File | Purpose |
|------|---------|
| `components/blog/VisualTransformer.tsx` | UI component that triggers generation |
| `app/api/blog/generate-layout-v2/route.ts` | API endpoint for layout generation |
| `components/blog-v2/utils/layoutGenerator.ts` | Main layout generation logic |
| `components/blog-v2/utils/sectionDetector.ts` | Content analysis and section detection |
| `components/blog-v2/BlogRenderer.tsx` | Component rendering |
| `components/blog-v2/types.ts` | Type definitions |
| `components/blog-v2/components/ThreeColumnCards.tsx` | Three-column card component |
| `components/blog-v2/components/UtilityComponents.tsx` | Paragraph, heading, list components |
| `components/blog-v2/components/NumberedSteps.tsx` | Numbered steps component |
| `components/blog-v2/components/Timeline.tsx` | Timeline component |
| `components/blog-v2/components/CalloutBox.tsx` | Callout box component |

---

## 11. Common Patterns

### Pattern: Three-Column Cards
**Detection:** 3 consecutive paragraphs with similar structure
**Extraction:** Title from first sentence or colon/dash separator
**Rendering:** Cards with icons, titles, descriptions

### Pattern: Numbered Steps
**Detection:** Consecutive paragraphs starting with numbers or "Step X:"
**Extraction:** Number, title, description from each step
**Rendering:** Vertical or grid layout with numbered steps

### Pattern: Timeline
**Detection:** Consecutive paragraphs with dates
**Extraction:** Date, title, description from each event
**Rendering:** Timeline with dates and events

### Pattern: Stats
**Detection:** Consecutive paragraphs with 3+ statistics
**Extraction:** Value, label, description from each stat
**Rendering:** Stats row with values and labels

---

## 12. Next Steps for Debugging

1. **Add More Logging:**
   - Log content at each stage (normalized, paragraphs, sections, components)
   - Log why sections are/aren't detected
   - Log title extraction results

2. **Test with Known Good Content:**
   - Use content that should produce specific components
   - Verify each detection step works correctly

3. **Check Component Rendering:**
   - Verify text cleaning in each component
   - Check title/description extraction
   - Verify no duplication

4. **Review Group Detection:**
   - Verify three-column card detection logic
   - Check numbered steps grouping
   - Verify timeline grouping

5. **Fix Text Extraction:**
   - Improve title extraction (word boundaries, sentence detection)
   - Fix word breaking issues
   - Improve duplicate removal

---

## Summary

The V2 layout system is a multi-stage pipeline:
1. **Input:** TipTap JSON or markdown
2. **Normalization:** Clean and extract text
3. **Detection:** Analyze content and detect sections
4. **Grouping:** Intelligently group related paragraphs
5. **Conversion:** Convert sections to components
6. **Rendering:** Render components with proper styling

**Key Issue:** The detection and grouping logic may not be working correctly, resulting in poor component detection and text extraction. The group-first approach should help, but may need further refinement.




