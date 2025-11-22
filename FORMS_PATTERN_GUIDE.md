# 🚀 ALL TRPC ROUTERS COMPLETE! Forms Pattern Ready

## ✅ **What's Complete:**

### **1. tRPC Routers (100% Done)** ✅
- ✅ Blog Router (`lib/trpc/routers/blog.ts`)
- ✅ CPD Router (`lib/trpc/routers/cpd.ts`)
- ✅ Webinars Router (`lib/trpc/routers/webinars.ts`)
- ✅ Examples Router (`lib/trpc/routers/examples.ts`)

All integrated into main router and ready to use!

---

## 📋 **Forms To Build (Following Blog Pattern):**

### **Pattern: Copy & Adapt BlogPostForm**

For each content type, follow this 3-file pattern:

#### **1. Form Component** (`components/admin/[Type]Form.tsx`)
Copy `BlogPostForm.tsx` and adapt:
- Change tRPC queries: `trpc.blog.*` → `trpc.cpd.*` / `trpc.webinars.*` / `trpc.examples.*`
- Add type-specific fields (see below)
- Keep: Rich editor, SEO fields, publishing workflow

#### **2. List Page** (`app/admin/[type]/page.tsx`)
Copy `app/admin/blog/page.tsx` and adapt:
- Change tRPC queries
- Update filters for type-specific fields
- Keep: Search, status filters, quick actions

#### **3. Route Pages**
- `app/admin/[type]/new/page.tsx` - Import form component
- `app/admin/[type]/edit/[id]/page.tsx` - Import form with ID

---

## 🎯 **Type-Specific Fields:**

### **CPD Articles Form** (Add these to BlogPostForm):
```tsx
// Additional fields after category/tags
<div>
  <Label htmlFor="cpdHours">CPD Hours</Label>
  <Input
    id="cpdHours"
    type="number"
    value={cpdHours}
    onChange={(e) => setCpdHours(Number(e.target.value))}
    placeholder="e.g., 1.5"
    step="0.5"
    min="0"
  />
</div>

<div>
  <Label htmlFor="difficulty">Difficulty Level</Label>
  <select
    id="difficulty"
    value={difficulty}
    onChange={(e) => setDifficulty(e.target.value)}
    className="w-full px-3 py-2 border rounded-md"
  >
    <option value="beginner">Beginner</option>
    <option value="intermediate">Intermediate</option>
    <option value="advanced">Advanced</option>
  </select>
</div>
```

---

### **Webinars Form** (Add these to BlogPostForm):
```tsx
// Additional fields
<div className="grid grid-cols-2 gap-4">
  <div>
    <Label htmlFor="webinarType">Webinar Type</Label>
    <select
      id="webinarType"
      value={webinarType}
      onChange={(e) => setWebinarType(e.target.value)}
      className="w-full px-3 py-2 border rounded-md"
    >
      <option value="recorded">Recorded</option>
      <option value="live">Live</option>
    </select>
  </div>

  <div>
    <Label htmlFor="status">Status</Label>
    <select
      id="status"
      value={status}
      onChange={(e) => setStatus(e.target.value)}
      className="w-full px-3 py-2 border rounded-md"
    >
      <option value="upcoming">Upcoming</option>
      <option value="live">Live Now</option>
      <option value="completed">Completed</option>
      <option value="cancelled">Cancelled</option>
    </select>
  </div>
</div>

<div className="grid grid-cols-2 gap-4">
  <div>
    <Label htmlFor="scheduledDate">Scheduled Date/Time</Label>
    <Input
      id="scheduledDate"
      type="datetime-local"
      value={scheduledDate}
      onChange={(e) => setScheduledDate(e.target.value)}
    />
  </div>

  <div>
    <Label htmlFor="duration">Duration (minutes)</Label>
    <Input
      id="duration"
      type="number"
      value={duration}
      onChange={(e) => setDuration(Number(e.target.value))}
      placeholder="e.g., 60"
      min="1"
    />
  </div>
</div>

<div>
  <Label htmlFor="videoUrl">Video URL (for recorded webinars)</Label>
  <Input
    id="videoUrl"
    value={videoUrl}
    onChange={(e) => setVideoUrl(e.target.value)}
    placeholder="https://..."
  />
</div>

<div>
  <Label htmlFor="streamUrl">Stream URL (for live webinars)</Label>
  <Input
    id="streamUrl"
    value={streamUrl}
    onChange={(e) => setStreamUrl(e.target.value)}
    placeholder="rtmp://..."
  />
</div>

<Card>
  <CardHeader>
    <CardTitle>Speaker Information</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <Label htmlFor="speakerName">Speaker Name</Label>
      <Input
        id="speakerName"
        value={speakerName}
        onChange={(e) => setSpeakerName(e.target.value)}
        placeholder="e.g., James Howard"
      />
    </div>

    <div>
      <Label htmlFor="speakerBio">Speaker Bio</Label>
      <textarea
        id="speakerBio"
        value={speakerBio}
        onChange={(e) => setSpeakerBio(e.target.value)}
        placeholder="Brief bio..."
        className="w-full px-3 py-2 border rounded-md"
        rows={3}
      />
    </div>

    <div>
      <Label htmlFor="speakerAvatar">Speaker Avatar URL</Label>
      <Input
        id="speakerAvatar"
        value={speakerAvatar}
        onChange={(e) => setSpeakerAvatar(e.target.value)}
        placeholder="https://..."
      />
    </div>
  </CardContent>
</Card>
```

---

### **Worked Examples Form** (Add these to BlogPostForm):
```tsx
// Replace single "content" editor with 4 editors:
<Card>
  <CardHeader>
    <CardTitle>Background</CardTitle>
    <CardDescription>Describe the situation/problem</CardDescription>
  </CardHeader>
  <CardContent>
    <RichTextEditor
      content={background}
      onChange={setBackground}
      placeholder="What was the initial situation?"
      bucket="example-media"
    />
  </CardContent>
</Card>

<Card>
  <CardHeader>
    <CardTitle>Actions Taken</CardTitle>
    <CardDescription>What steps were taken?</CardDescription>
  </CardHeader>
  <CardContent>
    <RichTextEditor
      content={actionsTaken}
      onChange={setActionsTaken}
      placeholder="What did you do?"
      bucket="example-media"
    />
  </CardContent>
</Card>

<Card>
  <CardHeader>
    <CardTitle>Outcome</CardTitle>
    <CardDescription>What was the result?</CardDescription>
  </CardHeader>
  <CardContent>
    <RichTextEditor
      content={outcome}
      onChange={setOutcome}
      placeholder="What happened?"
      bucket="example-media"
    />
  </CardContent>
</Card>

<Card>
  <CardHeader>
    <CardTitle>Lessons Learned</CardTitle>
    <CardDescription>Key takeaways</CardDescription>
  </CardHeader>
  <CardContent>
    <RichTextEditor
      content={lessonsLearned}
      onChange={setLessonsLearned}
      placeholder="What did you learn?"
      bucket="example-media"
    />
  </CardContent>
</Card>

// Additional metrics
<div className="grid grid-cols-3 gap-4">
  <div>
    <Label htmlFor="complexity">Complexity</Label>
    <select
      id="complexity"
      value={complexity}
      onChange={(e) => setComplexity(e.target.value)}
      className="w-full px-3 py-2 border rounded-md"
    >
      <option value="simple">Simple</option>
      <option value="intermediate">Intermediate</option>
      <option value="complex">Complex</option>
    </select>
  </div>

  <div>
    <Label htmlFor="feeRecovery">Fee Recovery (£)</Label>
    <Input
      id="feeRecovery"
      type="number"
      value={feeRecovery}
      onChange={(e) => setFeeRecovery(Number(e.target.value))}
      placeholder="e.g., 1250"
      min="0"
    />
  </div>

  <div>
    <Label htmlFor="durationDays">Duration (days)</Label>
    <Input
      id="durationDays"
      type="number"
      value={durationDays}
      onChange={(e) => setDurationDays(Number(e.target.value))}
      placeholder="e.g., 45"
      min="1"
    />
  </div>
</div>
```

---

## 🎨 **Media Library Modal** (Next Priority)

### **Component:** `components/MediaLibraryModal.tsx`

```tsx
'use client';

import { useState } from 'react';
import { MediaLibrary } from './MediaLibrary';
import { X } from 'lucide-react';
import { Button } from './ui/button';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  bucket: 'blog-images' | 'cpd-media' | 'webinar-videos' | 'documents';
}

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  bucket,
}: MediaLibraryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-heading font-bold">Media Library</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <MediaLibrary
            bucket={bucket}
            onSelectFile={(file) => {
              onSelect(file.url);
              onClose();
            }}
            selectionMode
          />
        </div>
      </div>
    </div>
  );
}
```

### **Usage in Forms:**

```tsx
// Add to any form component
import { MediaLibraryModal } from '@/components/MediaLibraryModal';

// State
const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

// In the form
<div>
  <Label htmlFor="featuredImage">Featured Image</Label>
  <div className="flex gap-2">
    <Input
      id="featuredImage"
      value={featuredImage}
      onChange={(e) => setFeaturedImage(e.target.value)}
      placeholder="https://..."
    />
    <Button
      type="button"
      variant="outline"
      onClick={() => setIsMediaModalOpen(true)}
    >
      Browse
    </Button>
  </div>
</div>

{/* Modal */}
<MediaLibraryModal
  isOpen={isMediaModalOpen}
  onClose={() => setIsMediaModalOpen(false)}
  onSelect={(url) => setFeaturedImage(url)}
  bucket="blog-images"
/>
```

---

## 📊 **Quick Implementation Checklist:**

### **For Each Content Type (CPD, Webinars, Examples):**

- [ ] Copy `components/admin/BlogPostForm.tsx` → `[Type]Form.tsx`
- [ ] Update tRPC queries (`trpc.blog.*` → `trpc.[type].*`)
- [ ] Add type-specific form fields (see above)
- [ ] Update bucket name in RichTextEditor
- [ ] Copy `app/admin/blog/page.tsx` → `app/admin/[type]/page.tsx`
- [ ] Update tRPC queries in list page
- [ ] Create `app/admin/[type]/new/page.tsx`
- [ ] Create `app/admin/[type]/edit/[id]/page.tsx`

### **For Media Library Modal:**

- [ ] Create `components/MediaLibraryModal.tsx` (see code above)
- [ ] Update `MediaLibrary.tsx` to support `selectionMode` prop
- [ ] Add "Browse" buttons to all image fields in forms
- [ ] Test upload → select → insert workflow

---

## 🚀 **Status:**

**✅ READY:**
- All tRPC routers (blog, cpd, webinars, examples)
- Database schema (migrations already run)
- Rich text editor component
- Media library component
- Blog system (fully working example)

**⏳ TO BUILD:**
- CPD form (30 min - copy blog pattern + add 2 fields)
- Webinars form (45 min - copy blog pattern + add speaker section)
- Examples form (40 min - copy blog pattern + change to 4 editors)
- Media library modal (30 min - wrap MediaLibrary in modal)

**Total Time Remaining:** ~2.5 hours

---

## 💡 **Pro Tip:**

Since you now have:
1. ✅ Working blog system (complete reference)
2. ✅ All tRPC routers ready
3. ✅ Rich text editor ready
4. ✅ Media library ready

You can quickly build the remaining 3 forms by:
1. Copy `components/admin/BlogPostForm.tsx` 3 times
2. Find/replace `blog` → `cpd`/`webinars`/`examples`
3. Add the type-specific fields from this guide
4. Copy the list pages 3 times
5. Done!

The pattern is identical - just different field names and a few extra inputs.

---

**Want me to build them all now, or would you like to test the blog system first and then continue?**


