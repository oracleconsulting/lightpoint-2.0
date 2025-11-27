# 🎨 Gamma-Style Visual System V3 - Complete Specification

## ⚠️ CRITICAL VIOLATIONS TO ELIMINATE

Before any generation, understand these **ABSOLUTE FAILURES** from previous outputs:

### ❌ VIOLATION 1: Light Theme Backgrounds
**WRONG:** Purple gradients, lavender tones, light grey backgrounds
**CORRECT:** Deep navy (#0a0a1a to #1a1a2e), pure dark (#0f0f1e)

### ❌ VIOLATION 2: Vertically-Stacked Dominating Stats
**WRONG:** 
```
┌─────────────────────────────────────┐
│                                     │
│         92,000                      │
│   PEOPLE COMPLAINED ABOUT HMRC      │
│         Last year                   │
│                                     │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│                                     │
│          98%                        │
│    RESOLVED INTERNALLY              │
│                                     │
└─────────────────────────────────────┘
```

**CORRECT:**
```
┌──────────────────┬──────────────────┬──────────────────┐
│ │ 92,000         │ │ 98%            │ │ 41%            │
│ │ Complaints     │ │ Resolved       │ │ Upheld         │
│ │ Last year      │ │ Internally     │ │ On appeal      │
└──────────────────┴──────────────────┴──────────────────┘
```

### ❌ VIOLATION 3: Stats Consuming >20% Viewport
**WRONG:** Giant stat boxes taking 40-50% of visible screen
**CORRECT:** Compact accent elements, max 15% of viewport height

### ❌ VIOLATION 4: Full Border Boxes
**WRONG:** `border: 2px solid blue` around entire stat card
**CORRECT:** `border-left: 4px solid` accent bar only

---

## 🎯 THE GAMMA PHILOSOPHY

Gamma.app creates **narrative-focused presentations** where:

1. **Text is the hero** - Large, readable prose drives the story
2. **Visuals punctuate** - Stats and charts accent, never dominate
3. **Dark creates depth** - Navy/black backgrounds with glowing accents
4. **Horizontal flow** - Related data sits side-by-side
5. **Unified width** - Everything aligns at `max-w-4xl` (896px)
6. **Breathing room** - Strategic whitespace, not vast emptiness

---

## 🌙 MANDATORY DARK THEME SPECIFICATION

### Background Palette (NEVER DEVIATE)

```css
/* Primary page background */
--bg-page: linear-gradient(180deg, #0a0a1a 0%, #0f0f23 50%, #1a1a2e 100%);

/* Card/component backgrounds */
--bg-card: linear-gradient(135deg, rgba(26, 26, 46, 0.6) 0%, rgba(15, 15, 30, 0.8) 100%);

/* Elevated surfaces */
--bg-elevated: linear-gradient(135deg, rgba(30, 30, 55, 0.7) 0%, rgba(20, 20, 40, 0.9) 100%);

/* Chart containers */
--bg-chart: linear-gradient(135deg, rgba(15, 15, 35, 0.9) 0%, rgba(10, 10, 25, 0.95) 100%);
```

### Accent Colors

```css
/* Primary blue - stats, highlights */
--accent-blue: #4F86F9;
--accent-blue-glow: rgba(79, 134, 249, 0.4);

/* Secondary cyan - secondary stats, links */
--accent-cyan: #00D4FF;
--accent-cyan-glow: rgba(0, 212, 255, 0.3);

/* Success green - positive metrics */
--accent-green: #10B981;
--accent-green-glow: rgba(16, 185, 129, 0.3);

/* Warning amber - caution items */
--accent-amber: #F59E0B;
--accent-amber-glow: rgba(245, 158, 11, 0.3);

/* Danger red - negative/critical */
--accent-red: #EF4444;
--accent-red-glow: rgba(239, 68, 68, 0.3);

/* Purple - tertiary accent */
--accent-purple: #8B5CF6;
--accent-purple-glow: rgba(139, 92, 246, 0.3);
```

### FORBIDDEN COLORS

```css
/* NEVER USE THESE */
❌ #E9D5FF (lavender)
❌ #F3E8FF (light purple)
❌ #DDD6FE (violet-100)
❌ #C4B5FD (violet-200)
❌ Any background with lightness > 30%
❌ Any purple/pink gradient as page background
❌ White or light grey backgrounds
```

---

## 📦 COMPONENT LIBRARY V3

### 1. StatCard (Redesigned)
- Compact horizontal layout
- Border-left accent only (NOT full border)
- Max height: 120px
- Max 15% viewport height

### 2. StatCardGroup (NEW)
- Horizontal grouping of 2-3 related stats
- Use instead of stacking individual StatCards
- Grid layout: 2-col or 3-col

### 3. TextSection
- Large readable prose (text-lg, prose-xl)
- Max 150 words per section
- Interwoven with visuals

### 4. ComparisonChart
- Types: bar, horizontalBar, donut
- Dark background container
- White text labels

### 5. ProcessFlow
- Numbered steps with cards
- Responsive grid layout
- Connection indicators

### 6. Timeline
- Date-based chronological display
- Only when explicit dates exist
- Tabular format

### 7. CalloutBox
- Variants: quote, info, warning, success
- Border-left accent for quotes
- Subtle gradient backgrounds

### 8. ChecklistCard
- Numbered action items
- 2x2 grid layout option

### 9. SectionDivider (NEW)
- Visual break between sections
- Diamond icon with gradient lines

---

## 🔄 GENERATION WORKFLOW

```
User Input: Topic
    ↓
[1] Research (ChatGPT 5.1)
    ↓
[2] Content Writing (Claude Opus 4.1)
    ↓
[3] GAMMA LAYOUT ENGINE V3 (Claude Opus 4.1)
    - Enforce dark theme
    - Group related stats horizontally
    - Alternate text and visuals
    - Max 150 words between visuals
    ↓
[4] Layout Validation
    - Theme mode === "dark"
    - No stacked stats
    - All max-w-4xl
    ↓
[5] Client Rendering (DynamicGammaRenderer)
    - Apply V3 CSS
    - Enforce dark background
    - Render components
```

---

## 📊 VALIDATION CHECKLIST

### Theme Validation
- [ ] `theme.mode` === "dark"
- [ ] Page background uses navy/black (#0a0a1a to #1a1a2e)
- [ ] No purple, lavender, or light backgrounds
- [ ] All text is white or white with opacity

### Stat Card Validation
- [ ] No vertically stacked individual StatCards
- [ ] Related stats (2-3) grouped in StatCardGroup
- [ ] All stat cards have max-height of 120px
- [ ] Stat cards use border-left accent (not full border)

### Layout Validation
- [ ] All components at max-w-4xl (896px)
- [ ] TextSections ≤150 words each
- [ ] Visuals alternate with text (no clustering)

### Content Validation
- [ ] Every component has sourceText field
- [ ] No invented content - only extracted
- [ ] UK spelling throughout

---

**Document Version:** 3.0  
**Last Updated:** November 27, 2025  
**Maintained by:** Lightpoint Development Team

