# 🎨 Gamma-Style Visual System V4

**Version:** 4.0  
**Last Updated:** November 27, 2025

## What's New in V4

- **Configurable colour themes** (not locked to ultra-dark)
- **Larger, more readable typography** (20px body text)
- **Enforced horizontal stat grouping** (no more vertical stacking)
- **Cleaner visual hierarchy**
- **Streamlined for faster generation**
- **Post-processing to auto-group stats**

---

## 🎨 THEME SYSTEM

### Available Themes

| Theme | Mode | Best For |
|-------|------|----------|
| **Midnight** | Dark | Ultra-dark aesthetic |
| **Slate** | Dark | Balanced readability |
| **Ocean** | Medium | Blue-focused content |
| **Lightpoint** | Dark | Brand consistency |
| **Professional** | Light | Corporate content |

### Usage

```typescript
import { getTheme, themes } from '@/lib/blog/themes';

// Get a theme by name
const theme = getTheme('lightpoint');

// Access theme colors
console.log(theme.colors.pageBgGradient);
console.log(theme.colors.accentPrimary);
```

### Theme Structure

```typescript
interface ThemeConfig {
  name: string;
  mode: 'dark' | 'medium' | 'light';
  colors: {
    pageBg: string;
    pageBgGradient: string;
    cardBg: string;
    cardBorder: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accentPrimary: string;
    accentSecondary: string;
    accentSuccess: string;
    accentWarning: string;
    accentDanger: string;
  };
}
```

---

## 📝 TYPOGRAPHY SCALE

### CSS Variables

```css
:root {
  --font-body: 1.25rem;           /* 20px - MINIMUM for body text */
  --font-body-lg: 1.375rem;       /* 22px */
  --font-heading-section: 2rem;    /* 32px */
  --font-heading-sub: 1.5rem;      /* 24px */
  --font-heading-hero: 3rem;       /* 48px */
  --font-stat-metric: 2.5rem;      /* 40px standalone */
  --font-stat-metric-grouped: 2rem; /* 32px in groups */
  --font-label: 0.9375rem;         /* 15px */
  --font-caption: 0.9375rem;       /* 15px */
  --line-height-body: 1.8;
  --line-height-heading: 1.2;
}
```

---

## 📊 STAT GROUPING

### The Rule

**If 2-3 stats appear within 200 words of each other, they MUST be grouped horizontally.**

### Before (Wrong)
```
┌─────────────────────────────────────┐
│  92,000                             │
│  PEOPLE COMPLAINED                  │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐
│  98%                                │
│  RESOLVED INTERNALLY                │
└─────────────────────────────────────┘
```

### After (Correct)
```
┌────────────────────────────────────────────────────┐
│  ┌──────────────┐    ┌──────────────┐              │
│  │ 92,000       │    │ 98%          │              │
│  │ Complaints   │    │ Resolved     │              │
│  └──────────────┘    └──────────────┘              │
└────────────────────────────────────────────────────┘
```

### Post-Processing

The API now includes automatic post-processing that:
1. Detects consecutive StatCard components
2. Groups them into StatCardGroup (2-3 per group)
3. Marks truly isolated stats as `standalone: true`

---

## 🤖 AI PROMPT (V4)

The AI prompt now includes:

1. **Theme injection** - Theme colors are passed to the AI
2. **Explicit grouping rules** - "NEVER output consecutive individual StatCards"
3. **Typography guidance** - Body text must be substantial
4. **Lower temperature** (0.4) - More consistent output

---

## 🧩 COMPONENTS

### StatCardGroup

```typescript
interface StatCardGroupProps {
  title?: string;
  stats: Array<{
    metric: string;
    label: string;
    context?: string;
    color: 'blue' | 'cyan' | 'green' | 'amber' | 'red' | 'purple';
    prefix?: string;
    suffix?: string;
  }>;
}
```

### TextSection

```typescript
interface TextSectionProps {
  content: string;  // HTML content
  style?: 'single-column' | 'two-column';
}
```

---

## 🔧 API USAGE

### Transform Visual Endpoint

```typescript
POST /api/blog/transform-visual

Body:
{
  "title": "Blog Post Title",
  "content": "Full blog content...",
  "excerpt": "Optional excerpt",
  "themeName": "lightpoint"  // Optional, defaults to lightpoint
}

Response:
{
  "success": true,
  "layout": {
    "theme": { ... },
    "layout": [ ... ]
  }
}
```

---

## 📋 VALIDATION CHECKLIST

Before rendering, verify:

### Theme
- [ ] Theme is one of: midnight, slate, ocean, lightpoint, professional
- [ ] Background gradient applied to page container
- [ ] Text colours match theme config

### Stats
- [ ] All 2-3 adjacent stats use StatCardGroup (not individual StatCards)
- [ ] StatCardGroup uses horizontal grid layout
- [ ] No vertically stacked StatCards in sequence

### Typography
- [ ] Body text is text-xl (20px) minimum
- [ ] Headings have proper hierarchy (32px → 24px → 20px)
- [ ] Stat metrics are 40px standalone, 32px grouped

### Layout
- [ ] All components max-w-4xl
- [ ] TextSections ≤150 words
- [ ] Visual elements alternate with text

### Content
- [ ] Every component has sourceText
- [ ] No invented content
- [ ] UK spelling throughout

---

## 🚀 FILES CHANGED IN V4

| File | Description |
|------|-------------|
| `lib/blog/themes.ts` | NEW - Theme configuration system |
| `app/api/blog/transform-visual/route.ts` | V4 prompt, post-processing |
| `components/blog/gamma/StatCardGroup.tsx` | Horizontal grid layout |
| `components/blog/gamma/TextSection.tsx` | Larger body text |
| `components/blog/DynamicGammaRenderer.tsx` | Theme support |
| `app/globals.css` | V4 typography variables |

---

## 🎯 SUMMARY: What V4 Fixes

| Issue | V3 Problem | V4 Solution |
|-------|------------|-------------|
| Too dark | Locked to ultra-dark navy | 5 configurable themes |
| Text too small | 18px body text | 20px minimum body text |
| Stats stacking | Individual StatCards stacked | StatCardGroup enforced |
| Readability | Low contrast in places | Theme system with balanced contrast |
| Generation speed | Large prompt, slow | Streamlined prompt, faster parsing |

