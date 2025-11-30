# Blog V2 Layout - Continuation Prompt

## Current Status
We're working on the Lightpoint blog V2 layout system. The blog uses a component-based layout system stored in `blog_posts.structured_layout` (JSONB column). The layout is detected/generated in admin and rendered on the public blog page.

## What Works ✅
- V2 layout generator (`components/blog-v2/utils/sectionDetector.ts` and `layoutGenerator.ts`)
- Pattern detection for section headings, stats, comparisons, timelines, numbered steps
- Component library in `components/blog-v2/components/`:
  - HeroSection, StatsRow, TextWithImage, NumberedSteps
  - ThreeColumnCards, Timeline, ComparisonCards, DonutChart
  - CalloutBox, QuoteBlock, Paragraph, SectionHeading, BulletList, CTASection
- BlogRenderer in `components/blog-v2/BlogRenderer.tsx` wraps components with appropriate spacing
- Public blog page (`app/blog/[slug]/page.tsx`) detects V2 layouts and renders them

## Critical Issues 🔴

### 1. Text Still Too Small
- User reports text is hard to read at 100% zoom in Chrome
- Current body text is 19-21px, but appears too small in practice
- Need to verify actual rendered sizes match expectations
- Research shows 18-20px minimum, but may need 22-24px for comfort

### 2. Missing Visual Elements
- **NO CHARTS** - DonutChart component exists but not being generated/detected
- **NO IMAGES** - TextWithImage component exists but not being used
- **NO VISUAL STATS** - StatsRow exists but may not have proper styling

### 3. Spacing Still Insufficient
- Large gaps between sections (user wants more breathing room)
- Paragraph spacing too tight
- Component padding needs to be more generous

## Files Modified Recently
- `components/blog-v2/BlogRenderer.tsx` - Section spacing
- `components/blog-v2/components/UtilityComponents.tsx` - Paragraph, SectionHeading, BulletList text sizes
- `components/blog-v2/components/CalloutBox.tsx` - Padding and text size
- `components/blog-v2/components/ThreeColumnCards.tsx` - Text sizes
- `components/blog-v2/components/NumberedSteps.tsx` - Spacing

## Key Database Post
- Slug: `why-hmrc-complaints-fail-how-to-fix`
- Should have 33 components in `structured_layout.components` array
- Includes: hero, stats, paragraphs, sectionHeading, threeColumnCards, numberedSteps, timeline, comparisonCards, callout, bulletList, quote, cta

## What Needs to Happen Next

### Immediate Fixes:
1. **Increase ALL body text to 22-24px minimum** - verify in browser DevTools
2. **Add charts** - Ensure DonutChart component is detected/generated for percentage stats (e.g., "98% internal resolution")
3. **Add images** - Generate contextual images or use TextWithImage component
4. **Increase spacing** - More padding between ALL components (py-12 → py-16 minimum)
5. **Verify max-width** - Ensure reading column is 600-700px wide (max-w-4xl ≈ 896px may be too wide)

### Reference Material:
- User provided research on readable blogs (20px+ body text, 1.8+ line height)
- Gamma output screenshots showing desired visual density
- Current blog is at ~75% quality - need to reach 100%

## Test Checklist
After fixes, verify:
- [ ] Body text is comfortable to read at 100% zoom
- [ ] Charts appear for key percentages/stats
- [ ] Images break up text blocks
- [ ] Spacing feels generous and magazine-like
- [ ] Headings are large and impactful (42-48px)
- [ ] Overall layout matches Gamma quality

## Key Command
To test locally after changes:
```bash
cd lightpoint-2.0
npm run build
# Check build succeeds, then push to trigger Railway deploy
```

## Important Notes
- Blog layout is read from DATABASE, not files - must update via SQL or "Apply This Layout" in admin
- Admin preview uses generator output, public page uses database layout
- Both need to match for consistency

