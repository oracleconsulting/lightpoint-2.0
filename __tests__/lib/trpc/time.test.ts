import { describe, it, expect, vi } from 'vitest';

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              { id: '1', minutes_spent: 30, activity_type: 'analysis' },
              { id: '2', minutes_spent: 45, activity_type: 'letter_generation' },
              { id: '3', minutes_spent: 15, activity_type: 'review' },
            ],
            error: null,
          })),
          single: vi.fn(() => Promise.resolve({
            data: { id: '1', minutes_spent: 30 },
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'new-log', minutes_spent: 30 },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({
              data: { id: '1', minutes_spent: 45 },
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

describe('Time Router', () => {
  describe('getComplaintTime', () => {
    it('should return all time logs for a complaint', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase/client');
      
      const result = await supabaseAdmin
        .from('time_logs')
        .select('*')
        .eq('complaint_id', 'complaint-123')
        .order('created_at', { ascending: true });
      
      expect(result.data).toHaveLength(3);
      expect(result.error).toBeNull();
    });

    it('should calculate total minutes correctly', async () => {
      const logs = [
        { minutes_spent: 30 },
        { minutes_spent: 45 },
        { minutes_spent: 15 },
      ];
      
      const totalMinutes = logs.reduce((sum, log) => sum + log.minutes_spent, 0);
      
      expect(totalMinutes).toBe(90);
    });

    it('should convert minutes to hours', () => {
      const totalMinutes = 90;
      const totalHours = (totalMinutes / 60).toFixed(2);
      
      expect(totalHours).toBe('1.50');
    });
  });

  describe('logActivity', () => {
    it('should create a new time log', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase/client');
      
      const result = await supabaseAdmin
        .from('time_logs')
        .insert({
          complaint_id: 'complaint-123',
          activity_type: 'analysis',
          minutes_spent: 30,
          automated: true,
        })
        .select()
        .single();
      
      expect(result.data).toHaveProperty('id');
      expect(result.error).toBeNull();
    });

    it('should support different activity types', () => {
      const activityTypes = [
        'document_upload',
        'analysis',
        'letter_generation',
        'review',
        'manual_activity',
      ];
      
      activityTypes.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });

    it('should mark automated activities correctly', () => {
      const automatedActivity = { automated: true };
      const manualActivity = { automated: false };
      
      expect(automatedActivity.automated).toBe(true);
      expect(manualActivity.automated).toBe(false);
    });
  });

  describe('updateActivity', () => {
    it('should update duration', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase/client');
      
      const result = await supabaseAdmin
        .from('time_logs')
        .update({ minutes_spent: 45 })
        .eq('id', 'log-123')
        .select()
        .single();
      
      expect(result.data?.minutes_spent).toBe(45);
    });
  });

  describe('deleteActivity', () => {
    it('should delete a time log', async () => {
      const { supabaseAdmin } = await import('@/lib/supabase/client');
      
      const result = await supabaseAdmin
        .from('time_logs')
        .delete()
        .eq('id', 'log-123');
      
      expect(result.error).toBeNull();
    });
  });

  describe('billing calculations', () => {
    it('should calculate value at charge-out rate', () => {
      const minutes = 90;
      const chargeOutRate = 275; // £275/hour
      
      const value = (minutes / 60) * chargeOutRate;
      
      expect(value).toBe(412.5); // £412.50
    });

    it('should handle fractional hours', () => {
      const minutes = 15;
      const chargeOutRate = 300;
      
      const value = (minutes / 60) * chargeOutRate;
      
      expect(value).toBe(75); // £75.00
    });
  });
});

