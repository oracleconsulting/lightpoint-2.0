export interface ExtractedDate {
  date: string;
  role: 'issued' | 'deadline' | 'response_due' | 'mentioned';
  context: string;
}

export interface ExtractedMetadata {
  dates: ExtractedDate[];
  references: string[];
  hmrcTeams: string[];
  hmrcOfficers: string[];
  amounts: string[];
  proposedEvents: Array<{
    eventDate: string;
    eventType: string;
    title: string;
    description: string;
    deadlineStatus?: 'live' | 'passed' | 'met' | 'extended';
    statutoryAuthority?: string;
  }>;
  proposedParties: Array<{
    name: string;
    role: string;
    organisation?: string;
    notes?: string;
  }>;
}

const MONTHS: Record<string, string> = {
  january: '01',
  february: '02',
  march: '03',
  april: '04',
  may: '05',
  june: '06',
  july: '07',
  august: '08',
  september: '09',
  october: '10',
  november: '11',
  december: '12',
};

function normaliseDate(raw: string): string | null {
  const numeric = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (numeric) {
    const year = numeric[3].length === 2 ? `20${numeric[3]}` : numeric[3];
    return `${year}-${numeric[2].padStart(2, '0')}-${numeric[1].padStart(2, '0')}`;
  }

  const words = raw.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/);
  if (words) {
    const month = MONTHS[words[2].toLowerCase()];
    if (!month) return null;
    return `${words[3]}-${month}-${words[1].padStart(2, '0')}`;
  }

  return null;
}

function contextAround(text: string, index: number): string {
  return text.slice(Math.max(0, index - 100), Math.min(text.length, index + 160)).replace(/\s+/g, ' ').trim();
}

export function extractCaseMetadata(text: string): ExtractedMetadata {
  const dates: ExtractedDate[] = [];
  const datePattern = /\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})\b/gi;
  let match: RegExpExecArray | null;

  while ((match = datePattern.exec(text)) !== null) {
    const date = normaliseDate(match[1]);
    if (!date) continue;
    const context = contextAround(text, match.index);
    const lower = context.toLowerCase();
    const role = lower.includes('deadline') || lower.includes('by ') || lower.includes('no later than')
      ? 'deadline'
      : lower.includes('issued') || lower.includes('dated')
        ? 'issued'
        : lower.includes('respond') || lower.includes('reply')
          ? 'response_due'
          : 'mentioned';
    dates.push({ date, role, context });
  }

  const references = Array.from(text.matchAll(/\b(?:UTR|reference|ref|case ref|HMRC ref)[:\s#-]*([A-Z0-9/-]{5,})/gi)).map((m) => m[1]);
  const hmrcTeams = Array.from(new Set(Array.from(text.matchAll(/\b([A-Z][A-Za-z &]+(?:Team|Unit|Office|Compliance|Debt Management|PAYE|Self Assessment))\b/g)).map((m) => m[1].trim()).slice(0, 10)));
  const hmrcOfficers = Array.from(new Set(Array.from(text.matchAll(/\b(?:Officer|caseworker|from)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g)).map((m) => m[1]).slice(0, 10)));
  const amounts = Array.from(new Set(text.match(/£\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g) || []));

  const proposedEvents = dates.slice(0, 12).map((date) => ({
    eventDate: date.date,
    eventType: date.role === 'deadline' ? 'deadline' : 'document_date',
    title: date.role === 'deadline' ? 'Potential deadline identified' : 'Date identified from document',
    description: date.context,
    deadlineStatus: date.role === 'deadline' ? ('live' as const) : undefined,
  }));

  const proposedParties = [
    ...hmrcTeams.map((team) => ({ name: team, role: 'hmrc_team', organisation: 'HMRC', notes: 'Extracted from uploaded document' })),
    ...hmrcOfficers.map((officer) => ({ name: officer, role: 'hmrc_officer', organisation: 'HMRC', notes: 'Extracted from uploaded document' })),
  ];

  return {
    dates,
    references: Array.from(new Set(references)),
    hmrcTeams,
    hmrcOfficers,
    amounts,
    proposedEvents,
    proposedParties,
  };
}
