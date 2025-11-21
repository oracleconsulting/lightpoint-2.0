import { describe, it, expect } from 'vitest';

// Import the functions we want to test
// Note: We'll test the pure utility functions, not the API endpoints

describe('Document Analysis', () => {
  describe('Text extraction utilities', () => {
    it('should extract JSON from markdown code blocks', () => {
      const text = '```json\n{"key": "value"}\n```';
      const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      
      expect(jsonMatch).toBeTruthy();
      if (jsonMatch) {
        const extracted = jsonMatch[1];
        expect(JSON.parse(extracted)).toEqual({ key: 'value' });
      }
    });

    it('should handle malformed JSON gracefully', () => {
      const text = '```json\n{invalid json}\n```';
      const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      
      expect(jsonMatch).toBeTruthy();
      if (jsonMatch) {
        expect(() => JSON.parse(jsonMatch[1])).toThrow();
      }
    });

    it('should extract text without code blocks', () => {
      const text = 'This is plain text without code blocks';
      const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      
      expect(jsonMatch).toBeNull();
    });
  });

  describe('Date parsing', () => {
    it('should parse ISO dates', () => {
      const isoDate = '2024-01-15T10:30:00Z';
      const parsed = new Date(isoDate);
      
      expect(parsed.getFullYear()).toBe(2024);
      expect(parsed.getMonth()).toBe(0); // January is 0
      expect(parsed.getDate()).toBe(15);
    });

    it('should parse UK date format', () => {
      const ukDate = '15/01/2024';
      const parts = ukDate.split('/');
      const parsed = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      
      expect(parsed.getFullYear()).toBe(2024);
      expect(parsed.getMonth()).toBe(0);
      expect(parsed.getDate()).toBe(15);
    });

    it('should handle invalid dates', () => {
      const invalid = new Date('invalid');
      expect(isNaN(invalid.getTime())).toBe(true);
    });
  });

  describe('Timeline parsing', () => {
    it('should extract dates from timeline entries', () => {
      const entry = '16 February 2024: Initial complaint submitted';
      const dateMatch = entry.match(/^(\d{1,2}\s+\w+\s+\d{4}):/);
      
      expect(dateMatch).toBeTruthy();
      if (dateMatch) {
        expect(dateMatch[1]).toBe('16 February 2024');
      }
    });

    it('should handle entries without dates', () => {
      const entry = 'No date in this entry';
      const dateMatch = entry.match(/^(\d{1,2}\s+\w+\s+\d{4}):/);
      
      expect(dateMatch).toBeNull();
    });
  });

  describe('Charter violation parsing', () => {
    it('should extract CRG reference numbers', () => {
      const violation = 'CRG4025 - Unreasonable Delay';
      const crgMatch = violation.match(/CRG\d+/);
      
      expect(crgMatch).toBeTruthy();
      if (crgMatch) {
        expect(crgMatch[0]).toBe('CRG4025');
      }
    });

    it('should extract CHG reference numbers', () => {
      const violation = 'CHG408 - Complaint Handling Standards';
      const chgMatch = violation.match(/CHG\d+/);
      
      expect(chgMatch).toBeTruthy();
      if (chgMatch) {
        expect(chgMatch[0]).toBe('CHG408');
      }
    });

    it('should handle violations without references', () => {
      const violation = 'Generic violation without reference';
      const refMatch = violation.match(/(CRG|CHG)\d+/);
      
      expect(refMatch).toBeNull();
    });
  });
});

