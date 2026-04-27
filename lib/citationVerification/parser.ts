export interface ParsedCitation {
  year: number;
  court: string;
  number: number;
  division?: string;
  raw: string;
}

const CITATION_REGEX = /\[(\d{4})\]\s+(EWCA\s+Civ|EWHC\s+Admin|UKFTT|UKUT|UKSC)\s+(\d+)(?:\s+\((TC|TCC|Admin|Ch|QB|Comm)\))?/gi;

export function parseCitation(citation: string): ParsedCitation | null {
  const match = citation.match(/\[(\d{4})\]\s+(EWCA\s+Civ|EWHC\s+Admin|UKFTT|UKUT|UKSC)\s+(\d+)(?:\s+\((TC|TCC|Admin|Ch|QB|Comm)\))?/i);
  if (!match) return null;
  return {
    year: Number(match[1]),
    court: match[2].replace(/\s+/g, ' '),
    number: Number(match[3]),
    division: match[4],
    raw: match[0],
  };
}

export function extractCitationsFromText(text: string): ParsedCitation[] {
  const citations: ParsedCitation[] = [];
  let match: RegExpExecArray | null;
  CITATION_REGEX.lastIndex = 0;
  while ((match = CITATION_REGEX.exec(text)) !== null) {
    const parsed = parseCitation(match[0]);
    if (parsed) citations.push(parsed);
  }
  return citations;
}
