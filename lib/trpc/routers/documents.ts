import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/client';
import { processDocument } from '@/lib/documentProcessor';
import { logger } from '../../logger';

export const documentsRouter = router({
  list: protectedProcedure
    .input(z.string()) // complaintId
    .query(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('documents')
        .select('*')
        .eq('complaint_id', input)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data;
    }),

  getSignedUrl: protectedProcedure
    .input(z.string()) // file_path
    .query(async ({ input }) => {
      logger.info('📎 Getting signed URL for:', input);
      
      const { data, error } = await supabaseAdmin.storage
        .from('complaint-documents')
        .createSignedUrl(input, 3600); // 1 hour expiry
      
      if (error) {
        logger.error('❌ Signed URL error:', error);
        throw new Error(`Failed to get signed URL: ${error.message}`);
      }
      
      logger.info('✅ Signed URL generated');
      return { signedUrl: data.signedUrl };
    }),

  retryOCR: protectedProcedure
    .input(z.object({
      documentId: z.string(),
      filePath: z.string(),
    }))
    .mutation(async ({ input }) => {
      logger.info('🔄 Retrying OCR for document:', input.documentId);
      
      // Get signed URL for the file
      const { data: urlData, error: urlError } = await supabaseAdmin.storage
        .from('complaint-documents')
        .createSignedUrl(input.filePath, 3600);
      
      if (urlError) {
        throw new Error(`Failed to get file URL: ${urlError.message}`);
      }
      
      // Fetch the file
      const response = await fetch(urlData.signedUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch document');
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Get the document to find complaintId
      const { data: doc, error: docError } = await (supabaseAdmin as any)
        .from('documents')
        .select('complaint_id, document_type')
        .eq('id', input.documentId)
        .single();
      
      if (docError) throw new Error(`Failed to get document: ${docError.message}`);
      
      // Re-process document with correct signature
      const result = await processDocument(
        buffer, 
        doc.complaint_id, 
        doc.document_type || 'evidence',
        input.filePath
      );
      
      // Update document with new processed data
      const { error: updateError } = await (supabaseAdmin as any)
        .from('documents')
        .update({
          processed_data: result,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.documentId);
      
      if (updateError) {
        throw new Error(`Failed to update document: ${updateError.message}`);
      }
      
      logger.info('✅ OCR retry complete');
      return { success: true, extractedText: result.processed_data?.extractedText || 'Text extracted' };
    }),
});

