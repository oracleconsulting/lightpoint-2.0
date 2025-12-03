/**
 * Per-API-Key Rate Limiting
 * 
 * Implements sliding window rate limiting for API keys.
 * Different limits based on subscription tier.
 */

import { getRedisClient } from '../cache/redis';
import { logger } from '../logger';
import { audit } from '../audit/auditLog';

// Rate limit tiers (requests per hour)
export const RATE_LIMIT_TIERS = {
  free: 100,
  starter: 500,
  professional: 2000,
  enterprise: 10000,
  unlimited: Infinity,
};

export type RateLimitTier = keyof typeof RATE_LIMIT_TIERS;

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds
  limit: number;
}

/**
 * Check rate limit for an API key
 */
export async function checkApiKeyRateLimit(
  keyId: string,
  tier: RateLimitTier = 'starter'
): Promise<RateLimitResult> {
  const redis = await getRedisClient();
  const limit = RATE_LIMIT_TIERS[tier];
  const windowMs = 60 * 60 * 1000; // 1 hour
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // If Redis not available, allow with warning
  if (!redis) {
    logger.warn('⚠️ Redis not available for rate limiting, allowing request');
    return {
      allowed: true,
      remaining: limit,
      resetIn: 3600,
      limit,
    };
  }
  
  const key = `ratelimit:apikey:${keyId}`;
  
  try {
    // Use sorted set for sliding window
    const multi = redis.multi();
    
    // Remove old entries
    multi.zRemRangeByScore(key, 0, windowStart);
    
    // Count current entries
    multi.zCard(key);
    
    // Add current request
    multi.zAdd(key, { score: now, value: `${now}:${Math.random()}` });
    
    // Set expiry
    multi.expire(key, 3600);
    
    const results = await multi.exec();
    const count = (results?.[1] as number) || 0;
    
    const allowed = count < limit;
    const remaining = Math.max(0, limit - count - 1);
    
    // Get time until oldest entry expires
    const oldestEntry = await redis.zRange(key, 0, 0);
    let resetIn = 3600;
    
    if (oldestEntry.length > 0) {
      const oldestTime = parseInt(oldestEntry[0].split(':')[0]);
      resetIn = Math.ceil((oldestTime + windowMs - now) / 1000);
    }
    
    if (!allowed) {
      logger.warn(`⚠️ Rate limit exceeded for API key: ${keyId}`);
      
      // Audit log
      await audit.rateLimit(keyId, 'api_key');
    }
    
    return {
      allowed,
      remaining,
      resetIn: Math.max(0, resetIn),
      limit,
    };
  } catch (error) {
    logger.error('❌ Rate limit check error:', error);
    // On error, allow request but log
    return {
      allowed: true,
      remaining: limit,
      resetIn: 3600,
      limit,
    };
  }
}

/**
 * Get rate limit headers for API response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + result.resetIn).toString(),
  };
}

/**
 * Middleware helper for API routes
 */
export async function withApiKeyRateLimit(
  keyId: string,
  tier: RateLimitTier,
  handler: () => Promise<Response>
): Promise<Response> {
  const result = await checkApiKeyRateLimit(keyId, tier);
  
  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: result.resetIn,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...getRateLimitHeaders(result),
          'Retry-After': result.resetIn.toString(),
        },
      }
    );
  }
  
  // Execute handler
  const response = await handler();
  
  // Clone response to add headers
  const headers = new Headers(response.headers);
  Object.entries(getRateLimitHeaders(result)).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/**
 * Get current usage for an API key
 */
export async function getApiKeyUsage(keyId: string): Promise<{
  current: number;
  resetIn: number;
} | null> {
  const redis = await getRedisClient();
  if (!redis) return null;
  
  const key = `ratelimit:apikey:${keyId}`;
  const windowMs = 60 * 60 * 1000;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  try {
    // Clean up old entries first
    await redis.zRemRangeByScore(key, 0, windowStart);
    
    // Count current entries
    const current = await redis.zCard(key);
    
    // Get reset time
    const oldestEntry = await redis.zRange(key, 0, 0);
    let resetIn = 3600;
    
    if (oldestEntry.length > 0) {
      const oldestTime = parseInt(oldestEntry[0].split(':')[0]);
      resetIn = Math.ceil((oldestTime + windowMs - now) / 1000);
    }
    
    return {
      current,
      resetIn: Math.max(0, resetIn),
    };
  } catch (error) {
    logger.error('❌ Failed to get API key usage:', error);
    return null;
  }
}

/**
 * Reset rate limit for an API key (admin use)
 */
export async function resetApiKeyRateLimit(keyId: string): Promise<boolean> {
  const redis = await getRedisClient();
  if (!redis) return false;
  
  try {
    await redis.del(`ratelimit:apikey:${keyId}`);
    logger.info('✅ Rate limit reset for API key:', keyId);
    return true;
  } catch (error) {
    logger.error('❌ Failed to reset rate limit:', error);
    return false;
  }
}

/**
 * IP-based rate limiting for public endpoints
 */
export async function checkIpRateLimit(
  ip: string,
  limit: number = 60,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const redis = await getRedisClient();
  const windowMs = windowSeconds * 1000;
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!redis) {
    return {
      allowed: true,
      remaining: limit,
      resetIn: windowSeconds,
      limit,
    };
  }
  
  const key = `ratelimit:ip:${ip}`;
  
  try {
    const multi = redis.multi();
    multi.zRemRangeByScore(key, 0, windowStart);
    multi.zCard(key);
    multi.zAdd(key, { score: now, value: `${now}:${Math.random()}` });
    multi.expire(key, windowSeconds);
    
    const results = await multi.exec();
    const count = (results?.[1] as number) || 0;
    
    const allowed = count < limit;
    const remaining = Math.max(0, limit - count - 1);
    
    return {
      allowed,
      remaining,
      resetIn: windowSeconds,
      limit,
    };
  } catch (error) {
    logger.error('❌ IP rate limit check error:', error);
    return {
      allowed: true,
      remaining: limit,
      resetIn: windowSeconds,
      limit,
    };
  }
}

