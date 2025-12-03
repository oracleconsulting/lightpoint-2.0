/**
 * Redis-Based Job Queue
 * 
 * High-performance job queue using Redis for scalability.
 * Replaces Supabase-based queue for production workloads.
 */

import { getRedisClient } from '../cache/redis';
import { logger } from '../logger';

const QUEUE_PREFIX = 'queue:';
const PROCESSING_PREFIX = 'processing:';
const DEAD_LETTER_PREFIX = 'dead:';

export interface RedisJob {
  id: string;
  type: string;
  payload: Record<string, any>;
  priority: number;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  scheduledFor?: number;
}

/**
 * Add job to Redis queue
 */
export async function enqueueRedisJob(
  queueName: string,
  type: string,
  payload: Record<string, any>,
  options: {
    priority?: number;
    scheduledFor?: Date;
    maxAttempts?: number;
  } = {}
): Promise<string | null> {
  const redis = await getRedisClient();
  if (!redis) {
    logger.warn('⚠️ Redis not available, falling back to Supabase queue');
    return null;
  }
  
  const job: RedisJob = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    payload,
    priority: options.priority ?? 5,
    attempts: 0,
    maxAttempts: options.maxAttempts ?? 3,
    createdAt: Date.now(),
    scheduledFor: options.scheduledFor?.getTime(),
  };
  
  try {
    const key = `${QUEUE_PREFIX}${queueName}`;
    const score = job.scheduledFor ?? Date.now() - (job.priority * 1000);
    
    await redis.zAdd(key, {
      score,
      value: JSON.stringify(job),
    });
    
    logger.info(`📥 Job enqueued to Redis: ${type} (${job.id})`);
    return job.id;
  } catch (error) {
    logger.error('❌ Failed to enqueue Redis job:', error);
    return null;
  }
}

/**
 * Dequeue job from Redis
 */
export async function dequeueRedisJob(queueName: string): Promise<RedisJob | null> {
  const redis = await getRedisClient();
  if (!redis) return null;
  
  const queueKey = `${QUEUE_PREFIX}${queueName}`;
  const processingKey = `${PROCESSING_PREFIX}${queueName}`;
  
  try {
    // Get jobs that are ready to process
    const now = Date.now();
    const jobs = await redis.zRangeByScore(queueKey, 0, now, { LIMIT: { offset: 0, count: 1 } });
    
    if (jobs.length === 0) {
      return null;
    }
    
    const jobStr = jobs[0];
    const job: RedisJob = JSON.parse(jobStr);
    
    // Move to processing set
    const multi = redis.multi();
    multi.zRem(queueKey, jobStr);
    multi.hSet(processingKey, job.id, JSON.stringify({
      ...job,
      attempts: job.attempts + 1,
      startedAt: Date.now(),
    }));
    await multi.exec();
    
    logger.info(`📤 Job dequeued from Redis: ${job.type} (${job.id})`);
    
    return { ...job, attempts: job.attempts + 1 };
  } catch (error) {
    logger.error('❌ Failed to dequeue Redis job:', error);
    return null;
  }
}

/**
 * Mark job as completed
 */
export async function completeRedisJob(
  queueName: string,
  jobId: string,
  result?: any
): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) return;
  
  const processingKey = `${PROCESSING_PREFIX}${queueName}`;
  
  try {
    await redis.hDel(processingKey, jobId);
    logger.info(`✅ Redis job completed: ${jobId}`);
  } catch (error) {
    logger.error('❌ Failed to complete Redis job:', error);
  }
}

/**
 * Mark job as failed
 */
export async function failRedisJob(
  queueName: string,
  jobId: string,
  error: string
): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) return;
  
  const processingKey = `${PROCESSING_PREFIX}${queueName}`;
  const queueKey = `${QUEUE_PREFIX}${queueName}`;
  const deadKey = `${DEAD_LETTER_PREFIX}${queueName}`;
  
  try {
    const jobStr = await redis.hGet(processingKey, jobId);
    if (!jobStr) return;
    
    const job: RedisJob & { startedAt?: number } = JSON.parse(jobStr);
    
    // Remove from processing
    await redis.hDel(processingKey, jobId);
    
    if (job.attempts < job.maxAttempts) {
      // Re-queue with exponential backoff
      const delay = Math.pow(2, job.attempts) * 60000; // 1, 2, 4 minutes
      const score = Date.now() + delay;
      
      await redis.zAdd(queueKey, {
        score,
        value: JSON.stringify({ ...job, error }),
      });
      
      logger.warn(`⚠️ Redis job failed, will retry: ${jobId} (attempt ${job.attempts}/${job.maxAttempts})`);
    } else {
      // Move to dead letter queue
      await redis.zAdd(deadKey, {
        score: Date.now(),
        value: JSON.stringify({ ...job, error, failedAt: Date.now() }),
      });
      
      logger.error(`❌ Redis job permanently failed: ${jobId}`);
    }
  } catch (err) {
    logger.error('❌ Failed to handle job failure:', err);
  }
}

/**
 * Get queue statistics
 */
export async function getRedisQueueStats(queueName: string): Promise<{
  pending: number;
  processing: number;
  dead: number;
} | null> {
  const redis = await getRedisClient();
  if (!redis) return null;
  
  try {
    const [pending, processing, dead] = await Promise.all([
      redis.zCard(`${QUEUE_PREFIX}${queueName}`),
      redis.hLen(`${PROCESSING_PREFIX}${queueName}`),
      redis.zCard(`${DEAD_LETTER_PREFIX}${queueName}`),
    ]);
    
    return { pending, processing, dead };
  } catch (error) {
    logger.error('❌ Failed to get queue stats:', error);
    return null;
  }
}

/**
 * Retry dead letter jobs
 */
export async function retryDeadLetterJobs(
  queueName: string,
  limit: number = 10
): Promise<number> {
  const redis = await getRedisClient();
  if (!redis) return 0;
  
  const deadKey = `${DEAD_LETTER_PREFIX}${queueName}`;
  const queueKey = `${QUEUE_PREFIX}${queueName}`;
  
  try {
    const jobs = await redis.zRange(deadKey, 0, limit - 1);
    
    if (jobs.length === 0) return 0;
    
    const multi = redis.multi();
    
    for (const jobStr of jobs) {
      const job: RedisJob = JSON.parse(jobStr);
      
      // Reset attempts and add back to queue
      multi.zRem(deadKey, jobStr);
      multi.zAdd(queueKey, {
        score: Date.now() - (job.priority * 1000),
        value: JSON.stringify({ ...job, attempts: 0 }),
      });
    }
    
    await multi.exec();
    
    logger.info(`🔄 Retried ${jobs.length} dead letter jobs`);
    return jobs.length;
  } catch (error) {
    logger.error('❌ Failed to retry dead letter jobs:', error);
    return 0;
  }
}

/**
 * Process stale jobs (stuck in processing)
 */
export async function recoverStaleJobs(
  queueName: string,
  staleThresholdMs: number = 300000 // 5 minutes
): Promise<number> {
  const redis = await getRedisClient();
  if (!redis) return 0;
  
  const processingKey = `${PROCESSING_PREFIX}${queueName}`;
  const queueKey = `${QUEUE_PREFIX}${queueName}`;
  
  try {
    const jobs = await redis.hGetAll(processingKey);
    const now = Date.now();
    let recovered = 0;
    
    for (const [jobId, jobStr] of Object.entries(jobs)) {
      const job: RedisJob & { startedAt?: number } = JSON.parse(jobStr);
      
      if (job.startedAt && now - job.startedAt > staleThresholdMs) {
        await redis.hDel(processingKey, jobId);
        
        // Re-queue immediately
        await redis.zAdd(queueKey, {
          score: Date.now() - (job.priority * 1000),
          value: JSON.stringify(job),
        });
        
        recovered++;
        logger.warn(`⚠️ Recovered stale job: ${jobId}`);
      }
    }
    
    return recovered;
  } catch (error) {
    logger.error('❌ Failed to recover stale jobs:', error);
    return 0;
  }
}

/**
 * Clean up completed jobs from processing (in case of crashes)
 */
export async function cleanupProcessingQueue(queueName: string): Promise<void> {
  // This would typically be called on startup
  await recoverStaleJobs(queueName, 0); // Recover all
}

