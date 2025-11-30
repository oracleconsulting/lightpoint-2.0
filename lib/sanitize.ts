/**
 * Content Sanitization Module
 * 
 * Removes or redacts personally identifiable information (PII) from content
 * for superadmin viewing of pilot user letters.
 */

// Common UK name patterns to redact
const UK_NAME_PATTERNS = [
  // Titles with names
  /\b(Mr|Mrs|Ms|Miss|Dr|Prof|Sir|Dame|Lord|Lady)\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)*/gi,
  // Full names at start of line (e.g., "John Smith,")
  /^[A-Z][a-z]+\s+[A-Z][a-z]+,/gm,
];

// PII patterns to redact
const PII_PATTERNS: Array<{ pattern: RegExp; replacement: string; name: string }> = [
  // UK National Insurance Number
  { 
    pattern: /\b[A-Z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-Z]\b/gi, 
    replacement: '[NINO REDACTED]',
    name: 'National Insurance Number'
  },
  // UK UTR (Unique Taxpayer Reference) - 10 digits
  { 
    pattern: /\b\d{10}\b/g, 
    replacement: '[UTR REDACTED]',
    name: 'UTR'
  },
  // UK Postcode
  { 
    pattern: /\b[A-Z]{1,2}\d{1,2}[A-Z]?\s*\d[A-Z]{2}\b/gi, 
    replacement: '[POSTCODE]',
    name: 'Postcode'
  },
  // Email addresses
  { 
    pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, 
    replacement: '[EMAIL REDACTED]',
    name: 'Email'
  },
  // UK Phone numbers
  { 
    pattern: /\b(?:0|\+44)[\s.-]?\d{2,4}[\s.-]?\d{3,4}[\s.-]?\d{3,4}\b/g, 
    replacement: '[PHONE REDACTED]',
    name: 'Phone'
  },
  // UK Mobile numbers
  { 
    pattern: /\b(?:07\d{3}|\+447\d{3})[\s.-]?\d{3}[\s.-]?\d{3}\b/g, 
    replacement: '[MOBILE REDACTED]',
    name: 'Mobile'
  },
  // Bank account numbers (8 digits)
  { 
    pattern: /\b\d{8}\b(?=.*(?:account|bank|sort|code))/gi, 
    replacement: '[ACCOUNT REDACTED]',
    name: 'Bank Account'
  },
  // Sort codes
  { 
    pattern: /\b\d{2}[-\s]?\d{2}[-\s]?\d{2}\b/g, 
    replacement: '[SORT CODE]',
    name: 'Sort Code'
  },
  // Addresses (common UK patterns)
  { 
    pattern: /\d+\s+[A-Z][a-z]+\s+(?:Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr|Close|Cl|Way|Court|Ct|Place|Pl|Gardens|Gdns|Terrace|Tce)\b/gi, 
    replacement: '[ADDRESS REDACTED]',
    name: 'Street Address'
  },
  // Company numbers
  { 
    pattern: /\b(?:company\s*(?:no|number|reg)\.?\s*:?\s*)?\d{7,8}\b/gi, 
    replacement: '[COMPANY NO. REDACTED]',
    name: 'Company Number'
  },
  // HMRC reference patterns (keeping department but redacting specific refs)
  { 
    pattern: /\b\d{3}\/[A-Z0-9]+\/\d+\b/g, 
    replacement: '[HMRC REF REDACTED]',
    name: 'HMRC Reference'
  },
  // Dates of birth patterns
  { 
    pattern: /\b(?:DOB|Date of Birth|Born)[\s:]+\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/gi, 
    replacement: '[DOB REDACTED]',
    name: 'Date of Birth'
  },
];

// Client reference patterns (redact the actual reference but keep the label)
const CLIENT_REF_PATTERNS = [
  /\bClient\s*(?:Ref|Reference)[\s:]+[A-Z0-9\-]+/gi,
  /\bYour\s*(?:Ref|Reference)[\s:]+[A-Z0-9\-]+/gi,
  /\bOur\s*(?:Ref|Reference)[\s:]+[A-Z0-9\-]+/gi,
];

/**
 * Sanitize content by removing PII
 * 
 * @param content - The content to sanitize
 * @param options - Sanitization options
 * @returns Sanitized content
 */
export function sanitizeContent(
  content: string,
  options: {
    redactNames?: boolean;
    redactClientRefs?: boolean;
    preserveStructure?: boolean;
  } = {}
): { sanitized: string; redactionCount: number; redactedTypes: string[] } {
  const {
    redactNames = true,
    redactClientRefs = true,
    preserveStructure = true,
  } = options;

  let sanitized = content;
  let redactionCount = 0;
  const redactedTypes: Set<string> = new Set();

  // Redact PII patterns
  for (const { pattern, replacement, name } of PII_PATTERNS) {
    const matches = sanitized.match(pattern);
    if (matches) {
      redactionCount += matches.length;
      redactedTypes.add(name);
      sanitized = sanitized.replace(pattern, replacement);
    }
  }

  // Redact names if enabled
  if (redactNames) {
    for (const pattern of UK_NAME_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        redactionCount += matches.length;
        redactedTypes.add('Personal Name');
        sanitized = sanitized.replace(pattern, '[NAME REDACTED]');
      }
    }
  }

  // Redact client references if enabled
  if (redactClientRefs) {
    for (const pattern of CLIENT_REF_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        redactionCount += matches.length;
        redactedTypes.add('Client Reference');
        sanitized = sanitized.replace(pattern, 'Client Ref: [REDACTED]');
      }
    }
  }

  // Redact letterhead (first few lines often contain firm details)
  if (preserveStructure) {
    // Add redaction notice at the top
    sanitized = `[SANITIZED FOR REVIEW - ${redactionCount} items redacted]\n\n${sanitized}`;
  }

  return {
    sanitized,
    redactionCount,
    redactedTypes: Array.from(redactedTypes),
  };
}

/**
 * Sanitize a complaint letter for superadmin viewing
 */
export function sanitizeLetterForAdmin(letterContent: string): {
  content: string;
  metadata: {
    redactionCount: number;
    redactedTypes: string[];
    letterLength: number;
  };
} {
  const result = sanitizeContent(letterContent, {
    redactNames: true,
    redactClientRefs: true,
    preserveStructure: true,
  });

  return {
    content: result.sanitized,
    metadata: {
      redactionCount: result.redactionCount,
      redactedTypes: result.redactedTypes,
      letterLength: letterContent.length,
    },
  };
}

/**
 * Check if content contains potential PII
 */
export function containsPII(content: string): boolean {
  for (const { pattern } of PII_PATTERNS) {
    if (pattern.test(content)) {
      return true;
    }
  }
  return false;
}

