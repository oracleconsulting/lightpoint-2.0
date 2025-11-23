import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { createBrowserClient } from '@supabase/ssr';
import { generateSocialContent, generateMultiPlatformContent } from '@/lib/ai/socialContentGenerator';

/**
 * tRPC Router: Social Content Management
 * 
 * Handles AI content generation, approval, scheduling, and analytics
 */

const platformEnum = z.enum(['twitter', 'linkedin', 'facebook']);
const statusEnum = z.enum(['draft', 'approved', 'scheduled', 'published', 'failed']);
const contentTypeEnum = z.enum(['announcement', 'key_quote', 'detailed_summary', 'stat_highlight', 'case_study', 'evergreen_reshare']);

export const socialContentRouter = router({
  // =====================================================
  // GENERATION
  // =====================================================

  /**
   * Generate AI content for a single platform
   */
  generateContent: protectedProcedure
    .input(z.object({
      blogPostId: z.string().uuid(),
      platform: platformEnum,
      variants: z.number().min(1).max(5).default(3),
      contentType: contentTypeEnum.optional(),
      tone: z.enum(['professional', 'casual', 'authoritative']).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // 1. Fetch the blog post
      const { data: blogPost, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', input.blogPostId)
        .single();

      if (fetchError || !blogPost) {
        throw new Error('Blog post not found');
      }

      // 2. Generate AI content
      const generatedContent = await generateSocialContent(
        {
          title: blogPost.title,
          excerpt: blogPost.excerpt || '',
          content: blogPost.content,
          category: blogPost.category,
          tags: blogPost.tags,
          url: `/blog/${blogPost.slug}`,
          readTimeMinutes: blogPost.read_time_minutes,
        },
        {
          platform: input.platform,
          variants: input.variants,
          contentType: input.contentType || 'announcement',
          tone: input.tone || 'professional',
          includeHashtags: true,
          includeCTA: true,
        }
      );

      // 3. Save to database
      const socialPosts = generatedContent.map(variant => ({
        blog_post_id: input.blogPostId,
        platform: input.platform,
        content: variant.content,
        content_variant: variant.variant,
        hashtags: variant.hashtags,
        ai_generated: true,
        ai_model: variant.aiModel,
        generation_metrics: {
          tokens: variant.tokens,
          cost: variant.cost,
          character_count: variant.characterCount,
        },
        status: 'draft',
        created_by: ctx.user?.id,
      }));

      const { data: savedPosts, error: saveError } = await supabase
        .from('social_content_posts')
        .insert(socialPosts)
        .select();

      if (saveError) {
        console.error('Error saving social posts:', saveError);
        throw new Error('Failed to save generated content');
      }

      return {
        success: true,
        generated: savedPosts.length,
        posts: savedPosts,
        totalCost: generatedContent.reduce((sum, v) => sum + v.cost, 0),
      };
    }),

  /**
   * Generate AI content for multiple platforms at once
   */
  generateMultiPlatform: protectedProcedure
    .input(z.object({
      blogPostId: z.string().uuid(),
      platforms: z.array(platformEnum),
      variantsPerPlatform: z.number().min(1).max(5).default(3),
      useDripCampaign: z.boolean().optional(),
      campaignId: z.string().uuid().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // 1. Fetch the blog post
      const { data: blogPost, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', input.blogPostId)
        .single();

      if (fetchError || !blogPost) {
        throw new Error('Blog post not found');
      }

      // 2. Generate content for all platforms
      const allContent = await generateMultiPlatformContent(
        {
          title: blogPost.title,
          excerpt: blogPost.excerpt || '',
          content: blogPost.content,
          category: blogPost.category,
          tags: blogPost.tags,
          url: `/blog/${blogPost.slug}`,
          readTimeMinutes: blogPost.read_time_minutes,
        },
        input.platforms,
        input.variantsPerPlatform
      );

      // 3. If using drip campaign, get schedule
      let schedule: any = null;
      if (input.useDripCampaign) {
        const { data: campaign } = await supabase
          .from('social_drip_campaigns')
          .select('schedule')
          .eq('id', input.campaignId || '')
          .eq('is_active', true)
          .single();

        if (!campaign) {
          // Use default campaign
          const { data: defaultCampaign } = await supabase
            .from('social_drip_campaigns')
            .select('schedule')
            .eq('is_default', true)
            .single();

          schedule = defaultCampaign?.schedule;
        } else {
          schedule = campaign.schedule;
        }
      }

      // 4. Save all variants to database
      const allSocialPosts: any[] = [];
      let totalCost = 0;

      for (const [platform, variants] of Object.entries(allContent)) {
        for (const variant of variants) {
          totalCost += variant.cost;

          // Calculate scheduled_for if using drip campaign
          let scheduledFor = null;
          if (schedule && Array.isArray(schedule)) {
            // Find matching schedule entry for this platform
            const scheduleEntry = schedule.find(
              (s: any) => s.platforms?.includes(platform)
            );

            if (scheduleEntry) {
              const publishDate = new Date(blogPost.published_at || Date.now());
              publishDate.setDate(publishDate.getDate() + (scheduleEntry.day || 0));
              
              // Parse time (e.g., "09:00")
              if (scheduleEntry.time) {
                const [hours, minutes] = scheduleEntry.time.split(':').map(Number);
                publishDate.setHours(hours, minutes, 0, 0);
              }

              scheduledFor = publishDate.toISOString();
            }
          }

          allSocialPosts.push({
            blog_post_id: input.blogPostId,
            platform,
            content: variant.content,
            content_variant: variant.variant,
            hashtags: variant.hashtags,
            ai_generated: true,
            ai_model: variant.aiModel,
            generation_metrics: {
              tokens: variant.tokens,
              cost: variant.cost,
              character_count: variant.characterCount,
            },
            status: scheduledFor ? 'draft' : 'draft', // Will be 'scheduled' after approval
            scheduled_for: scheduledFor,
            created_by: ctx.user?.id,
          });
        }
      }

      const { data: savedPosts, error: saveError } = await supabase
        .from('social_content_posts')
        .insert(allSocialPosts)
        .select();

      if (saveError) {
        console.error('Error saving social posts:', saveError);
        throw new Error('Failed to save generated content');
      }

      return {
        success: true,
        generated: savedPosts.length,
        byPlatform: {
          twitter: savedPosts.filter(p => p.platform === 'twitter').length,
          linkedin: savedPosts.filter(p => p.platform === 'linkedin').length,
          facebook: savedPosts.filter(p => p.platform === 'facebook').length,
        },
        totalCost: Math.round(totalCost * 100) / 100,
        usedDripCampaign: !!schedule,
      };
    }),

  // =====================================================
  // LISTING & RETRIEVAL
  // =====================================================

  /**
   * List social content for a blog post
   */
  listByBlogPost: protectedProcedure
    .input(z.object({
      blogPostId: z.string().uuid(),
      platform: platformEnum.or(z.literal('all')).optional(),
      status: statusEnum.or(z.literal('all')).optional(),
    }))
    .query(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      let query = supabase
        .from('social_content_posts')
        .select('*')
        .eq('blog_post_id', input.blogPostId)
        .order('platform', { ascending: true })
        .order('content_variant', { ascending: true });

      if (input.platform && input.platform !== 'all') {
        query = query.eq('platform', input.platform);
      }

      if (input.status && input.status !== 'all') {
        query = query.eq('status', input.status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error('Failed to fetch social content');
      }

      return {
        posts: data || [],
        total: data?.length || 0,
      };
    }),

  /**
   * Get single social post by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('social_content_posts')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error) {
        throw new Error('Social post not found');
      }

      return data;
    }),

  // =====================================================
  // APPROVAL & SCHEDULING
  // =====================================================

  /**
   * Approve and optionally schedule a social post
   */
  approveAndSchedule: protectedProcedure
    .input(z.object({
      socialPostId: z.string().uuid(),
      scheduledFor: z.string().optional(), // ISO datetime
      edits: z.object({
        content: z.string().optional(),
        hashtags: z.array(z.string()).optional(),
      }).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const updateData: any = {
        status: input.scheduledFor ? 'scheduled' : 'approved',
        approved_by: ctx.user?.id,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (input.scheduledFor) {
        updateData.scheduled_for = input.scheduledFor;
      }

      if (input.edits?.content) {
        updateData.content = input.edits.content;
      }

      if (input.edits?.hashtags) {
        updateData.hashtags = input.edits.hashtags;
      }

      const { data, error } = await supabase
        .from('social_content_posts')
        .update(updateData)
        .eq('id', input.socialPostId)
        .select()
        .single();

      if (error) {
        throw new Error('Failed to approve social post');
      }

      return {
        success: true,
        post: data,
      };
    }),

  /**
   * Batch approve multiple posts
   */
  batchApprove: protectedProcedure
    .input(z.object({
      postIds: z.array(z.string().uuid()),
      scheduleAll: z.boolean().optional(),
      baseScheduleTime: z.string().optional(), // ISO datetime
      intervalMinutes: z.number().optional(), // Space out posts
    }))
    .mutation(async ({ input, ctx }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const results = [];

      for (let i = 0; i < input.postIds.length; i++) {
        const postId = input.postIds[i];
        
        let scheduledFor = null;
        if (input.scheduleAll && input.baseScheduleTime) {
          const baseTime = new Date(input.baseScheduleTime);
          baseTime.setMinutes(baseTime.getMinutes() + (i * (input.intervalMinutes || 60)));
          scheduledFor = baseTime.toISOString();
        }

        const { data, error } = await supabase
          .from('social_content_posts')
          .update({
            status: scheduledFor ? 'scheduled' : 'approved',
            approved_by: ctx.user?.id,
            approved_at: new Date().toISOString(),
            scheduled_for: scheduledFor,
          })
          .eq('id', postId)
          .select()
          .single();

        if (!error && data) {
          results.push(data);
        }
      }

      return {
        success: true,
        approved: results.length,
        posts: results,
      };
    }),

  // =====================================================
  // ANALYTICS
  // =====================================================

  /**
   * Get analytics summary for a blog post's social campaign
   */
  getAnalytics: protectedProcedure
    .input(z.object({
      blogPostId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('social_analytics_summary')
        .select('*')
        .eq('blog_post_id', input.blogPostId)
        .single();

      if (error || !data) {
        // No analytics yet
        return {
          total_impressions: 0,
          total_engagements: 0,
          total_clicks: 0,
          engagement_rate: 0,
        };
      }

      return data;
    }),

  // =====================================================
  // DRIP CAMPAIGNS
  // =====================================================

  /**
   * List available drip campaigns
   */
  listCampaigns: protectedProcedure
    .query(async () => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('social_drip_campaigns')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error('Failed to fetch campaigns');
      }

      return data || [];
    }),
});

