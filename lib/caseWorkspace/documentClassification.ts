export interface DocumentClassification {
  documentType: string;
  confidence: number;
  signals: string[];
}

const DOCUMENT_RULES: Array<{ type: string; signals: string[] }> = [
  { type: 'SA316_s8_notice', signals: ['SA316', 'section 8', 's.8', 'TMA 1970', 'notice to file'] },
  { type: 'schedule_36_notice', signals: ['Schedule 36', 'information notice', 'FA 2008', 'paragraph 1'] },
  { type: 'penalty_notice', signals: ['penalty', 'late filing', 'late payment', 'surcharge', 'assessment'] },
  { type: 'closure_notice', signals: ['closure notice', 'conclusion of the enquiry', 'section 28A'] },
  { type: 'hmrc_response', signals: ['thank you for your letter', 'complaint', 'HMRC response', 'we have reviewed'] },
  { type: 'agent_letter', signals: ['Dear HMRC', 'we act for', 'our client', 'agent authorisation'] },
  { type: 'bank_statement', signals: ['statement', 'balance brought forward', 'sort code', 'account number'] },
  { type: 'schedule', signals: ['schedule', 'transaction', 'amount', 'date paid'] },
];

export function classifyDocument(text: string, fileName = ''): DocumentClassification {
  const haystack = `${fileName}\n${text}`.toLowerCase();
  const matches = DOCUMENT_RULES.map((rule) => {
    const signals = rule.signals.filter((signal) => haystack.includes(signal.toLowerCase()));
    return {
      type: rule.type,
      signals,
      score: signals.length / rule.signals.length,
    };
  }).sort((a, b) => b.score - a.score);

  const best = matches[0];
  if (!best || best.score === 0) {
    return { documentType: 'other', confidence: 0.25, signals: [] };
  }

  return {
    documentType: best.type,
    confidence: Math.min(0.95, 0.35 + best.score),
    signals: best.signals,
  };
}
