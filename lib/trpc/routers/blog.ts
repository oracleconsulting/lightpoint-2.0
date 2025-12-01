import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { createServerClient } from '@/lib/supabase/client';
import { TRPCError } from '@trpc/server';

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
  structuredLayout: z.any().optional(), // AI-generated visual layout
  gammaUrl: z.string().optional(), // Gamma API presentation URL
  gammaPdfUrl: z.string().optional(), // Gamma PDF export URL
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
      const supabase = createServerClient();

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

  // List PUBLISHED blog posts (PUBLIC - for blog listing page)
  listPublished: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).optional().default(20),
        offset: z.number().min(0).optional().default(0),
      }).optional()
    )
    .query(async ({ input }) => {
      const supabase = createServerClient();
      const limit = input?.limit || 20;
      const offset = input?.offset || 0;

      const { data, error, count } = await supabase
        .from('blog_posts')
        .select('id, title, slug, excerpt, featured_image_url, featured_image_alt, author, category, tags, read_time_minutes, published_at, created_at', { count: 'exact' })
        .eq('status', 'published')
        .eq('is_published', true)
        .order('published_at', { ascending: false, nullsFirst: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching published blog posts:', error);
        return { posts: [], total: 0 };
      }

      return {
        posts: data || [],
        total: count || 0,
      };
    }),

  // Get single blog post by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const supabase = createServerClient();

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
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const supabase = createServerClient();

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
      const supabase = createServerClient();

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
          author: input.author || 'Admin', // TEXT field - required
          author_id: ctx.user?.id || null, // UUID field - optional FK
          status: input.isPublished ? 'published' : 'draft',
          published_at: input.isPublished ? new Date().toISOString() : null,
          category: input.category || null,
          tags: input.tags || [],
          seo_title: input.metaTitle || input.title,
          seo_description: input.metaDescription || input.excerpt || null,
          read_time_minutes: readTime,
          scheduled_for: input.scheduledFor || null,
          auto_publish: input.autoPublish || false,
          structured_layout: input.structuredLayout || null, // AI-generated layout
          gamma_url: input.gammaUrl || null,
          gamma_pdf_url: input.gammaPdfUrl || null,
        } as any)
        .select()
        .single();

      // Debug: Log what we saved
      if (input.structuredLayout) {
        console.log('💾 [tRPC blog.create] Saved structured_layout:');
        console.log('💾 Component count:', input.structuredLayout?.layout?.length || 0);
        console.log('💾 TextSection count:', input.structuredLayout?.layout?.filter((c: any) => c.type === 'TextSection').length || 0);
      }

      if (error) {
        console.error('❌ Error creating blog post:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create blog post: ${error.message || 'Unknown error'}`,
          cause: error,
        });
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
      const supabase = createServerClient();

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
      if (input.data.structuredLayout !== undefined) {
        updateData.structured_layout = input.data.structuredLayout;
        // Debug: Log what we're saving
        console.log('💾 [tRPC blog.update] Saving structured_layout:');
        console.log('💾 Component count:', input.data.structuredLayout?.layout?.length || 0);
        console.log('💾 TextSection count:', input.data.structuredLayout?.layout?.filter((c: any) => c.type === 'TextSection').length || 0);
        console.log('💾 Component types:', input.data.structuredLayout?.layout?.map((c: any) => c.type) || []);
      }
      if (input.data.gammaUrl !== undefined) {
        updateData.gamma_url = input.data.gammaUrl;
      }
      if (input.data.gammaPdfUrl !== undefined) {
        updateData.gamma_pdf_url = input.data.gammaPdfUrl;
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating blog post:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error,
        });
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update blog post: ${error.message || 'Unknown error'}`,
          cause: error,
        });
      }

      return data as any;
    }),

  // Delete blog post
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const supabase = createServerClient();

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
      const supabase = createServerClient();

      const { error } = await supabase.rpc('increment_blog_post_views', {
        post_id: input.id,
      } as any);

      if (error) {
        console.error('Error incrementing views:', error);
      }

      return { success: !error };
    }),

  // Generate SEO metadata using AI
  generateSEO: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        content: z.string(),
        excerpt: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://lightpoint.uk',
            'X-Title': 'Lightpoint Blog SEO Generator',
          },
          body: JSON.stringify({
            model: 'anthropic/claude-3.5-sonnet',
            messages: [
              {
                role: 'user',
                content: `You are an SEO expert for a UK accounting technology platform specializing in HMRC complaints.

Generate SEO-optimized metadata for this blog post:

Title: ${input.title}
Content: ${input.content.substring(0, 3000)}...

Return ONLY a JSON object with:
{
  "metaTitle": "60 characters max, compelling, keyword-rich",
  "metaDescription": "155 characters max, persuasive, includes call-to-action",
  "suggestedTags": ["3-5", "relevant", "tags"]
}

Focus on UK accounting, HMRC, tax, and professional services keywords.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenRouter API error: ${response.statusText}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0]?.message?.content;

        if (!aiResponse) {
          throw new Error('No response from AI');
        }

        // Parse JSON from AI response (strip markdown code fences if present)
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Could not parse AI response');
        }

        const seoData = JSON.parse(jsonMatch[0]);

        return {
          metaTitle: seoData.metaTitle?.substring(0, 60) || input.title.substring(0, 60),
          metaDescription: seoData.metaDescription?.substring(0, 160) || input.excerpt?.substring(0, 160) || '',
          suggestedTags: Array.isArray(seoData.suggestedTags) ? seoData.suggestedTags.slice(0, 5) : [],
        };
      } catch (error) {
        console.error('Error generating SEO:', error);
        // Fallback to basic generation
        return {
          metaTitle: input.title.substring(0, 60),
          metaDescription: input.excerpt?.substring(0, 160) || input.content.substring(0, 160),
          suggestedTags: ['HMRC', 'Tax', 'Accounting'],
        };
      }
    }),
});

