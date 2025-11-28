/**
 * Embedding Generation Module
 * 
 * Updated to use text-embedding-3-large (3072 dimensions) for maximum quality.
 * This aligns with the schema expectation of VECTOR(3072).
 * 
 * Quality is prioritised over speed/cost for this application.
 */
import { logger } from './logger';
import { 
  EMBEDDING_CONFIG, 
  EmbeddingModelKey, 
  DEFAULT_EMBEDDING_MODEL,
  getEmbeddingConfig 
} from './config/embeddingConfig';

// API endpoints
const OPENROUTER_EMBEDDINGS_URL = 'https://openrouter.ai/api/v1/embeddings';
const VOYAGE_EMBEDDINGS_URL = 'https://api.voyageai.com/v1/embeddings';

/**
 * Generate embedding for text using configured model
 * 
 * @param text - Text to embed
 * @param modelKey - Model to use (defaults to primary: text-embedding-3-large)
 * @returns Embedding vector (3072 dimensions for primary model)
 */
export async function generateEmbedding(
  text: string,
  modelKey: EmbeddingModelKey = DEFAULT_EMBEDDING_MODEL
): Promise<number[]> {
  const config = getEmbeddingConfig(modelKey);
  
  // Truncate text if too long
  const truncatedText = text.length > config.maxChars 
    ? text.substring(0, config.maxChars) 
    : text;

  if (text.length > config.maxChars) {
    logger.warn(`⚠️ Text truncated from ${text.length} to ${config.maxChars} chars for embedding`);
  }

  if (config.provider === 'openai') {
    return generateOpenAIEmbedding(truncatedText, config.model, config.dimensions);
  }
  
  if (config.provider === 'voyage') {
    return generateVoyageEmbedding(truncatedText, config.model);
  }
  
  // This should never happen with current config, but TypeScript needs the exhaustive check
  throw new Error(`Unknown embedding provider: ${(config as { provider: string }).provider}`);
}

/**
 * Generate embedding via OpenRouter (for OpenAI models)
 */
async function generateOpenAIEmbedding(
  text: string, 
  model: string,
  dimensions: number
): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  try {
    const response = await fetch(OPENROUTER_EMBEDDINGS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://lightpoint.app',
        'X-Title': 'Lightpoint HMRC Complaint System',
      },
      body: JSON.stringify({
        model: `openai/${model}`,
        input: text,
        dimensions, // Specify dimensions for text-embedding-3-large
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('OpenRouter embedding API error:', error);
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (!data.data?.[0]?.embedding) {
      logger.error('Unexpected OpenRouter response:', JSON.stringify(data).substring(0, 200));
      throw new Error('Invalid embedding response from OpenRouter');
    }
    
    return data.data[0].embedding;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error generating OpenAI embedding:', error);
    throw new Error(`Failed to generate embedding: ${errorMessage}`);
  }
}

/**
 * Generate embedding via Voyage AI (for legal-tuned models)
 */
async function generateVoyageEmbedding(text: string, model: string): Promise<number[]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY is not configured');
  }

  try {
    const response = await fetch(VOYAGE_EMBEDDINGS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('Voyage embedding API error:', error);
      throw new Error(`Voyage API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (!data.data?.[0]?.embedding) {
      logger.error('Unexpected Voyage response:', JSON.stringify(data).substring(0, 200));
      throw new Error('Invalid embedding response from Voyage');
    }
    
    return data.data[0].embedding;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Error generating Voyage embedding:', error);
    throw new Error(`Failed to generate Voyage embedding: ${errorMessage}`);
  }
}

/**
 * Generate embeddings for multiple texts in batch
 * Supports batching with rate limiting for large ingestion jobs
 * 
 * @param texts - Array of texts to embed
 * @param modelKey - Model to use (defaults to primary)
 * @param batchSize - Number of texts to process in each API call (default 100)
 * @returns Array of embedding vectors
 */
export async function generateEmbeddingsBatch(
  texts: string[],
  modelKey: EmbeddingModelKey = DEFAULT_EMBEDDING_MODEL,
  batchSize: number = 100
): Promise<number[][]> {
  const config = getEmbeddingConfig(modelKey);
  const results: number[][] = [];
  
  logger.info(`📊 Generating ${texts.length} embeddings in batches of ${batchSize} using ${config.model}`);
  
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize).map(t => 
      t.length > config.maxChars ? t.substring(0, config.maxChars) : t
    );
    
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(texts.length / batchSize);
    logger.info(`  Processing batch ${batchNum}/${totalBatches} (${batch.length} texts)`);
    
    if (config.provider === 'openai') {
      const batchEmbeddings = await generateOpenAIEmbeddingsBatch(batch, config.model, config.dimensions);
      results.push(...batchEmbeddings);
    } else if (config.provider === 'voyage') {
      const batchEmbeddings = await generateVoyageEmbeddingsBatch(batch, config.model);
      results.push(...batchEmbeddings);
    } else {
      // This should never happen with current config, but TypeScript needs the exhaustive check
      throw new Error(`Unknown embedding provider: ${(config as { provider: string }).provider}`);
    }
    
    // Rate limiting: small delay between batches to avoid hitting rate limits
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  logger.info(`✅ Generated ${results.length} embeddings successfully`);
  return results;
}

/**
 * Batch embedding via OpenRouter
 */
async function generateOpenAIEmbeddingsBatch(
  texts: string[],
  model: string,
  dimensions: number
): Promise<number[][]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  try {
    const response = await fetch(OPENROUTER_EMBEDDINGS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://lightpoint.app',
        'X-Title': 'Lightpoint HMRC Complaint System',
      },
      body: JSON.stringify({
        model: `openai/${model}`,
        input: texts,
        dimensions,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter batch API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      logger.error('Unexpected OpenRouter batch response:', JSON.stringify(data).substring(0, 200));
      throw new Error('Invalid batch embeddings response from OpenRouter');
    }
    
    // Sort by index to ensure correct order
    const sorted = data.data.sort((a: { index: number }, b: { index: number }) => a.index - b.index);
    return sorted.map((item: { embedding: number[] }) => item.embedding);
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    logger.error('Error generating batch embeddings:', errorMessage);
    throw new Error(`Failed to generate batch embeddings: ${errorMessage}`);
  }
}

/**
 * Batch embedding via Voyage AI
 */
async function generateVoyageEmbeddingsBatch(
  texts: string[],
  model: string
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY;
  
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY is not configured');
  }

  try {
    const response = await fetch(VOYAGE_EMBEDDINGS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Voyage batch API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      logger.error('Unexpected Voyage batch response:', JSON.stringify(data).substring(0, 200));
      throw new Error('Invalid batch embeddings response from Voyage');
    }
    
    return data.data.map((item: { embedding: number[] }) => item.embedding);
  } catch (error) {
    logger.error('Error generating Voyage batch embeddings:', error);
    throw new Error('Failed to generate Voyage batch embeddings');
  }
}

/**
 * Estimate tokens for a text (rough approximation)
 * ~4 characters per token on average
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Re-export config for convenience
export { EMBEDDING_CONFIG, DEFAULT_EMBEDDING_MODEL, getEmbeddingConfig };
export type { EmbeddingModelKey };
