/**
 * Types for HMRC Manual Ingestion Pipeline
 * 
 * Defines the data structures for crawling, chunking, and storing
 * HMRC internal manuals in the knowledge base.
 */

/**
 * Configuration for an HMRC manual to be ingested
 */
export interface HMRCManualConfig {
  /** Manual code (e.g., 'DMBM', 'ARTG') */
  code: string;
  /** Full manual name */
  name: string;
  /** GOV.UK base URL */
  baseUrl: string;
  /** Path to manual index page */
  indexPath: string;
  /** Knowledge base category to use */
  category: string;
  /** Document type for classification */
  documentType: 'manual';
  /** Ingestion priority (1 = highest) */
  priority: number;
}

/**
 * Parsed content from a single manual section
 */
export interface HMRCManualSection {
  /** Section reference (e.g., 'DMBM210105') */
  sectionReference: string;
  /** Section title */
  title: string;
  /** Full section content text */
  content: string;
  /** Parent section reference (for hierarchy) */
  parentSection: string | null;
  /** Navigation breadcrumb */
  breadcrumb: string[];
  /** Full source URL on GOV.UK */
  sourceUrl: string;
  /** References to other manual sections found in content */
  internalLinks: string[];
  /** Last modified date (if available from page) */
  lastModified: Date | null;
}

/**
 * Result of ingesting a single section
 */
export interface IngestionResult {
  /** Section reference that was processed */
  sectionReference: string;
  /** Result status */
  status: 'added' | 'updated' | 'unchanged' | 'error';
  /** Error message if status is 'error' */
  error?: string;
}

/**
 * Summary of a manual ingestion run
 */
export interface ManualIngestionSummary {
  /** Manual code that was ingested */
  manualCode: string;
  /** Total sections found during crawl */
  sectionsFound: number;
  /** Sections added to knowledge base */
  sectionsAdded: number;
  /** Sections updated in knowledge base */
  sectionsUpdated: number;
  /** Sections unchanged (content identical) */
  sectionsUnchanged: number;
  /** Errors encountered */
  errors: Array<{ section: string; error: string }>;
  /** Total duration in milliseconds */
  duration: number;
}

/**
 * Progress callback for ingestion monitoring
 */
export type IngestionProgressCallback = (
  stage: 'crawling' | 'chunking' | 'embedding' | 'storing',
  current: number,
  total: number
) => void;

/**
 * Configuration for all target HMRC manuals
 * 
 * Priority order reflects relevance to complaint handling:
 * 1. DMBM (Debt Management) - Payment allocation, collection, enforcement
 * 2. ARTG (Appeals Reviews) - Complaint escalation, tribunal procedures
 * 3. CH (Compliance Handbook) - Penalty regimes, reasonable excuse
 * 4. SAM (Self Assessment) - SA procedures, filing, amendments
 * 5. EM (Enquiry Manual) - HMRC investigation procedures
 */
export const HMRC_MANUAL_CONFIGS: HMRCManualConfig[] = [
  {
    code: 'DMBM',
    name: 'Debt Management and Banking Manual',
    baseUrl: 'https://www.gov.uk',
    indexPath: '/hmrc-internal-manuals/debt-management-and-banking',
    category: 'DMBM',
    documentType: 'manual',
    priority: 1,
  },
  {
    code: 'ARTG',
    name: 'Appeals Reviews and Tribunals Guidance',
    baseUrl: 'https://www.gov.uk',
    indexPath: '/hmrc-internal-manuals/appeals-reviews-and-tribunals-guidance',
    category: 'ARTG',
    documentType: 'manual',
    priority: 1,
  },
  {
    code: 'CH',
    name: 'Compliance Handbook',
    baseUrl: 'https://www.gov.uk',
    indexPath: '/hmrc-internal-manuals/compliance-handbook',
    category: 'CH',
    documentType: 'manual',
    priority: 2,
  },
  {
    code: 'SAM',
    name: 'Self Assessment Manual',
    baseUrl: 'https://www.gov.uk',
    indexPath: '/hmrc-internal-manuals/self-assessment-manual',
    category: 'SAM',
    documentType: 'manual',
    priority: 2,
  },
  {
    code: 'EM',
    name: 'Enquiry Manual',
    baseUrl: 'https://www.gov.uk',
    indexPath: '/hmrc-internal-manuals/enquiry-manual',
    category: 'EM',
    documentType: 'manual',
    priority: 2,
  },
  {
    code: 'PAYE',
    name: 'PAYE Manual',
    baseUrl: 'https://www.gov.uk',
    indexPath: '/hmrc-internal-manuals/paye-manual',
    category: 'PAYE',
    documentType: 'manual',
    priority: 3,
  },
];

/**
 * Get manual config by code
 */
export function getManualConfig(code: string): HMRCManualConfig | undefined {
  return HMRC_MANUAL_CONFIGS.find(config => config.code === code);
}

/**
 * Get all manual configs sorted by priority
 */
export function getManualConfigsByPriority(): HMRCManualConfig[] {
  return [...HMRC_MANUAL_CONFIGS].sort((a, b) => a.priority - b.priority);
}

// ============================================================================
// TRIBUNAL CASE LAW TYPES (for future implementation)
// ============================================================================

/**
 * Configuration for tribunal case law ingestion
 */
export interface TribunalConfig {
  /** Tribunal type (FTT, UT) */
  type: 'FTT' | 'UT' | 'High Court';
  /** Full tribunal name */
  name: string;
  /** Source URL (BAILII or similar) */
  sourceUrl: string;
  /** Knowledge base category */
  category: 'Tribunal_FTT' | 'Tribunal_UT' | 'CaseLaw';
  /** Document type */
  documentType: 'case_law';
}

/**
 * Parsed tribunal case
 */
export interface TribunalCase {
  /** Case citation (e.g., '[2024] UKFTT 123') */
  citation: string;
  /** Case name */
  caseName: string;
  /** Tribunal type */
  tribunalType: 'FTT' | 'UT' | 'High Court';
  /** Decision date */
  decisionDate: Date;
  /** Judge name(s) */
  judges: string[];
  /** Headnote/summary */
  headnote: string;
  /** Full decision text */
  fullText: string;
  /** Key principles established */
  keyPrinciples: string[];
  /** HMRC guidance cited in the case */
  hmrcGuidanceCited: string[];
  /** Source URL */
  sourceUrl: string;
}

// ============================================================================
// LEGISLATION TYPES (for future implementation)
// ============================================================================

/**
 * Configuration for legislation ingestion
 */
export interface LegislationConfig {
  /** Legislation identifier */
  identifier: string;
  /** Full name (e.g., 'Taxes Management Act 1970') */
  name: string;
  /** Short name (e.g., 'TMA 1970') */
  shortName: string;
  /** Source URL (legislation.gov.uk) */
  sourceUrl: string;
  /** Knowledge base category */
  category: 'Legislation';
  /** Document type */
  documentType: 'legislation';
}

/**
 * Parsed legislation section
 */
export interface LegislationSection {
  /** Act identifier (e.g., 'TMA1970') */
  actIdentifier: string;
  /** Section number (e.g., 's.59B') */
  sectionNumber: string;
  /** Section title */
  title: string;
  /** Section content */
  content: string;
  /** Related sections */
  relatedSections: string[];
  /** Source URL */
  sourceUrl: string;
  /** Effective date */
  effectiveDate: Date | null;
  /** Amendment history */
  amendments: string[];
}

