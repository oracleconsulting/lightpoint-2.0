/**
 * Parallel AI Operations
 * 
 * Utilities for running AI operations in parallel to reduce latency.
 * Includes rate limiting, error handling, and result aggregation.
 */

import { logger } from '../logger';

interface ParallelResult<T> {
  results: T[];
  errors: Error[];
  duration: number;
}

/**
 * Run multiple async operations in parallel with concurrency limit
 */
export async function runParallel<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number = 3
): Promise<ParallelResult<T>> {
  const startTime = Date.now();
  const results: T[] = [];
  const errors: Error[] = [];
  
  // Process in batches
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    
    const batchResults = await Promise.allSettled(batch.map(fn => fn()));
    
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        errors.push(result.reason);
        logger.error(`❌ Parallel task ${i + index} failed:`, result.reason);
      }
    });
  }
  
  const duration = Date.now() - startTime;
  
  logger.info(`✅ Parallel execution complete: ${results.length}/${tasks.length} succeeded in ${duration}ms`);
  
  return { results, errors, duration };
}

/**
 * Run AI analysis operations in parallel
 * Used for multi-document analysis
 */
export async function parallelAnalysis<T>(
  documents: { id: string; content: string }[],
  analyzeFunc: (content: string) => Promise<T>,
  concurrency: number = 2 // Lower concurrency for AI to avoid rate limits
): Promise<Map<string, T | Error>> {
  const startTime = Date.now();
  const resultMap = new Map<string, T | Error>();
  
  const tasks = documents.map(doc => async () => {
    const result = await analyzeFunc(doc.content);
    return { id: doc.id, result };
  });
  
  const { results, errors } = await runParallel(tasks, concurrency);
  
  results.forEach(({ id, result }) => {
    resultMap.set(id, result);
  });
  
  // Map errors back to documents (best effort)
  errors.forEach((error, index) => {
    if (index < documents.length) {
      resultMap.set(documents[index].id, error);
    }
  });
  
  logger.info(`📊 Parallel analysis: ${resultMap.size} documents in ${Date.now() - startTime}ms`);
  
  return resultMap;
}

/**
 * Run multiple AI providers in parallel (for comparison or fallback)
 */
export async function raceProviders<T>(
  providers: { name: string; fn: () => Promise<T> }[],
  timeout: number = 30000
): Promise<{ result: T; provider: string; duration: number }> {
  const startTime = Date.now();
  
  // Create timeout promise
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('All providers timed out')), timeout);
  });
  
  // Race all providers
  const providerPromises = providers.map(async ({ name, fn }) => {
    try {
      const result = await fn();
      return { result, provider: name, duration: Date.now() - startTime };
    } catch (error) {
      logger.error(`❌ Provider ${name} failed:`, error);
      throw error;
    }
  });
  
  try {
    return await Promise.race([...providerPromises, timeoutPromise]);
  } catch (error) {
    // If all fail, throw the first error
    throw error;
  }
}

/**
 * Batch similar AI requests to reduce API calls
 */
export class AIBatcher<TInput, TOutput> {
  private queue: { input: TInput; resolve: (output: TOutput) => void; reject: (error: Error) => void }[] = [];
  private batchSize: number;
  private batchDelay: number;
  private batchFn: (inputs: TInput[]) => Promise<TOutput[]>;
  private timer: NodeJS.Timeout | null = null;
  
  constructor(
    batchFn: (inputs: TInput[]) => Promise<TOutput[]>,
    batchSize: number = 10,
    batchDelay: number = 100
  ) {
    this.batchFn = batchFn;
    this.batchSize = batchSize;
    this.batchDelay = batchDelay;
  }
  
  async add(input: TInput): Promise<TOutput> {
    return new Promise((resolve, reject) => {
      this.queue.push({ input, resolve, reject });
      
      // Process immediately if batch is full
      if (this.queue.length >= this.batchSize) {
        this.processBatch();
      } else {
        // Otherwise, wait for more items
        if (!this.timer) {
          this.timer = setTimeout(() => this.processBatch(), this.batchDelay);
        }
      }
    });
  }
  
  private async processBatch(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    
    if (this.queue.length === 0) return;
    
    const batch = this.queue.splice(0, this.batchSize);
    const inputs = batch.map(item => item.input);
    
    try {
      logger.info(`🔄 Processing batch of ${inputs.length} items`);
      const outputs = await this.batchFn(inputs);
      
      batch.forEach((item, index) => {
        if (index < outputs.length) {
          item.resolve(outputs[index]);
        } else {
          item.reject(new Error('No output for batch item'));
        }
      });
    } catch (error) {
      batch.forEach(item => {
        item.reject(error as Error);
      });
    }
    
    // Process remaining items
    if (this.queue.length > 0) {
      this.processBatch();
    }
  }
}

/**
 * Retry with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, attempt);
        logger.warn(`⚠️ Retry ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

