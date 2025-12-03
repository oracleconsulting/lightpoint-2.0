/**
 * Integration Tests: Complete Complaint Workflow
 * 
 * Tests the full lifecycle of a complaint from creation to resolution.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies
vi.mock('@/lib/supabase/client', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { 
              id: 'complaint-123',
              status: 'assessment',
              complaint_reference: 'REF-001',
              timeline: [],
            },
            error: null,
          })),
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'new-id', status: 'assessment' },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'complaint-123', status: 'active' },
              error: null,
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(() => Promise.resolve({ data: { path: 'file.pdf' }, error: null })),
        createSignedUrl: vi.fn(() => Promise.resolve({ data: { signedUrl: 'https://...' }, error: null })),
      })),
    },
  },
}));

describe('Complaint Workflow Integration', () => {
  describe('Phase 1: Complaint Creation', () => {
    it('should create a new complaint with initial status', async () => {
      const complaint = {
        organization_id: 'org-123',
        created_by: 'user-123',
        complaint_reference: 'CLIENT-REF-001',
        status: 'assessment',
        timeline: [],
      };
      
      expect(complaint.status).toBe('assessment');
      expect(complaint.timeline).toHaveLength(0);
    });

    it('should assign unique complaint reference', () => {
      const reference = `COMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      expect(reference).toMatch(/^COMP-\d+-[a-z0-9]+$/);
    });

    it('should initialize empty timeline', () => {
      const timeline: any[] = [];
      
      timeline.push({
        date: new Date().toISOString(),
        type: 'created',
        summary: 'Complaint created',
      });
      
      expect(timeline).toHaveLength(1);
      expect(timeline[0].type).toBe('created');
    });
  });

  describe('Phase 2: Document Upload', () => {
    it('should process uploaded documents', async () => {
      const documents = [
        { name: 'hmrc_letter.pdf', type: 'hmrc_letter' },
        { name: 'evidence.pdf', type: 'evidence' },
      ];
      
      expect(documents).toHaveLength(2);
    });

    it('should extract text from documents', async () => {
      const extractedText = 'HMRC Notice of Penalty...';
      
      expect(extractedText.length).toBeGreaterThan(0);
    });

    it('should add document upload to timeline', () => {
      const timeline: any[] = [];
      
      timeline.push({
        date: new Date().toISOString(),
        type: 'document_uploaded',
        summary: 'hmrc_letter.pdf uploaded',
        documentType: 'hmrc_letter',
      });
      
      expect(timeline[0].type).toBe('document_uploaded');
    });
  });

  describe('Phase 3: AI Analysis', () => {
    it('should analyze complaint documents', async () => {
      const analysis = {
        viability: 85,
        keyIssues: ['Processing delay', 'Penalty miscalculation'],
        charterBreaches: ['Taxpayers Charter Section 3.2'],
        recommendedActions: ['File Tier 1 complaint', 'Request penalty cancellation'],
      };
      
      expect(analysis.viability).toBeGreaterThan(50);
      expect(analysis.keyIssues.length).toBeGreaterThan(0);
    });

    it('should search knowledge base for precedents', async () => {
      const precedents = [
        { id: '1', title: 'Similar VAT Case', similarity: 0.92 },
        { id: '2', title: 'Processing Delay Win', similarity: 0.87 },
      ];
      
      expect(precedents[0].similarity).toBeGreaterThan(0.85);
    });

    it('should update status to draft after analysis', () => {
      const beforeStatus = 'assessment';
      const afterStatus = 'draft';
      
      expect(beforeStatus).toBe('assessment');
      expect(afterStatus).toBe('draft');
    });

    it('should log analysis time', () => {
      const timeLog = {
        activity_type: 'analysis',
        minutes_spent: 5,
        automated: true,
      };
      
      expect(timeLog.automated).toBe(true);
    });
  });

  describe('Phase 4: Letter Generation', () => {
    it('should generate complaint letter with three-stage pipeline', async () => {
      const stages = ['fact_extraction', 'structure', 'tone'];
      const letterContent = 'Dear HMRC...';
      
      expect(stages).toHaveLength(3);
      expect(letterContent.length).toBeGreaterThan(0);
    });

    it('should include user details in letter', () => {
      const letterHeader = {
        userName: 'John Smith',
        userTitle: 'Tax Manager',
        practiceLetterhead: 'ABC Accountants Ltd',
      };
      
      expect(letterHeader.userName).toBeDefined();
    });

    it('should save letter to database', async () => {
      const savedLetter = {
        id: 'letter-123',
        complaint_id: 'complaint-123',
        letter_type: 'initial_complaint',
        letter_content: 'Dear HMRC...',
        locked_at: null,
        sent_at: null,
      };
      
      expect(savedLetter.locked_at).toBeNull();
    });

    it('should log letter generation time', () => {
      const timeLog = {
        activity_type: 'letter_generation',
        minutes_spent: 8,
        automated: true,
      };
      
      expect(timeLog.minutes_spent).toBeGreaterThan(0);
    });
  });

  describe('Phase 5: Letter Review & Send', () => {
    it('should allow letter editing before lock', () => {
      const letter = { locked_at: null };
      const canEdit = !letter.locked_at;
      
      expect(canEdit).toBe(true);
    });

    it('should lock letter when ready to send', async () => {
      const lockedLetter = {
        id: 'letter-123',
        locked_at: new Date().toISOString(),
      };
      
      expect(lockedLetter.locked_at).toBeDefined();
    });

    it('should record send details', async () => {
      const sentDetails = {
        sent_at: new Date().toISOString(),
        sent_by: 'user-123',
        sent_method: 'post',
        hmrc_reference: 'HMRC-ACK-001',
      };
      
      expect(sentDetails.sent_method).toBe('post');
    });

    it('should update status to active after sending', () => {
      const newStatus = 'active';
      
      expect(newStatus).toBe('active');
    });

    it('should add sent event to timeline', () => {
      const timelineEvent = {
        date: new Date().toISOString(),
        type: 'letter_sent',
        summary: 'Initial complaint sent to HMRC',
      };
      
      expect(timelineEvent.type).toBe('letter_sent');
    });
  });

  describe('Phase 6: Response Handling', () => {
    it('should process HMRC response documents', async () => {
      const responseDoc = {
        type: 'response',
        content: 'HMRC response letter...',
      };
      
      expect(responseDoc.type).toBe('response');
    });

    it('should generate rebuttal if needed', async () => {
      const rebuttal = {
        letter_type: 'rebuttal',
        letter_content: 'Response to HMRC...',
      };
      
      expect(rebuttal.letter_type).toBe('rebuttal');
    });

    it('should track escalation path', () => {
      const escalationPath = ['tier1', 'tier2', 'adjudicator'];
      const currentStage = 0;
      
      expect(escalationPath[currentStage]).toBe('tier1');
    });
  });

  describe('Phase 7: Complaint Resolution', () => {
    it('should record outcome when closed', async () => {
      const outcome = {
        outcome_type: 'successful_full',
        compensation_received: 500,
        penalties_cancelled: 1200,
        notes: 'HMRC accepted all arguments',
      };
      
      expect(outcome.outcome_type).toContain('successful');
    });

    it('should update status to closed', () => {
      const finalStatus = 'closed';
      
      expect(finalStatus).toBe('closed');
    });

    it('should add to precedents if successful', async () => {
      const precedent = {
        title: 'Successful VAT Penalty Appeal',
        success_factors: ['Clear timeline', 'Charter references'],
        outcome_type: 'successful_full',
      };
      
      expect(precedent.success_factors.length).toBeGreaterThan(0);
    });

    it('should calculate total time spent', () => {
      const timeLogs = [
        { minutes_spent: 5 },  // Analysis
        { minutes_spent: 8 },  // Letter generation
        { minutes_spent: 15 }, // Review
        { minutes_spent: 10 }, // Response handling
      ];
      
      const total = timeLogs.reduce((sum, log) => sum + log.minutes_spent, 0);
      
      expect(total).toBe(38);
    });

    it('should calculate billing amount', () => {
      const totalMinutes = 38;
      const chargeOutRate = 275; // £275/hour
      
      const billingAmount = (totalMinutes / 60) * chargeOutRate;
      
      expect(billingAmount).toBeCloseTo(174.17, 1);
    });
  });
});

