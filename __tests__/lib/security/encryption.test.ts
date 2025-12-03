import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Encryption Utilities', () => {
  const testKey = Buffer.from('0'.repeat(64), 'hex').toString('base64');
  
  beforeEach(() => {
    process.env.ENCRYPTION_KEY = testKey;
  });
  
  afterEach(() => {
    delete process.env.ENCRYPTION_KEY;
  });

  describe('encrypt/decrypt', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const { encrypt, decrypt } = await import('@/lib/security/encryption');
      
      const plaintext = 'my-secret-mfa-token';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(encrypted).not.toBe(plaintext);
      expect(decrypted).toBe(plaintext);
    });

    it('should produce different ciphertext for same plaintext', async () => {
      const { encrypt } = await import('@/lib/security/encryption');
      
      const plaintext = 'test-data';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);
      
      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should handle empty strings', async () => {
      const { encrypt, decrypt } = await import('@/lib/security/encryption');
      
      const plaintext = '';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', async () => {
      const { encrypt, decrypt } = await import('@/lib/security/encryption');
      
      const plaintext = '🔐 Secret: café résumé 日本語';
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });

    it('should handle long data', async () => {
      const { encrypt, decrypt } = await import('@/lib/security/encryption');
      
      const plaintext = 'a'.repeat(10000);
      const encrypted = encrypt(plaintext);
      const decrypted = decrypt(encrypted);
      
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('generateEncryptionKey', () => {
    it('should generate valid base64 key', async () => {
      const { generateEncryptionKey } = await import('@/lib/security/encryption');
      
      const key = generateEncryptionKey();
      const decoded = Buffer.from(key, 'base64');
      
      expect(decoded.length).toBe(32); // 256 bits
    });

    it('should generate unique keys', async () => {
      const { generateEncryptionKey } = await import('@/lib/security/encryption');
      
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('isEncryptionConfigured', () => {
    it('should return true when key is set', async () => {
      const { isEncryptionConfigured } = await import('@/lib/security/encryption');
      
      expect(isEncryptionConfigured()).toBe(true);
    });

    it('should return false when key is missing', async () => {
      delete process.env.ENCRYPTION_KEY;
      
      // Need to re-import to get fresh module
      vi.resetModules();
      const { isEncryptionConfigured } = await import('@/lib/security/encryption');
      
      expect(isEncryptionConfigured()).toBe(false);
    });
  });

  describe('hashSensitive', () => {
    it('should produce consistent hashes', async () => {
      const { hashSensitive } = await import('@/lib/security/encryption');
      
      const data = 'my-password';
      const hash1 = hashSensitive(data);
      const hash2 = hashSensitive(data);
      
      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different data', async () => {
      const { hashSensitive } = await import('@/lib/security/encryption');
      
      const hash1 = hashSensitive('password1');
      const hash2 = hashSensitive('password2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('secureCompare', () => {
    it('should return true for equal strings', async () => {
      const { secureCompare } = await import('@/lib/security/encryption');
      
      expect(secureCompare('abc123', 'abc123')).toBe(true);
    });

    it('should return false for different strings', async () => {
      const { secureCompare } = await import('@/lib/security/encryption');
      
      expect(secureCompare('abc123', 'abc124')).toBe(false);
    });

    it('should return false for different lengths', async () => {
      const { secureCompare } = await import('@/lib/security/encryption');
      
      expect(secureCompare('abc', 'abcd')).toBe(false);
    });
  });

  describe('maskSensitive', () => {
    it('should mask middle of string', async () => {
      const { maskSensitive } = await import('@/lib/security/encryption');
      
      const masked = maskSensitive('1234567890', 2);
      
      expect(masked).toBe('12******90');
    });

    it('should mask entire short strings', async () => {
      const { maskSensitive } = await import('@/lib/security/encryption');
      
      const masked = maskSensitive('abc', 4);
      
      expect(masked).toBe('***');
    });

    it('should use default visible chars', async () => {
      const { maskSensitive } = await import('@/lib/security/encryption');
      
      const masked = maskSensitive('abcdefghijklmnop');
      
      expect(masked.startsWith('abcd')).toBe(true);
      expect(masked.endsWith('mnop')).toBe(true);
    });
  });

  describe('encryptFields/decryptFields', () => {
    it('should encrypt specified fields', async () => {
      const { encryptFields, decryptFields } = await import('@/lib/security/encryption');
      
      const obj = {
        id: '123',
        secret: 'my-secret',
        publicField: 'visible',
      };
      
      const encrypted = encryptFields(obj, ['secret']);
      
      expect(encrypted.id).toBe('123');
      expect(encrypted.secret).not.toBe('my-secret');
      expect(encrypted.publicField).toBe('visible');
      
      const decrypted = decryptFields(encrypted, ['secret']);
      expect(decrypted.secret).toBe('my-secret');
    });

    it('should handle null/undefined fields', async () => {
      const { encryptFields } = await import('@/lib/security/encryption');
      
      const obj = {
        id: '123',
        secret: null,
      };
      
      const encrypted = encryptFields(obj, ['secret']);
      
      expect(encrypted.secret).toBeNull();
    });
  });
});

