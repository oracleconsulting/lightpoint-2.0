import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { supabaseAdmin } from '@/lib/supabase/client';
import { ensureCaseAccess, requireOrg } from './caseUtils';
import { logger } from '../../logger';

const caseStatus = z.enum(['open', 'active', 'on_hold', 'closed']);
const caseTier = z.union([z.literal(1), z.literal(2), z.literal(3)]);

function safeDate(value: unknown): string {
  const date = value ? new Date(String(value)) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function stringifyContext(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function throwIfSupabaseError(error: any, action: string): void {
  if (error) {
    logger.error(`Case workspace sync failed during ${action}:`, error);
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `${action} failed: ${error.message || JSON.stringify(error)}`,
    });
  }
}

async function syncComplaintIntoCase(caseId: string, complaint: any, userId: string | null) {
  const complaintId = complaint.id;

  const syncStats = {
    eventsImported: 0,
    documentsImported: 0,
    outputsImported: 0,
    analysisImported: false,
  };

  const { error: caseUpdateError } = await (supabaseAdmin as any)
    .from('cases')
    .update({
      summary: [
        `Imported from complaint ${complaint.complaint_reference || complaintId}.`,
        complaint.complaint_type ? `Complaint type: ${complaint.complaint_type}.` : null,
        complaint.complaint_context || null,
      ].filter(Boolean).join('\n'),
      metadata: {
        imported_from_complaint_id: complaintId,
        complaint_status: complaint.status,
        complaint_case_type: complaint.case_type || null,
        complaint_analysis_completed_at: complaint.analysis_completed_at || null,
        last_import_sync_at: new Date().toISOString(),
      },
    })
    .eq('id', caseId);
  throwIfSupabaseError(caseUpdateError, 'updating case import metadata');

  const { error: deleteEventsError } = await (supabaseAdmin as any)
    .from('case_events')
    .delete()
    .eq('case_id', caseId)
    .eq('source', 'manual')
    .contains('metadata', { imported_from_complaint_id: complaintId });
  throwIfSupabaseError(deleteEventsError, 'clearing previous imported timeline events');

  const timeline = Array.isArray(complaint.timeline) ? complaint.timeline : [];
  const importedEvents = [
    {
      case_id: caseId,
      event_date: safeDate(complaint.created_at),
      event_type: 'note',
      title: `Imported complaint ${complaint.complaint_reference || complaintId}`,
      description: [
        complaint.complaint_context || null,
        complaint.analysis ? `Analysis available. Summary: ${String(stringifyContext(complaint.analysis)).slice(0, 1500)}` : null,
      ].filter(Boolean).join('\n\n') || 'Complaint imported into the case workspace for discussion.',
      source: 'manual',
      metadata: {
        imported_from_complaint_id: complaintId,
        original_source: 'complaint_import',
        original_event_type: 'complaint_imported',
      },
      created_by: userId,
    },
    ...timeline.map((event: any, index: number) => ({
      case_id: caseId,
      event_date: safeDate(event.date),
      event_type: 'note',
      title: event.summary ? String(event.summary).slice(0, 120) : `Imported complaint event ${index + 1}`,
      description: event.notes || event.summary || JSON.stringify(event),
      source: 'manual',
      metadata: {
        original_event: event,
        original_source: 'complaint_import',
        original_event_type: event.type || 'complaint_timeline',
        imported_from_complaint_id: complaintId,
      },
      created_by: userId,
    })),
    ...(complaint.complaint_context ? [{
      case_id: caseId,
      event_date: safeDate(complaint.created_at),
      event_type: 'note',
      title: 'Original complaint context',
      description: complaint.complaint_context,
      source: 'manual',
      metadata: {
        imported_from_complaint_id: complaintId,
        original_source: 'complaint_import',
        original_event_type: 'complaint_context',
      },
      created_by: userId,
    }] : []),
  ];

  if (importedEvents.length) {
    const { error: eventsError } = await (supabaseAdmin as any).from('case_events').insert(importedEvents);
    throwIfSupabaseError(eventsError, 'importing complaint timeline events');
    syncStats.eventsImported = importedEvents.length;
  }

  const { data: existingDocs, error: existingDocsError } = await (supabaseAdmin as any)
    .from('case_documents')
    .select('id, extracted_metadata')
    .eq('case_id', caseId);
  throwIfSupabaseError(existingDocsError, 'checking existing imported documents');
  const existingDocImports = new Set(
    (existingDocs || []).map((doc: any) => doc.extracted_metadata?.imported_from_document_id || doc.extracted_metadata?.imported_virtual_document)
  );

  const { data: documents, error: documentsError } = await (supabaseAdmin as any)
    .from('documents')
    .select('*')
    .eq('complaint_id', complaintId);
  throwIfSupabaseError(documentsError, 'loading complaint documents');

  const docsToInsert = (documents || [])
    .filter((document: any) => !existingDocImports.has(document.id))
    .map((document: any) => {
      const processed = document.processed_data || {};
      const extractedText =
        document.extracted_text ||
        processed.text ||
        processed.anonymized_text ||
        processed.detailed_analysis ||
        stringifyContext(processed) ||
        null;

      return {
        case_id: caseId,
        file_name: document.filename || document.file_name || 'Imported complaint document',
        storage_path: document.file_path || document.storage_path || `complaint-import/${complaintId}/${document.id}`,
        mime_type: document.mime_type || null,
        file_size: document.file_size || null,
        document_type: document.document_type || null,
        extraction_status: extractedText ? 'complete' : 'pending',
        extracted_text: extractedText,
        extracted_metadata: {
          imported_from_complaint_id: complaintId,
          imported_from_document_id: document.id,
          processed_data: processed || null,
        },
        uploaded_by: userId,
      };
    });

  if (complaint.analysis && !existingDocImports.has('complaint_analysis')) {
    docsToInsert.push({
      case_id: caseId,
      file_name: 'Imported complaint analysis',
      storage_path: `complaint-import/${complaintId}/analysis.json`,
      mime_type: 'application/json',
      file_size: null,
      document_type: 'complaint_analysis',
      extraction_status: 'complete',
      extracted_text: stringifyContext(complaint.analysis),
      extracted_metadata: {
        imported_from_complaint_id: complaintId,
        imported_virtual_document: 'complaint_analysis',
        analysis_completed_at: complaint.analysis_completed_at || null,
      },
      uploaded_by: userId,
    });
    syncStats.analysisImported = true;
  }

  if (docsToInsert.length) {
    const { error: docsError } = await (supabaseAdmin as any).from('case_documents').insert(docsToInsert);
    throwIfSupabaseError(docsError, 'importing complaint documents and analysis');
    syncStats.documentsImported = docsToInsert.length;
  }

  const { data: existingOutputs, error: existingOutputsError } = await (supabaseAdmin as any)
    .from('case_outputs')
    .select('id, metadata')
    .eq('case_id', caseId);
  throwIfSupabaseError(existingOutputsError, 'checking existing imported outputs');
  const existingLetterImports = new Set(
    (existingOutputs || []).map((output: any) => output.metadata?.imported_from_letter_id)
  );

  const { data: letters, error: lettersError } = await (supabaseAdmin as any)
    .from('generated_letters')
    .select('*')
    .eq('complaint_id', complaintId)
    .order('created_at', { ascending: true });
  throwIfSupabaseError(lettersError, 'loading generated complaint letters');

  const outputsToInsert = (letters || [])
    .filter((letter: any) => !existingLetterImports.has(letter.id))
    .map((letter: any) => ({
      case_id: caseId,
      output_type: letter.letter_type || 'complaint_letter',
      title: `Imported ${String(letter.letter_type || 'letter').replace(/_/g, ' ')}`,
      content: letter.letter_content || null,
      status: 'draft',
      metadata: {
        imported_from_letter_id: letter.id,
        imported_from_complaint_id: complaintId,
      },
      created_by: userId,
    }));

  if (outputsToInsert.length) {
    const { error: outputsError } = await (supabaseAdmin as any).from('case_outputs').insert(outputsToInsert);
    throwIfSupabaseError(outputsError, 'importing generated letters');
    syncStats.outputsImported = outputsToInsert.length;
  }

  return syncStats;
}

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

      if (existingLink?.case_id) {
        await ensureCaseAccess(existingLink.case_id, organizationId);
        const sync = await syncComplaintIntoCase(existingLink.case_id, complaint, ctx.userId);
        return { caseId: existingLink.case_id, created: false, synced: true, sync };
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

      const sync = await syncComplaintIntoCase(caseRecord.id, complaint, ctx.userId);

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

      return { caseId: caseRecord.id, created: true, sync };
    }),

  syncFromLinkedComplaint: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      const { data: link, error: linkError } = await (supabaseAdmin as any)
        .from('case_complaint_links')
        .select('complaint_id')
        .eq('case_id', input.caseId)
        .maybeSingle();

      if (linkError) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: linkError.message });
      }

      let complaintId = link?.complaint_id;
      if (!complaintId) {
        const { data: caseRecord, error: caseError } = await (supabaseAdmin as any)
          .from('cases')
          .select('metadata')
          .eq('id', input.caseId)
          .eq('organization_id', organizationId)
          .single();

        if (caseError) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: caseError.message });
        }
        complaintId = caseRecord?.metadata?.imported_from_complaint_id;
      }

      if (!complaintId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No linked complaint found for this workspace' });
      }

      const { data: complaint, error: complaintError } = await (supabaseAdmin as any)
        .from('complaints')
        .select('*')
        .eq('id', complaintId)
        .eq('organization_id', organizationId)
        .single();

      if (complaintError || !complaint) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Linked complaint not found or access denied' });
      }

      const sync = await syncComplaintIntoCase(input.caseId, complaint, ctx.userId);

      if (!link?.complaint_id) {
        await (supabaseAdmin as any)
          .from('case_complaint_links')
          .upsert({
            case_id: input.caseId,
            complaint_id: complaintId,
            link_type: 'imported_from',
          }, { onConflict: 'case_id,complaint_id' });
      }

      return { success: true, complaintId, sync };
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

  delete: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input, organizationId);

      const { error } = await (supabaseAdmin as any)
        .from('cases')
        .delete()
        .eq('id', input)
        .eq('organization_id', organizationId);

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return { success: true };
    }),
});
