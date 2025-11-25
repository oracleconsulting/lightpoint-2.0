# 🎨 Gamma-Style Visual System - Complete Overview

## 📋 Table of Contents
1. [Design Philosophy](#design-philosophy)
2. [Component Library](#component-library)
3. [AI Models & Prompts](#ai-models--prompts)
4. [Generation Workflow](#generation-workflow)
5. [Implementation Details](#implementation-details)
6. [Critical Rules](#critical-rules)

---

## 🎨 Design Philosophy

### **The Gamma Approach**
Our blog visual system is inspired by **Gamma.app's** elegant, narrative-focused design:

#### **Core Principles:**

1. **Unified Width** 
   - All components flow at same width as body text (`max-w-4xl`)
   - No more tiny text next to giant boxes
   - Everything aligns perfectly

2. **Compact Visual Elements**
   - Stats are horizontal accents, not dominating boxes
   - Border-left accent (not full border)
   - Numbers and labels flow together

3. **Typography First, Visuals Second**
   - Body text: `prose-xl`, `text-lg` (large, readable)
   - Headings: `text-2xl` (clear hierarchy)
   - Stats: `text-4xl` (prominent but not overwhelming)

4. **Content Preservation**
   - AI extracts visuals ONLY from existing content
   - **NEVER invents** new content
   - Original prose preserved in `TextSection` components

5. **Minimal Chrome**
   - Less borders, less padding
   - More content, better readability
   - Strategic whitespace (not vast empty boxes)

6. **Strategic Spacing**
   - Tight, cohesive gaps (`my-6` not `my-12`)
   - Components breathe without drowning
   - Seamless flow: text → stat → text → chart → text

### **Before vs After**

#### ❌ **Before (Overpowering):**
```
[Tiny paragraph of text]

┌─────────────────────────────────────┐
│                                     │
│                                     │
│   92,000                            │
│   PEOPLE COMPLAINED ABOUT HMRC      │
│   Last year                         │
│                                     │
│                                     │
└─────────────────────────────────────┘

[Another tiny paragraph]
```

#### ✅ **After (Gamma-Style):**
```
Paragraph of text flowing naturally, large and readable,
taking up the full content width...

│ [Icon] 92,000
│        PEOPLE COMPLAINED ABOUT HMRC
│        Last year

More text continuing the narrative, same width as the stat
above, creating a unified, cohesive reading experience...
```

---

## 📦 Component Library

### 1. **StatCard** (Redesigned)
**Purpose:** Compact, horizontal stat display

**Layout:**
```
┌─────────────────────────────────────┐
│ [Icon]  92,000                      │
│         PEOPLE COMPLAINED ABOUT HMRC│
│         Last year                   │
└─────────────────────────────────────┘
```

**Props:**
- `metric` - The number to display
- `label` - Descriptive label
- `context` - Optional additional info
- `color` - Accent color (blue/green/red/yellow/purple)
- `prefix` - Currency symbol (£)
- `suffix` - % or unit
- `icon` - Optional icon

**Styling:**
- `max-w-4xl mx-auto` - Unified width
- `border-l-4` - Left accent bar (not full border)
- `px-6 py-4` - Tight padding
- `bg-gradient-to-br from-gray-900/40` - Subtle background

---

### 2. **TextSection**
**Purpose:** Plain prose blocks interwoven with visuals

**Layout:**
```
┌─────────────────────────────────────┐
│ Paragraph of body text...           │
│                                     │
│ More text continuing naturally...   │
└─────────────────────────────────────┘
```

**Props:**
- `content` - HTML string of prose

**Styling:**
- `prose-xl` - Large, readable text
- `text-lg` - 18px font size
- `max-w-4xl mx-auto` - Unified width
- `my-6` - Tight spacing

---

### 3. **ComparisonChart**
**Purpose:** Data visualizations (bar, pie, line)

**Props:**
- `type` - "bar" | "pie" | "line"
- `title` - Chart title
- `data` - Array of data points

**Styling:**
- `max-w-4xl mx-auto` - Unified width
- Recharts with white text, UK formatting

---

### 4. **ProcessFlow**
**Purpose:** Step-by-step process visualization

**Props:**
- `steps` - Array of step objects
- `title` - Optional title

**Styling:**
- Responsive grid for 5+ steps
- Auto-detects layout

---

### 5. **Timeline**
**Purpose:** Chronological event display

**Props:**
- `events` - Array of events with dates

---

### 6. **CalloutBox**
**Purpose:** Highlighted quotes/insights

**Props:**
- `text` - Quote text
- `variant` - "info" | "warning" | "success" | "quote"

---

### 7. **ChecklistCard**
**Purpose:** Numbered action items

**Props:**
- `items` - Array of checklist items

---

### 8. **HeroGradient**
**Purpose:** Full-width hero section

**Props:**
- `headline` - Main title
- `subheadline` - Subtitle
- `ctaText` - Call-to-action button text
- `ctaLink` - Button URL

---

## 🤖 AI Models & Prompts

### **Step 1: Research (ChatGPT 5.1)**
**Model:** `openai/chatgpt-5.1`  
**Temperature:** 0.7  
**Purpose:** Deep research, identify visual opportunities

**Prompt Focus:**
- Gather statistics and data points
- Identify process flows, timelines, comparisons
- Find quotable insights
- Collect evidence for visual storytelling

---

### **Step 2: Content Writing (Claude Opus 4.1)**
**Model:** `anthropic/claude-opus-4.1`  
**Temperature:** 0.8  
**Purpose:** Write visually-rich blog post

**Critical Structure Rules:**
```
1. Hero Section (opening impact)
2. Opening Impact (2-3 paragraphs max)
3. Main Content (max 150 words between visual markers)
4. Evidence (stats, charts, timelines)
5. Action Steps (process flows, checklists)
6. Conclusion (summary + CTA)
```

**Style Requirements:**
- UK spelling (standardised, optimise, colour)
- Active voice
- Bold key phrases
- Scannable paragraphs (3-4 lines max)
- Visual markers in text (e.g., "📊 Key Statistics:")

---

### **Step 3: Visual Layout Generation (Claude Opus 4.1) - GAMMA ENGINE**

**Model:** `anthropic/claude-opus-4.1`  
**Temperature:** 0.6  
**Max Tokens:** 8000

#### **System Prompt:**
```
You are an ELITE visual designer creating Gamma-style presentations. Your job is to ENHANCE existing text with visual components, NOT replace it. Original prose must be preserved.

🎯 YOUR MISSION: Extract visual elements ONLY from the provided text. NEVER INVENT CONTENT.

📊 MANDATORY EXTRACTION RULES:

1. **Stats Everywhere** - ANY number becomes a StatCard:
   - Currency: Input "£5,000" → metric: "5,000", prefix: "£"
     NEVER output "££" - prefix applied by component
   - Percentages: "92%" → metric: "92", suffix: "%"
   - Counts: "35,000 cases" → metric: "35,000", label: "Cases"

2. **Chart All Comparisons** - 2+ numbers = automatic chart:
   - ONLY if numbers are directly comparable
   - Extract exact values from text
   - Use bar chart for comparisons, pie for distributions

3. **Timeline Everything** - Any sequence = Timeline:
   - CRITICAL: ONLY create a Timeline if dates/sequences are EXPLICITLY stated in text
   - "May 12, 2024: VAT1 submitted" → Timeline event
   - "Then... After..." alone is NOT enough for Timeline

4. **Process = Visual Flow** - Any steps = ProcessFlow:
   - CRITICAL: ONLY create a ProcessFlow if steps are EXPLICITLY numbered/listed
   - "Step 1: ... Step 2: ..." → ProcessFlow
   - Generic mention of "process" alone is NOT enough

5. **Callouts for Impact** - Important points = CalloutBox:
   - Quotes from regulations
   - Key insights
   - Warnings/tips

6. **Hero First** - ALWAYS start with HeroGradient:
   - Use article title as headline
   - Create engaging subheadline from excerpt

🚨 CRITICAL RULES - VIOLATION RESULTS IN FAILURE:

1. NEVER INVENT CONTENT - Only extract what explicitly exists in the provided text
2. NEVER REWRITE TEXT - Preserve original wording exactly
3. NEVER CREATE TIMELINES unless dates/sequences explicitly stated
4. NEVER CREATE PROCESSES unless steps explicitly numbered/listed
5. NEVER ADD CONTEXT - Use exact phrases from source
6. Every component MUST include "sourceText" field, containing the exact snippet from the original content that justified its creation
7. UK English: Convert all Americanisms (e.g., "standardized" → "standardised", "optimize" → "optimise")
8. Em-dashes: Replace all em-dashes (—) with regular dashes (-)
9. **TextSection**: For any prose that is not part of a visual component, wrap it in a `TextSection` component. Break long paragraphs into logical `TextSection` blocks.

🎨 COMPONENT LIBRARY:

- **HeroGradient**: Full-width hero (use first with article title)
- **TextSection**: Prose paragraphs (REQUIRED to preserve narrative)
- **StatCard**: Single stat (compact, horizontal)
- **ComparisonChart**: Bar/pie/line chart
- **ProcessFlow**: Numbered steps (ONLY if explicit)
- **Timeline**: Chronological events (ONLY if explicit)
- **CalloutBox**: Highlighted quotes/insights
- **ChecklistCard**: Action items

📐 LAYOUT RULES:

1. **Max 2-3 paragraphs before visual** - Never more than 150 words
2. **One visual per section** - Don't cluster multiple charts together
3. **Alternate text and visuals** - Never: text-text-text-visual-visual-visual
4. **Consistent spacing** - Even distribution throughout post
5. **TextSections interwoven** - Text → Visual → Text → Visual

📊 OUTPUT STRUCTURE:

{
  "theme": {
    "mode": "dark",
    "colors": {
      "primary": "#4F86F9",
      "secondary": "#00D4FF"
    }
  },
  "layout": [
    {
      "type": "HeroGradient",
      "props": {
        "headline": "Article Title",
        "subheadline": "Engaging subtitle from excerpt",
        "ctaText": "Learn More",
        "ctaLink": "/about"
      },
      "sourceText": "Article title and excerpt"
    },
    {
      "type": "TextSection",
      "content": "<p>Opening paragraph preserved exactly...</p>"
    },
    {
      "type": "StatCard",
      "props": {
        "metric": "92,000",
        "label": "Complaints Filed",
        "context": "Last year with HMRC",
        "color": "blue"
      },
      "sourceText": "Last year, 92,000 complaints were filed"
    },
    {
      "type": "TextSection",
      "content": "<p>Next paragraph of content...</p>"
    }
  ],
  "warnings": ["List any components you could NOT create due to missing explicit data"]
}

⚠️ RETURN ONLY VALID JSON - No markdown, no explanations, just JSON.
```

---

### **Step 4: Image Generation (Gemini 3 Pro)**
**Model:** `google/gemini-3-pro-image-preview`  
**Temperature:** 0.7  
**Purpose:** Generate hero images and chart visualizations

**Style Requirements:**
- Dark gradient backgrounds
- Neon accents (blue, cyan, pink)
- Professional UK business aesthetic
- High contrast
- Subtle glow effects

---

### **Step 5: SEO Generation (Claude Opus 4.1)**
**Model:** `anthropic/claude-opus-4.1`  
**Temperature:** 0.5  
**Purpose:** Generate meta title, description, tags, slug

---

## 🔄 Generation Workflow

```
┌─────────────────────────────────────┐
│  User Input: Topic                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Step 1: Research (ChatGPT 5.1)     │
│  - Gather stats, data points        │
│  - Identify visual opportunities    │
│  - Find process flows, timelines    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Step 2: Content Writing (Claude)   │
│  - Visually-rich structure          │
│  - Max 150 words between visuals    │
│  - Bold key phrases                 │
│  - UK spelling, scannable           │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Step 3: GAMMA LAYOUT ENGINE        │
│  (Claude Opus 4.1)                  │
│                                     │
│  STRICT RULES:                      │
│  ✓ NEVER invent content             │
│  ✓ ONLY extract explicit data       │
│  ✓ Preserve prose in TextSections   │
│  ✓ Create compact StatCards         │
│  ✓ All components at max-w-4xl      │
│  ✓ Typography-first approach        │
│                                     │
│  OUTPUT:                            │
│  - HeroGradient (always first)      │
│  - TextSection (opening)            │
│  - StatCard (compact, horizontal)   │
│  - TextSection (continuing)         │
│  - ComparisonChart (if data)        │
│  - TextSection (more prose)         │
│  - ProcessFlow/Timeline (if steps)  │
│  - TextSection (conclusion)         │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Step 4: Image Gen (Gemini 3 Pro)   │
│  - Hero image (optional)            │
│  - Chart visualizations             │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Step 5: SEO (Claude)               │
│  - Meta title, description          │
│  - Tags, slug                       │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  CLIENT-SIDE RENDERING              │
│  DynamicGammaRenderer               │
│                                     │
│  - Renders all components           │
│  - Applies max-w-4xl to all         │
│  - Gamma-style CSS (glows, etc.)    │
│  - Ensures seamless flow            │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  RESULT: Gamma-Style Blog Post      │
│  ✓ Elegant, narrative-focused       │
│  ✓ Unified visual hierarchy         │
│  ✓ Large, readable typography       │
│  ✓ Visuals enhance (not overpower)  │
└─────────────────────────────────────┘
```

---

## 💻 Implementation Details

### **Frontend Rendering**

**File:** `components/blog/DynamicGammaRenderer.tsx`

**Key Features:**
1. **Unified Width Wrapper:** All components wrapped in `max-w-4xl mx-auto`
2. **Component Mapping:** Maps AI-generated JSON to React components
3. **Null Safety:** Comprehensive error handling
4. **Debug Logging:** Console logs for development

**Render Logic:**
```typescript
switch (type) {
  case 'StatCard':
    return <StatCard {...props} animationDelay={index * 0.05} />;
  
  case 'TextSection':
    return (
      <div className="prose prose-xl prose-invert max-w-4xl mx-auto my-6">
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    );
  
  case 'ComparisonChart':
    return (
      <div className="max-w-4xl mx-auto my-8">
        <ComparisonChart {...props} />
      </div>
    );
  
  // ... other components
}
```

---

### **Styling System**

**File:** `app/globals.css`

**Gamma-Style CSS:**
```css
/* Stat Card - Compact Horizontal */
.stat-card {
  background: linear-gradient(135deg, rgba(79, 134, 249, 0.15) 0%, rgba(0, 212, 255, 0.08) 100%);
  border-left: 4px solid rgba(79, 134, 249, 0.4);
  border-radius: 12px;
  padding: 1.5rem 1.5rem;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
}

.stat-card:hover {
  transform: translateY(-2px);
  border-left-color: rgba(79, 134, 249, 0.8);
  box-shadow: 
    0 12px 24px rgba(79, 134, 249, 0.2),
    inset 0 1px 0 0 rgba(255, 255, 255, 0.2);
}

/* Metrics - Prominent but not overwhelming */
.stat-metric {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #4F86F9 0%, #00D4FF 50%, #8B5CF6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  filter: drop-shadow(0 0 20px rgba(79, 134, 249, 0.5));
}

/* Charts - Professional depth */
.chart-container {
  background: linear-gradient(135deg, rgba(26, 26, 46, 0.8) 0%, rgba(15, 15, 30, 0.9) 100%);
  border-radius: 16px;
  padding: 2rem;
  border: 2px solid rgba(79, 134, 249, 0.3);
  backdrop-filter: blur(16px);
}
```

---

## 🚨 Critical Rules

### **Content Preservation**
1. **NEVER invent content** - Only extract from provided text
2. **NEVER rewrite prose** - Preserve exact wording
3. **NEVER create timelines** without explicit dates
4. **NEVER create process flows** without explicit steps
5. **Include sourceText** field for every component

### **Layout Rules**
1. **All components at max-w-4xl** - Unified width
2. **TextSections interwoven** - Never cluster visuals
3. **Max 2-3 paragraphs before visual** - ~150 words
4. **Typography-first** - Large text, subtle visuals

### **Styling Rules**
1. **Compact stats** - Horizontal, border-left accent
2. **Tight spacing** - `my-6` not `my-12`
3. **Minimal chrome** - Less borders, more content
4. **Strategic whitespace** - Breathe without drowning

### **UK Standards**
1. **UK spelling** - "standardised", "optimise", "colour"
2. **Currency** - £ not $
3. **Date format** - DD/MM/YYYY
4. **Em-dashes** - Replace with regular dashes

---

## 📈 Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| **Visual density** | 1 visual per 150 words | ✅ Achieved |
| **Content preservation** | 100% original prose | ✅ Achieved |
| **Width consistency** | All max-w-4xl | ✅ Achieved |
| **Typography readability** | prose-xl, text-lg | ✅ Achieved |
| **Component compactness** | Horizontal stats | ✅ Achieved |

---

## 🎯 Future Enhancements

### **Planned:**
- [ ] More chart types (scatter, area, radar)
- [ ] Template presets ("Data Story", "Case Study")
- [ ] A/B testing different layouts
- [ ] User customization (color schemes, spacing)
- [ ] Animation presets

### **Under Consideration:**
- [ ] Interactive charts (hover tooltips)
- [ ] Video/audio embedding
- [ ] Table of contents auto-generation
- [ ] Print-optimized layouts

---

**Last Updated:** November 25, 2025  
**Version:** 2.0 Gamma-Style  
**Maintained by:** Lightpoint Development Team

