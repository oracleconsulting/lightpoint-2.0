import { z } from 'zod';
import { router, protectedProcedure, publicProcedure } from '../trpc';
import { createBrowserClient } from '@supabase/ssr';

// Validation schema for webinars
const webinarSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required'),
  description: z.string().optional(),
  content: z.any(), // TipTap JSON content
  webinarType: z.enum(['live', 'recorded']).default('recorded'),
  status: z.enum(['upcoming', 'live', 'completed', 'cancelled']).default('upcoming'),
  scheduledDate: z.string().optional(), // ISO date string
  duration: z.number().min(1).optional(), // Duration in minutes
  videoUrl: z.string().optional(),
  streamUrl: z.string().optional(),
  streamKey: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  speakerName: z.string().optional(),
  speakerBio: z.string().optional(),
  speakerAvatar: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  isPublished: z.boolean().default(false),
  maxAttendees: z.number().optional(),
});

export const webinarRouter = router({
  // List all webinars
  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['all', 'upcoming', 'live', 'completed', 'cancelled']).optional(),
        webinarType: z.enum(['all', 'live', 'recorded']).optional(),
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
        .from('webinars')
        .select('*', { count: 'exact' })
        .order('scheduled_date', { ascending: false })
        .range(input.offset, input.offset + input.limit - 1);

      if (input.status && input.status !== 'all') {
        query = query.eq('status', input.status);
      }

      if (input.webinarType && input.webinarType !== 'all') {
        query = query.eq('webinar_type', input.webinarType);
      }

      if (input.searchTerm) {
        query = query.or(`title.ilike.%${input.searchTerm}%,description.ilike.%${input.searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching webinars:', error);
        throw new Error('Failed to fetch webinars');
      }

      return {
        webinars: data as any[],
        total: count || 0,
      };
    }),

  // Get single webinar by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('webinars')
        .select('*')
        .eq('id', input.id)
        .single();

      if (error) {
        console.error('Error fetching webinar:', error);
        throw new Error('Webinar not found');
      }

      return data as any;
    }),

  // Get webinar by slug (public)
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('webinars')
        .select('*')
        .eq('slug', input.slug)
        .eq('is_published', true) // Only show published webinars
        .single();

      if (error) {
        console.error('Error fetching webinar by slug:', error);
        throw new Error('Webinar not found');
      }

      return data as any;
    }),

  // Create new webinar
  create: protectedProcedure
    .input(webinarSchema)
    .mutation(async ({ input, ctx }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('webinars')
        .insert({
          title: input.title,
          slug: input.slug,
          description: input.description || null,
          content: input.content,
          webinar_type: input.webinarType,
          status: input.status,
          scheduled_date: input.scheduledDate || null,
          duration_minutes: input.duration || null,
          video_url: input.videoUrl || null,
          stream_url: input.streamUrl || null,
          stream_key: input.streamKey || null,
          thumbnail_url: input.thumbnailUrl || null,
          speaker_name: input.speakerName || null,
          speaker_bio: input.speakerBio || null,
          speaker_avatar_url: input.speakerAvatar || null,
          host_id: ctx.user?.id || null,
          category: input.category || null,
          tags: input.tags || [],
          seo_title: input.metaTitle || input.title,
          seo_description: input.metaDescription || input.description || null,
          max_attendees: input.maxAttendees || null,
          is_published: input.isPublished,
        } as any)
        .select()
        .single();

      if (error) {
        console.error('Error creating webinar:', error);
        throw new Error('Failed to create webinar');
      }

      return data as any;
    }),

  // Update existing webinar
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        data: webinarSchema.partial(),
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
      if (input.data.description !== undefined) updateData.description = input.data.description;
      if (input.data.content) updateData.content = input.data.content;
      if (input.data.webinarType) updateData.webinar_type = input.data.webinarType;
      if (input.data.status) updateData.status = input.data.status;
      if (input.data.scheduledDate !== undefined) updateData.scheduled_date = input.data.scheduledDate;
      if (input.data.duration !== undefined) updateData.duration_minutes = input.data.duration;
      if (input.data.videoUrl !== undefined) updateData.video_url = input.data.videoUrl;
      if (input.data.streamUrl !== undefined) updateData.stream_url = input.data.streamUrl;
      if (input.data.streamKey !== undefined) updateData.stream_key = input.data.streamKey;
      if (input.data.thumbnailUrl !== undefined) updateData.thumbnail_url = input.data.thumbnailUrl;
      if (input.data.speakerName !== undefined) updateData.speaker_name = input.data.speakerName;
      if (input.data.speakerBio !== undefined) updateData.speaker_bio = input.data.speakerBio;
      if (input.data.speakerAvatar !== undefined) updateData.speaker_avatar_url = input.data.speakerAvatar;
      if (input.data.category !== undefined) updateData.category = input.data.category;
      if (input.data.tags !== undefined) updateData.tags = input.data.tags;
      if (input.data.metaTitle !== undefined) updateData.seo_title = input.data.metaTitle;
      if (input.data.metaDescription !== undefined) updateData.seo_description = input.data.metaDescription;
      if (input.data.maxAttendees !== undefined) updateData.max_attendees = input.data.maxAttendees;
      if (input.data.isPublished !== undefined) updateData.is_published = input.data.isPublished;

      const { data, error } = await supabase
        .from('webinars')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating webinar:', error);
        throw new Error('Failed to update webinar');
      }

      return data as any;
    }),

  // Delete webinar
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ input }) => {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase
        .from('webinars')
        .delete()
        .eq('id', input.id);

      if (error) {
        console.error('Error deleting webinar:', error);
        throw new Error('Failed to delete webinar');
      }

      return { success: true };
    }),
});

