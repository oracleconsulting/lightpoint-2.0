import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { supabaseAdmin } from '@/lib/supabase/client';
import { ensureCaseAccess, requireOrg } from './caseUtils';
import { generateOutput } from '@/lib/caseWorkspace/outputGeneration';
import { OUTPUT_TEMPLATES } from '@/lib/caseWorkspace/outputTemplates';

const outputTypeSchema = z.enum(Object.keys(OUTPUT_TEMPLATES) as [keyof typeof OUTPUT_TEMPLATES, ...(keyof typeof OUTPUT_TEMPLATES)[]]);

export const caseOutputRouter = router({
  generate: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
      outputType: outputTypeSchema,
      title: z.string().optional(),
      instructions: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);
      return generateOutput(input.caseId, input.outputType, {
        title: input.title,
        instructions: input.instructions,
        userId: ctx.userId,
      });
    }),

  list: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input, organizationId);
      const { data, error } = await (supabaseAdmin as any)
        .from('case_outputs')
        .select('*')
        .eq('case_id', input)
        .order('created_at', { ascending: false });
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data || [];
    }),

  get: protectedProcedure
    .input(z.object({ caseId: z.string().uuid(), outputId: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);
      const { data, error } = await (supabaseAdmin as any)
        .from('case_outputs')
        .select('*')
        .eq('case_id', input.caseId)
        .eq('id', input.outputId)
        .single();
      if (error) throw new TRPCError({ code: 'NOT_FOUND', message: error.message });
      return data;
    }),

  export: protectedProcedure
    .input(z.object({ caseId: z.string().uuid(), outputId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);
      const { data, error } = await (supabaseAdmin as any)
        .from('case_outputs')
        .select('storage_path')
        .eq('case_id', input.caseId)
        .eq('id', input.outputId)
        .single();
      if (error || !data?.storage_path) throw new TRPCError({ code: 'NOT_FOUND', message: 'Output file not found' });
      const signed = await (supabaseAdmin as any).storage
        .from('case-documents')
        .createSignedUrl(data.storage_path, 60);
      if (signed.error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: signed.error.message });
      return signed.data;
    }),

  regenerate: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
      outputType: outputTypeSchema,
      feedback: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);
      return generateOutput(input.caseId, input.outputType, {
        instructions: input.feedback,
        userId: ctx.userId,
      });
    }),
});
