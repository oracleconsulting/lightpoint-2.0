import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { supabaseAdmin } from '@/lib/supabase/client';
import { ensureCaseAccess, requireOrg } from './caseUtils';

const partyInput = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  organisation: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

export const casePartyRouter = router({
  create: protectedProcedure
    .input(partyInput.extend({ caseId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      const { data, error } = await (supabaseAdmin as any)
        .from('case_parties')
        .insert({
          case_id: input.caseId,
          name: input.name.trim(),
          role: input.role,
          organisation: input.organisation?.trim() || null,
          email: input.email?.trim() || null,
          phone: input.phone?.trim() || null,
          notes: input.notes?.trim() || null,
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
        .from('case_parties')
        .select('*')
        .eq('case_id', input)
        .order('role', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data || [];
    }),

  update: protectedProcedure
    .input(partyInput.partial().extend({
      id: z.string().uuid(),
      caseId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      const updates: Record<string, unknown> = {};
      if (input.name !== undefined) updates.name = input.name.trim();
      if (input.role !== undefined) updates.role = input.role;
      if (input.organisation !== undefined) updates.organisation = input.organisation?.trim() || null;
      if (input.email !== undefined) updates.email = input.email?.trim() || null;
      if (input.phone !== undefined) updates.phone = input.phone?.trim() || null;
      if (input.notes !== undefined) updates.notes = input.notes?.trim() || null;

      const { data, error } = await (supabaseAdmin as any)
        .from('case_parties')
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
        .from('case_parties')
        .delete()
        .eq('id', input.id)
        .eq('case_id', input.caseId);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { success: true };
    }),
});
