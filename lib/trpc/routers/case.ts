import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { supabaseAdmin } from '@/lib/supabase/client';
import { ensureCaseAccess, requireOrg } from './caseUtils';
import { logger } from '../../logger';

const caseStatus = z.enum(['open', 'active', 'on_hold', 'closed']);
const caseTier = z.union([z.literal(1), z.literal(2), z.literal(3)]);

export const caseRouter = router({
  importFromComplaint: protectedProcedure
    .input(z.object({
      complaintId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);

      const { data: existingLink, error: linkLookupError } = await (supabaseAdmin as any)
        .from('case_complaint_links')
        .select('case_id')
        .eq('complaint_id', input.complaintId)
        .maybeSingle();

      if (linkLookupError) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: linkLookupError.message });
      }

      if (existingLink?.case_id) {
        await ensureCaseAccess(existingLink.case_id, organizationId);
        return { caseId: existingLink.case_id, created: false };
      }

      const { data: complaint, error: complaintError } = await (supabaseAdmin as any)
        .from('complaints')
        .select('*')
        .eq('id', input.complaintId)
        .eq('organization_id', organizationId)
        .single();

      if (complaintError || !complaint) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Complaint not found or access denied',
        });
      }

      const caseReference = `CASE-${complaint.complaint_reference || input.complaintId.slice(0, 8)}`;
      const { data: caseRecord, error: caseError } = await (supabaseAdmin as any)
        .from('cases')
        .insert({
          organization_id: organizationId,
          created_by: ctx.userId,
          case_reference: caseReference,
          title: `Workspace for ${complaint.complaint_reference || 'complaint'}`,
          client_name: complaint.client_name_encrypted || null,
          hmrc_reference: complaint.hmrc_reference || null,
          hmrc_department: complaint.hmrc_department || null,
          case_type: complaint.case_type || 'imported_complaint',
          status: complaint.status === 'closed' ? 'closed' : 'active',
          tier: 3,
          priority: complaint.status === 'escalated' ? 'high' : 'normal',
          summary: [
            `Imported from complaint ${complaint.complaint_reference || input.complaintId}.`,
            complaint.complaint_type ? `Complaint type: ${complaint.complaint_type}.` : null,
            complaint.complaint_context || null,
          ].filter(Boolean).join('\n'),
          metadata: {
            imported_from_complaint_id: input.complaintId,
            complaint_status: complaint.status,
            complaint_case_type: complaint.case_type || null,
          },
        })
        .select()
        .single();

      if (caseError || !caseRecord) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: caseError?.message || 'Failed to create case workspace',
        });
      }

      const timeline = Array.isArray(complaint.timeline) ? complaint.timeline : [];
      if (timeline.length) {
        await (supabaseAdmin as any)
          .from('case_events')
          .insert(timeline.map((event: any, index: number) => ({
            case_id: caseRecord.id,
            event_date: event.date ? new Date(event.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
            event_type: event.type || 'complaint_timeline',
            title: event.summary ? String(event.summary).slice(0, 120) : `Imported complaint event ${index + 1}`,
            description: event.notes || event.summary || JSON.stringify(event),
            source: 'complaint_import',
            metadata: {
              original_event: event,
              imported_from_complaint_id: input.complaintId,
            },
            created_by: ctx.userId,
          })));
      }

      const { data: documents } = await (supabaseAdmin as any)
        .from('documents')
        .select('*')
        .eq('complaint_id', input.complaintId);

      if (documents?.length) {
        await (supabaseAdmin as any)
          .from('case_documents')
          .insert(documents.map((document: any) => ({
            case_id: caseRecord.id,
            file_name: document.filename || document.file_name || 'Imported complaint document',
            storage_path: document.file_path || document.storage_path || `complaint-import/${input.complaintId}/${document.id}`,
            mime_type: document.mime_type || null,
            file_size: document.file_size || null,
            document_type: document.document_type || null,
            extraction_status: document.processed_data ? 'complete' : 'pending',
            extracted_text: document.extracted_text || document.processed_data?.text || document.processed_data?.anonymized_text || null,
            extracted_metadata: {
              imported_from_document_id: document.id,
              processed_data: document.processed_data || null,
            },
            uploaded_by: ctx.userId,
          })));
      }

      const { data: letters } = await (supabaseAdmin as any)
        .from('generated_letters')
        .select('*')
        .eq('complaint_id', input.complaintId)
        .order('created_at', { ascending: true });

      if (letters?.length) {
        await (supabaseAdmin as any)
          .from('case_outputs')
          .insert(letters.map((letter: any) => ({
            case_id: caseRecord.id,
            output_type: letter.letter_type || 'complaint_letter',
            title: `Imported ${String(letter.letter_type || 'letter').replace(/_/g, ' ')}`,
            content: letter.letter_content || null,
            status: 'draft',
            metadata: {
              imported_from_letter_id: letter.id,
              imported_from_complaint_id: input.complaintId,
            },
            created_by: ctx.userId,
          })));
      }

      const { error: linkError } = await (supabaseAdmin as any)
        .from('case_complaint_links')
        .insert({
          case_id: caseRecord.id,
          complaint_id: input.complaintId,
          link_type: 'imported_from',
        });

      if (linkError) {
        logger.error('Failed to link imported complaint to case:', linkError);
      }

      return { caseId: caseRecord.id, created: true };
    }),

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
