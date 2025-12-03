import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '../../logger';

export const complaintsRouter = router({
  create: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
      createdBy: z.string(),
      clientReference: z.string(),
      complaintType: z.string().optional(),
      hmrcDepartment: z.string().optional(),
      context: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      // Verify user belongs to the organization they're creating in
      if (input.organizationId !== ctx.organizationId) {
        throw new Error('Unauthorized: Cannot create complaint for different organization');
      }
      
      const { data, error } = await (supabaseAdmin as any)
        .from('complaints')
        .insert({
          organization_id: input.organizationId,
          created_by: input.createdBy,
          complaint_reference: input.clientReference,
          complaint_type: input.complaintType,
          hmrc_department: input.hmrcDepartment,
          status: 'assessment',
          timeline: input.context ? [{
            date: new Date().toISOString(),
            type: 'context_provided',
            summary: input.context,
          }] : [],
        })
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      return data;
    }),

  list: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
      status: z.enum(['assessment', 'draft', 'active', 'escalated', 'resolved', 'closed']).optional(),
    }))
    .query(async ({ input, ctx }) => {
      // Force user's organization - prevent accessing other orgs
      const organizationId = ctx.organizationId;
      
      // SECURITY: Reject if no organization ID
      if (!organizationId) {
        logger.warn('🚨 SECURITY: User attempted to list complaints without organization');
        return []; // Return empty array instead of all data
      }
      
      let query = supabaseAdmin
        .from('complaints')
        .select('*')
        .eq('organization_id', organizationId);
      
      if (input.status) {
        query = query.eq('status', input.status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        logger.error('❌ Supabase error:', error.message);
        throw new Error(`Supabase error: ${error.message}`);
      }
      
      return data;
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('complaints')
        .select('*')
        .eq('id', input)
        .single();
      
      if (error) throw new Error(error.message);
      
      return data;
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['assessment', 'draft', 'active', 'escalated', 'resolved', 'closed']),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('complaints')
        .update({ status: input.status, updated_at: new Date().toISOString() })
        .eq('id', input.id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      return data;
    }),

  closeWithOutcome: protectedProcedure
    .input(z.object({
      complaintId: z.string().uuid(),
      outcomeType: z.enum([
        'successful_full',
        'successful_partial',
        'unsuccessful',
        'withdrawn',
        'escalated_adjudicator',
        'escalated_tribunal',
        'settled'
      ]),
      compensationReceived: z.number().optional(),
      taxPositionCorrected: z.number().optional(),
      penaltiesCancelled: z.number().optional(),
      interestRefunded: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { recordComplaintOutcome } = await import('@/lib/outcomeAnalysis');
      
      // First update the complaint status to closed
      const { error: statusError } = await (supabaseAdmin as any)
        .from('complaints')
        .update({ 
          status: 'closed', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', input.complaintId);

      if (statusError) throw new Error(statusError.message);
      
      // Record the outcome for learning
      const outcome = await recordComplaintOutcome(input.complaintId, {
        outcomeType: input.outcomeType,
        compensationReceived: input.compensationReceived,
        taxPositionCorrected: input.taxPositionCorrected,
        penaltiesCancelled: input.penaltiesCancelled,
        interestRefunded: input.interestRefunded,
        notes: input.notes,
      });
      
      return outcome;
    }),

  getOutcomeStats: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
    }).optional())
    .query(async ({ input }) => {
      // Get outcome statistics from case_outcomes table
      const { data, error } = await (supabaseAdmin as any)
        .from('case_outcomes')
        .select('outcome_type, compensation_received, penalties_cancelled');
      
      if (error) {
        logger.error('Failed to fetch outcomes:', error);
        return { total: 0, successful: 0, successRate: 0 };
      }
      
      const total = data?.length || 0;
      const successful = (data || []).filter((o: any) => 
        o.outcome_type === 'successful_full' || o.outcome_type === 'successful_partial'
      ).length;
      
      return {
        total,
        successful,
        successRate: total > 0 ? Math.round((successful / total) * 100) : 0,
      };
    }),

  updateReference: protectedProcedure
    .input(z.object({
      id: z.string(),
      reference: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('complaints')
        .update({ 
          complaint_reference: input.reference,
          updated_at: new Date().toISOString() 
        })
        .eq('id', input.id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      return data;
    }),

  assign: protectedProcedure
    .input(z.object({
      complaintId: z.string(),
      assignedTo: z.string().nullable(),
    }))
    .mutation(async ({ input }) => {
      logger.info(`📋 Assigning complaint ${input.complaintId} to ${input.assignedTo || 'unassigned'}`);
      
      const { data, error } = await (supabaseAdmin as any)
        .from('complaints')
        .update({ 
          assigned_to: input.assignedTo,
          updated_at: new Date().toISOString() 
        })
        .eq('id', input.complaintId)
        .select()
        .single();
      
      if (error) {
        logger.error('❌ Failed to assign complaint:', error);
        throw new Error(error.message);
      }
      
      logger.info('✅ Complaint assigned successfully');
      return data;
    }),

  delete: protectedProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      // Delete related records first
      await (supabaseAdmin as any)
        .from('documents')
        .delete()
        .eq('complaint_id', input);
      
      await (supabaseAdmin as any)
        .from('time_logs')
        .delete()
        .eq('complaint_id', input);
      
      await (supabaseAdmin as any)
        .from('generated_letters')
        .delete()
        .eq('complaint_id', input);
      
      // Delete the complaint
      const { error } = await (supabaseAdmin as any)
        .from('complaints')
        .delete()
        .eq('id', input);
      
      if (error) throw new Error(error.message);
      
      return { success: true };
    }),

  addTimelineEvent: protectedProcedure
    .input(z.object({
      complaintId: z.string(),
      event: z.object({
        date: z.string(),
        type: z.string(),
        summary: z.string(),
        notes: z.string().optional(),
        duration: z.number().optional(),
      }),
    }))
    .mutation(async ({ input }) => {
      // Get current timeline
      const { data: complaint, error: fetchError } = await (supabaseAdmin as any)
        .from('complaints')
        .select('timeline')
        .eq('id', input.complaintId)
        .single();
      
      if (fetchError) throw new Error(fetchError.message);
      
      const currentTimeline = complaint?.timeline || [];
      const updatedTimeline = [...currentTimeline, input.event];
      
      // Update with new timeline
      const { data, error } = await (supabaseAdmin as any)
        .from('complaints')
        .update({ 
          timeline: updatedTimeline,
          updated_at: new Date().toISOString() 
        })
        .eq('id', input.complaintId)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      return data;
    }),
});

