/**
 * Generate embedding for text using OpenRouter
 * Using text-embedding-ada-002 via OpenRouter API (1536 dimensions)
 */
import { logger } from './/logger';

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  // Truncate text if too long (embedding models have token limits)
  // text-embedding-ada-002 has a limit of 8191 tokens (~30,000 chars)
  const MAX_CHARS = 30000;
  const truncatedText = text.length > MAX_CHARS 
    ? text.substring(0, MAX_CHARS) 
    : text;

  if (text.length > MAX_CHARS) {
    logger.warn(`⚠️ Text truncated from ${text.length} to ${MAX_CHARS} chars for embedding`);
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://lightpoint.app',
        'X-Title': 'Lightpoint HMRC Complaint System',
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-ada-002',
        input: truncatedText,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('OpenRouter embedding API error:', error);
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    // OpenRouter returns the same format as OpenAI
    if (!data.data || !data.data[0] || !data.data[0].embedding) {
      logger.error('Unexpected OpenRouter response:', JSON.stringify(data).substring(0, 200));
      throw new Error('Invalid embedding response from OpenRouter');
    }
    
    return data.data[0].embedding;
  } catch (error: any) {
    logger.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message || 'Unknown error'}`);
  }
};

/**
 * Generate embeddings for multiple texts in batch
 */
export const generateEmbeddingsBatch = async (texts: string[]): Promise<number[][]> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://lightpoint.app',
        'X-Title': 'Lightpoint HMRC Complaint System',
      },
      body: JSON.stringify({
        model: 'openai/text-embedding-ada-002',
        input: texts,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    
    if (!data.data || !Array.isArray(data.data)) {
      logger.error('Unexpected OpenRouter response:', JSON.stringify(data).substring(0, 200));
      throw new Error('Invalid embeddings response from OpenRouter');
    }
    
    return data.data.map((item: any) => item.embedding);
  } catch (error) {
    logger.error('Error generating embeddings:', error);
    throw new Error('Failed to generate embeddings');
  }
};

