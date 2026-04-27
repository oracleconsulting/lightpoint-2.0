// @ts-ignore - pdf-parse does not ship reliable types
import pdfParse from 'pdf-parse';
// @ts-ignore - mammoth does not ship reliable types in this setup
import mammoth from 'mammoth';
import { supabaseAdmin } from '@/lib/supabase/client';
import { anonymizePII } from '@/lib/privacy';
import { logger } from '@/lib/logger';
import { classifyDocument } from './documentClassification';
import { extractCaseMetadata } from './metadataExtraction';
import { detectAnomalies } from './anomalyDetection';
import { classifyTier } from './triage';

async function extractText(buffer: Buffer, fileName: string, mimeType?: string | null): Promise<string> {
  const lower = fileName.toLowerCase();
  if (mimeType?.includes('pdf') || lower.endsWith('.pdf')) {
    const parsed = await pdfParse(buffer);
    return parsed.text || '';
  }
  if (mimeType?.includes('wordprocessingml') || lower.endsWith('.docx')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  }
  if (mimeType?.startsWith('text/') || lower.endsWith('.txt') || lower.endsWith('.csv')) {
    return buffer.toString('utf8');
  }
  return `[Text extraction pending for ${fileName}. Phase 3 supports text-layer PDFs, DOCX, TXT and CSV. File is stored for manual review.]`;
}

export async function processUploadedDocument(documentId: string) {
  const { data: document, error: docError } = await (supabaseAdmin as any)
    .from('case_documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (docError || !document) throw docError || new Error('Document not found');

  await (supabaseAdmin as any)
    .from('case_documents')
    .update({ extraction_status: 'processing' })
    .eq('id', documentId);

  try {
    const { data: fileData, error: downloadError } = await (supabaseAdmin as any).storage
      .from('case-documents')
      .download(document.storage_path);

    if (downloadError || !fileData) throw downloadError || new Error('Stored file not found');

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const rawText = await extractText(buffer, document.file_name, document.mime_type);
    const extractedText = anonymizePII(rawText);
    const classification = classifyDocument(extractedText, document.file_name);
    const metadata = extractCaseMetadata(extractedText);

    const { data: existingEvents } = await (supabaseAdmin as any)
      .from('case_events')
      .select('event_date')
      .eq('case_id', document.case_id);

    const anomalies = detectAnomalies({
      text: extractedText,
      metadata,
      existingEvents: existingEvents || [],
    });

    if (anomalies.length) {
      await (supabaseAdmin as any)
        .from('case_anomalies')
        .insert(anomalies.map((anomaly) => ({
          case_id: document.case_id,
          anomaly_type: anomaly.anomalyType,
          description: anomaly.description,
          severity: anomaly.severity,
          metadata: anomaly.metadata || {},
        })));
    }

    const triage = classifyTier({ anomalies, metadata });
    await (supabaseAdmin as any)
      .from('cases')
      .update({
        tier: triage.tier,
        metadata: {
          last_intake_document_id: documentId,
          triage_flags: triage.flags,
        },
      })
      .eq('id', document.case_id);

    const extractedMetadata = {
      classification,
      ...metadata,
      anomalies,
      triage,
      confirmed: false,
    };

    const { data: updated, error: updateError } = await (supabaseAdmin as any)
      .from('case_documents')
      .update({
        document_type: classification.documentType,
        extraction_status: 'complete',
        extracted_text: extractedText,
        extracted_metadata: extractedMetadata,
      })
      .eq('id', documentId)
      .select()
      .single();

    if (updateError) throw updateError;
    return updated;
  } catch (error: any) {
    logger.error('Case document intake failed:', error);
    await (supabaseAdmin as any)
      .from('case_documents')
      .update({
        extraction_status: 'failed',
        extracted_metadata: {
          error: error?.message || 'Unknown intake failure',
        },
      })
      .eq('id', documentId);
    throw error;
  }
}
