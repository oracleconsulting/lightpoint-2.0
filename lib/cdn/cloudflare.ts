/**
 * Cloudflare CDN Configuration
 * 
 * Utilities for Cloudflare CDN integration including
 * cache purging, page rules, and analytics.
 */

import { logger } from '../logger';

// Cloudflare API configuration
const CF_API_URL = 'https://api.cloudflare.com/client/v4';
const CF_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;

interface CloudflareResponse<T> {
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  result: T;
}

/**
 * Check if Cloudflare is configured
 */
export function isCloudflareConfigured(): boolean {
  return !!(CF_ZONE_ID && CF_API_TOKEN);
}

/**
 * Make authenticated request to Cloudflare API
 */
async function cfRequest<T>(
  endpoint: string,
  method: string = 'GET',
  body?: Record<string, any>
): Promise<T | null> {
  if (!isCloudflareConfigured()) {
    logger.warn('⚠️ Cloudflare not configured');
    return null;
  }

  try {
    const response = await fetch(`${CF_API_URL}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data: CloudflareResponse<T> = await response.json();

    if (!data.success) {
      logger.error('❌ Cloudflare API error:', data.errors);
      return null;
    }

    return data.result;
  } catch (error) {
    logger.error('❌ Cloudflare request failed:', error);
    return null;
  }
}

/**
 * Purge specific URLs from cache
 */
export async function purgeUrls(urls: string[]): Promise<boolean> {
  const result = await cfRequest<{ id: string }>(
    `/zones/${CF_ZONE_ID}/purge_cache`,
    'POST',
    { files: urls }
  );

  if (result) {
    logger.info(`✅ Purged ${urls.length} URLs from Cloudflare cache`);
    return true;
  }
  return false;
}

/**
 * Purge cache by tags
 */
export async function purgeTags(tags: string[]): Promise<boolean> {
  const result = await cfRequest<{ id: string }>(
    `/zones/${CF_ZONE_ID}/purge_cache`,
    'POST',
    { tags }
  );

  if (result) {
    logger.info(`✅ Purged cache for tags: ${tags.join(', ')}`);
    return true;
  }
  return false;
}

/**
 * Purge everything (use sparingly!)
 */
export async function purgeAll(): Promise<boolean> {
  const result = await cfRequest<{ id: string }>(
    `/zones/${CF_ZONE_ID}/purge_cache`,
    'POST',
    { purge_everything: true }
  );

  if (result) {
    logger.info('✅ Purged entire Cloudflare cache');
    return true;
  }
  return false;
}

/**
 * Get cache analytics
 */
export async function getCacheAnalytics(since: Date): Promise<{
  requests: number;
  cached: number;
  bandwidth: number;
} | null> {
  const sinceStr = since.toISOString().split('T')[0];
  
  const result = await cfRequest<{
    totals: {
      requests: { all: number; cached: number };
      bandwidth: { all: number; cached: number };
    };
  }>(
    `/zones/${CF_ZONE_ID}/analytics/dashboard?since=${sinceStr}`
  );

  if (!result) return null;

  return {
    requests: result.totals.requests.all,
    cached: result.totals.requests.cached,
    bandwidth: result.totals.bandwidth.all,
  };
}

/**
 * Cache tags for different content types
 */
export const CACHE_TAGS = {
  BLOG: 'blog',
  BLOG_POST: (slug: string) => `blog-post-${slug}`,
  STATIC: 'static-assets',
  API: 'api-responses',
  KNOWLEDGE_BASE: 'knowledge-base',
  USER: (userId: string) => `user-${userId}`,
  ORG: (orgId: string) => `org-${orgId}`,
};

/**
 * Get Cloudflare cache headers
 */
export function getCfCacheHeaders(options: {
  ttl?: number;
  tags?: string[];
  bypass?: boolean;
}): Record<string, string> {
  const headers: Record<string, string> = {};

  if (options.bypass) {
    headers['Cache-Control'] = 'no-store';
    headers['CDN-Cache-Control'] = 'no-store';
    return headers;
  }

  const ttl = options.ttl ?? 86400;
  headers['Cache-Control'] = `public, max-age=${ttl}, s-maxage=${ttl}`;
  headers['CDN-Cache-Control'] = `max-age=${ttl}`;

  if (options.tags?.length) {
    headers['Cache-Tag'] = options.tags.join(',');
  }

  return headers;
}

/**
 * Invalidate cache when blog post is updated
 */
export async function invalidateBlogPost(slug: string): Promise<void> {
  await Promise.all([
    purgeTags([CACHE_TAGS.BLOG_POST(slug), CACHE_TAGS.BLOG]),
    purgeUrls([
      `https://lightpoint.uk/blog/${slug}`,
      'https://lightpoint.uk/blog',
      'https://lightpoint.uk/sitemap.xml',
    ]),
  ]);
}

/**
 * Invalidate cache when knowledge base is updated
 */
export async function invalidateKnowledgeBase(): Promise<void> {
  await purgeTags([CACHE_TAGS.KNOWLEDGE_BASE]);
}

/**
 * Get zone settings
 */
export async function getZoneSettings(): Promise<Record<string, any> | null> {
  return cfRequest<Record<string, any>>(
    `/zones/${CF_ZONE_ID}/settings`
  );
}

/**
 * Security level settings
 */
export type SecurityLevel = 'off' | 'essentially_off' | 'low' | 'medium' | 'high' | 'under_attack';

export async function setSecurityLevel(level: SecurityLevel): Promise<boolean> {
  const result = await cfRequest<{ value: string }>(
    `/zones/${CF_ZONE_ID}/settings/security_level`,
    'PATCH',
    { value: level }
  );

  if (result) {
    logger.info(`✅ Security level set to: ${level}`);
    return true;
  }
  return false;
}

/**
 * Enable "Under Attack" mode
 */
export async function enableUnderAttackMode(): Promise<boolean> {
  return setSecurityLevel('under_attack');
}

/**
 * Disable "Under Attack" mode
 */
export async function disableUnderAttackMode(): Promise<boolean> {
  return setSecurityLevel('medium');
}

