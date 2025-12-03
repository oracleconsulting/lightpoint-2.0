/**
 * Multi-Factor Authentication (MFA) Support
 * 
 * Provides TOTP-based MFA using authenticator apps.
 * Integrates with Supabase Auth for seamless experience.
 */

import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '../logger';
import { audit } from '../audit/auditLog';
import crypto from 'crypto';

// TOTP settings
const TOTP_PERIOD = 30; // seconds
const TOTP_DIGITS = 6;
const TOTP_ALGORITHM = 'sha1';

/**
 * Generate a new MFA secret
 */
export function generateMfaSecret(): string {
  const buffer = crypto.randomBytes(20);
  return base32Encode(buffer);
}

/**
 * Base32 encoding for TOTP secrets
 */
function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  let result = '';
  
  for (const byte of buffer) {
    bits += byte.toString(2).padStart(8, '0');
  }
  
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substr(i, 5).padEnd(5, '0');
    result += alphabet[parseInt(chunk, 2)];
  }
  
  return result;
}

/**
 * Generate TOTP URI for QR code
 */
export function generateTotpUri(
  secret: string,
  email: string,
  issuer: string = 'Lightpoint'
): string {
  const encodedEmail = encodeURIComponent(email);
  const encodedIssuer = encodeURIComponent(issuer);
  
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=${TOTP_ALGORITHM.toUpperCase()}&digits=${TOTP_DIGITS}&period=${TOTP_PERIOD}`;
}

/**
 * Generate current TOTP code
 */
export function generateTotp(secret: string): string {
  const counter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  return generateHotp(secret, counter);
}

/**
 * Generate HOTP code
 */
function generateHotp(secret: string, counter: number): string {
  const decodedSecret = base32Decode(secret);
  const buffer = Buffer.alloc(8);
  
  for (let i = 7; i >= 0; i--) {
    buffer[i] = counter & 0xff;
    counter = Math.floor(counter / 256);
  }
  
  const hmac = crypto.createHmac(TOTP_ALGORITHM, decodedSecret);
  hmac.update(buffer);
  const hash = hmac.digest();
  
  const offset = hash[hash.length - 1] & 0x0f;
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % Math.pow(10, TOTP_DIGITS);
  
  return code.toString().padStart(TOTP_DIGITS, '0');
}

/**
 * Base32 decoding
 */
function base32Decode(secret: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleanSecret = secret.replace(/[^A-Z2-7]/gi, '').toUpperCase();
  
  let bits = '';
  for (const char of cleanSecret) {
    const value = alphabet.indexOf(char);
    if (value === -1) continue;
    bits += value.toString(2).padStart(5, '0');
  }
  
  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substr(i, 8), 2));
  }
  
  return Buffer.from(bytes);
}

/**
 * Verify TOTP code (with tolerance for clock drift)
 */
export function verifyTotp(secret: string, code: string, tolerance: number = 1): boolean {
  const normalizedCode = code.replace(/\s/g, '');
  
  if (normalizedCode.length !== TOTP_DIGITS) {
    return false;
  }
  
  const currentCounter = Math.floor(Date.now() / 1000 / TOTP_PERIOD);
  
  for (let i = -tolerance; i <= tolerance; i++) {
    const expectedCode = generateHotp(secret, currentCounter + i);
    if (crypto.timingSafeEqual(
      Buffer.from(normalizedCode),
      Buffer.from(expectedCode)
    )) {
      return true;
    }
  }
  
  return false;
}

/**
 * Enable MFA for a user
 */
export async function enableMfa(
  userId: string,
  organizationId: string
): Promise<{ secret: string; uri: string; backupCodes: string[] } | null> {
  try {
    // Get user email
    const { data: user } = await (supabaseAdmin as any)
      .from('lightpoint_users')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (!user) {
      logger.error('❌ User not found for MFA setup');
      return null;
    }
    
    // Generate secret and backup codes
    const secret = generateMfaSecret();
    const backupCodes = generateBackupCodes(8);
    const uri = generateTotpUri(secret, user.email);
    
    // Store MFA settings (secret encrypted in production)
    const { error } = await (supabaseAdmin as any)
      .from('user_mfa')
      .upsert({
        user_id: userId,
        totp_secret: secret, // In production, encrypt this
        backup_codes: backupCodes.map(c => hashBackupCode(c)),
        enabled: false, // Not enabled until verified
        created_at: new Date().toISOString(),
      });
    
    if (error) {
      logger.error('❌ Failed to store MFA settings:', error);
      return null;
    }
    
    logger.info('✅ MFA setup initiated for user:', userId);
    
    return { secret, uri, backupCodes };
  } catch (error) {
    logger.error('❌ MFA setup error:', error);
    return null;
  }
}

/**
 * Verify and activate MFA
 */
export async function verifyAndActivateMfa(
  userId: string,
  organizationId: string,
  code: string
): Promise<boolean> {
  try {
    // Get stored secret
    const { data: mfa } = await (supabaseAdmin as any)
      .from('user_mfa')
      .select('totp_secret')
      .eq('user_id', userId)
      .single();
    
    if (!mfa) {
      logger.error('❌ MFA not set up for user');
      return false;
    }
    
    // Verify code
    if (!verifyTotp(mfa.totp_secret, code)) {
      logger.warn('⚠️ Invalid MFA code during activation');
      return false;
    }
    
    // Activate MFA
    await (supabaseAdmin as any)
      .from('user_mfa')
      .update({
        enabled: true,
        verified_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    
    // Audit log
    await audit.dataUpdate(userId, organizationId, 'user_mfa', userId, { action: 'enabled' });
    
    logger.info('✅ MFA enabled for user:', userId);
    return true;
  } catch (error) {
    logger.error('❌ MFA verification error:', error);
    return false;
  }
}

/**
 * Verify MFA code during login
 */
export async function verifyMfaLogin(
  userId: string,
  code: string
): Promise<boolean> {
  try {
    const { data: mfa } = await (supabaseAdmin as any)
      .from('user_mfa')
      .select('totp_secret, enabled, backup_codes')
      .eq('user_id', userId)
      .single();
    
    if (!mfa || !mfa.enabled) {
      return true; // MFA not enabled, allow login
    }
    
    // Try TOTP first
    if (verifyTotp(mfa.totp_secret, code)) {
      return true;
    }
    
    // Try backup code
    const hashedCode = hashBackupCode(code);
    if (mfa.backup_codes?.includes(hashedCode)) {
      // Remove used backup code
      const updatedCodes = mfa.backup_codes.filter((c: string) => c !== hashedCode);
      await (supabaseAdmin as any)
        .from('user_mfa')
        .update({ backup_codes: updatedCodes })
        .eq('user_id', userId);
      
      logger.info('✅ Backup code used for MFA');
      return true;
    }
    
    logger.warn('⚠️ Invalid MFA code during login');
    return false;
  } catch (error) {
    logger.error('❌ MFA login verification error:', error);
    return false;
  }
}

/**
 * Disable MFA for a user
 */
export async function disableMfa(
  userId: string,
  organizationId: string,
  code: string
): Promise<boolean> {
  try {
    // Verify code first
    const verified = await verifyMfaLogin(userId, code);
    if (!verified) {
      return false;
    }
    
    // Delete MFA settings
    await (supabaseAdmin as any)
      .from('user_mfa')
      .delete()
      .eq('user_id', userId);
    
    // Audit log
    await audit.dataUpdate(userId, organizationId, 'user_mfa', userId, { action: 'disabled' });
    
    logger.info('✅ MFA disabled for user:', userId);
    return true;
  } catch (error) {
    logger.error('❌ MFA disable error:', error);
    return false;
  }
}

/**
 * Generate backup codes
 */
function generateBackupCodes(count: number): string[] {
  const codes: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  
  return codes;
}

/**
 * Hash backup code for storage
 */
function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code.toUpperCase().replace(/-/g, '')).digest('hex');
}

/**
 * Check if user has MFA enabled
 */
export async function hasMfaEnabled(userId: string): Promise<boolean> {
  try {
    const { data } = await (supabaseAdmin as any)
      .from('user_mfa')
      .select('enabled')
      .eq('user_id', userId)
      .single();
    
    return data?.enabled === true;
  } catch {
    return false;
  }
}

