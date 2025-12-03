import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '../../logger';

export const timeRouter = router({
  getComplaintTime: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('time_logs')
        .select('*')
        .eq('complaint_id', input)
        .order('created_at', { ascending: true });
      
      if (error) throw new Error(error.message);
      
      const totalMinutes = (data as any[]).reduce((sum: number, log: any) => sum + log.minutes_spent, 0);
      
      return {
        logs: data,
        totalMinutes,
        totalHours: (totalMinutes / 60).toFixed(2),
      };
    }),

  logActivity: protectedProcedure
    .input(z.object({
      complaintId: z.string(),
      activity: z.string(),
      duration: z.number(), // minutes
      rate: z.number().optional(),
      notes: z.string().optional(),
      automated: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      logger.info('⏱️ Logging activity:', input.activity, input.duration, 'minutes');
      
      const { data: timeLog, error: timeError } = await (supabaseAdmin as any)
        .from('time_logs')
        .insert({
          complaint_id: input.complaintId,
          activity_type: input.activity,
          minutes_spent: input.duration,
          automated: input.automated !== false,
        })
        .select()
        .single();
      
      if (timeError) {
        logger.error('Time logging error:', timeError);
        return null;
      }
      
      // If manual entry with notes, add to timeline
      if (input.notes && input.automated === false) {
        const { data: complaint } = await (supabaseAdmin as any)
          .from('complaints')
          .select('timeline')
          .eq('id', input.complaintId)
          .single();
        
        if (complaint) {
          const currentTimeline = complaint.timeline || [];
          const newTimelineEntry = {
            date: new Date().toISOString(),
            type: 'manual_activity',
            summary: `${input.activity} (${input.duration}m)`,
            notes: input.notes,
            duration: input.duration,
          };
          
          await (supabaseAdmin as any)
            .from('complaints')
            .update({
              timeline: [...currentTimeline, newTimelineEntry],
              updated_at: new Date().toISOString(),
            })
            .eq('id', input.complaintId);
        }
      }
      
      return timeLog;
    }),

  deleteActivityByType: protectedProcedure
    .input(z.object({
      complaintId: z.string(),
      activityType: z.string(),
    }))
    .mutation(async ({ input }) => {
      logger.info(`🗑️ Deleting time logs for ${input.complaintId} / ${input.activityType}`);
      
      const { error } = await (supabaseAdmin as any)
        .from('time_logs')
        .delete()
        .eq('complaint_id', input.complaintId)
        .eq('activity_type', input.activityType)
        .eq('automated', true);
      
      if (error) {
        logger.error('Time log deletion error:', error);
        return null;
      }
      
      return { success: true };
    }),

  deleteActivity: protectedProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      logger.info(`🗑️ Deleting time log: ${input}`);
      
      const { error } = await (supabaseAdmin as any)
        .from('time_logs')
        .delete()
        .eq('id', input);
      
      if (error) {
        logger.error('Time log deletion error:', error);
        throw new Error(error.message);
      }
      
      return { success: true };
    }),

  updateActivity: protectedProcedure
    .input(z.object({
      id: z.string(),
      duration: z.number().optional(),
      activity: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      logger.info(`✏️ Updating time log: ${input.id}`);
      
      const updates: Record<string, any> = {};
      if (input.duration !== undefined) updates.minutes_spent = input.duration;
      if (input.activity !== undefined) updates.activity_type = input.activity;
      
      const { data, error } = await (supabaseAdmin as any)
        .from('time_logs')
        .update(updates)
        .eq('id', input.id)
        .select()
        .single();
      
      if (error) {
        logger.error('Time log update error:', error);
        throw new Error(error.message);
      }
      
      return data;
    }),
});

