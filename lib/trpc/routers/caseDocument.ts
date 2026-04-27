import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { supabaseAdmin } from '@/lib/supabase/client';
import { ensureCaseAccess, requireOrg } from './caseUtils';
import { processUploadedDocument } from '@/lib/caseWorkspace/documentIntake';

export const caseDocumentRouter = router({
  createRecord: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
      fileName: z.string().min(1),
      storagePath: z.string().min(1),
      mimeType: z.string().optional(),
      fileSize: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      const { data, error } = await (supabaseAdmin as any)
        .from('case_documents')
        .insert({
          case_id: input.caseId,
          file_name: input.fileName,
          storage_path: input.storagePath,
          mime_type: input.mimeType || null,
          file_size: input.fileSize || null,
          extraction_status: 'pending',
          uploaded_by: ctx.userId,
        })
        .select()
        .single();

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      try {
        return await processUploadedDocument(data.id);
      } catch {
        return data;
      }
    }),

  list: protectedProcedure
    .input(z.string().uuid())
    .query(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input, organizationId);

      const { data, error } = await (supabaseAdmin as any)
        .from('case_documents')
        .select('*')
        .eq('case_id', input)
        .order('uploaded_at', { ascending: false });

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data || [];
    }),

  reprocess: protectedProcedure
    .input(z.object({
      documentId: z.string().uuid(),
      caseId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);
      return processUploadedDocument(input.documentId);
    }),

  confirmExtraction: protectedProcedure
    .input(z.object({
      documentId: z.string().uuid(),
      caseId: z.string().uuid(),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      const { data: document, error } = await (supabaseAdmin as any)
        .from('case_documents')
        .select('*')
        .eq('id', input.documentId)
        .eq('case_id', input.caseId)
        .single();

      if (error || !document) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
      }

      const metadata = document.extracted_metadata || {};
      const proposedEvents = Array.isArray(metadata.proposedEvents) ? metadata.proposedEvents : [];
      const proposedParties = Array.isArray(metadata.proposedParties) ? metadata.proposedParties : [];

      if (proposedEvents.length) {
        await (supabaseAdmin as any)
          .from('case_events')
          .insert(proposedEvents.map((event: any) => ({
            case_id: input.caseId,
            event_date: event.eventDate,
            event_type: event.eventType || 'document_date',
            title: event.title,
            description: event.description,
            deadline_status: event.deadlineStatus || null,
            statutory_authority: event.statutoryAuthority || null,
            source: 'document_intake',
            created_by: ctx.userId,
          })));
      }

      if (proposedParties.length) {
        await (supabaseAdmin as any)
          .from('case_parties')
          .insert(proposedParties.map((party: any) => ({
            case_id: input.caseId,
            name: party.name,
            role: party.role || 'other',
            organisation: party.organisation || null,
            notes: party.notes || 'Confirmed from document intake',
          })));
      }

      const { data: updated, error: updateError } = await (supabaseAdmin as any)
        .from('case_documents')
        .update({
          extracted_metadata: {
            ...metadata,
            confirmed: true,
            confirmed_at: new Date().toISOString(),
          },
        })
        .eq('id', input.documentId)
        .select()
        .single();

      if (updateError) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: updateError.message });
      }

      return updated;
    }),
});
