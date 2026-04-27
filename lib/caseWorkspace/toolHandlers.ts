import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { searchKnowledgeBaseMultiAngle } from '@/lib/vectorSearch';
import type { StructuredOutput } from './structuredOutputs';
import { verifyCitation } from '@/lib/citationVerification/verifier';
import { extractCitationsFromText } from '@/lib/citationVerification/parser';

export async function searchWorkspaceKnowledge(query: string) {
  return searchKnowledgeBaseMultiAngle(query, 0.72, 6);
}

export async function commitStructuredOutput(
  caseId: string,
  output: StructuredOutput,
  userId: string
) {
  switch (output.type) {
    case 'capture_decision': {
      const { data, error } = await (supabaseAdmin as any)
        .from('case_decisions')
        .insert({
          case_id: caseId,
          decision_text: output.decisionText,
          reasoning: output.reasoning,
          alternatives_considered: output.alternativesConsidered || null,
          created_by: userId,
        })
        .select()
        .single();
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }
    case 'flag_anomaly': {
      const { data, error } = await (supabaseAdmin as any)
        .from('case_anomalies')
        .insert({
          case_id: caseId,
          anomaly_type: output.anomalyType,
          description: output.description,
          severity: output.severity,
        })
        .select()
        .single();
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }
    case 'propose_research': {
      const citation = extractCitationsFromText(`${output.query}\n${output.reasoning}`)[0];
      const verification = citation
        ? await verifyCitation(citation.raw, output.query)
        : null;
      const { data, error } = await (supabaseAdmin as any)
        .from('case_research')
        .insert({
          case_id: caseId,
          title: output.query,
          proposition: output.reasoning,
          citation: verification?.citation || null,
          source_url: verification?.sourceUrl || null,
          verification_status: verification?.status || 'pending',
          verification_notes: verification?.notes || 'No citation found in proposal; verification pending manual research.',
          created_by: userId,
        })
        .select()
        .single();
      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return data;
    }
    case 'propose_workspace_update':
    case 'propose_draft':
      return {
        accepted: true,
        note: 'Proposal acknowledged. Phase 2 records it in conversation history; direct workspace mutation is intentionally limited.',
      };
    default:
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unsupported structured output type' });
  }
}
