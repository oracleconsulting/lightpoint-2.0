import { supabaseAdmin } from '@/lib/supabase/client';
import { parseCitation } from './parser';
import { fetchFromBailii } from './bailiiClient';

export interface VerificationResult {
  citation: string;
  status: 'verified' | 'manual_check_required' | 'failed';
  sourceUrl?: string;
  fetchedCaseName?: string;
  notes: string;
  cached?: boolean;
}

function normalise(value?: string): string {
  return (value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export async function verifyCitation(citation: string, claimedCaseName?: string): Promise<VerificationResult> {
  const parsed = parseCitation(citation);
  if (!parsed) {
    return {
      citation,
      status: 'failed',
      notes: 'Citation could not be parsed.',
    };
  }

  const { data: cached } = await (supabaseAdmin as any)
    .from('citation_verification_cache')
    .select('*')
    .eq('citation', parsed.raw)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (cached) {
    return {
      citation: parsed.raw,
      status: cached.verification_status,
      sourceUrl: cached.source_url,
      fetchedCaseName: cached.fetched_case_name,
      notes: cached.verification_notes || 'Loaded from verification cache.',
      cached: true,
    };
  }

  const bailii = await fetchFromBailii(parsed);
  let status: VerificationResult['status'] = 'failed';
  let notes = bailii.error || 'Citation was not found on BAILII.';

  if (bailii.found) {
    status = 'verified';
    notes = 'Citation resolved on BAILII.';
    if (claimedCaseName && bailii.caseName) {
      const claimed = normalise(claimedCaseName);
      const fetched = normalise(bailii.caseName);
      if (claimed && fetched && !fetched.includes(claimed) && !claimed.includes(fetched)) {
        status = 'manual_check_required';
        notes = `Citation exists, but fetched case name "${bailii.caseName}" does not clearly match "${claimedCaseName}".`;
      }
    }
  }

  await (supabaseAdmin as any)
    .from('citation_verification_cache')
    .upsert({
      citation: parsed.raw,
      claimed_case_name: claimedCaseName || null,
      verification_status: status,
      source_url: bailii.url || null,
      fetched_case_name: bailii.caseName || null,
      fetched_details: bailii.details || {},
      verification_notes: notes,
      checked_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'citation' });

  return {
    citation: parsed.raw,
    status,
    sourceUrl: bailii.url,
    fetchedCaseName: bailii.caseName,
    notes,
  };
}
