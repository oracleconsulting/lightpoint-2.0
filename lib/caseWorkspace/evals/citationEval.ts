import { verifyCitation } from '@/lib/citationVerification/verifier';

export async function evaluateKnownCitations() {
  const known = [
    '[2019] EWHC 1327 (Admin)',
    '[2016] EWCA Civ 15',
    '[2015] UKFTT 8 (TC)',
    '[2024] UKFTT 564 (TC)',
    '[2022] UKFTT 160 (TC)',
  ];
  const hallucinated = '[2022] UKFTT 100 (TC)';

  const verified = await Promise.all(known.map((citation) => verifyCitation(citation)));
  const failed = await verifyCitation(hallucinated, 'Mehrban v HMRC');

  return {
    passed: verified.every((result) => result.status === 'verified') && failed.status !== 'verified',
    verified,
    failed,
  };
}
