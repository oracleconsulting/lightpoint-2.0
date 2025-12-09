# Blog V2 Automatic Image Generation

## Overview

The blog V2 layout system now **automatically generates and populates images** for all `textWithImage` components when a blog post is published. This ensures every blog post has proper visualizations without manual intervention.

## How It Works

### 1. Layout Generation
When a layout is generated (via API or tRPC), the system:
- Detects all `textWithImage` components
- Checks if they have images (`imageSrc` prop)
- Automatically generates contextual images using NanoBanana (Gemini 3 Pro)
- Uploads images to Supabase storage
- Updates the layout with image URLs

### 2. Automatic Trigger
Images are automatically generated when:
- A blog post is **published** (status changes to `published`)
- The layout contains `textWithImage` components without images
- The post has a valid `slug` for storage organization

### 3. Background Processing
Image generation runs in the background (non-blocking) so publishing isn't delayed. Images are generated and saved asynchronously.

## Files Changed

### New Files
- `components/blog-v2/utils/autoImageGenerator.ts` - Core image generation logic

### Updated Files
- `components/blog-v2/utils/layoutGenerator.ts` - Now async, supports auto image generation
- `lib/trpc/routers/blog.ts` - Auto-generates images on publish
- `app/api/blog/generate-layout-v2/route.ts` - Supports image generation flag
- `components/blog-v2/BlogRenderer.tsx` - Improved spacing
- `components/blog-v2/components/UtilityComponents.tsx` - Tighter spacing

## Usage

### Automatic (Recommended)
Just publish your blog post - images will be generated automatically!

```typescript
// In your blog editor
await trpc.blog.update.mutate({
  id: postId,
  data: {
    isPublished: true,
    structuredLayout: layout, // Layout with textWithImage components
  },
});
// Images will be generated automatically in the background
```

### Manual Generation
You can also trigger image generation manually:

```typescript
import { generateImagesForLayout } from '@/components/blog-v2/utils';

const layoutWithImages = await generateImagesForLayout(
  layout,
  'Article Title',
  'article-slug'
);
```

### API Endpoint
The existing `/api/blog/generate-images` endpoint still works for manual generation:

```bash
POST /api/blog/generate-images
{
  "slug": "article-slug",
  "generateAll": true
}
```

## Image Generation Details

- **Model**: Google Gemini 3 Pro (NanoBanana Pro) via OpenRouter
- **Style**: Professional, corporate aesthetic
- **Aspect Ratio**: 4:3 (optimized for blog layouts)
- **Storage**: Supabase Storage (`public/blog-images/{slug}/`)
- **Rate Limiting**: 2 seconds between images
- **Retry**: Automatic retry on failure

## Spacing Improvements

Fixed spacing issues for better readability at 100% zoom:
- Reduced padding between sections (`py-3 lg:py-4` instead of `py-1 lg:py-2`)
- Tighter heading margins (`mt-4 mb-3` instead of `mt-6 mb-4`)
- Reduced paragraph spacing (`mb-1` instead of `mb-2`)

## Future Blog Posts

**Every new blog post will automatically:**
1. Generate V2 layout with proper component detection
2. Create `textWithImage` components where appropriate
3. Generate contextual images automatically on publish
4. Display with proper spacing and visualization

No manual steps required! 🎉

