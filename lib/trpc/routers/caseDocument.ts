import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { supabaseAdmin } from '@/lib/supabase/client';
import { ensureCaseAccess, requireOrg } from './caseUtils';

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
      return data;
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
});
