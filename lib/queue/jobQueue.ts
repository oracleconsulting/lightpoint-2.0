/**
 * Background Job Queue System
 * 
 * Handles long-running tasks asynchronously:
 * - Document OCR processing
 * - Letter generation
 * - Embedding generation
 * - Email notifications
 * - Report generation
 * 
 * Uses Supabase for persistence (Redis upgrade available)
 */

import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '../logger';

export type JobType = 
  | 'document_ocr'
  | 'letter_generation'
  | 'embedding_generation'
  | 'send_email'
  | 'generate_report'
  | 'sync_knowledge_base'
  | 'analyze_complaint';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface Job {
  id: string;
  type: JobType;
  payload: Record<string, any>;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  result?: any;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  scheduledFor?: Date;
}

/**
 * Add a job to the queue
 */
export async function enqueueJob(
  type: JobType,
  payload: Record<string, any>,
  options: {
    priority?: number;
    scheduledFor?: Date;
    maxAttempts?: number;
  } = {}
): Promise<string | null> {
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('job_queue')
      .insert({
        type,
        payload,
        status: 'pending',
        priority: options.priority ?? 5,
        attempts: 0,
        max_attempts: options.maxAttempts ?? 3,
        scheduled_for: options.scheduledFor?.toISOString(),
      })
      .select('id')
      .single();
    
    if (error) {
      logger.error('❌ Failed to enqueue job:', error);
      return null;
    }
    
    logger.info(`📥 Job enqueued: ${type} (${data.id})`);
    return data.id;
  } catch (error) {
    logger.error('❌ Job enqueue error:', error);
    return null;
  }
}

/**
 * Get next available job for processing
 */
export async function dequeueJob(): Promise<Job | null> {
  try {
    // Get next pending job, ordered by priority and creation time
    const { data, error } = await (supabaseAdmin as any)
      .from('job_queue')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // Mark as processing
    await (supabaseAdmin as any)
      .from('job_queue')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
        attempts: data.attempts + 1,
      })
      .eq('id', data.id);
    
    logger.info(`📤 Job dequeued: ${data.type} (${data.id})`);
    
    return {
      id: data.id,
      type: data.type,
      payload: data.payload,
      status: 'processing',
      priority: data.priority,
      attempts: data.attempts + 1,
      maxAttempts: data.max_attempts,
      createdAt: new Date(data.created_at),
      startedAt: new Date(),
    };
  } catch (error) {
    logger.error('❌ Job dequeue error:', error);
    return null;
  }
}

/**
 * Mark job as completed
 */
export async function completeJob(jobId: string, result?: any): Promise<void> {
  try {
    await (supabaseAdmin as any)
      .from('job_queue')
      .update({
        status: 'completed',
        result,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId);
    
    logger.info(`✅ Job completed: ${jobId}`);
  } catch (error) {
    logger.error('❌ Job completion error:', error);
  }
}

/**
 * Mark job as failed
 */
export async function failJob(jobId: string, error: string): Promise<void> {
  try {
    // Get current attempt count
    const { data: job } = await (supabaseAdmin as any)
      .from('job_queue')
      .select('attempts, max_attempts')
      .eq('id', jobId)
      .single();
    
    const shouldRetry = job && job.attempts < job.max_attempts;
    
    await (supabaseAdmin as any)
      .from('job_queue')
      .update({
        status: shouldRetry ? 'pending' : 'failed',
        error,
        // Exponential backoff for retries
        scheduled_for: shouldRetry 
          ? new Date(Date.now() + Math.pow(2, job.attempts) * 60000).toISOString()
          : undefined,
      })
      .eq('id', jobId);
    
    if (shouldRetry) {
      logger.warn(`⚠️ Job failed, will retry: ${jobId} (attempt ${job.attempts}/${job.max_attempts})`);
    } else {
      logger.error(`❌ Job failed permanently: ${jobId}`);
    }
  } catch (err) {
    logger.error('❌ Job failure handling error:', err);
  }
}

/**
 * Cancel a pending job
 */
export async function cancelJob(jobId: string): Promise<boolean> {
  try {
    const { error } = await (supabaseAdmin as any)
      .from('job_queue')
      .update({ status: 'cancelled' })
      .eq('id', jobId)
      .eq('status', 'pending');
    
    if (error) {
      logger.error('❌ Job cancellation error:', error);
      return false;
    }
    
    logger.info(`🚫 Job cancelled: ${jobId}`);
    return true;
  } catch (error) {
    logger.error('❌ Job cancellation error:', error);
    return false;
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<Job | null> {
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from('job_queue')
      .select('*')
      .eq('id', jobId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return {
      id: data.id,
      type: data.type,
      payload: data.payload,
      status: data.status,
      priority: data.priority,
      attempts: data.attempts,
      maxAttempts: data.max_attempts,
      result: data.result,
      error: data.error,
      createdAt: new Date(data.created_at),
      startedAt: data.started_at ? new Date(data.started_at) : undefined,
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    };
  } catch (error) {
    logger.error('❌ Job status error:', error);
    return null;
  }
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}> {
  try {
    const { data } = await (supabaseAdmin as any)
      .from('job_queue')
      .select('status');
    
    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };
    
    (data || []).forEach((job: { status: JobStatus }) => {
      if (job.status in stats) {
        stats[job.status as keyof typeof stats]++;
      }
    });
    
    return stats;
  } catch (error) {
    logger.error('❌ Queue stats error:', error);
    return { pending: 0, processing: 0, completed: 0, failed: 0 };
  }
}

/**
 * Clean up old completed/failed jobs
 */
export async function cleanupOldJobs(daysOld: number = 7): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const { data, error } = await (supabaseAdmin as any)
      .from('job_queue')
      .delete()
      .in('status', ['completed', 'failed', 'cancelled'])
      .lt('created_at', cutoffDate.toISOString())
      .select('id');
    
    if (error) {
      logger.error('❌ Job cleanup error:', error);
      return 0;
    }
    
    const count = data?.length || 0;
    logger.info(`🧹 Cleaned up ${count} old jobs`);
    return count;
  } catch (error) {
    logger.error('❌ Job cleanup error:', error);
    return 0;
  }
}

/**
 * Job processor - runs in background
 */
export async function processJobs(
  handlers: Partial<Record<JobType, (payload: any) => Promise<any>>>,
  options: { pollInterval?: number; maxConcurrent?: number } = {}
): Promise<void> {
  const pollInterval = options.pollInterval ?? 5000;
  const maxConcurrent = options.maxConcurrent ?? 3;
  let activeJobs = 0;
  
  logger.info(`🚀 Job processor started (poll: ${pollInterval}ms, max: ${maxConcurrent})`);
  
  const processNext = async () => {
    if (activeJobs >= maxConcurrent) return;
    
    const job = await dequeueJob();
    if (!job) return;
    
    activeJobs++;
    
    const handler = handlers[job.type];
    if (!handler) {
      await failJob(job.id, `No handler for job type: ${job.type}`);
      activeJobs--;
      return;
    }
    
    try {
      const result = await handler(job.payload);
      await completeJob(job.id, result);
    } catch (error: any) {
      await failJob(job.id, error.message);
    }
    
    activeJobs--;
  };
  
  // Poll for new jobs
  setInterval(async () => {
    while (activeJobs < maxConcurrent) {
      const hadJob = await dequeueJob();
      if (!hadJob) break;
      processNext();
    }
  }, pollInterval);
}

