import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { supabaseAdmin } from '@/lib/supabase/client';
import { ensureCaseAccess, requireOrg } from './caseUtils';
import { logger } from '../../logger';

const caseStatus = z.enum(['open', 'active', 'on_hold', 'closed']);
const caseTier = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const caseRouter = router({
  create: protectedProcedure
    .input(z.object({
      caseReference: z.string().min(1),
      title: z.string().min(1),
      clientName: z.string().optional(),
      hmrcReference: z.string().optional(),
      hmrcDepartment: z.string().optional(),
      caseType: z.string().optional(),
      tier: caseTier.default(3),
      priority: z.enum(['low', 'normal', 'high', 'critical']).default('normal'),
      summary: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);

      const { data, error } = await (supabaseAdmin as any)
        .from('cases')
        .insert({
          organization_id: organizationId,
          created_by: ctx.userId,
          case_reference: input.caseReference.trim(),
          title: input.title.trim(),
          client_name: input.clientName?.trim() || null,
          hmrc_reference: input.hmrcReference?.trim() || null,
          hmrc_department: input.hmrcDepartment?.trim() || null,
          case_type: input.caseType || 'complex_dispute',
          tier: input.tier,
          priority: input.priority,
          summary: input.summary?.trim() || null,
          status: 'open',
        })
        .select()
        .single();

      if (error) {
        logger.error('Failed to create case:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }

      return data;
    }),

  list: protectedProcedure
    .input(z.object({
      status: caseStatus.or(z.literal('all')).optional(),
      tier: caseTier.or(z.literal('all')).optional(),
      recent: z.boolean().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      let query = (supabaseAdmin as any)
        .from('cases')
        .select('*')
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false });

      if (input?.status && input.status !== 'all') {
        query = query.eq('status', input.status);
      }
      if (input?.tier && input.tier !== 'all') {
        query = query.eq('tier', input.tier);
      }
      if (input?.recent) {
        query = query.limit(10);
      }

      const { data, error } = await query;
      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return data || [];
    }),

  get: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input, organizationId);

      const { data, error } = await (supabaseAdmin as any)
        .rpc('get_case_workspace', { case_id_param: input });

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
      if (!data) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Case workspace not found' });
      }

      return data;
    }),

  update: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
      caseReference: z.string().min(1).optional(),
      title: z.string().min(1).optional(),
      clientName: z.string().optional().nullable(),
      hmrcReference: z.string().optional().nullable(),
      hmrcDepartment: z.string().optional().nullable(),
      status: caseStatus.optional(),
      tier: caseTier.optional(),
      priority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
      summary: z.string().optional().nullable(),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      const updates: Record<string, unknown> = {};
      if (input.caseReference !== undefined) updates.case_reference = input.caseReference.trim();
      if (input.title !== undefined) updates.title = input.title.trim();
      if (input.clientName !== undefined) updates.client_name = input.clientName?.trim() || null;
      if (input.hmrcReference !== undefined) updates.hmrc_reference = input.hmrcReference?.trim() || null;
      if (input.hmrcDepartment !== undefined) updates.hmrc_department = input.hmrcDepartment?.trim() || null;
      if (input.status !== undefined) updates.status = input.status;
      if (input.tier !== undefined) updates.tier = input.tier;
      if (input.priority !== undefined) updates.priority = input.priority;
      if (input.summary !== undefined) updates.summary = input.summary?.trim() || null;

      const { data, error } = await (supabaseAdmin as any)
        .from('cases')
        .update(updates)
        .eq('id', input.caseId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return data;
    }),

  close: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
      outcome: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      const { data, error } = await (supabaseAdmin as any)
        .from('cases')
        .update({
          status: 'closed',
          outcome: input.outcome.trim(),
          closed_at: new Date().toISOString(),
        })
        .eq('id', input.caseId)
        .eq('organization_id', organizationId)
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return data;
    }),
});
