import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '@/lib/supabase/client';

const groundTypeSchema = z.enum([
  'reasonable_excuse', 'special_circumstances',
  'procedural_error', 'statutory_defence', 'proportionality',
]);

const strengthSchema = z.enum(['strong', 'moderate', 'weak', 'untested']);

const penaltyTypeSchema = z.enum([
  'late_filing', 'late_payment', 'inaccuracy',
  'failure_to_notify', 'rti_late_filing', 'vat_default_surcharge',
  'vat_error_penalty', 'cis_penalty', 'other',
]);

const appealStatusSchema = z.enum([
  'pending', 'filed', 'under_review', 'upheld', 'cancelled',
  'partially_cancelled', 'referred_to_tribunal',
]);

export const appealsRouter = router({
  listGrounds: protectedProcedure
    .input(z.object({ complaintId: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('appeal_grounds')
        .select('*')
        .eq('complaint_id', input.complaintId)
        .order('created_at', { ascending: true });
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  addGround: protectedProcedure
    .input(z.object({
      complaintId: z.string(),
      groundType: groundTypeSchema,
      statuteReference: z.string(),
      description: z.string(),
      supportingEvidence: z.any().optional(),
      strengthAssessment: strengthSchema.optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('appeal_grounds')
        .insert({
          complaint_id: input.complaintId,
          ground_type: input.groundType,
          statute_reference: input.statuteReference,
          description: input.description,
          supporting_evidence: input.supportingEvidence || null,
          strength_assessment: input.strengthAssessment || null,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  updateGround: protectedProcedure
    .input(z.object({
      id: z.string(),
      groundType: groundTypeSchema.optional(),
      statuteReference: z.string().optional(),
      description: z.string().optional(),
      supportingEvidence: z.any().optional(),
      strengthAssessment: strengthSchema.optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.groundType !== undefined) updatePayload.ground_type = updates.groundType;
      if (updates.statuteReference !== undefined) updatePayload.statute_reference = updates.statuteReference;
      if (updates.description !== undefined) updatePayload.description = updates.description;
      if (updates.supportingEvidence !== undefined) updatePayload.supporting_evidence = updates.supportingEvidence;
      if (updates.strengthAssessment !== undefined) updatePayload.strength_assessment = updates.strengthAssessment;

      const { data, error } = await (supabaseAdmin as any)
        .from('appeal_grounds')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  removeGround: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { error } = await supabaseAdmin
        .from('appeal_grounds')
        .delete()
        .eq('id', input.id);
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return { success: true };
    }),

  listPenalties: protectedProcedure
    .input(z.object({ complaintId: z.string() }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('penalty_assessments')
        .select('*')
        .eq('complaint_id', input.complaintId)
        .order('created_at', { ascending: true });
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  addPenalty: protectedProcedure
    .input(z.object({
      complaintId: z.string(),
      penaltyType: penaltyTypeSchema,
      penaltyRegime: z.string(),
      penaltyAmount: z.number().optional(),
      taxYear: z.string().optional(),
      taxType: z.string().optional(),
      penaltyNoticeDate: z.string().optional(),
      penaltyReference: z.string().optional(),
      appealDeadline: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('penalty_assessments')
        .insert({
          complaint_id: input.complaintId,
          penalty_type: input.penaltyType,
          penalty_regime: input.penaltyRegime,
          penalty_amount: input.penaltyAmount ?? null,
          tax_year: input.taxYear ?? null,
          tax_type: input.taxType ?? null,
          penalty_notice_date: input.penaltyNoticeDate ?? null,
          penalty_reference: input.penaltyReference ?? null,
          appeal_deadline: input.appealDeadline ?? null,
          appeal_status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  updatePenalty: protectedProcedure
    .input(z.object({
      id: z.string(),
      penaltyAmount: z.number().optional(),
      taxYear: z.string().optional(),
      appealDeadline: z.string().optional(),
      appealFiledDate: z.string().optional(),
      hmrcReviewRequested: z.boolean().optional(),
      hmrcReviewDate: z.string().optional(),
      hmrcReviewOutcome: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...rest } = input;
      const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      const map: Record<string, string> = {
        penaltyAmount: 'penalty_amount',
        taxYear: 'tax_year',
        appealDeadline: 'appeal_deadline',
        appealFiledDate: 'appeal_filed_date',
        hmrcReviewRequested: 'hmrc_review_requested',
        hmrcReviewDate: 'hmrc_review_date',
        hmrcReviewOutcome: 'hmrc_review_outcome',
      };
      for (const [k, dbKey] of Object.entries(map)) {
        if ((rest as any)[k] !== undefined) updatePayload[dbKey] = (rest as any)[k];
      }

      const { data, error } = await (supabaseAdmin as any)
        .from('penalty_assessments')
        .update(updatePayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  updatePenaltyStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      appealStatus: appealStatusSchema,
      appealFiledDate: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const updatePayload: Record<string, unknown> = {
        appeal_status: input.appealStatus,
        updated_at: new Date().toISOString(),
      };
      if (input.appealFiledDate) updatePayload.appeal_filed_date = input.appealFiledDate;

      const { data, error } = await (supabaseAdmin as any)
        .from('penalty_assessments')
        .update(updatePayload)
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),

  searchPrecedents: protectedProcedure
    .input(z.object({
      query: z.string().optional(),
      penaltyType: z.string().optional(),
      groundType: z.string().optional(),
      limit: z.number().optional().default(10),
    }))
    .query(async ({ input }) => {
      let q = supabaseAdmin
        .from('appeal_precedents')
        .select('id, case_name, case_reference, tribunal_level, outcome, summary')
        .limit(input.limit);
      if (input.penaltyType) q = q.eq('penalty_type', input.penaltyType);
      if (input.groundType) q = q.eq('ground_type', input.groundType);
      if (input.query && input.query.trim()) {
        q = q.ilike('summary', `%${input.query.trim()}%`);
      }
      const { data, error } = await q;
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }),
});
