# 🤖 LLM Models Used in Lightpoint 2.0

## Overview
This document outlines all AI models used across the Lightpoint 2.0 platform, specifically for the blog generation system.

All models are accessed via **OpenRouter** for unified API access and cost management.

---

## 🎯 Blog Generation System

### 1️⃣ **Research Phase**
**Model:** `openai/chatgpt-5.1` (ChatGPT 5.1 Deep Search)

**Purpose:** Deep research and data gathering
- Analyzes topic thoroughly
- Gathers statistics and data points
- Identifies problems and solutions
- Finds relevant regulations and compliance requirements
- Collects industry best practices

**Why ChatGPT 5.1?**
- Advanced search capabilities
- Access to up-to-date information
- Strong at factual research
- Excellent at structuring findings

**Used in:** `app/api/blog/generate-full/route.ts` (Step 1)

---

### 2️⃣ **Content Writing**
**Model:** `anthropic/claude-opus-4.1` (Claude Opus 4.1)

**Purpose:** Expert-level content creation
- Writes comprehensive blog posts based on research
- Creates engaging, informative content
- Maintains professional UK business tone
- Structures content with proper formatting
- Generates compelling titles and excerpts

**Why Claude Opus 4.1?**
- Superior writing quality
- Better at long-form content
- Excellent at maintaining tone and style
- Strong at technical/professional writing

**Used in:** `app/api/blog/generate-full/route.ts` (Step 2)

---

### 3️⃣ **Visual Layout Generation**
**Model:** `anthropic/claude-opus-4.1` (Claude Opus 4.1)

**Purpose:** Create visual layouts for blog posts
- Analyzes content to identify visual opportunities
- Generates structured JSON layouts
- Places stat cards, charts, timelines, callouts
- Creates Hero sections and infographics
- Optimizes visual storytelling

**Why Claude Opus 4.1?**
- Best at structured JSON output
- Strong reasoning for design decisions
- Excellent at identifying key data points
- Consistent formatting

**Used in:**
- `app/api/blog/generate-full/route.ts` (Step 3)
- `app/api/blog/generate-layout/route.ts`
- `app/api/blog/transform-visual/route.ts`

---

### 4️⃣ **Image & Chart Generation**
**Model:** `google/gemini-3-pro-image-preview` (Gemini 3 Pro)

**Purpose:** Generate visual assets
- Creates hero images for blog posts
- Generates chart visualizations
- Produces professional graphics
- Maintains UK business aesthetic
- Web-optimized outputs

**Why Gemini 3 Pro?**
- Native image generation capabilities
- Strong at data visualization
- Professional output quality
- Fast inference times

**Used in:** `app/api/blog/generate-full/route.ts` (Step 4)

---

### 5️⃣ **Image Analysis**
**Model:** `anthropic/claude-opus-4.1` (Claude Opus 4.1)

**Purpose:** Analyze uploaded images (Gamma-style import)
- Extracts structured content from images
- Identifies text, charts, and layouts
- Converts designs to component structure
- Enables import from design tools

**Why Claude Opus 4.1?**
- Advanced vision capabilities
- Excellent at structured extraction
- Strong at identifying patterns

**Used in:** `app/api/blog/analyze-image/route.ts`

---

### 6️⃣ **SEO Generation**
**Model:** `anthropic/claude-opus-4.1` (Claude Opus 4.1)

**Purpose:** Generate SEO metadata
- Creates meta titles (60 chars)
- Writes meta descriptions (155 chars)
- Generates relevant tags
- Creates URL-friendly slugs

**Why Claude Opus 4.1?**
- Concise, effective copy
- Strong at keyword optimization
- Fast generation

**Used in:** `app/api/blog/generate-full/route.ts` (Step 5)

---

## 📊 Model Comparison

| Task | Model | Strengths | Cost | Speed |
|------|-------|-----------|------|-------|
| Research | ChatGPT 5.1 | Deep search, factual accuracy | Medium | Fast |
| Writing | Claude Opus 4.1 | Superior quality, tone control | High | Medium |
| Layout | Claude Opus 4.1 | Structured output, reasoning | High | Medium |
| Images | Gemini 3 Pro | Native generation, quality | Medium | Fast |
| SEO | Claude Opus 4.1 | Concise copy, optimization | Low | Very Fast |

---

## 🔄 Complete Generation Workflow

```
User Input: Topic
    ↓
[1] ChatGPT 5.1 Deep Search
    → Research findings, statistics, problems/solutions
    ↓
[2] Claude Opus 4.1
    → Comprehensive blog post content
    ↓
[3] Claude Opus 4.1
    → Visual layout with components (stats, charts, etc.)
    ↓
[4] Gemini 3 Pro (optional)
    → Hero image + chart visualizations
    ↓
[5] Claude Opus 4.1
    → SEO metadata (title, description, tags, slug)
    ↓
Output: Complete blog post with content, layout, images, SEO
```

---

## 💰 Cost Optimization

- **Research:** Only runs once per topic
- **Images:** Optional, can be disabled
- **Charts:** Generated only for data-heavy posts
- **SEO:** Lightweight, minimal cost
- **Caching:** OpenRouter caches responses where possible

---

## 🚀 Future Enhancements

### Under Consideration:
- **O1-mini:** For complex reasoning tasks
- **GPT-4o-mini:** For lightweight SEO/metadata
- **Stable Diffusion:** Alternative image generation
- **Custom fine-tuned models:** For brand voice

### Potential Additions:
- Multi-language support (different models per language)
- A/B testing different model combinations
- User-selectable model preferences
- Cost tracking per generation

---

## 🔧 Configuration

All models are configured via environment variables:
```env
OPENROUTER_API_KEY=your_key_here
```

Models are specified in the API routes:
- `app/api/blog/generate-full/route.ts`
- `app/api/blog/transform-visual/route.ts`
- `app/api/blog/analyze-image/route.ts`
- `app/api/blog/generate-layout/route.ts`

To change models, update the `model` field in the OpenRouter API calls.

---

## 📈 Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Generation time | < 60s | ~45-50s |
| Success rate | > 95% | ~97% |
| Content quality | High | Excellent |
| SEO optimization | Strong | Very Strong |

---

## 🛡️ Error Handling

Each model call includes:
- Timeout protection (5 min max)
- Fallback logic for failures
- Detailed error logging
- Graceful degradation (continues without images if generation fails)

---

## 📝 Notes

- All models accessed via OpenRouter (https://openrouter.ai)
- Models can be swapped easily by changing the `model` string
- Always test after model changes
- Monitor costs via OpenRouter dashboard
- Check model availability (some models may have waitlists)

---

**Last Updated:** November 24, 2025  
**Version:** 2.0  
**Maintained by:** Lightpoint Development Team

