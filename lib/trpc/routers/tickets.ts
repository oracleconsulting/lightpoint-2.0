import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '../../logger';

export const ticketsRouter = router({
  create: protectedProcedure
    .input(z.object({
      complaintId: z.string(),
      organizationId: z.string(),
      createdBy: z.string(),
      ticketType: z.enum(['escalation', 'question', 'feedback', 'other']),
      priority: z.enum(['low', 'medium', 'high', 'urgent']),
      title: z.string(),
      description: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('support_tickets')
        .insert({
          complaint_id: input.complaintId,
          organization_id: input.organizationId,
          created_by: input.createdBy,
          ticket_type: input.ticketType,
          priority: input.priority,
          title: input.title,
          description: input.description,
          status: 'open',
        })
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),

  list: protectedProcedure
    .input(z.object({
      organizationId: z.string(),
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    }))
    .query(async ({ input }) => {
      let query = (supabaseAdmin as any)
        .from('support_tickets')
        .select('*')
        .eq('organization_id', input.organizationId);
      
      if (input.status) {
        query = query.eq('status', input.status);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data;
    }),

  getByComplaint: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('support_tickets')
        .select('*')
        .eq('complaint_id', input)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
      priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
      assignedTo: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      
      const updateData: Record<string, any> = {};
      if (updates.status) updateData.status = updates.status;
      if (updates.priority) updateData.priority = updates.priority;
      if (updates.assignedTo !== undefined) updateData.assigned_to = updates.assignedTo;
      if (updates.notes) updateData.notes = updates.notes;
      updateData.updated_at = new Date().toISOString();
      
      const { data, error } = await (supabaseAdmin as any)
        .from('support_tickets')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),

  addComment: protectedProcedure
    .input(z.object({
      ticketId: z.string(),
      userId: z.string(),
      comment: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Get existing ticket
      const { data: ticket, error: fetchError } = await (supabaseAdmin as any)
        .from('support_tickets')
        .select('comments')
        .eq('id', input.ticketId)
        .single();
      
      if (fetchError) throw new Error(fetchError.message);
      
      const comments = ticket?.comments || [];
      comments.push({
        id: crypto.randomUUID(),
        user_id: input.userId,
        comment: input.comment,
        created_at: new Date().toISOString(),
      });
      
      const { data, error } = await (supabaseAdmin as any)
        .from('support_tickets')
        .update({ comments, updated_at: new Date().toISOString() })
        .eq('id', input.ticketId)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),
});

