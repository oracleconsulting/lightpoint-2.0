/**
 * Time Tracking & Billing Utilities
 * Based on real-world HMRC complaint handling practices
 */

// ============================================================================
// TIME BENCHMARKS (12-minute segments)
// ============================================================================

export const TIME_BENCHMARKS = {
  // Letter Generation (based on page count) - ALL IN 12-MINUTE INCREMENTS
  LETTER_HALF_PAGE: 36,      // 0.5 pages = 36 minutes (3 units)
  LETTER_1_PAGE: 48,          // 1 page = 48 minutes (4 units)
  LETTER_1_5_PAGES: 60,       // 1.5 pages = 60 minutes (5 units)
  LETTER_2_PAGES: 84,         // 2 pages = 84 minutes (7 units)
  LETTER_2_5_PAGES: 120,      // 2.5 pages = 120 minutes (10 units)
  LETTER_3_PAGES: 156,        // 3 pages = 156 minutes (13 units) ~2.5 hours
  
  // Letter Refinement
  LETTER_REFINEMENT: 12,      // Adding context and regenerating (1 unit)
  
  // Analysis & Review
  DOCUMENT_ANALYSIS_BASE: 36, // Base analysis = 36 minutes (3 units)
  DOCUMENT_ANALYSIS_PER_DOC: 12, // +12 min per additional document (1 unit)
  
  // File Management
  FILE_OPENING: 12,           // Opening new complaint file (1 unit)
  FILE_CLOSING: 12,           // Closing complaint file (1 unit)
  FINAL_INVOICE: 12,          // Preparing final invoice (1 unit)
  
  // Client Communication
  CLIENT_CALL_SHORT: 12,      // Short call (< 15 min) (1 unit)
  CLIENT_CALL_MEDIUM: 24,     // Medium call (15-30 min) (2 units)
  CLIENT_CALL_LONG: 36,       // Long call (30+ min) (3 units)
  CLIENT_EMAIL: 12,           // Email correspondence (1 unit)
  
  // Response Handling
  HMRC_RESPONSE_REVIEW: 24,   // Reviewing HMRC response - NOT BILLABLE (2 units)
  FOLLOW_UP_LETTER: 24,       // Follow-up/chasing letter (2 units)
  
  // Escalation
  TIER_2_ESCALATION: 36,      // Escalating to Tier 2 (3 units)
  ADJUDICATOR_ESCALATION: 48, // Escalating to Adjudicator (4 units)
  
  // Resolution
  RESOLUTION_REVIEW: 24,      // Reviewing final resolution (2 units)
  CLIENT_UPDATE: 12,          // Updating client on outcome (1 unit)
} as const;

// ============================================================================
// LETTER PAGE ESTIMATION
// ============================================================================

/**
 * Estimates letter page count from content
 * Assumes ~500 words per page in formal business letter format
 */
export function estimateLetterPageCount(letterContent: string): number {
  const wordCount = letterContent.split(/\s+/).filter(w => w.length > 0).length;
  const pages = wordCount / 500;
  
  // Round to nearest 0.5
  return Math.round(pages * 2) / 2;
}

/**
 * Calculates billable time for letter based on page count
 */
export function calculateLetterTime(letterContent: string): {
  pages: number;
  minutes: number;
  description: string;
} {
  const pages = estimateLetterPageCount(letterContent);
  
  let minutes: number;
  let description: string;
  
  if (pages <= 0.5) {
    minutes = TIME_BENCHMARKS.LETTER_HALF_PAGE;
    description = 'Half-page letter';
  } else if (pages <= 1) {
    minutes = TIME_BENCHMARKS.LETTER_1_PAGE;
    description = '1-page letter';
  } else if (pages <= 1.5) {
    minutes = TIME_BENCHMARKS.LETTER_1_5_PAGES;
    description = '1.5-page letter';
  } else if (pages <= 2) {
    minutes = TIME_BENCHMARKS.LETTER_2_PAGES;
    description = '2-page letter';
  } else if (pages <= 2.5) {
    minutes = TIME_BENCHMARKS.LETTER_2_5_PAGES;
    description = '2.5-page letter';
  } else if (pages <= 3) {
    minutes = TIME_BENCHMARKS.LETTER_3_PAGES;
    description = '3-page letter';
  } else {
    // Custom calculation for 3+ pages
    // Add 24 minutes per additional 0.5 page after 3 pages (2 units)
    const extraPages = pages - 3;
    const extraTime = Math.ceil(extraPages / 0.5) * 24; // Rounded to 12-min increments
    minutes = TIME_BENCHMARKS.LETTER_3_PAGES + extraTime;
    description = `${pages}-page letter (custom)`;
  }
  
  // Ensure all times are rounded to 12-minute increments
  minutes = roundTo12Minutes(minutes);
  
  return { pages, minutes, description };
}

// ============================================================================
// ANALYSIS TIME CALCULATION
// ============================================================================

/**
 * Calculates time for initial analysis based on document count
 */
export function calculateAnalysisTime(documentCount: number): {
  minutes: number;
  description: string;
} {
  const minutes = TIME_BENCHMARKS.DOCUMENT_ANALYSIS_BASE + 
                  ((documentCount - 1) * TIME_BENCHMARKS.DOCUMENT_ANALYSIS_PER_DOC);
  
  return {
    minutes,
    description: `Analysis of ${documentCount} document${documentCount > 1 ? 's' : ''}`,
  };
}

// ============================================================================
// TIME FORMATTING
// ============================================================================

/**
 * Formats minutes into hours and minutes
 */
export function formatTimeHHMM(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

/**
 * Converts minutes to decimal hours for invoicing
 */
export function minutesToDecimalHours(minutes: number): number {
  return Number((minutes / 60).toFixed(2));
}

/**
 * Rounds time to nearest 12-minute segment (0.2 hours)
 */
export function roundTo12Minutes(minutes: number): number {
  return Math.ceil(minutes / 12) * 12;
}

// ============================================================================
// BILLING CALCULATION
// ============================================================================

/**
 * Calculates billable value from minutes and hourly rate
 */
export function calculateBillableValue(minutes: number, hourlyRate: number): number {
  const hours = minutes / 60;
  return Number((hours * hourlyRate).toFixed(2));
}

/**
 * Formats currency value
 */
export function formatCurrency(amount: number): string {
  return `£${amount.toFixed(2)}`;
}

// ============================================================================
// ACTIVITY TYPE DEFINITIONS
// ============================================================================

export const ACTIVITY_TYPES = {
  // Core Activities (Billable)
  INITIAL_ANALYSIS: 'Initial Analysis',
  LETTER_GENERATION: 'Letter Generation',
  LETTER_REFINEMENT: 'Letter Refinement',
  FILE_OPENING: 'File Opening',
  FILE_CLOSING: 'File Closing',
  FINAL_INVOICE: 'Final Invoice Preparation',
  
  // Client Communication (Billable)
  CLIENT_CALL: 'Client Phone Call',
  CLIENT_EMAIL: 'Client Email Correspondence',
  CLIENT_MEETING: 'Client Meeting',
  CLIENT_UPDATE: 'Client Progress Update',
  
  // Follow-up (Billable)
  FOLLOW_UP_LETTER: 'Follow-up Letter',
  TIER_2_ESCALATION: 'Tier 2 Escalation',
  ADJUDICATOR_ESCALATION: 'Adjudicator Escalation',
  
  // Resolution (Billable)
  RESOLUTION_REVIEW: 'Resolution Review',
  SETTLEMENT_NEGOTIATION: 'Settlement Negotiation',
  
  // HMRC Response Review (NOT Billable - track for records)
  HMRC_RESPONSE_REVIEW: 'HMRC Response Review',
} as const;

// ============================================================================
// BILLABILITY FLAGS
// ============================================================================

/**
 * Determines if an activity type is billable to client
 * HMRC no longer allows billing for reviewing their responses
 */
export function isBillableActivity(activityType: string): boolean {
  const nonBillableActivities = [
    ACTIVITY_TYPES.HMRC_RESPONSE_REVIEW,
  ];
  
  return !nonBillableActivities.includes(activityType as any);
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export default {
  TIME_BENCHMARKS,
  ACTIVITY_TYPES,
  estimateLetterPageCount,
  calculateLetterTime,
  calculateAnalysisTime,
  formatTimeHHMM,
  minutesToDecimalHours,
  roundTo12Minutes,
  calculateBillableValue,
  formatCurrency,
  isBillableActivity,
};

