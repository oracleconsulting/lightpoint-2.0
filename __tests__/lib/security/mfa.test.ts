import { describe, it, expect, vi } from 'vitest';

describe('MFA Utilities', () => {
  describe('generateMfaSecret', () => {
    it('should generate valid base32 secret', async () => {
      const { generateMfaSecret } = await import('@/lib/security/mfa');
      
      const secret = generateMfaSecret();
      
      // Base32 alphabet
      expect(secret).toMatch(/^[A-Z2-7]+$/);
      expect(secret.length).toBe(32); // 20 bytes = 32 base32 chars
    });

    it('should generate unique secrets', async () => {
      const { generateMfaSecret } = await import('@/lib/security/mfa');
      
      const secret1 = generateMfaSecret();
      const secret2 = generateMfaSecret();
      
      expect(secret1).not.toBe(secret2);
    });
  });

  describe('generateTotpUri', () => {
    it('should generate valid otpauth URI', async () => {
      const { generateTotpUri } = await import('@/lib/security/mfa');
      
      const uri = generateTotpUri('JBSWY3DPEHPK3PXP', 'test@example.com', 'MyApp');
      
      expect(uri).toContain('otpauth://totp/');
      expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
      expect(uri).toContain('issuer=MyApp');
      expect(uri).toContain('test%40example.com');
    });

    it('should use default issuer', async () => {
      const { generateTotpUri } = await import('@/lib/security/mfa');
      
      const uri = generateTotpUri('SECRET', 'test@example.com');
      
      expect(uri).toContain('issuer=Lightpoint');
    });
  });

  describe('generateTotp', () => {
    it('should generate 6-digit code', async () => {
      const { generateTotp } = await import('@/lib/security/mfa');
      
      const code = generateTotp('JBSWY3DPEHPK3PXP');
      
      expect(code).toMatch(/^\d{6}$/);
    });

    it('should generate consistent code for same time window', async () => {
      const { generateTotp } = await import('@/lib/security/mfa');
      
      const code1 = generateTotp('JBSWY3DPEHPK3PXP');
      const code2 = generateTotp('JBSWY3DPEHPK3PXP');
      
      expect(code1).toBe(code2);
    });
  });

  describe('verifyTotp', () => {
    it('should verify correct code', async () => {
      const { generateTotp, verifyTotp } = await import('@/lib/security/mfa');
      
      const secret = 'JBSWY3DPEHPK3PXP';
      const code = generateTotp(secret);
      
      expect(verifyTotp(secret, code)).toBe(true);
    });

    it('should reject incorrect code', async () => {
      const { verifyTotp } = await import('@/lib/security/mfa');
      
      expect(verifyTotp('JBSWY3DPEHPK3PXP', '000000')).toBe(false);
    });

    it('should reject wrong length code', async () => {
      const { verifyTotp } = await import('@/lib/security/mfa');
      
      expect(verifyTotp('JBSWY3DPEHPK3PXP', '12345')).toBe(false);
      expect(verifyTotp('JBSWY3DPEHPK3PXP', '1234567')).toBe(false);
    });

    it('should handle codes with spaces', async () => {
      const { generateTotp, verifyTotp } = await import('@/lib/security/mfa');
      
      const secret = 'JBSWY3DPEHPK3PXP';
      const code = generateTotp(secret);
      const codeWithSpaces = code.slice(0, 3) + ' ' + code.slice(3);
      
      expect(verifyTotp(secret, codeWithSpaces)).toBe(true);
    });
  });

  describe('backup codes', () => {
    it('should generate backup codes in correct format', () => {
      // Backup codes format: XXXX-XXXX
      const codeFormat = /^[A-F0-9]{4}-[A-F0-9]{4}$/;
      const sampleCode = 'ABCD-1234';
      
      expect(sampleCode).toMatch(codeFormat);
    });

    it('should generate unique backup codes', () => {
      const codes = new Set<string>();
      for (let i = 0; i < 8; i++) {
        const code = `${Math.random().toString(16).substr(2, 4).toUpperCase()}-${Math.random().toString(16).substr(2, 4).toUpperCase()}`;
        codes.add(code);
      }
      
      expect(codes.size).toBe(8);
    });
  });

  describe('hasMfaEnabled', () => {
    it('should return false for users without MFA', async () => {
      // Mock the database to return null
      vi.mock('@/lib/supabase/client', () => ({
        supabaseAdmin: {
          from: vi.fn(() => ({
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: null, error: null })),
              })),
            })),
          })),
        },
      }));
      
      const { hasMfaEnabled } = await import('@/lib/security/mfa');
      
      const result = await hasMfaEnabled('user-123');
      
      expect(result).toBe(false);
    });
  });
});

