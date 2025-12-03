/**
 * Data Encryption Utilities
 * 
 * Provides AES-256-GCM encryption for sensitive data at rest.
 * Used for MFA secrets, API keys, and other sensitive fields.
 */

import crypto from 'crypto';
import { logger } from '../logger';

// Encryption algorithm
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

/**
 * Get encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable not set');
  }
  
  // Key should be 32 bytes (256 bits) base64 encoded
  return Buffer.from(key, 'base64');
}

/**
 * Derive a key from a master key and salt
 */
function deriveKey(masterKey: Buffer, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt sensitive data
 * Returns base64 encoded: salt + iv + authTag + ciphertext
 */
export function encrypt(plaintext: string): string {
  try {
    const masterKey = getEncryptionKey();
    
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Derive key from master key
    const key = deriveKey(masterKey, salt);
    
    // Encrypt
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    
    // Get auth tag
    const authTag = cipher.getAuthTag();
    
    // Combine: salt + iv + authTag + ciphertext
    const combined = Buffer.concat([salt, iv, authTag, encrypted]);
    
    return combined.toString('base64');
  } catch (error) {
    logger.error('❌ Encryption failed:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedData: string): string {
  try {
    const masterKey = getEncryptionKey();
    const combined = Buffer.from(encryptedData, 'base64');
    
    // Extract components
    const salt = combined.subarray(0, SALT_LENGTH);
    const iv = combined.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const authTag = combined.subarray(
      SALT_LENGTH + IV_LENGTH,
      SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH
    );
    const ciphertext = combined.subarray(SALT_LENGTH + IV_LENGTH + AUTH_TAG_LENGTH);
    
    // Derive key
    const key = deriveKey(masterKey, salt);
    
    // Decrypt
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    logger.error('❌ Decryption failed:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Generate a new encryption key (for initial setup)
 */
export function generateEncryptionKey(): string {
  const key = crypto.randomBytes(32);
  return key.toString('base64');
}

/**
 * Check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  try {
    getEncryptionKey();
    return true;
  } catch {
    return false;
  }
}

/**
 * Hash sensitive data (one-way, for comparison)
 */
export function hashSensitive(data: string): string {
  const salt = process.env.HASH_SALT || 'lightpoint-default-salt';
  return crypto
    .createHmac('sha256', salt)
    .update(data)
    .digest('hex');
}

/**
 * Secure compare to prevent timing attacks
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/**
 * Mask sensitive data for logging (show first/last 4 chars)
 */
export function maskSensitive(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars * 2) {
    return '*'.repeat(data.length);
  }
  
  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const middle = '*'.repeat(Math.max(data.length - visibleChars * 2, 4));
  
  return `${start}${middle}${end}`;
}

/**
 * Encrypt object fields
 */
export function encryptFields<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fieldsToEncrypt) {
    if (result[field] && typeof result[field] === 'string') {
      (result as any)[field] = encrypt(result[field] as string);
    }
  }
  
  return result;
}

/**
 * Decrypt object fields
 */
export function decryptFields<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const result = { ...obj };
  
  for (const field of fieldsToDecrypt) {
    if (result[field] && typeof result[field] === 'string') {
      try {
        (result as any)[field] = decrypt(result[field] as string);
      } catch {
        // Field might not be encrypted, leave as-is
      }
    }
  }
  
  return result;
}

/**
 * Rotate encryption key
 * Re-encrypts all data with new key
 */
export async function rotateEncryptionKey(
  oldKey: string,
  newKey: string,
  dataFetcher: () => Promise<{ id: string; data: string }[]>,
  dataUpdater: (id: string, data: string) => Promise<void>
): Promise<{ success: number; failed: number }> {
  let success = 0;
  let failed = 0;
  
  // Temporarily set old key
  const originalKey = process.env.ENCRYPTION_KEY;
  process.env.ENCRYPTION_KEY = oldKey;
  
  try {
    const items = await dataFetcher();
    
    for (const item of items) {
      try {
        // Decrypt with old key
        const plaintext = decrypt(item.data);
        
        // Set new key
        process.env.ENCRYPTION_KEY = newKey;
        
        // Encrypt with new key
        const newCiphertext = encrypt(plaintext);
        
        // Update
        await dataUpdater(item.id, newCiphertext);
        
        success++;
        
        // Reset to old key for next iteration
        process.env.ENCRYPTION_KEY = oldKey;
      } catch (error) {
        failed++;
        logger.error(`❌ Failed to rotate key for item ${item.id}:`, error);
      }
    }
  } finally {
    // Restore original key
    process.env.ENCRYPTION_KEY = originalKey || '';
  }
  
  return { success, failed };
}

