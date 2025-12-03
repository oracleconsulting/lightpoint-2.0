/**
 * API Key Management System
 * 
 * Secure API key generation, validation, and rotation.
 * Keys are hashed before storage for security.
 */

import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '../logger';
import { audit } from '../audit/auditLog';
import crypto from 'crypto';

// Key prefix for easy identification
const KEY_PREFIX = 'lp_';

// Key hash algorithm
const HASH_ALGORITHM = 'sha256';

/**
 * Generate a secure API key
 */
export function generateApiKey(): { key: string; hash: string } {
  // Generate 32 random bytes (256 bits)
  const randomBytes = crypto.randomBytes(32);
  const key = KEY_PREFIX + randomBytes.toString('base64url');
  
  // Hash the key for storage
  const hash = crypto.createHash(HASH_ALGORITHM).update(key).digest('hex');
  
  return { key, hash };
}

/**
 * Hash an API key for comparison
 */
export function hashApiKey(key: string): string {
  return crypto.createHash(HASH_ALGORITHM).update(key).digest('hex');
}

/**
 * Create a new API key for an organization
 */
export async function createApiKey(
  organizationId: string,
  name: string,
  createdBy: string,
  expiresAt?: Date,
  scopes?: string[]
): Promise<{ id: string; key: string } | null> {
  try {
    const { key, hash } = generateApiKey();
    
    const { data, error } = await (supabaseAdmin as any)
      .from('api_keys')
      .insert({
        organization_id: organizationId,
        name,
        key_hash: hash,
        key_prefix: key.substring(0, 8), // Store prefix for identification
        created_by: createdBy,
        expires_at: expiresAt?.toISOString(),
        scopes: scopes || ['read', 'write'],
        is_active: true,
      })
      .select('id')
      .single();
    
    if (error) {
      logger.error('❌ Failed to create API key:', error);
      return null;
    }
    
    // Audit log
    await audit.dataCreate(createdBy, organizationId, 'api_key', data.id, { name });
    
    logger.info('✅ API key created:', data.id);
    
    // Return the key only once - it cannot be retrieved again
    return { id: data.id, key };
  } catch (error) {
    logger.error('❌ API key creation error:', error);
    return null;
  }
}

/**
 * Validate an API key
 */
export async function validateApiKey(key: string): Promise<{
  valid: boolean;
  organizationId?: string;
  scopes?: string[];
  error?: string;
}> {
  try {
    if (!key.startsWith(KEY_PREFIX)) {
      return { valid: false, error: 'Invalid key format' };
    }
    
    const hash = hashApiKey(key);
    
    const { data, error } = await (supabaseAdmin as any)
      .from('api_keys')
      .select('id, organization_id, scopes, is_active, expires_at')
      .eq('key_hash', hash)
      .single();
    
    if (error || !data) {
      return { valid: false, error: 'Key not found' };
    }
    
    if (!data.is_active) {
      return { valid: false, error: 'Key is disabled' };
    }
    
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return { valid: false, error: 'Key has expired' };
    }
    
    // Update last used timestamp
    await (supabaseAdmin as any)
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', data.id);
    
    return {
      valid: true,
      organizationId: data.organization_id,
      scopes: data.scopes,
    };
  } catch (error) {
    logger.error('❌ API key validation error:', error);
    return { valid: false, error: 'Validation failed' };
  }
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(
  keyId: string,
  revokedBy: string,
  organizationId: string
): Promise<boolean> {
  try {
    const { error } = await (supabaseAdmin as any)
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: revokedBy,
      })
      .eq('id', keyId)
      .eq('organization_id', organizationId);
    
    if (error) {
      logger.error('❌ Failed to revoke API key:', error);
      return false;
    }
    
    // Audit log
    await audit.dataUpdate(revokedBy, organizationId, 'api_key', keyId, { action: 'revoke' });
    
    logger.info('✅ API key revoked:', keyId);
    return true;
  } catch (error) {
    logger.error('❌ API key revocation error:', error);
    return false;
  }
}

/**
 * List API keys for an organization (without the actual keys)
 */
export async function listApiKeys(organizationId: string): Promise<any[]> {
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('api_keys')
      .select('id, name, key_prefix, scopes, is_active, created_at, expires_at, last_used_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('❌ Failed to list API keys:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    logger.error('❌ API key listing error:', error);
    return [];
  }
}

/**
 * Rotate an API key (create new, revoke old)
 */
export async function rotateApiKey(
  oldKeyId: string,
  organizationId: string,
  rotatedBy: string
): Promise<{ id: string; key: string } | null> {
  try {
    // Get old key details
    const { data: oldKey } = await (supabaseAdmin as any)
      .from('api_keys')
      .select('name, scopes, expires_at')
      .eq('id', oldKeyId)
      .eq('organization_id', organizationId)
      .single();
    
    if (!oldKey) {
      logger.error('❌ Old key not found for rotation');
      return null;
    }
    
    // Create new key with same settings
    const newKey = await createApiKey(
      organizationId,
      `${oldKey.name} (rotated)`,
      rotatedBy,
      oldKey.expires_at ? new Date(oldKey.expires_at) : undefined,
      oldKey.scopes
    );
    
    if (!newKey) {
      return null;
    }
    
    // Revoke old key
    await revokeApiKey(oldKeyId, rotatedBy, organizationId);
    
    logger.info('✅ API key rotated:', oldKeyId, '->', newKey.id);
    
    return newKey;
  } catch (error) {
    logger.error('❌ API key rotation error:', error);
    return null;
  }
}

