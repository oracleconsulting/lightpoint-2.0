import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { supabaseAdmin } from '@/lib/supabase/client';
import { ensureCaseAccess, requireOrg } from './caseUtils';

const deadlineStatus = z.enum(['live', 'passed', 'met', 'extended']);

export const caseEventRouter = router({
  create: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
      eventDate: z.string().min(1),
      eventType: z.string().min(1).default('note'),
      title: z.string().min(1),
      description: z.string().optional(),
      deadlineStatus: deadlineStatus.optional().nullable(),
      statutoryAuthority: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      const { data, error } = await (supabaseAdmin as any)
        .from('case_events')
        .insert({
          case_id: input.caseId,
          event_date: input.eventDate,
          event_type: input.eventType,
          title: input.title.trim(),
          description: input.description?.trim() || null,
          deadline_status: input.deadlineStatus || null,
          statutory_authority: input.statutoryAuthority?.trim() || null,
          created_by: ctx.userId,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  list: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input, organizationId);

      const { data, error } = await (supabaseAdmin as any)
        .from('case_events')
        .select('*')
        .eq('case_id', input)
        .order('event_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data || [];
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      caseId: z.string().uuid(),
      eventDate: z.string().min(1).optional(),
      eventType: z.string().min(1).optional(),
      title: z.string().min(1).optional(),
      description: z.string().optional().nullable(),
      deadlineStatus: deadlineStatus.optional().nullable(),
      statutoryAuthority: z.string().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      const updates: Record<string, unknown> = {};
      if (input.eventDate !== undefined) updates.event_date = input.eventDate;
      if (input.eventType !== undefined) updates.event_type = input.eventType;
      if (input.title !== undefined) updates.title = input.title.trim();
      if (input.description !== undefined) updates.description = input.description?.trim() || null;
      if (input.deadlineStatus !== undefined) updates.deadline_status = input.deadlineStatus || null;
      if (input.statutoryAuthority !== undefined) updates.statutory_authority = input.statutoryAuthority?.trim() || null;

      const { data, error } = await (supabaseAdmin as any)
        .from('case_events')
        .update(updates)
        .eq('id', input.id)
        .eq('case_id', input.caseId)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  delete: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      caseId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      const { error } = await (supabaseAdmin as any)
        .from('case_events')
        .delete()
        .eq('id', input.id)
        .eq('case_id', input.caseId);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { success: true };
    }),

  markDeadlineStatus: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      caseId: z.string().uuid(),
      deadlineStatus,
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      const { data, error } = await (supabaseAdmin as any)
        .from('case_events')
        .update({ deadline_status: input.deadlineStatus })
        .eq('id', input.id)
        .eq('case_id', input.caseId)
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),
});
