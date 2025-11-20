/**
 * Rate Limiting Middleware for Lightpoint v2.0
 * 
 * Protects API endpoints from abuse and DoS attacks
 * Uses Redis for distributed rate limiting
 * 
 * Limits:
 * - 60 requests per minute per user (general)
 * - 10 letter generations per hour per user (expensive operations)
 * - 100 requests per minute per IP (unauthenticated)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

// Initialize Redis client for rate limiting
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * General API rate limiter
 * 60 requests per minute per user
 */
export const generalRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, '1 m'),
      analytics: true,
      prefix: 'ratelimit:general',
    })
  : null;

/**
 * Letter generation rate limiter
 * 10 letter generations per hour per user
 */
export const letterGenerationRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 h'),
      analytics: true,
      prefix: 'ratelimit:letters',
    })
  : null;

/**
 * Analysis rate limiter
 * 20 analyses per hour per user
 */
export const analysisRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 h'),
      analytics: true,
      prefix: 'ratelimit:analysis',
    })
  : null;

/**
 * Upload rate limiter
 * 30 uploads per hour per user
 */
export const uploadRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, '1 h'),
      analytics: true,
      prefix: 'ratelimit:uploads',
    })
  : null;

/**
 * IP-based rate limiter (for unauthenticated requests)
 * 100 requests per minute per IP
 */
export const ipRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 m'),
      analytics: true,
      prefix: 'ratelimit:ip',
    })
  : null;

/**
 * Get identifier for rate limiting
 */
export const getRateLimitIdentifier = (
  req: NextRequest,
  userId?: string
): string => {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`;
  }

  // Fall back to IP address
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || 
             req.headers.get('x-real-ip') ||
             'unknown';
  
  return `ip:${ip}`;
};

/**
 * Check rate limit and return result
 */
export const checkRateLimit = async (
  identifier: string,
  limiter: Ratelimit | null
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> => {
  if (!limiter) {
    // Rate limiting disabled (no Redis configured)
    return {
      success: true,
      limit: 999999,
      remaining: 999999,
      reset: Date.now() + 60000,
    };
  }

  try {
    const result = await limiter.limit(identifier);
    
    if (!result.success) {
      console.warn(`⚠️  Rate limit exceeded for ${identifier}`);
    }

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error('❌ Rate limit check failed:', error);
    // Fail open (allow request) if rate limiting fails
    return {
      success: true,
      limit: 0,
      remaining: 0,
      reset: Date.now() + 60000,
    };
  }
};

/**
 * Rate limit middleware for tRPC procedures
 */
export const rateLimitMiddleware = async (
  userId: string | undefined,
  procedureName: string,
  ipAddress?: string
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> => {
  // Determine which rate limiter to use based on procedure
  let limiter: Ratelimit | null = generalRateLimiter;
  
  if (procedureName.includes('letters.generate')) {
    limiter = letterGenerationRateLimiter;
  } else if (procedureName.includes('analysis.analyze')) {
    limiter = analysisRateLimiter;
  } else if (procedureName.includes('documents.upload') || procedureName.includes('knowledge.upload')) {
    limiter = uploadRateLimiter;
  }

  // Create identifier
  const identifier = userId ? `user:${userId}` : `ip:${ipAddress || 'unknown'}`;

  // Check rate limit
  const result = await checkRateLimit(identifier, limiter);

  return {
    allowed: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
};

/**
 * Format rate limit headers for HTTP responses
 */
export const getRateLimitHeaders = (result: {
  limit: number;
  remaining: number;
  reset: number;
}): Record<string, string> => {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  };
};

/**
 * Get rate limit analytics
 */
export const getRateLimitAnalytics = async (): Promise<{
  general: number;
  letters: number;
  analysis: number;
  uploads: number;
} | null> => {
  if (!redis) return null;

  try {
    const [general, letters, analysis, uploads] = await Promise.all([
      redis.dbsize(), // This is a placeholder - actual analytics would need more implementation
      redis.dbsize(),
      redis.dbsize(),
      redis.dbsize(),
    ]);

    return {
      general: 0, // Placeholder - would need actual analytics implementation
      letters: 0,
      analysis: 0,
      uploads: 0,
    };
  } catch (error) {
    console.error('❌ Failed to get rate limit analytics:', error);
    return null;
  }
};

/**
 * Reset rate limits for a specific user (admin function)
 */
export const resetUserRateLimits = async (userId: string): Promise<void> => {
  if (!redis) return;

  try {
    const keys = await redis.keys(`ratelimit:*:user:${userId}`);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => redis.del(key)));
      console.log(`✅ Reset rate limits for user: ${userId}`);
    }
  } catch (error) {
    console.error('❌ Failed to reset user rate limits:', error);
  }
};

export default {
  generalRateLimiter,
  letterGenerationRateLimiter,
  analysisRateLimiter,
  uploadRateLimiter,
  ipRateLimiter,
  getRateLimitIdentifier,
  checkRateLimit,
  rateLimitMiddleware,
  getRateLimitHeaders,
  getRateLimitAnalytics,
  resetUserRateLimits,
};

