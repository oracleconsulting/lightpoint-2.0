/**
 * Tribunal Case Law Ingestion Service
 *
 * Ingests FTT/UT tax tribunal decisions into appeal_precedents and knowledge_base.
 * Priority cases: Perrin, Rowland, Armitage, Jade Constructions, Loprestos, Archer.
 *
 * Full implementation would:
 * - Download decisions from gov.uk/tax-and-chancery-tribunal-decisions
 * - Extract text from PDFs
 * - Use Claude Sonnet to extract structured metadata
 *
 * This module provides the storage layer; PDF extraction is a separate concern.
 */

import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/embeddings';
import { logger } from '@/lib/logger';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(url, key);
}

export interface CaseLawInput {
  caseName: string;
  caseReference: string;
  tribunalLevel: 'FTT' | 'UT' | 'CoA' | 'SC';
  decisionDate?: string; // YYYY-MM-DD
  penaltyType?: string;
  groundType?: string;
  outcome?: 'appeal_allowed' | 'appeal_dismissed' | 'partially_allowed' | 'remitted';
  keyPrinciples: string[];
  summary: string;
  fullText?: string;
  citationFormat?: string;
}

export interface CaseLawIngestionResult {
  caseReference: string;
  appealPrecedentsId: string;
  knowledgeBaseId?: string;
  status: 'added' | 'updated' | 'error';
  error?: string;
}

/**
 * Ingest a single tribunal case into appeal_precedents and knowledge_base.
 */
export async function ingestCaseLaw(input: CaseLawInput): Promise<CaseLawIngestionResult> {
  const supabase = getSupabaseClient();

  const embeddingText = [
    input.caseName,
    input.summary,
    ...(input.keyPrinciples || []),
    input.penaltyType || '',
    input.groundType || '',
  ].filter(Boolean).join('\n');

  const embedding = await generateEmbedding(embeddingText);

  try {
    const precedentRecord = {
      case_name: input.caseName,
      case_reference: input.caseReference,
      tribunal_level: input.tribunalLevel,
      decision_date: input.decisionDate || null,
      penalty_type: input.penaltyType || null,
      ground_type: input.groundType || null,
      outcome: input.outcome || null,
      key_principles: input.keyPrinciples || [],
      summary: input.summary,
      full_text: input.fullText || null,
      citation_format: input.citationFormat || input.caseReference,
      embedding,
    };

    const { data: existing } = await supabase
      .from('appeal_precedents')
      .select('id')
      .eq('case_reference', input.caseReference)
      .maybeSingle();

    let precedentId: string | undefined;

    if (existing) {
      const { error: updateError } = await supabase
        .from('appeal_precedents')
        .update(precedentRecord)
        .eq('id', existing.id);
      if (updateError) {
        return {
          caseReference: input.caseReference,
          appealPrecedentsId: '',
          status: 'error',
          error: updateError.message,
        };
      }
      precedentId = existing.id;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('appeal_precedents')
        .insert(precedentRecord)
        .select('id')
        .single();

      if (insertError) {
        return {
          caseReference: input.caseReference,
          appealPrecedentsId: '',
          status: 'error',
          error: insertError.message,
        };
      }
      precedentId = inserted?.id;
    }

    // Also add to knowledge_base for unified search
    const kbContent = `${input.caseName}\n${input.summary}\n\nKey principles:\n${(input.keyPrinciples || []).join('\n')}`;
    const kbEmbedding = await generateEmbedding(kbContent);

    const kbRecord = {
      category: 'CaseLaw',
      title: input.caseName,
      content: kbContent,
      source: 'Tribunal Decision',
      source_url: null,
      source_verified_at: new Date().toISOString(),
      verification_status: 'verified',
      section_reference: input.caseReference,
      manual_code: 'CaseLaw',
      citation_format: input.citationFormat || input.caseReference,
      document_type: 'case_law',
      embedding: kbEmbedding,
      last_checked_at: new Date().toISOString(),
      metadata: { caseReference: input.caseReference },
    };

    const { data: kbRow } = await supabase
      .from('knowledge_base')
      .insert(kbRecord)
      .select('id')
      .single();

    logger.info(`Ingested case law: ${input.caseName} (${input.caseReference})`);
    return {
      caseReference: input.caseReference,
      appealPrecedentsId: precedentId || '',
      knowledgeBaseId: kbRow?.id,
      status: 'added',
    };
  } catch (e: any) {
    logger.error(`Case law ingestion error for ${input.caseReference}:`, e);
    return {
      caseReference: input.caseReference,
      appealPrecedentsId: '',
      status: 'error',
      error: e?.message || String(e),
    };
  }
}

/** Priority tribunal cases for reasonable excuse penalty appeals */
export const PRIORITY_CASES: Partial<CaseLawInput>[] = [
  { caseName: 'Christine Perrin v HMRC', caseReference: '[2018] UKFTT 156', tribunalLevel: 'FTT', keyPrinciples: ['Four-stage reasonable excuse test'] },
  { caseName: 'Rowland v HMRC', caseReference: '[2006] STC (SCD) 536', tribunalLevel: 'FTT', keyPrinciples: ['Objective reasonable excuse test'] },
  { caseName: 'Armitage v HMRC', caseReference: '[2014] UKFTT 823', tribunalLevel: 'FTT', keyPrinciples: ['Non-receipt of notices'] },
  { caseName: 'Jade Constructions Ltd v HMRC', caseReference: '[2014] UKFTT', tribunalLevel: 'FTT', keyPrinciples: ['HMRC IT failures'] },
  { caseName: 'Loprestos v HMRC', caseReference: '[2017] UKFTT', tribunalLevel: 'FTT', keyPrinciples: ['Third-party illness'] },
  { caseName: 'Archer v HMRC', caseReference: '[2023] UKFTT', tribunalLevel: 'FTT', keyPrinciples: ['Special reduction disproportionate penalties'] },
];
