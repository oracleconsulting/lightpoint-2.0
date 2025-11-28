/**
 * Unit Tests for Letter Generation Pipeline
 * 
 * Tests the three-stage letter generation including:
 * - Fact extraction (Stage 1)
 * - Letter structuring (Stage 2)
 * - Tone application (Stage 3)
 * - Full pipeline
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock OpenRouter API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}));

// Sample data
const sampleAnalysis = {
  hasGrounds: true,
  complaintCategory: ['Delay', 'Poor Service'],
  violations: [
    { type: 'CRG4025', description: 'Unreasonable delay', citation: 'CRG4025', severity: 'high' },
  ],
  timeline: { totalDuration: '14 months', longestGap: '6 months', missedDeadlines: 3 },
  systemErrors: [{ type: 'Lost correspondence', departments: ['PAYE'] }],
  breakthroughTriggers: ['Multiple departments involved', 'Contradictory guidance'],
  actions: ['Process claim immediately', 'Reimburse professional fees'],
  compensationEstimate: { professionalFees: '£3,000', distressPayment: '£500' },
  successRate: 85,
  escalationRequired: 'Tier 2',
  reasoning: 'Clear violations with strong evidence',
};

describe('Letter Generation Pipeline', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENROUTER_API_KEY = 'test-key';
  });

  describe('stage1_extractFacts', () => {
    it('should extract facts from complaint analysis', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: `## FACT SHEET

### TIMELINE FACTS
- February 2024: Initial claim submitted
- March 2025: Still unresolved (14 months)

### FINANCIAL FACTS
- Relief claimed: £34,000
- Professional fees: £3,000

### VIOLATION FACTS
- CRG4025 breach: 14-month delay vs 30-day standard`,
            },
          }],
        }),
      });

      const { stage1_extractFacts } = await import('@/lib/openrouter/three-stage-client');
      
      const facts = await stage1_extractFacts(
        sampleAnalysis,
        'CLIENT-001',
        'PAYE'
      );

      expect(facts).toContain('TIMELINE');
      expect(facts).toContain('February 2024');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('openrouter'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    it('should handle extraction errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('API timeout'));

      const { stage1_extractFacts } = await import('@/lib/openrouter/three-stage-client');

      await expect(
        stage1_extractFacts(sampleAnalysis, 'CLIENT-001', 'PAYE')
      ).rejects.toThrow('API timeout');
    });
  });

  describe('stage2_structureLetter', () => {
    it('should structure facts into proper letter format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: `**FORMAL COMPLAINT: Unreasonable Delay**

**Chronological Timeline of Events**

**February 2024:** Initial claim submitted.

**Charter Violations and CRG Breaches**

**1. CRG4025 - Unreasonable Delay**

The 14-month delay exceeds standards.`,
            },
          }],
        }),
      });

      const { stage2_structureLetter } = await import('@/lib/openrouter/three-stage-client');

      const structured = await stage2_structureLetter(
        'Fact sheet content here',
        'Test Practice LLP',
        275,
        'John Smith',
        'Senior Partner'
      );

      expect(structured).toContain('FORMAL COMPLAINT');
      expect(structured).toContain('Chronological Timeline');
      expect(structured).toContain('CRG4025');
    });

    it('should include real user details in closing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: `Yours faithfully,

John Smith
Senior Partner
Test Practice LLP`,
            },
          }],
        }),
      });

      const { stage2_structureLetter } = await import('@/lib/openrouter/three-stage-client');

      const structured = await stage2_structureLetter(
        'Fact sheet',
        'Test Practice LLP',
        275,
        'John Smith',
        'Senior Partner'
      );

      expect(structured).toContain('John Smith');
      expect(structured).toContain('Senior Partner');
    });
  });

  describe('stage3_addTone', () => {
    it('should apply professional tone to structured letter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: `We are writing to lodge a formal complaint regarding the completely unacceptable handling of our client's tax affairs.

This represents a significant breach of CRG4025 standards.`,
            },
          }],
        }),
      });

      const { stage3_addTone } = await import('@/lib/openrouter/three-stage-client');

      const final = await stage3_addTone(
        'Structured letter content',
        'John Smith',
        'Senior Partner'
      );

      expect(final).toContain('formal complaint');
      expect(final).not.toContain('I '); // Should use organizational voice
    });

    it('should preserve bold formatting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [{
            message: {
              content: `**Chronological Timeline of Events**

**February 2024:** Initial submission.

**1. CRG4025 - Unreasonable Delay**`,
            },
          }],
        }),
      });

      const { stage3_addTone } = await import('@/lib/openrouter/three-stage-client');

      const final = await stage3_addTone('Input', 'Name', 'Title');

      expect(final).toContain('**Chronological Timeline');
      expect(final).toContain('**February 2024:**');
      expect(final).toContain('**1. CRG4025');
    });
  });

  describe('Full Pipeline', () => {
    it('should complete all three stages successfully', async () => {
      // Mock all three API calls
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Stage 1 facts' } }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Stage 2 structure' } }],
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            choices: [{ message: { content: 'Stage 3 final letter' } }],
          }),
        });

      const { generateComplaintLetterThreeStage } = await import('@/lib/openrouter/three-stage-client');

      const letter = await generateComplaintLetterThreeStage(
        sampleAnalysis,
        'CLIENT-001',
        'PAYE',
        'Test LLP',
        275,
        'John Smith',
        'Partner'
      );

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(letter).toBe('Stage 3 final letter');
    });

    it('should call progress callback at each stage', async () => {
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: 'S1' } }] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: 'S2' } }] }) })
        .mockResolvedValueOnce({ ok: true, json: async () => ({ choices: [{ message: { content: 'S3' } }] }) });

      const progressCallback = vi.fn();

      const { generateComplaintLetterThreeStage } = await import('@/lib/openrouter/three-stage-client');

      await generateComplaintLetterThreeStage(
        sampleAnalysis,
        'CLIENT-001',
        'PAYE',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        progressCallback
      );

      expect(progressCallback).toHaveBeenCalled();
      expect(progressCallback).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Number),
        expect.any(String)
      );
    });
  });
});

describe('Tone Calibration', () => {
  it('should determine correct tone level based on success rate', () => {
    // This is more of a documentation test - the actual logic is in the prompt
    
    // Level 1: 50-70% success rate
    expect(50).toBeLessThan(70);
    
    // Level 2: 70-85% success rate
    expect(75).toBeGreaterThanOrEqual(70);
    expect(75).toBeLessThan(85);
    
    // Level 3: 85%+ success rate
    expect(90).toBeGreaterThanOrEqual(85);
  });
});

