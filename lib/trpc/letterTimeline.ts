/**
 * Shared helper to append a letter_generated entry to complaints.timeline
 * after any successful insert into generated_letters.
 */

import { supabaseAdmin } from '@/lib/supabase/client';

const LETTER_TYPE_LABELS: Record<string, string> = {
  initial_complaint: 'Initial Complaint Letter',
  rebuttal: 'Rebuttal Letter',
  tier2_escalation: 'Tier 2 Escalation Letter',
  upheld_response: 'Upheld Response & Invoice Acceptance',
  chase: 'Progress Chase Letter',
  delayed_response: 'Delayed Response Follow-Up',
  inadequate_response: 'Inadequate Response Follow-Up',
  adjudicator_escalation: 'Adjudicator Escalation Letter',
  acknowledgement: 'Acknowledgement Letter',
  penalty_appeal: 'Penalty Appeal Letter',
  penalty_appeal_follow_up: 'Penalty Appeal Follow-Up',
  statutory_review_request: 'Statutory Review Request',
  tribunal_appeal_notice: 'Tribunal Appeal Notice',
  tribunal_appeal_grounds: 'Tribunal Appeal Grounds',
};

function humanReadableLetterType(letterType: string): string {
  return LETTER_TYPE_LABELS[letterType] ?? letterType;
}

export async function writeLetterToTimeline(
  complaintId: string,
  letterId: string,
  letterType: string
): Promise<void> {
  const { data: complaint, error: fetchError } = await (supabaseAdmin as any)
    .from('complaints')
    .select('timeline')
    .eq('id', complaintId)
    .single();

  if (fetchError || !complaint) return;

  const timeline = Array.isArray(complaint.timeline) ? [...complaint.timeline] : [];
  const summary = `${humanReadableLetterType(letterType)} generated`;
  timeline.push({
    date: new Date().toISOString(),
    type: 'letter_generated',
    summary,
    letter_id: letterId,
    letter_type: letterType,
  });

  await (supabaseAdmin as any)
    .from('complaints')
    .update({
      timeline,
      updated_at: new Date().toISOString(),
    })
    .eq('id', complaintId);
}
