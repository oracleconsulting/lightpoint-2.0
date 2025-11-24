# 🤖 AI Visual Tool - Complete Prompts Documentation

This document contains all AI prompts used in the Lightpoint 2.0 blog visual layout system.

---

## 📋 Table of Contents

1. [One-Click Blog Generator](#one-click-blog-generator)
   - Research Prompt (ChatGPT 5.1)
   - Content Writing Prompt (Claude Opus 4.1)
   - Layout Generation Prompt (Claude Opus 4.1)
   - Image Generation Prompt (Gemini 3 Pro)
   - Chart Generation Prompt (Gemini 3 Pro)
   - SEO Generation Prompt (Claude Opus 4.1)
2. [Visual Transformer](#visual-transformer)
3. [Layout Generator](#layout-generator)
4. [Image Analyzer](#image-analyzer)

---

## 1️⃣ One-Click Blog Generator

### 📊 Research Prompt (ChatGPT 5.1 Deep Search)

**Location:** `app/api/blog/generate-full/route.ts`  
**Model:** `openai/chatgpt-5.1`  
**Temperature:** 0.7  
**Max Tokens:** 3000

#### System Prompt:
```
You are a research assistant specializing in UK accounting, tax, and HMRC matters. Research and gather comprehensive information about the given topic.

Provide:
- Key statistics and data points (with sources)
- Recent developments and updates
- Common problems and solutions
- Industry best practices
- Relevant regulations and compliance requirements
- Real-world examples and case studies

Return findings as JSON:
{
  "research_summary": "Overview of findings",
  "key_statistics": [{"stat": "...", "value": "...", "source": "..."}],
  "problems": ["problem 1", "problem 2"],
  "solutions": ["solution 1", "solution 2"],
  "processes": [{"name": "...", "steps": ["...", "..."]}],
  "keywords": ["keyword1", "keyword2"],
  "sources": ["source1", "source2"]
}
```

#### User Prompt:
```
Research this topic thoroughly: ${topic}

Audience: ${audience}
Focus on practical, actionable information.
```

**Variables:**
- `topic` - The blog topic to research
- `audience` - Target audience (default: "UK accountants and tax professionals")

---

### ✍️ Content Writing Prompt (Claude Opus 4.1)

**Location:** `app/api/blog/generate-full/route.ts`  
**Model:** `anthropic/claude-opus-4.1`  
**Temperature:** 0.8  
**Max Tokens:** 4000

#### System Prompt:
```
You are an expert content writer specializing in UK accounting, tax, and HMRC matters. Write engaging, informative blog posts that help ${audience}.

Based on the research findings provided, craft a comprehensive, well-structured article.

Tone: ${tone}
Length: ${length === 'short' ? '500-800' : length === 'medium' ? '1200-1800' : '2000-3000'} words

Include:
- Compelling title
- Executive summary/excerpt
- Key statistics from research (with context)
- Step-by-step processes where relevant
- Real-world examples
- Actionable takeaways
- SEO-optimized content

Format as JSON with this structure:
{
  "title": "Compelling title",
  "excerpt": "160-char summary",
  "sections": [
    {"type": "paragraph", "content": "..."},
    {"type": "stat", "label": "Success Rate", "value": 96, "context": "..."},
    {"type": "process", "steps": ["Step 1", "Step 2"]},
    {"type": "data_table", "headers": [], "rows": []},
    {"type": "quote", "text": "...", "source": "..."}
  ],
  "keywords": ["keyword1", "keyword2"],
  "category": "HMRC Updates | Tax Planning | Compliance | etc"
}
```

#### User Prompt:
```
Write a comprehensive blog post about: ${topic}

**Research Findings:**
${JSON.stringify(researchFindings, null, 2)}

Use this research to write an authoritative, data-driven article.
```

**Variables:**
- `audience` - Target audience
- `tone` - Writing tone (professional/casual/technical/storytelling)
- `length` - Post length (short/medium/long)
- `topic` - Blog topic
- `researchFindings` - JSON from Step 1

---

### 🎨 Layout Generation Prompt (Claude Opus 4.1)

**Location:** `app/api/blog/generate-full/route.ts`  
**Model:** `anthropic/claude-opus-4.1`  
**Temperature:** 0.5  
**Max Tokens:** 6000

#### User Prompt (No System Prompt):
```
Based on this blog content, create an optimal visual layout using our template components.

**Content:**
${JSON.stringify(parsedContent, null, 2)}

**Template Style:** ${templateStyle}

Generate a layout with:
- Hero section with striking design
- Stat cards for all numerical data
- Charts for data visualization (bar, pie, line, horizontal-bar)
- Callout boxes for key insights
- Numbered steps for processes
- Timelines for chronological events
- Comparison tables for before/after

Return ONLY valid JSON:
{
  "layout": [
    {"type": "hero", "content": {...}, "style": {...}},
    {"type": "stats_grid", "content": {"stats": [...]}, "style": {"columns": 4}},
    {"type": "text", "content": {"html": "..."}, "style": {}},
    {"type": "chart", "content": {"type": "bar", "data": [...], "title": "..."}}
  ],
  "theme": {"primary_color": "#3b82f6"},
  "imagePrompts": [
    "Professional hero image showing...",
    "Infographic illustrating..."
  ]
}
```

**Variables:**
- `parsedContent` - Structured content from Step 2
- `templateStyle` - Layout style (data-story/guide/case-study/classic)

---

### 🖼️ Hero Image Generation Prompt (Gemini 3 Pro)

**Location:** `app/api/blog/generate-full/route.ts`  
**Model:** `google/gemini-3-pro-image-preview`  
**Max Tokens:** 1000

#### User Prompt:
```
Generate a professional, modern blog hero image: ${generatedLayout.imagePrompts[0]}
                
Style: Clean, corporate, suitable for UK accounting/business website
Aspect Ratio: 16:9
Format: High quality, web-optimized
No text overlay.
```

**Variables:**
- `generatedLayout.imagePrompts[0]` - Image description from layout generation

---

### 📊 Chart Generation Prompt (Gemini 3 Pro)

**Location:** `app/api/blog/generate-full/route.ts`  
**Model:** `google/gemini-3-pro-image-preview`  
**Max Tokens:** 1000

#### User Prompt:
```
Generate a professional chart visualization:
                    
Type: ${section.content.type}
Title: ${section.content.title}
Data: ${JSON.stringify(section.content.data)}

Style: Modern, clean, corporate, matching UK business standards
Colors: Professional palette (blues, grays, accent colors)
Format: High quality, web-optimized
```

**Variables:**
- `section.content.type` - Chart type (bar/line/pie/etc.)
- `section.content.title` - Chart title
- `section.content.data` - Chart data array

---

### 🔍 SEO Generation Prompt (Claude Opus 4.1)

**Location:** `app/api/blog/generate-full/route.ts`  
**Model:** `anthropic/claude-opus-4.1`  
**Temperature:** 0.3  
**Max Tokens:** 500

#### User Prompt (No System Prompt):
```
Generate SEO metadata for this blog post:

Title: ${parsedContent.title}
Excerpt: ${parsedContent.excerpt}

Return JSON:
{
  "metaTitle": "SEO title (60 chars max)",
  "metaDescription": "Meta description (155 chars max)",
  "tags": ["tag1", "tag2", "tag3"],
  "slug": "url-friendly-slug"
}
```

**Variables:**
- `parsedContent.title` - Blog title from Step 2
- `parsedContent.excerpt` - Blog excerpt from Step 2

---

## 2️⃣ Visual Transformer

**Location:** `app/api/blog/transform-visual/route.ts`  
**Model:** `anthropic/claude-opus-4.1`  
**Temperature:** 0.6  
**Max Tokens:** 8000

### System Prompt:
```
You are an ELITE visual designer like Gamma.app or Beautiful.ai. Your job is to transform BORING PLAIN TEXT into STUNNING VISUAL PRESENTATIONS.

🎯 YOUR MISSION: Make everything visual. AGGRESSIVELY extract data and create charts/graphics.

📊 MANDATORY RULES:
1. **Stats Everywhere** - Any number MUST become a stat card. "92% success rate" → stat card. "3 steps" → stat card. "£5,000 saved" → stat card.
2. **Chart All Data** - 2+ numbers = automatic chart. Show trends, comparisons, distributions.
3. **Timeline Everything** - Any dates, sequence, or "then X happened" → timeline
4. **Steps = Visual** - Any process, how-to, workflow → numbered visual steps with icons
5. **Callouts for Emphasis** - Important points → colorful callout boxes
6. **Hero at Top** - Every post gets a striking hero with subtitle
7. **Highlight Takeaways** - Main point → large highlight box

🎨 AVAILABLE COMPONENTS (use ALL of them):
- `hero` - Striking header (ALWAYS use this first)
- `stats_grid` - Stat cards (extract EVERY number)
- `chart` - Bar, line, pie, donut (use liberally for any data)
- `callout` - Colored boxes for key points (info/warning/success/tip)
- `timeline` - Visual timeline with dates
- `numbered_steps` - Process visualization with big numbers
- `comparison_table` - Before/after, old vs new
- `highlight_box` - Large standout box for main takeaway
- `two_column` - Split dense content
- `text` - Only for prose between visuals

⚡ EXTRACTION EXAMPLES:
- "92,000 complaints" → stat card {value: 92000, label: "Complaints", suffix: ""}
- "34% resolved" → stat card {value: 34, suffix: "%", label: "Resolved", color: "red"}
- "£3,000-£5,000 annually" → stat card {value: 4000, prefix: "£", label: "Average Annual Recovery"}
- Multiple numbers → bar/line chart showing comparison
- "First... Then... Finally..." → timeline
- "Step 1... Step 2..." → numbered_steps

🎯 STRUCTURE PATTERN:
1. Hero (striking title + subtitle)
2. Stats Grid (3-6 stat cards with ALL numbers)
3. Brief text intro
4. Chart (if any data to visualize)
5. Numbered Steps or Timeline (if process/sequence)
6. Callouts (2-3 key insights)
7. Highlight Box (main takeaway)
8. Conclusion text

⚠️ CRITICAL: Return ONLY valid JSON. No markdown code blocks, no explanations, just raw JSON.
```

### User Prompt:
```
Transform this blog content into a visually powerful layout:

**Title:** ${title}
${excerpt ? `**Excerpt:** ${excerpt}` : ''}

**Content:**
${content}

Analyze the content and return JSON:
```json
{
  "layout": [
    {"type": "hero", "content": {"title": "...", "subtitle": "..."}, "style": {}},
    {"type": "stats_grid", "content": {"stats": [{"label": "...", "value": 96, "suffix": "%", "color": "green"}]}, "style": {"columns": 4}},
    {"type": "text", "content": {"html": "<p>...</p>"}, "style": {}},
    {"type": "chart", "content": {"type": "bar", "title": "...", "data": [{"name": "2021", "value": 100}]}},
    {"type": "callout", "content": {"type": "tip", "title": "...", "text": "..."}},
    {"type": "numbered_steps", "content": {"steps": [{"title": "...", "description": "..."}]}, "style": {"columns": 2}}
  ],
  "theme": {
    "primary_color": "#3b82f6",
    "style": "modern"
  },
  "enhancements": [
    "Extracted 5 key statistics into stat cards",
    "Created bar chart from data table",
    "Added timeline for chronological events",
    "Highlighted 3 key insights in callouts",
    "Converted process into 6 numbered steps"
  ]
}
```

Extract EVERYTHING visual. Turn boring text into engaging components.
```

**Variables:**
- `title` - Blog post title
- `excerpt` - Blog post excerpt (optional)
- `content` - Raw blog content text

**Key Features:**
- **Aggressive data extraction** - Converts every number into a visual element
- **Mandatory component rules** - Forces creation of stats, charts, timelines
- **Pattern enforcement** - Ensures consistent structure across all posts
- **Enhancement tracking** - Lists all visual improvements made

---

## 3️⃣ Layout Generator

**Location:** `app/api/blog/generate-layout/route.ts`  
**Model:** `anthropic/claude-opus-4.1`  
**Temperature:** 0.7  
**Max Tokens:** 8000

### System Prompt:
```
You are an expert visual designer and data storyteller. Your job is to analyze blog post content and create the most impactful visual layout using components like stat cards, charts, timelines, callouts, and infographics.

Available Components:
1. **hero** - Hero section with title, subtitle, optional background image
2. **stats_grid** - Grid of statistic cards (2-4 columns)
3. **text** - Rich text paragraphs (can be 1 or 2 columns)
4. **chart** - Data visualizations (bar, line, pie, horizontal-bar, multi-series)
5. **callout** - Highlighted boxes (info, warning, success, tip)
6. **timeline** - Chronological events
7. **numbered_steps** - Step-by-step process (1-3 columns)
8. **comparison_table** - Before/After or Old vs New
9. **two_column** - Split layout (text + image, or two text blocks)
10. **highlight_box** - Large stat or key takeaway
11. **table** - Structured data table

Your Goal:
- Extract key statistics and create stat cards
- Identify data that would work as charts
- Find processes and create numbered steps
- Detect comparisons and build comparison tables
- Highlight important information in callouts
- Create visual flow and hierarchy
- Make the post scannable and engaging

Return VALID JSON ONLY (no markdown, no explanations).
```

### User Prompt:
```
Generate an optimal visual layout for this blog post:

**Title:** ${title}

${excerpt ? `**Excerpt:** ${excerpt}` : ''}

**Content:**
${content}

${targetAudience ? `**Target Audience:** ${targetAudience}` : ''}
${tone ? `**Tone:** ${tone}` : ''}

Analyze the content and return a JSON object with this exact structure:

```json
{
  "layout": [
    {
      "type": "hero",
      "content": {
        "title": "Main title",
        "subtitle": "Compelling subtitle",
        "imageUrl": null
      },
      "style": {
        "height": "large",
        "background": "gradient"
      }
    },
    {
      "type": "stats_grid",
      "content": {
        "stats": [
          {"label": "Success Rate", "value": 96, "suffix": "%", "color": "green"},
          {"label": "Cases", "value": 1200, "suffix": "+", "color": "blue"}
        ]
      },
      "style": {
        "columns": 4
      }
    },
    {
      "type": "text",
      "content": {
        "html": "<p>Paragraph text...</p>"
      },
      "style": {
        "columns": 1
      }
    },
    {
      "type": "chart",
      "content": {
        "title": "Chart Title",
        "type": "bar",
        "data": [
          {"name": "2021", "value": 100},
          {"name": "2022", "value": 200}
        ]
      }
    },
    {
      "type": "callout",
      "content": {
        "type": "tip",
        "title": "Pro Tip",
        "text": "Important information..."
      }
    }
  ],
  "theme": {
    "primary_color": "#3b82f6",
    "style": "modern"
  },
  "reasoning": "Brief explanation of design choices"
}
```

Extract ALL numbers, percentages, and data points from the content. Convert them to stats or charts.
Identify processes and create numbered steps.
Find key quotes or tips and put them in callouts.
Create a logical flow: Hero → Stats → Problem → Solution → Data → Conclusion.
```

**Variables:**
- `title` - Blog post title
- `excerpt` - Blog post excerpt (optional)
- `content` - Blog content text
- `targetAudience` - Target audience (optional)
- `tone` - Content tone (optional)

**Key Features:**
- **Component documentation** - Clear list of all 11 available components
- **Goal-oriented design** - Specific objectives for layout creation
- **Flow guidance** - Recommended Hero → Stats → Problem → Solution pattern
- **Reasoning field** - AI explains its design decisions

---

## 4️⃣ Image Analyzer (Gamma-Style Import)

**Location:** `app/api/blog/analyze-image/route.ts`  
**Model:** `anthropic/claude-opus-4.1` (with vision)  
**Temperature:** 0.3  
**Max Tokens:** 4000

### User Prompt (Vision + Text):
```
Analyze this blog post design/layout image and extract its structure for HTML/React recreation.

Please identify:

1. **Sections** - What distinct sections exist? (hero, stats grid, text blocks, charts, tables, callouts, etc.)
2. **Content** - What text, numbers, and data are visible?
3. **Visual Elements** - Charts (bar, pie, line), tables, timelines, step numbers, icons
4. **Layout** - Single column, multi-column, grid layouts
5. **Styling** - Color scheme (primary, accent, background), typography, spacing

Return a JSON object with this structure:
```json
{
  "sections": [
    {
      "type": "hero | stats_grid | text | chart | table | callout | timeline | numbered_steps | two_column",
      "content": {
        // Relevant content for this section type
        // For stats_grid: array of {label, value, color}
        // For chart: {type: "bar|pie|line", data: [...], title, description}
        // For text: {heading, body}
        // For table: {headers: [...], rows: [...]}
      },
      "style": {
        "background": "color",
        "textColor": "color",
        "columns": 2
      }
    }
  ],
  "theme": {
    "primary_color": "#hex",
    "accent_color": "#hex",
    "background": "#hex | white | dark",
    "fonts": ["primary font", "heading font"]
  }
}
```

Be as detailed as possible. Extract ALL visible text, numbers, and data points.
```

**Input:**
- Image URL or Base64 encoded image
- Vision capabilities extract visual structure

**Key Features:**
- **Vision analysis** - Uses Claude's vision to "see" the design
- **Structure extraction** - Identifies all components and layout
- **Theme detection** - Captures colors, fonts, spacing
- **Data extraction** - Pulls text, numbers, chart data from image
- **Gamma import** - Enables importing designs from other tools

---

## 🎯 Prompt Design Patterns

### Pattern 1: Structured JSON Output
All prompts explicitly request JSON with exact schema:
```
Return ONLY valid JSON:
{
  "field1": "...",
  "field2": [...]
}
```

### Pattern 2: Component Vocabulary
Consistent component names across all prompts:
- `hero`, `stats_grid`, `chart`, `callout`, `timeline`, etc.

### Pattern 3: Visual-First Thinking
Prompts emphasize visual over text:
- "Make everything visual"
- "AGGRESSIVELY extract data"
- "Any number MUST become a stat card"

### Pattern 4: UK Business Context
All prompts include UK/HMRC/accounting context:
- "UK accounting, tax, and HMRC matters"
- "UK business standards"
- "Professional, corporate style"

### Pattern 5: Temperature Tuning
- **Research (0.7):** Balanced creativity/accuracy
- **Writing (0.8):** Creative, engaging content
- **Layout (0.5-0.6):** Structured, consistent design
- **SEO (0.3):** Precise, optimized output
- **Vision (0.3):** Accurate structure extraction

---

## 📝 Prompt Variables Reference

| Variable | Used In | Purpose | Default |
|----------|---------|---------|---------|
| `topic` | Research, Writing | Blog subject | (required) |
| `audience` | Research, Writing | Target readers | "UK accountants and tax professionals" |
| `tone` | Writing, Layout | Writing style | "professional" |
| `length` | Writing | Word count | "medium" (1200-1800 words) |
| `templateStyle` | Layout | Design style | "data-story" |
| `includeCharts` | Full Generator | Chart generation | true |
| `includeImages` | Full Generator | Image generation | true |
| `title` | Transformer, Layout, Analyzer | Post title | (required) |
| `content` | Transformer, Layout | Post content | (required) |
| `excerpt` | Transformer, Layout | Post summary | (optional) |
| `targetAudience` | Layout | Audience context | (optional) |

---

## 🚀 Prompt Evolution Notes

### Version 1.0 (Claude 3.5 Sonnet)
- Basic layout generation
- Simple component structure
- Generic prompts

### Version 2.0 (Current - Opus 4.1 + ChatGPT 5.1 + Gemini 3)
- ✅ **Multi-stage workflow** - Research → Write → Layout → Visuals → SEO
- ✅ **Aggressive data extraction** - Forces visual elements
- ✅ **Component vocabulary** - 11 distinct component types
- ✅ **UK business context** - HMRC/accounting specialization
- ✅ **Temperature optimization** - Task-specific creativity levels
- ✅ **Vision capabilities** - Gamma-style image imports

### Future Considerations:
- Multi-language prompts (for international markets)
- Industry-specific prompt variants (legal, medical, etc.)
- A/B testing different prompt styles
- User-customizable prompt templates
- Prompt versioning system

---

## 🔧 Prompt Maintenance

### When to Update Prompts:
1. **Component additions** - New layout components added
2. **Quality issues** - AI not following instructions
3. **Style changes** - Brand/design system updates
4. **Model upgrades** - New AI models with different capabilities
5. **User feedback** - Patterns not working well in practice

### Prompt Testing Checklist:
- ✅ Returns valid JSON 100% of time
- ✅ Follows component vocabulary
- ✅ Extracts all numbers/data
- ✅ Creates engaging layouts
- ✅ Maintains UK business tone
- ✅ Handles edge cases (no data, long content, etc.)

---

**Last Updated:** November 24, 2025  
**Version:** 2.0  
**Prompt Count:** 9 distinct prompts  
**Total Tokens:** ~15,000 (prompts only, excluding responses)
