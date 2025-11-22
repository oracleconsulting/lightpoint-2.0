import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { createBrowserClient } from '@supabase/ssr';

// Validation schema for CPD articles
const cpdArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  content: z.any(), // TipTap JSON content
  featuredImage: z.string().optional(),
  featuredImageAlt: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  cpdHours: z.number().min(0).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const cpdRouter = router({
  // List all CPD articles
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['all', 'published', 'draft']).optional(),
        searchTerm: z.string().optional(),
        category: z.string().optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      let query = supabase
        .from('cpd_articles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.status === 'published') {
        query = query.eq('status', 'published');
      } else if (input.status === 'draft') {
        query = query.eq('status', 'draft');
      }

      if (input.searchTerm) {
        query = query.or(`title.ilike.%${input.searchTerm}%,excerpt.ilike.%${input.searchTerm}%`);
      }

      if (input.category) {
        query = query.eq('category', input.category);
      }

      if (input.difficulty) {
        query = query.eq('difficulty_level', input.difficulty);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching CPD articles:', error);
        throw new Error('Failed to fetch CPD articles');
      }

      return {
        articles: data as any[],
        total: count || 0,
      };
    }),

  // Get single article by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('cpd_articles')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error) {
        console.error('Error fetching CPD article:', error);
        throw new Error('CPD article not found');
      }

      return data as any;
    }),

  // Create new CPD article
  create: protectedProcedure
    .input(cpdArticleSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const wordCount = JSON.stringify(input.content).split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 200);

      const { data, error } = await supabase
        .from('cpd_articles')
        .insert({
          title: input.title,
          slug: input.slug,
          excerpt: input.excerpt || null,
          content: input.content,
          featured_image_url: input.featuredImage || null,
          featured_image_alt: input.featuredImageAlt || null,
          author_id: ctx.user?.id || null,
          status: input.isPublished ? 'published' : 'draft',
          published_at: input.isPublished ? new Date().toISOString() : null,
          category: input.category || null,
          tags: input.tags || [],
          cpd_hours: input.cpdHours || null,
          difficulty_level: input.difficulty || 'intermediate',
          seo_title: input.metaTitle || input.title,
          seo_description: input.metaDescription || input.excerpt || null,
          read_time_minutes: readTime,
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Error creating CPD article:', error);
        throw new Error('Failed to create CPD article');
      }

      return data as any;
    }),

  // Update existing CPD article
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: cpdArticleSchema.partial(),
      })
    )
    .mutation(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (input.data.title) updateData.title = input.data.title;
      if (input.data.slug) updateData.slug = input.data.slug;
      if (input.data.excerpt !== undefined) updateData.excerpt = input.data.excerpt;
      if (input.data.content) {
        updateData.content = input.data.content;
        const wordCount = JSON.stringify(input.data.content).split(/\s+/).length;
        updateData.read_time_minutes = Math.ceil(wordCount / 200);
      }
      if (input.data.featuredImage !== undefined) updateData.featured_image_url = input.data.featuredImage;
      if (input.data.featuredImageAlt !== undefined) updateData.featured_image_alt = input.data.featuredImageAlt;
      if (input.data.category !== undefined) updateData.category = input.data.category;
      if (input.data.tags !== undefined) updateData.tags = input.data.tags;
      if (input.data.cpdHours !== undefined) updateData.cpd_hours = input.data.cpdHours;
      if (input.data.difficulty !== undefined) updateData.difficulty_level = input.data.difficulty;
      if (input.data.metaTitle !== undefined) updateData.seo_title = input.data.metaTitle;
      if (input.data.metaDescription !== undefined) updateData.seo_description = input.data.metaDescription;
      if (input.data.isPublished !== undefined) {
        updateData.status = input.data.isPublished ? 'published' : 'draft';
        if (input.data.isPublished && !updateData.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('cpd_articles')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating CPD article:', error);
        throw new Error('Failed to update CPD article');
      }

      return data as any;
    }),

  // Delete CPD article
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from('cpd_articles')
        .delete()
        .eq('id', input.id);

      if (error) {
        console.error('Error deleting CPD article:', error);
        throw new Error('Failed to delete CPD article');
      }

      return { success: true };
    }),
});

