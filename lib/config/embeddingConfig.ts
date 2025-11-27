/**
 * Embedding Model Configuration
 * 
 * We use text-embedding-3-large (3072 dimensions) for maximum quality.
 * Quality of retrieval is prioritised over speed/cost for this application.
 * 
 * NOTE: This aligns the codebase with the schema expectation of VECTOR(3072)
 */

export const EMBEDDING_CONFIG = {
  // Primary model - text-embedding-3-large at reduced dimensions
  // Uses Matryoshka representation: 1536 dims = ~98% quality of full 3072
  // Better than ada-002, HNSW index compatible (max 2000 dims)
  primary: {
    model: 'text-embedding-3-large',
    provider: 'openai' as const,
    dimensions: 1536, // Reduced from 3072 for HNSW compatibility
    maxTokens: 8191,
    maxChars: 30000,
    costPer1M: 0.13,
    notes: 'Best quality at HNSW-compatible dimensions',
  },
  
  // Cost-efficient alternative
  small: {
    model: 'text-embedding-3-small',
    provider: 'openai' as const,
    dimensions: 1536,
    maxTokens: 8191,
    maxChars: 30000,
    costPer1M: 0.02,
    notes: '6.5x cheaper, ~90% quality of large',
  },
  
  // Domain-specific for legal content (future use)
  legal: {
    model: 'voyage-law-2',
    provider: 'voyage' as const,
    dimensions: 1024,
    maxTokens: 16000,
    maxChars: 60000,
    costPer1M: 0.12,
    notes: 'Legal-tuned for case law (requires Voyage API)',
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

