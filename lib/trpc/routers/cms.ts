// lib/trpc/routers/cms.ts
import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../trpc';
import { supabaseAdmin } from '@/lib/supabase/client';
import { TRPCError } from '@trpc/server';

export const cmsRouter = router({
  /**
   * Get all page sections for a page
   */
  getPageSections: publicProcedure
    .input(z.object({ pageName: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('page_sections')
        .select('*')
        .eq('page_name', input.pageName)
        .eq('is_visible', true)
        .order('display_order', { ascending: true });
      
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch page sections',
        });
      }
      
      return data;
    }),
  
  /**
   * Get single page section
   */
  getPageSection: publicProcedure
    .input(z.object({ 
      pageName: z.string(),
      sectionKey: z.string()
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('page_sections')
        .select('*')
        .eq('page_name', input.pageName)
        .eq('section_key', input.sectionKey)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return data;
    }),
  
  /**
   * Update page section (admin only)
   */
  updatePageSection: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      content: z.record(z.any()).optional(),
      sectionTitle: z.string().optional(),
      isVisible: z.boolean().optional(),
      displayOrder: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;
      
      const { data, error } = await (supabaseAdmin as any)
        .from('page_sections')
        .update({
          ...updates,
          updated_by: ctx.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update page section',
        });
      }
      
      return data;
    }),
  
  /**
   * Get all site settings
   */
  getSiteSettings: publicProcedure
    .input(z.object({ group: z.string().optional() }).optional())
    .query(async ({ input }) => {
      let query = supabaseAdmin.from('site_settings').select('*');
      
      if (input?.group) {
        query = query.eq('setting_group', input.group);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch site settings',
        });
      }
      
      return data;
    }),
  
  /**
   * Get single site setting
   */
  getSiteSetting: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('site_settings')
        .select('*')
        .eq('setting_key', input)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return (data as any).value;
    }),
  
  /**
   * Update site setting (admin only)
   */
  updateSiteSetting: protectedProcedure
    .input(z.object({
      settingKey: z.string(),
      value: z.any(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('site_settings')
        .update({
          value: input.value,
          updated_by: ctx.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', input.settingKey)
        .select()
        .single();
      
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update site setting',
        });
      }
      
      return data;
    }),
  
  /**
   * Get SEO metadata for page
   */
  getSEOMetadata: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('seo_metadata')
        .select('*')
        .eq('page_path', input)
        .single();
      
      if (error || !data) {
        return null;
      }
      
      return data;
    }),
  
  /**
   * Update SEO metadata (admin only)
   */
  updateSEOMetadata: protectedProcedure
    .input(z.object({
      pagePath: z.string(),
      pageTitle: z.string().optional(),
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      metaKeywords: z.array(z.string()).optional(),
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      ogImageUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { pagePath, ...updates } = input;
      
      const { data, error } = await (supabaseAdmin as any)
        .from('seo_metadata')
        .update({
          ...updates,
          updated_by: ctx.user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('page_path', pagePath)
        .select()
        .single();
      
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update SEO metadata',
        });
      }
      
      return data;
    }),
  
  /**
   * List all content posts
   */
  listContentPosts: publicProcedure
    .input(z.object({
      contentType: z.enum(['blog_post', 'cpd_article', 'worked_example', 'webinar', 'knowledge_base']).optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
      limit: z.number().min(1).max(100).optional().default(20),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ input }) => {
      let query = supabaseAdmin
        .from('content_posts')
        .select('*', { count: 'exact' });
      
      if (input.contentType) {
        query = query.eq('content_type', input.contentType);
      }
      
      query = query.eq('status', input.status || 'published');
      query = query.order('published_at', { ascending: false });
      query = query.range(input.offset, input.offset + input.limit - 1);
      
      const { data, error, count } = await query;
      
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch content posts',
        });
      }
      
      return { posts: data, total: count || 0 };
    }),
  
  /**
   * Get single content post by slug
   */
  getContentPost: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('content_posts')
        .select('*')
        .eq('slug', input)
        .eq('status', 'published')
        .single();
      
      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Content post not found',
        });
      }
      
      const post = data as any;
      
      // Increment view count
      await (supabaseAdmin as any)
        .from('content_posts')
        .update({ view_count: (post.view_count || 0) + 1 })
        .eq('id', post.id);
      
      return post;
    }),
  
  /**
   * Create content post (admin only)
   */
  createContentPost: protectedProcedure
    .input(z.object({
      title: z.string(),
      slug: z.string(),
      excerpt: z.string().optional(),
      content: z.string(),
      contentType: z.enum(['blog_post', 'cpd_article', 'worked_example', 'webinar', 'knowledge_base']),
      tags: z.array(z.string()).optional(),
      requiredTier: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
      featuredImageUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('content_posts')
        .insert({
          ...input,
          author_id: ctx.user?.id,
          status: 'draft',
        })
        .select()
        .single();
      
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create content post',
        });
      }
      
      return data;
    }),
  
  /**
   * Update content post (admin only)
   */
  updateContentPost: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().optional(),
      slug: z.string().optional(),
      excerpt: z.string().optional(),
      content: z.string().optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
      tags: z.array(z.string()).optional(),
      featuredImageUrl: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;
      
      // If publishing, set published_at
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString(),
      };
      
      if (updates.status === 'published') {
        updateData.published_at = new Date().toISOString();
      }
      
      const { data, error } = await (supabaseAdmin as any)
        .from('content_posts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update content post',
        });
      }
      
      return data;
    }),
  
  /**
   * Delete content post (admin only)
   */
  deleteContentPost: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin
        .from('content_posts')
        .delete()
        .eq('id', input);
      
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete content post',
        });
      }
      
      return { success: true };
    }),
});

