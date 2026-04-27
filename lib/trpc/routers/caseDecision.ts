import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { supabaseAdmin } from '@/lib/supabase/client';
import { ensureCaseAccess, requireOrg } from './caseUtils';

export const caseDecisionRouter = router({
  log: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
      decisionText: z.string().min(1),
      reasoning: z.string().optional(),
      alternativesConsidered: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      const { data, error } = await (supabaseAdmin as any)
        .from('case_decisions')
        .insert({
          case_id: input.caseId,
          decision_text: input.decisionText.trim(),
          reasoning: input.reasoning?.trim() || null,
          alternatives_considered: input.alternativesConsidered?.trim() || null,
          created_by: ctx.userId,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  list: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
      includeHistory: z.boolean().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      let query = (supabaseAdmin as any)
        .from('case_decisions')
        .select('*')
        .eq('case_id', input.caseId)
        .order('created_at', { ascending: false });

      if (!input.includeHistory) {
        query = query.is('superseded_at', null);
      }

      const { data, error } = await query;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data || [];
    }),

  supersede: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
      supersededDecisionId: z.string().uuid(),
      decisionText: z.string().min(1),
      reasoning: z.string().optional(),
      alternativesConsidered: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      const { error: updateError } = await (supabaseAdmin as any)
        .from('case_decisions')
        .update({ superseded_at: new Date().toISOString() })
        .eq('id', input.supersededDecisionId)
        .eq('case_id', input.caseId);

      if (updateError) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: updateError.message });
      }

      const { data, error } = await (supabaseAdmin as any)
        .from('case_decisions')
        .insert({
          case_id: input.caseId,
          decision_text: input.decisionText.trim(),
          reasoning: input.reasoning?.trim() || null,
          alternatives_considered: input.alternativesConsidered?.trim() || null,
          supersedes_decision_id: input.supersededDecisionId,
          created_by: ctx.userId,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),
});
