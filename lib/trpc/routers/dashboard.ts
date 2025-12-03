import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '../../logger';

export const dashboardRouter = router({
  getMetrics: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      // Security: ensure user can only access their org's metrics
      if (input.organizationId !== ctx.organizationId) {
        throw new Error('Unauthorized');
      }

      // Get complaint counts by status
      const { data: complaints, error: complaintsError } = await (supabaseAdmin as any)
        .from('complaints')
        .select('status')
        .eq('organization_id', input.organizationId);

      if (complaintsError) {
        logger.error('Failed to fetch complaints:', complaintsError);
        throw new Error(complaintsError.message);
      }

      const statusCounts = (complaints || []).reduce((acc: Record<string, number>, c: any) => {
        acc[c.status] = (acc[c.status] || 0) + 1;
        return acc;
      }, {});

      // Get total time logged
      const { data: timeLogs, error: timeError } = await (supabaseAdmin as any)
        .from('time_logs')
        .select('minutes_spent, complaint_id')
        .in('complaint_id', (complaints || []).map((c: any) => c.id));

      const totalMinutes = (timeLogs || []).reduce((sum: number, log: any) => sum + (log.minutes_spent || 0), 0);

      // Get recent letters
      const { data: letters, error: lettersError } = await (supabaseAdmin as any)
        .from('generated_letters')
        .select('id, letter_type, created_at, sent_at')
        .in('complaint_id', (complaints || []).map((c: any) => c.id))
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        totalComplaints: complaints?.length || 0,
        statusBreakdown: statusCounts,
        activeComplaints: (statusCounts['assessment'] || 0) + (statusCounts['active'] || 0),
        resolvedComplaints: statusCounts['resolved'] || 0,
        closedComplaints: statusCounts['closed'] || 0,
        totalTimeMinutes: totalMinutes,
        totalTimeHours: Number((totalMinutes / 60).toFixed(1)),
        recentLetters: letters || [],
        lettersSent: (letters || []).filter((l: any) => l.sent_at).length,
      };
    }),

  getOnboardingStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const { data: org, error } = await (supabaseAdmin as any)
        .from('organizations')
        .select('pilot_status, onboarding_completed, onboarding_meeting_booked')
        .eq('id', ctx.organizationId)
        .single();

      if (error) {
        logger.error('Failed to fetch org:', error);
        return { 
          pilotStatus: 'unknown',
          onboardingCompleted: false,
          meetingBooked: false 
        };
      }

      return {
        pilotStatus: org?.pilot_status || 'unknown',
        onboardingCompleted: org?.onboarding_completed || false,
        meetingBooked: org?.onboarding_meeting_booked || false,
      };
    }),

  bookOnboardingMeeting: protectedProcedure
    .input(z.object({
      meetingDate: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { error } = await (supabaseAdmin as any)
        .from('organizations')
        .update({
          onboarding_meeting_booked: true,
          onboarding_meeting_date: input.meetingDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ctx.organizationId);

      if (error) throw new Error(error.message);
      return { success: true };
    }),

  completeOnboarding: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { error } = await (supabaseAdmin as any)
        .from('organizations')
        .update({
          onboarding_completed: true,
          pilot_status: 'pilot_active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ctx.organizationId);

      if (error) throw new Error(error.message);
      return { success: true };
    }),
});

export const managementRouter = router({
  getOverview: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
    }))
    .query(async ({ input, ctx }) => {
      // Security check
      if (input.organizationId !== ctx.organizationId) {
        throw new Error('Unauthorized');
      }

      // Get all complaints for this org
      const { data: complaints } = await (supabaseAdmin as any)
        .from('complaints')
        .select('id, status, assigned_to, created_at')
        .eq('organization_id', input.organizationId);

      // Get ticket counts
      const { data: tickets } = await (supabaseAdmin as any)
        .from('support_tickets')
        .select('status, priority')
        .eq('organization_id', input.organizationId);

      const openTickets = (tickets || []).filter((t: any) => t.status === 'open').length;
      const urgentTickets = (tickets || []).filter((t: any) => t.priority === 'urgent').length;

      // Get team members
      const { data: users } = await (supabaseAdmin as any)
        .from('user_profiles')
        .select('id, full_name, role')
        .eq('organization_id', input.organizationId);

      return {
        totalComplaints: complaints?.length || 0,
        complaintsThisMonth: (complaints || []).filter((c: any) => {
          const createdAt = new Date(c.created_at);
          const now = new Date();
          return createdAt.getMonth() === now.getMonth() && 
                 createdAt.getFullYear() === now.getFullYear();
        }).length,
        openTickets,
        urgentTickets,
        teamMembers: users?.length || 0,
        unassignedComplaints: (complaints || []).filter((c: any) => !c.assigned_to).length,
      };
    }),
});

