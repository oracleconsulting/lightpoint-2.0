import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { createBrowserClient } from '@supabase/ssr';

// Validation schemas
const blogPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  excerpt: z.string().optional(),
  content: z.any(), // TipTap JSON content
  featuredImage: z.string().optional(),
  featuredImageAlt: z.string().optional(),
  author: z.string().min(1, 'Author is required'),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isPublished: z.boolean().default(false),
  scheduledFor: z.string().optional(), // ISO datetime string
  autoPublish: z.boolean().optional(),
});

export const blogRouter = router({
  // List all blog posts (with optional filters)
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['all', 'published', 'draft']).optional(),
        searchTerm: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        offset: z.number().min(0).optional().default(0),
      })
    )
    .query(async ({ input, ctx }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      let query = supabase
        .from('blog_posts')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      // Filter by status
      if (input.status === 'published') {
        query = query.eq('status', 'published');
      } else if (input.status === 'draft') {
        query = query.eq('status', 'draft');
      }

      // Search filter
      if (input.searchTerm) {
        query = query.or(`title.ilike.%${input.searchTerm}%,excerpt.ilike.%${input.searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching blog posts:', error);
        throw new Error('Failed to fetch blog posts');
      }

      return {
        posts: data as any[],
        total: count || 0,
      };
    }),

  // Get single blog post by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error) {
        console.error('Error fetching blog post:', error);
        throw new Error('Blog post not found');
      }

      return data as any;
    }),

  // Get single blog post by slug (for public viewing)
  getBySlug: protectedProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', input.slug)
        .single();

      if (error) {
        console.error('Error fetching blog post:', error);
        throw new Error('Blog post not found');
      }

      // Increment view count
      await supabase.rpc('increment_blog_views', { post_id: input.slug });

      return data as any;
    }),

  // Create new blog post
  create: protectedProcedure
    .input(blogPostSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      // Calculate read time (rough estimate: 200 words per minute)
      const wordCount = JSON.stringify(input.content).split(/\s+/).length;
      const readTime = Math.ceil(wordCount / 200);

      const { data, error } = await supabase
        .from('blog_posts')
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
          seo_title: input.metaTitle || input.title,
          seo_description: input.metaDescription || input.excerpt || null,
          read_time_minutes: readTime,
          scheduled_for: input.scheduledFor || null,
          auto_publish: input.autoPublish || false,
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Error creating blog post:', error);
        throw new Error('Failed to create blog post');
      }

      return data as any;
    }),

  // Update existing blog post
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: blogPostSchema.partial(),
      })
    )
    .mutation(async ({ input, ctx }) => {
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
        // Recalculate read time
        const wordCount = JSON.stringify(input.data.content).split(/\s+/).length;
        updateData.read_time_minutes = Math.ceil(wordCount / 200);
      }
      if (input.data.featuredImage !== undefined) updateData.featured_image_url = input.data.featuredImage;
      if (input.data.featuredImageAlt !== undefined) updateData.featured_image_alt = input.data.featuredImageAlt;
      if (input.data.author) updateData.author_id = ctx.user?.id;
      if (input.data.category !== undefined) updateData.category = input.data.category;
      if (input.data.tags !== undefined) updateData.tags = input.data.tags;
      if (input.data.metaTitle !== undefined) updateData.seo_title = input.data.metaTitle;
      if (input.data.metaDescription !== undefined) updateData.seo_description = input.data.metaDescription;
      if (input.data.isPublished !== undefined) {
        updateData.status = input.data.isPublished ? 'published' : 'draft';
        if (input.data.isPublished && !updateData.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }
      if (input.data.scheduledFor !== undefined) updateData.scheduled_for = input.data.scheduledFor;
      if (input.data.autoPublish !== undefined) updateData.auto_publish = input.data.autoPublish;

      const { data, error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating blog post:', error);
        throw new Error('Failed to update blog post');
      }

      return data as any;
    }),

  // Delete blog post
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', input.id);

      if (error) {
        console.error('Error deleting blog post:', error);
        throw new Error('Failed to delete blog post');
      }

      return { success: true };
    }),

  // Increment view count (helper function)
  incrementViews: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase.rpc('increment_blog_post_views', {
        post_id: input.id,
      } as any);

      if (error) {
        console.error('Error incrementing views:', error);
      }

      return { success: !error };
    }),
});

