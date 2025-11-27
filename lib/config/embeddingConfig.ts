/**
 * Embedding Model Configuration
 * 
 * We use text-embedding-3-large (3072 dimensions) for maximum quality.
 * Quality of retrieval is prioritised over speed/cost for this application.
 * 
 * NOTE: This aligns the codebase with the schema expectation of VECTOR(3072)
 */

export const EMBEDDING_CONFIG = {
  // Primary model for all knowledge base content - HIGHEST QUALITY
  primary: {
    model: 'text-embedding-3-large',
    provider: 'openai' as const,
    dimensions: 3072,
    maxTokens: 8191,
    maxChars: 30000, // Conservative estimate (~4 chars per token)
    costPer1M: 0.13, // USD per 1M tokens
    notes: 'Best retrieval performance, aligns with schema VECTOR(3072)',
  },
  
  // Cost-efficient alternative (for staging/testing environments)
  costEfficient: {
    model: 'text-embedding-3-small',
    provider: 'openai' as const,
    dimensions: 1536,
    maxTokens: 8191,
    maxChars: 30000,
    costPer1M: 0.02, // USD per 1M tokens
    notes: '6.5x cheaper, use with reranker for acceptable quality',
  },
  
  // Domain-specific for legal content (consider for case law)
  legal: {
    model: 'voyage-law-2',
    provider: 'voyage' as const,
    dimensions: 1024,
    maxTokens: 16000,
    maxChars: 60000,
    costPer1M: 0.12, // USD per 1M tokens
    notes: 'Legal-tuned, tops legal retrieval benchmarks (requires Voyage API)',
  },
} as const;

export type EmbeddingModelKey = keyof typeof EMBEDDING_CONFIG;
export type EmbeddingProvider = 'openai' | 'voyage';

/**
 * Default to primary (highest quality) - text-embedding-3-large
 * This matches the schema expectation of VECTOR(3072)
 */
export const DEFAULT_EMBEDDING_MODEL: EmbeddingModelKey = 'primary';

/**
 * Get embedding config for a specific model
 */
export function getEmbeddingConfig(modelKey: EmbeddingModelKey = DEFAULT_EMBEDDING_MODEL) {
  return EMBEDDING_CONFIG[modelKey];
}

/**
 * Get the dimensions for the active embedding model
 */
export function getEmbeddingDimensions(modelKey: EmbeddingModelKey = DEFAULT_EMBEDDING_MODEL): number {
  return EMBEDDING_CONFIG[modelKey].dimensions;
}

/**
 * Estimate cost for embedding a certain number of tokens
 */
export function estimateEmbeddingCost(
  tokenCount: number,
  modelKey: EmbeddingModelKey = DEFAULT_EMBEDDING_MODEL
): number {
  const config = EMBEDDING_CONFIG[modelKey];
  return (tokenCount / 1_000_000) * config.costPer1M;
}

/**
 * Check if Voyage API is available for legal embeddings
 */
export function isVoyageAvailable(): boolean {
  return Boolean(process.env.VOYAGE_API_KEY);
}

