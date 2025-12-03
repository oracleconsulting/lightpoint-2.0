/**
 * Response Caching for AI Operations
 * 
 * Caches expensive AI responses to improve performance.
 * Uses Redis for distributed caching across instances.
 * 
 * Cache TTLs:
 * - Analysis results: 1 hour (may change with new documents)
 * - Letter generation: Not cached (unique per request)
 * - Knowledge search: 24 hours (KB rarely changes)
 * - Embeddings: 7 days (text rarely changes)
 */

import { getRedisClient, generateCacheKey } from '../cache/redis';
import { logger } from '../logger';

// Cache TTLs in seconds
const TTL = {
  ANALYSIS: 3600,        // 1 hour
  KNOWLEDGE: 86400,      // 24 hours
  EMBEDDING: 604800,     // 7 days
  PRECEDENT: 86400,      // 24 hours
};

/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(
  prefix: string,
  params: Record<string, any>,
  ttl: number,
  fn: () => Promise<T>
): Promise<T> {
  const redis = await getRedisClient();
  
  // If Redis not available, just execute function
  if (!redis) {
    return fn();
  }
  
  const cacheKey = generateCacheKey(prefix, params);
  
  try {
    // Check cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      logger.info(`✅ Cache HIT: ${prefix}`);
      return JSON.parse(cached) as T;
    }
    
    logger.info(`❌ Cache MISS: ${prefix}`);
    
    // Execute function
    const result = await fn();
    
    // Cache result
    await redis.setEx(cacheKey, ttl, JSON.stringify(result));
    
    return result;
  } catch (error) {
    logger.error(`❌ Cache error for ${prefix}:`, error);
    // On cache error, just execute function
    return fn();
  }
}

/**
 * Cache analysis results
 */
export function cacheAnalysis<T>(
  complaintId: string,
  documentHashes: string[],
  fn: () => Promise<T>
): Promise<T> {
  return withCache(
    'analysis',
    { complaintId, documentHashes: documentHashes.sort().join(',') },
    TTL.ANALYSIS,
    fn
  );
}

/**
 * Cache embedding results
 */
export function cacheEmbedding(
  text: string,
  fn: () => Promise<number[]>
): Promise<number[]> {
  // Use first 100 chars + length as cache key (full text too long)
  const textKey = text.substring(0, 100) + ':' + text.length;
  
  return withCache(
    'embedding',
    { text: textKey },
    TTL.EMBEDDING,
    fn
  );
}

/**
 * Invalidate cache for a complaint
 */
export async function invalidateComplaintCache(complaintId: string): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) return;
  
  try {
    const keys = await redis.keys(`analysis:*${complaintId}*`);
    if (keys.length > 0) {
      await redis.del(keys);
      logger.info(`✅ Invalidated ${keys.length} cache entries for complaint ${complaintId}`);
    }
  } catch (error) {
    logger.error('❌ Cache invalidation error:', error);
  }
}

/**
 * Cache statistics
 */
export async function getCacheStats(): Promise<{
  connected: boolean;
  hitRate?: number;
  size?: number;
  memory?: string;
} | null> {
  const redis = await getRedisClient();
  if (!redis) {
    return { connected: false };
  }
  
  try {
    const info = await redis.info('stats');
    const memInfo = await redis.info('memory');
    
    // Parse hit/miss from info
    const hitsMatch = info.match(/keyspace_hits:(\d+)/);
    const missesMatch = info.match(/keyspace_misses:(\d+)/);
    const memMatch = memInfo.match(/used_memory_human:([\d.]+[A-Z]+)/);
    
    const hits = hitsMatch ? parseInt(hitsMatch[1]) : 0;
    const misses = missesMatch ? parseInt(missesMatch[1]) : 0;
    const total = hits + misses;
    
    const keys = await redis.keys('*');
    
    return {
      connected: true,
      hitRate: total > 0 ? Math.round((hits / total) * 100) : 0,
      size: keys.length,
      memory: memMatch ? memMatch[1] : 'unknown',
    };
  } catch (error) {
    logger.error('❌ Failed to get cache stats:', error);
    return { connected: true };
  }
}

/**
 * Warm up cache with common queries
 */
export async function warmUpCache(): Promise<void> {
  logger.info('🔥 Warming up cache...');
  
  // This would pre-cache common knowledge base queries
  // Implementation depends on your specific needs
  
  logger.info('✅ Cache warm-up complete');
}

/**
 * Clear all cache (use with caution)
 */
export async function clearAllCache(): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) return;
  
  try {
    await redis.flushDb();
    logger.info('✅ All cache cleared');
  } catch (error) {
    logger.error('❌ Failed to clear cache:', error);
  }
}

