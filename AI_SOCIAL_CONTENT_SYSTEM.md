# 🤖 AI Social Content Generation & Automation System

## **Executive Summary**

Transform each Lightpoint blog post into optimized social media content across Twitter, LinkedIn, and Facebook with AI-powered generation, scheduling, and momentum tracking.

---

## **System Architecture**

```
┌─────────────────────────────────────────────────────────────┐
│                    BLOG POST PUBLISHED                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              AI CONTENT GENERATION ENGINE                   │
│  • OpenAI GPT-4 / Claude for content transformation        │
│  • Platform-specific optimization (Twitter/LinkedIn/FB)     │
│  • Generate 3-5 variants per platform                       │
│  • Extract key quotes, stats, CTAs                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│           CONTENT APPROVAL & SCHEDULING                     │
│  • Admin review dashboard                                   │
│  • Edit/approve/reject AI-generated content                 │
│  • Schedule posts with optimal timing                       │
│  • Set drip campaign (Day 1, 3, 7, 14, 30)                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              SOCIAL MEDIA AUTOMATION                        │
│  • Buffer/Zapier/Make.com integration                       │
│  • Direct API posting (Twitter/LinkedIn/Facebook)           │
│  • Image generation (OG images, quote cards)                │
│  • Hashtag optimization                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│          ANALYTICS & MOMENTUM TRACKING                      │
│  • Engagement metrics (likes, shares, comments)             │
│  • Click-through rates to blog                              │
│  • Best-performing content types                            │
│  • Audience growth tracking                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## **Phase 1: AI Content Generation (Database & tRPC)**

### **Database Schema**

```sql
-- Migration: 019_social_content_system.sql

CREATE TABLE social_content_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
  
  -- Platform & Status
  platform TEXT NOT NULL CHECK (platform IN ('twitter', 'linkedin', 'facebook')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'published', 'failed')),
  
  -- Content
  content TEXT NOT NULL,
  content_variant INTEGER DEFAULT 1, -- Multiple variants per platform
  hashtags TEXT[], -- Platform-specific hashtags
  media_urls TEXT[], -- Images/videos
  
  -- AI Metadata
  ai_generated BOOLEAN DEFAULT true,
  ai_model TEXT, -- e.g., 'gpt-4-turbo', 'claude-3-opus'
  ai_prompt TEXT, -- Store prompt for reference
  generation_metrics JSONB, -- tokens, cost, etc.
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  
  -- Analytics
  impressions INTEGER DEFAULT 0,
  engagements INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  
  -- External IDs (from social platforms)
  platform_post_id TEXT, -- Twitter ID, LinkedIn URN, FB post ID
  platform_response JSONB, -- Full API response
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

CREATE INDEX idx_social_content_blog_post ON social_content_posts(blog_post_id);
CREATE INDEX idx_social_content_status ON social_content_posts(status);
CREATE INDEX idx_social_content_scheduled ON social_content_posts(scheduled_for) WHERE status = 'scheduled';

-- Drip campaign templates
CREATE TABLE social_drip_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  schedule JSONB NOT NULL, -- e.g., [{"day": 1, "platforms": ["twitter", "linkedin"]}, ...]
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Example drip campaign
INSERT INTO social_drip_campaigns (name, description, schedule) VALUES (
  'Standard Blog Launch',
  '30-day drip campaign for new blog posts',
  '[
    {"day": 0, "time": "09:00", "platforms": ["twitter", "linkedin", "facebook"], "type": "announcement"},
    {"day": 0, "time": "15:00", "platforms": ["twitter"], "type": "key_quote"},
    {"day": 3, "time": "10:00", "platforms": ["linkedin"], "type": "detailed_summary"},
    {"day": 7, "time": "11:00", "platforms": ["twitter", "linkedin"], "type": "stat_highlight"},
    {"day": 14, "time": "09:00", "platforms": ["facebook"], "type": "case_study"},
    {"day": 30, "time": "10:00", "platforms": ["twitter", "linkedin"], "type": "evergreen_reshare"}
  ]'::jsonb
);
```

### **tRPC Endpoints**

```typescript
// lib/trpc/routers/socialContent.ts

export const socialContentRouter = router({
  // Generate AI content for a blog post
  generateContent: protectedProcedure
    .input(z.object({
      blogPostId: z.string().uuid(),
      platforms: z.array(z.enum(['twitter', 'linkedin', 'facebook'])),
      variantsPerPlatform: z.number().min(1).max(5).default(3),
      campaignId: z.string().uuid().optional(), // Use a drip campaign template
    }))
    .mutation(async ({ input }) => {
      // 1. Fetch blog post
      // 2. Call AI generation function
      // 3. Save variants to database
      // 4. Return generated content for review
    }),

  // List social content for a blog post
  listByBlogPost: protectedProcedure
    .input(z.object({
      blogPostId: z.string().uuid(),
      platform: z.enum(['twitter', 'linkedin', 'facebook', 'all']).optional(),
    }))
    .query(async ({ input }) => {
      // Fetch all social posts for this blog
    }),

  // Approve and schedule content
  approveAndSchedule: protectedProcedure
    .input(z.object({
      socialPostId: z.string().uuid(),
      scheduledFor: z.string(), // ISO datetime
      edits: z.object({
        content: z.string().optional(),
        hashtags: z.array(z.string()).optional(),
      }).optional(),
    }))
    .mutation(async ({ input }) => {
      // Update status to 'scheduled'
      // Queue for publishing
    }),

  // Publish immediately
  publishNow: protectedProcedure
    .input(z.object({
      socialPostId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      // Call social media API
      // Update status to 'published'
    }),

  // Get analytics
  getAnalytics: protectedProcedure
    .input(z.object({
      blogPostId: z.string().uuid().optional(),
      dateRange: z.object({
        from: z.string(),
        to: z.string(),
      }).optional(),
    }))
    .query(async ({ input }) => {
      // Aggregate analytics data
    }),
});
```

---

## **Phase 2: AI Content Generation Logic**

### **lib/ai/socialContentGenerator.ts**

```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface BlogPost {
  title: string;
  excerpt: string;
  content: string; // TipTap JSON or HTML
  category?: string;
  tags?: string[];
  url: string;
}

interface GenerationOptions {
  platform: 'twitter' | 'linkedin' | 'facebook';
  variants: number;
  tone?: 'professional' | 'casual' | 'authoritative';
  includeHashtags?: boolean;
  includeCTA?: boolean;
}

export async function generateSocialContent(
  blogPost: BlogPost,
  options: GenerationOptions
): Promise<string[]> {
  
  const platformGuidelines = {
    twitter: {
      maxLength: 280,
      style: 'Concise, punchy, use line breaks. Include 1-2 relevant hashtags.',
      cta: 'Read more 👇',
    },
    linkedin: {
      maxLength: 3000,
      style: 'Professional, detailed, storytelling. Use emojis sparingly. 3-5 hashtags.',
      cta: 'Read the full article on our blog',
    },
    facebook: {
      maxLength: 2000,
      style: 'Conversational, engaging, ask questions. 2-3 hashtags.',
      cta: 'Learn more in our latest blog post',
    },
  };

  const guidelines = platformGuidelines[options.platform];

  const prompt = `
You are a social media expert creating ${options.platform.toUpperCase()} content for Lightpoint, an AI-powered HMRC complaint management platform for UK accountants and tax professionals.

BLOG POST DETAILS:
Title: ${blogPost.title}
Excerpt: ${blogPost.excerpt}
Category: ${blogPost.category || 'General'}
Tags: ${blogPost.tags?.join(', ') || 'None'}

PLATFORM: ${options.platform.toUpperCase()}
GUIDELINES:
- Max length: ${guidelines.maxLength} characters
- Style: ${guidelines.style}
- CTA: ${guidelines.cta}

TASK:
Generate ${options.variants} unique, engaging social media posts for this blog article.

REQUIREMENTS:
1. Each variant should highlight different aspects of the article
2. Use attention-grabbing hooks
3. Include relevant statistics or key takeaways if available
4. ${options.includeHashtags ? `Add ${options.platform === 'twitter' ? '1-2' : options.platform === 'linkedin' ? '3-5' : '2-3'} relevant hashtags` : 'No hashtags'}
5. ${options.includeCTA ? `End with a clear CTA: "${guidelines.cta} ${blogPost.url}"` : 'No CTA'}
6. Tone: ${options.tone || 'professional'}

EXAMPLES OF GOOD ${options.platform.toUpperCase()} POSTS:
${getExamplePosts(options.platform)}

Generate ${options.variants} variants now. Return ONLY the post content, one per line, no numbering or labels.
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: `You are an expert social media manager specializing in LinkedIn, Twitter, and Facebook content for B2B SaaS companies in the UK professional services sector.`,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    temperature: 0.8, // Higher creativity
    max_tokens: 1500,
  });

  const response = completion.choices[0]?.message?.content || '';
  const variants = response
    .split('\n')
    .filter(line => line.trim().length > 50)
    .slice(0, options.variants);

  return variants;
}

function getExamplePosts(platform: string): string {
  const examples = {
    twitter: `
1. "96%+ success rate in HMRC complaints? It's not magic—it's data. Our AI analyzes 10,000+ precedents to build bulletproof cases. See how → [link] #TaxCompliance #HMRC"
2. "Your client just got hit with an unfair HMRC penalty. What do you do? ❌ Accept it ❌ Spend 10 hours researching ✅ Let AI draft a precedent-backed complaint in 5 minutes [link]"
3. "HMRC just rejected your complaint. Now what? Most accountants give up. Top firms use our AI to find the exact case law that changes minds. Real example 👇 [link]"`,
    
    linkedin: `
1. "After reviewing 10,000+ HMRC complaints, we discovered something surprising: 78% of rejected complaints could have succeeded with better precedent citations. That's why we built Lightpoint—an AI that knows every successful complaint strategy from the past decade. Here's how it works... [Read more]"
2. "Handling HMRC complaints used to take our team 8-12 hours per case. Research, drafting, finding precedents—it was exhausting. Then we automated it. Now? 90 minutes. Same quality, 6x faster. Here's the exact process... [Full article]"`,
    
    facebook: `
1. "Ever feel like HMRC complaints are a black box? You submit, wait weeks, and hope for the best? There's a better way. Our AI analyzes your case against 10,000+ historical complaints and tells you: ✅ Your chances of success ✅ Which precedents to cite ✅ Exactly what to write Want to see it in action? [Read our latest post]"`,
  };

  return examples[platform] || '';
}
```

---

## **Phase 3: Admin UI - Social Content Manager**

### **app/admin/social-content/[blogPostId]/page.tsx**

```typescript
'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Twitter, Linkedin, Facebook, Calendar, Send, RefreshCw } from 'lucide-react';

export default function SocialContentManager({ params }: { params: { blogPostId: string } }) {
  const [generating, setGenerating] = useState(false);
  
  const { data: blogPost } = trpc.blog.getById.useQuery({ id: params.blogPostId });
  const { data: socialPosts, refetch } = trpc.socialContent.listByBlogPost.useQuery({
    blogPostId: params.blogPostId,
  });

  const generateContent = trpc.socialContent.generateContent.useMutation();

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateContent.mutateAsync({
        blogPostId: params.blogPostId,
        platforms: ['twitter', 'linkedin', 'facebook'],
        variantsPerPlatform: 3,
      });
      refetch();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Social Content Manager</h1>
          <p className="text-gray-600 mt-2">{blogPost?.title}</p>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Generating...' : 'Generate AI Content'}
        </Button>
      </div>

      {/* Platform Tabs */}
      {['twitter', 'linkedin', 'facebook'].map(platform => (
        <Card key={platform} className="mb-6 p-6">
          <div className="flex items-center gap-3 mb-4">
            {platform === 'twitter' && <Twitter className="h-6 w-6 text-blue-500" />}
            {platform === 'linkedin' && <Linkedin className="h-6 w-6 text-blue-700" />}
            {platform === 'facebook' && <Facebook className="h-6 w-6 text-blue-600" />}
            <h2 className="text-xl font-bold capitalize">{platform}</h2>
          </div>

          {/* Variants */}
          <div className="space-y-4">
            {socialPosts?.posts
              ?.filter(p => p.platform === platform)
              .map((post, idx) => (
                <SocialPostCard key={post.id} post={post} variant={idx + 1} />
              ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

function SocialPostCard({ post, variant }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(post.content);

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">Variant {variant}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setIsEditing(!isEditing)}>
            Edit
          </Button>
          <Button size="sm" variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule
          </Button>
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" />
            Publish Now
          </Button>
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full p-3 border rounded-lg"
          rows={4}
        />
      ) : (
        <p className="text-gray-800 whitespace-pre-wrap">{post.content}</p>
      )}

      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
        <span>{post.content.length} characters</span>
        {post.hashtags?.length > 0 && (
          <span>{post.hashtags.length} hashtags</span>
        )}
        <span className="ml-auto">{post.status}</span>
      </div>
    </div>
  );
}
```

---

## **Phase 4: Social Media API Integration**

### **Option A: Use Buffer (Recommended - Easiest)**

```typescript
// lib/social/bufferClient.ts

import axios from 'axios';

const BUFFER_API_KEY = process.env.BUFFER_API_KEY!;

export async function postToBuffer(content: {
  text: string;
  profileIds: string[]; // Twitter, LinkedIn, Facebook profile IDs
  scheduledAt?: Date;
  media?: string[];
}) {
  const response = await axios.post(
    'https://api.bufferapp.com/1/updates/create.json',
    {
      text: content.text,
      profile_ids: content.profileIds,
      scheduled_at: content.scheduledAt?.toISOString(),
      media: content.media ? { photo: content.media } : undefined,
    },
    {
      headers: {
        Authorization: `Bearer ${BUFFER_API_KEY}`,
      },
    }
  );

  return response.data;
}
```

### **Option B: Direct Social Media APIs**

```typescript
// lib/social/directPosting.ts

import { TwitterApi } from 'twitter-api-v2';

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY!,
  appSecret: process.env.TWITTER_API_SECRET!,
  accessToken: process.env.TWITTER_ACCESS_TOKEN!,
  accessSecret: process.env.TWITTER_ACCESS_SECRET!,
});

export async function postToTwitter(content: string) {
  const tweet = await twitterClient.v2.tweet(content);
  return tweet.data;
}

// Similar for LinkedIn and Facebook...
```

---

## **Phase 5: Scheduled Publishing (Cron Job)**

```typescript
// supabase/functions/publish-social-content/index.ts

serve(async (req) => {
  const supabase = createClient(/*...*/);

  // Get posts scheduled for now
  const { data: posts } = await supabase
    .from('social_content_posts')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_for', new Date().toISOString())
    .limit(10);

  for (const post of posts || []) {
    try {
      // Publish to social media
      let platformResponse;
      if (post.platform === 'twitter') {
        platformResponse = await postToTwitter(post.content);
      } else if (post.platform === 'linkedin') {
        platformResponse = await postToLinkedIn(post.content);
      } else if (post.platform === 'facebook') {
        platformResponse = await postToFacebook(post.content);
      }

      // Update database
      await supabase
        .from('social_content_posts')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          platform_post_id: platformResponse.id,
          platform_response: platformResponse,
        })
        .eq('id', post.id);

    } catch (error) {
      // Mark as failed
      await supabase
        .from('social_content_posts')
        .update({ status: 'failed' })
        .eq('id', post.id);
    }
  }

  return new Response(JSON.stringify({ published: posts?.length || 0 }));
});
```

---

## **Phase 6: Analytics Dashboard**

Track:
- **Impressions**: How many people saw your posts
- **Engagements**: Likes, comments, shares
- **Click-throughs**: Traffic to your blog
- **Best-performing**: Which platforms/content types work best

---

## **Implementation Roadmap**

### **Week 1: Foundation**
- ✅ Database schema + migrations
- ✅ tRPC endpoints
- ✅ AI generation function

### **Week 2: Admin UI**
- Social content manager page
- Content approval workflow
- Scheduling interface

### **Week 3: Integration**
- Buffer API setup OR
- Direct social media APIs
- Webhook handlers

### **Week 4: Automation**
- Cron jobs for scheduled publishing
- Drip campaign automation
- Analytics tracking

---

## **Cost Estimate**

- **OpenAI GPT-4**: ~$0.10 per blog post (3 platforms × 3 variants)
- **Buffer**: $6/month (Starter) to $120/month (Business)
- **Development Time**: 40-60 hours

---

## **Next Steps**

1. **Choose Integration Method**:
   - Buffer (easiest, best for startups)
   - Direct APIs (more control, requires maintenance)

2. **Set Up Accounts**:
   - Twitter Developer Account
   - LinkedIn Developer Account
   - Facebook Developer Account

3. **Implement Phase 1**: Database + AI generation (I can start NOW!)

**Ready to build this? Say "GO" and I'll start with Phase 1! 🚀**

