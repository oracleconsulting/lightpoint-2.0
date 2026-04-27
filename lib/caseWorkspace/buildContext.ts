import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '@/lib/supabase/client';

export interface WorkspaceContext {
  case: any;
  events: any[];
  parties: any[];
  documents: any[];
  research: any[];
  decisions: any[];
  anomalies: any[];
  outputs: any[];
  narrative: {
    timeline: string;
    parties: string;
    documents: string;
    decisions: string;
    anomalies: string;
    verifiedResearch: string;
  };
}

function formatDate(value: string | null | undefined): string {
  if (!value) return 'No date';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function asArray<T = any>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export async function buildWorkspaceContext(caseId: string): Promise<WorkspaceContext> {
  const { data, error } = await (supabaseAdmin as any)
    .rpc('get_case_workspace', { case_id_param: caseId });

  if (error || !data?.case) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: error?.message || 'Case workspace not found',
    });
  }

  const events = asArray(data.events);
  const parties = asArray(data.parties);
  const documents = asArray(data.documents);
  const research = asArray(data.research);
  const decisions = asArray(data.decisions);
  const anomalies = asArray(data.anomalies);
  const outputs = asArray(data.outputs);

  const timeline = events.length
    ? events.map((event) => {
      const status = event.deadline_status ? ` [deadline: ${event.deadline_status}]` : '';
      const authority = event.statutory_authority ? ` (${event.statutory_authority})` : '';
      return `- ${formatDate(event.event_date)}: ${event.title}${status}${authority}. ${event.description || ''}`.trim();
    }).join('\n')
    : 'No timeline events recorded.';

  const groupedParties = parties.reduce<Record<string, string[]>>((acc, party) => {
    const role = party.role || 'other';
    acc[role] = acc[role] || [];
    acc[role].push(`${party.name}${party.organisation ? ` (${party.organisation})` : ''}`);
    return acc;
  }, {});

  const verifiedResearch = research
    .filter((item) => item.verification_status === 'verified')
    .map((item) => `- ${item.title}${item.citation ? `, ${item.citation}` : ''}: ${item.proposition || 'No proposition recorded.'}`)
    .join('\n') || 'No verified research recorded.';

  return {
    case: data.case,
    events,
    parties,
    documents,
    research,
    decisions,
    anomalies,
    outputs,
    narrative: {
      timeline,
      parties: Object.keys(groupedParties).length
        ? Object.entries(groupedParties).map(([role, names]) => `${role}: ${names.join(', ')}`).join('\n')
        : 'No parties recorded.',
      documents: documents.length
        ? documents.map((doc) => `- ${doc.file_name || doc.document_name || 'Document'}: ${doc.extraction_status}${doc.extracted_text ? `; summary text available (${String(doc.extracted_text).slice(0, 400)})` : '; extraction pending'}`).join('\n')
        : 'No documents uploaded.',
      decisions: decisions.length
        ? decisions.map((decision) => `- ${formatDate(decision.created_at)}: ${decision.decision_text}. Reasoning: ${decision.reasoning || 'Not recorded.'}`).join('\n')
        : 'No active decisions recorded.',
      anomalies: anomalies.length
        ? anomalies.map((anomaly) => `- ${anomaly.severity.toUpperCase()}: ${anomaly.anomaly_type} - ${anomaly.description}`).join('\n')
        : 'No unacknowledged anomalies.',
      verifiedResearch,
    },
  };
}
