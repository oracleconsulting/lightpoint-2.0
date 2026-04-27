import { complianceCoveringLetterTemplate } from './complianceCoveringLetter';
import { complaintLetterTemplate } from './complaintLetter';
import { appealGroundsTemplate } from './appealGrounds';
import { closureApplicationTemplate } from './closureApplication';
import { tribunalFilingTemplate } from './tribunalFiling';

export const OUTPUT_TEMPLATES = {
  compliance_covering_letter: complianceCoveringLetterTemplate,
  complaint_letter: complaintLetterTemplate,
  appeal_grounds: appealGroundsTemplate,
  closure_application: closureApplicationTemplate,
  tribunal_filing: tribunalFilingTemplate,
} as const;

export type OutputType = keyof typeof OUTPUT_TEMPLATES;
