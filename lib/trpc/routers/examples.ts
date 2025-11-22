import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { createBrowserClient } from '@supabase/ssr';

// Validation schema for worked examples
const workedExampleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  summary: z.string().optional(),
  background: z.any(), // TipTap JSON content
  actionsTaken: z.any(), // TipTap JSON content
  outcome: z.any(), // TipTap JSON content
  lessonsLearned: z.any(), // TipTap JSON content
  category: z.string().optional(),
  complexity: z.enum(['simple', 'intermediate', 'complex']).default('intermediate'),
  feeRecoveryAmount: z.number().optional(),
  durationDays: z.number().optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isPublished: z.boolean().default(false),
});

export const examplesRouter = router({
  // List all worked examples
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['all', 'published', 'draft']).optional(),
        category: z.string().optional(),
        complexity: z.enum(['simple', 'intermediate', 'complex']).optional(),
        searchTerm: z.string().optional(),
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
        .from('worked_examples')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.status === 'published') {
        query = query.eq('status', 'published');
      } else if (input.status === 'draft') {
        query = query.eq('status', 'draft');
      }

      if (input.category) {
        query = query.eq('category', input.category);
      }

      if (input.complexity) {
        query = query.eq('complexity_rating', input.complexity);
      }

      if (input.searchTerm) {
        query = query.or(`title.ilike.%${input.searchTerm}%,summary.ilike.%${input.searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching worked examples:', error);
        throw new Error('Failed to fetch worked examples');
      }

      return {
        examples: data as any[],
        total: count || 0,
      };
    }),

  // Get single worked example by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('worked_examples')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error) {
        console.error('Error fetching worked example:', error);
        throw new Error('Worked example not found');
      }

      return data as any;
    }),

  // Create new worked example
  create: protectedProcedure
    .input(workedExampleSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('worked_examples')
        .insert({
          title: input.title,
          slug: input.slug,
          summary: input.summary || null,
          background: input.background,
          actions_taken: input.actionsTaken,
          outcome: input.outcome,
          lessons_learned: input.lessonsLearned,
          category: input.category || null,
          complexity_rating: input.complexity,
          fee_recovery_amount: input.feeRecoveryAmount || null,
          duration_days: input.durationDays || null,
          author_id: ctx.user?.id || null,
          status: input.isPublished ? 'published' : 'draft',
          published_at: input.isPublished ? new Date().toISOString() : null,
          tags: input.tags || [],
          seo_title: input.metaTitle || input.title,
          seo_description: input.metaDescription || input.summary || null,
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Error creating worked example:', error);
        throw new Error('Failed to create worked example');
      }

      return data as any;
    }),

  // Update existing worked example
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: workedExampleSchema.partial(),
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
      if (input.data.summary !== undefined) updateData.summary = input.data.summary;
      if (input.data.background) updateData.background = input.data.background;
      if (input.data.actionsTaken) updateData.actions_taken = input.data.actionsTaken;
      if (input.data.outcome) updateData.outcome = input.data.outcome;
      if (input.data.lessonsLearned) updateData.lessons_learned = input.data.lessonsLearned;
      if (input.data.category !== undefined) updateData.category = input.data.category;
      if (input.data.complexity) updateData.complexity_rating = input.data.complexity;
      if (input.data.feeRecoveryAmount !== undefined) updateData.fee_recovery_amount = input.data.feeRecoveryAmount;
      if (input.data.durationDays !== undefined) updateData.duration_days = input.data.durationDays;
      if (input.data.tags !== undefined) updateData.tags = input.data.tags;
      if (input.data.metaTitle !== undefined) updateData.seo_title = input.data.metaTitle;
      if (input.data.metaDescription !== undefined) updateData.seo_description = input.data.metaDescription;
      if (input.data.isPublished !== undefined) {
        updateData.status = input.data.isPublished ? 'published' : 'draft';
        if (input.data.isPublished && !updateData.published_at) {
          updateData.published_at = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from('worked_examples')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating worked example:', error);
        throw new Error('Failed to update worked example');
      }

      return data as any;
    }),

  // Delete worked example
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from('worked_examples')
        .delete()
        .eq('id', input.id);

      if (error) {
        console.error('Error deleting worked example:', error);
        throw new Error('Failed to delete worked example');
      }

      return { success: true };
    }),
});

