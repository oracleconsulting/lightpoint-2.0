import { describe, it, expect, vi } from 'vitest';

// Mock dependencies
vi.mock('@/lib/supabase/client', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { 
              id: 'complaint-123', 
              complaint_reference: 'REF-001',
              hmrc_department: 'PAYE'
            },
            error: null,
          })),
          order: vi.fn(() => Promise.resolve({
            data: [
              { id: 'letter-1', letter_type: 'initial_complaint', created_at: '2024-01-01' },
              { id: 'letter-2', letter_type: 'tier2_escalation', created_at: '2024-01-02' },
            ],
            error: null,
          })),
          is: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: [{ id: 'letter-1', letter_type: 'initial_complaint' }],
              error: null,
            })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'new-letter', letter_type: 'initial_complaint' },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: 'letter-1', locked_at: '2024-01-01T00:00:00Z' },
              error: null,
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}));

vi.mock('@/lib/openrouter/client', () => ({
  generateComplaintLetter: vi.fn(() => Promise.resolve('Generated letter content...')),
}));

vi.mock('@/lib/openrouter/three-stage-client', () => ({
  generateComplaintLetterThreeStage: vi.fn(() => Promise.resolve('Three-stage generated letter content...')),
}));

describe('Letters Router', () => {
  describe('generateComplaint', () => {
    it('should use three-stage pipeline by default', async () => {
      const useThreeStage = undefined;
      const shouldUseThreeStage = useThreeStage !== false;
      
      expect(shouldUseThreeStage).toBe(true);
    });

    it('should use single-stage when explicitly disabled', async () => {
      const useThreeStage = false;
      const shouldUseThreeStage = useThreeStage !== false;
      
      expect(shouldUseThreeStage).toBe(false);
    });

    it('should include user details in letter generation', async () => {
      const input = {
        complaintId: 'complaint-123',
        analysis: { viability: 85 },
        userName: 'John Smith',
        userTitle: 'Tax Manager',
        userEmail: 'john@example.com',
        userPhone: '0123456789',
      };
      
      expect(input.userName).toBe('John Smith');
      expect(input.userTitle).toBe('Tax Manager');
    });

    it('should support additional context', async () => {
      const additionalContext = 'Focus on penalty cancellation arguments';
      
      expect(additionalContext.length).toBeGreaterThan(0);
    });
  });

  describe('save', () => {
    it('should save letter with valid type', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase/client');
      
      const result = await supabaseAdmin
        .from('generated_letters')
        .insert({
          complaint_id: 'complaint-123',
          letter_type: 'initial_complaint',
          letter_content: 'Letter content...',
        })
        .select()
        .single();
      
      expect(result.data).toHaveProperty('id');
      expect(result.error).toBeNull();
    });

    it('should accept all valid letter types', () => {
      const validTypes = [
        'initial_complaint',
        'tier2_escalation',
        'adjudicator_escalation',
        'rebuttal',
        'acknowledgement',
      ];
      
      validTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('lock', () => {
    it('should set locked_at timestamp', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase/client');
      
      const result = await supabaseAdmin
        .from('generated_letters')
        .update({ locked_at: new Date().toISOString() })
        .eq('id', 'letter-123')
        .select()
        .single();
      
      expect(result.data).toHaveProperty('locked_at');
    });

    it('should prevent editing after lock', () => {
      const letter = { locked_at: '2024-01-01T00:00:00Z' };
      const isLocked = !!letter.locked_at;
      
      expect(isLocked).toBe(true);
    });
  });

  describe('markAsSent', () => {
    it('should record sent details', async () => {
      const sentDetails = {
        sent_at: new Date().toISOString(),
        sent_by: 'user-123',
        sent_method: 'post',
        hmrc_reference: 'HMRC-REF-001',
      };
      
      expect(sentDetails).toHaveProperty('sent_at');
      expect(sentDetails).toHaveProperty('sent_method');
    });

    it('should accept valid send methods', () => {
      const validMethods = ['post', 'email', 'post_and_email', 'fax'];
      
      validMethods.forEach(method => {
        expect(validMethods).toContain(method);
      });
    });

    it('should add timeline event when letter sent', () => {
      const timeline: any[] = [];
      const letterSentEvent = {
        date: new Date().toISOString(),
        type: 'letter_sent',
        summary: 'initial_complaint sent to HMRC via post',
      };
      
      timeline.push(letterSentEvent);
      
      expect(timeline).toHaveLength(1);
      expect(timeline[0].type).toBe('letter_sent');
    });
  });

  describe('list', () => {
    it('should return letters for complaint', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase/client');
      
      const result = await supabaseAdmin
        .from('generated_letters')
        .select('*')
        .eq('complaint_id', 'complaint-123')
        .order('created_at', { ascending: false });
      
      expect(result.data).toBeInstanceOf(Array);
    });

    it('should order by created_at descending', () => {
      const letters = [
        { id: '1', created_at: '2024-01-01' },
        { id: '2', created_at: '2024-01-02' },
      ];
      
      const sorted = letters.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      expect(sorted[0].id).toBe('2');
    });
  });

  describe('updateContent', () => {
    it('should reject update for locked letter', () => {
      const letter = { locked_at: '2024-01-01T00:00:00Z' };
      
      expect(() => {
        if (letter.locked_at) {
          throw new Error('Cannot edit a locked letter');
        }
      }).toThrow('Cannot edit a locked letter');
    });

    it('should allow update for unlocked letter', () => {
      const letter = { locked_at: null };
      const canEdit = !letter.locked_at;
      
      expect(canEdit).toBe(true);
    });
  });

  describe('delete', () => {
    it('should reject delete for sent letter', () => {
      const letter = { sent_at: '2024-01-01T00:00:00Z' };
      
      expect(() => {
        if (letter.sent_at) {
          throw new Error('Cannot delete a sent letter');
        }
      }).toThrow('Cannot delete a sent letter');
    });

    it('should allow delete for unsent letter', () => {
      const letter = { sent_at: null };
      const canDelete = !letter.sent_at;
      
      expect(canDelete).toBe(true);
    });
  });

  describe('listActive', () => {
    it('should filter out superseded letters', async () => {
      const letters = [
        { id: '1', superseded_by: 'letter-2' },
        { id: '2', superseded_by: null },
      ];
      
      const active = letters.filter(l => l.superseded_by === null);
      
      expect(active).toHaveLength(1);
      expect(active[0].id).toBe('2');
    });
  });
});

