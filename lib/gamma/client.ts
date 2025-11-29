/**
 * Gamma API Client
 * 
 * Integrates with Gamma's public API (v1.0 GA) to generate
 * beautiful visual presentations from blog content.
 * 
 * @see https://gamma.app/docs/api
 */

const GAMMA_API_BASE = 'https://public-api.gamma.app/v1.0';

// ============================================================================
// Types
// ============================================================================

export interface GammaGenerationRequest {
  inputText: string;
  textMode: 'preserve' | 'generate' | 'condense';
  format: 'presentation' | 'document' | 'webpage';
  themeId?: string;
  numCards?: number;
  additionalInstructions?: string;
  exportAs?: 'pdf' | 'pptx';
  textOptions?: {
    amount: 'brief' | 'medium' | 'detailed' | 'extensive';
    tone: string;
    audience: string;
    language: string;
  };
  imageOptions?: {
    source: 'aiGenerated' | 'stock';
    model?: string;
    style?: string;
  };
  cardOptions?: {
    dimensions: 'fluid' | '16x9' | '4x3';
  };
}

export interface GammaGenerationResponse {
  generationId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  gammaUrl?: string;
  exportUrl?: string;
  error?: string;
}

export interface GammaGenerationResult {
  generationId: string;
  gammaUrl: string;
  exportUrl?: string;
  generatedAt: Date;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Start a Gamma generation from blog content
 */
export async function startGammaGeneration(
  blogMarkdown: string,
  title: string,
  options?: Partial<GammaGenerationRequest>
): Promise<GammaGenerationResponse> {
  const apiKey = process.env.GAMMA_API_KEY;
  
  if (!apiKey) {
    throw new Error('GAMMA_API_KEY environment variable is not set');
  }

  const themeId = process.env.GAMMA_THEME_ID;

  const requestBody: GammaGenerationRequest = {
    inputText: `# ${title}\n\n${blogMarkdown}`,
    textMode: 'preserve', // Keep exact content
    format: 'document', // Document style for blog posts
    ...(themeId && { themeId }),
    additionalInstructions: `
      This is a professional blog post for UK accountants about HMRC complaints.
      Maintain the exact content structure and all factual information.
      Use professional, authoritative visuals.
      Include data visualizations for any statistics mentioned.
      Use a clean, professional color scheme (blues and whites).
      Ensure all text is readable and well-formatted.
      Add visual hierarchy with clear headings and sections.
    `,
    exportAs: 'pdf',
    textOptions: {
      amount: 'detailed',
      tone: 'professional, authoritative, helpful',
      audience: 'UK accountants, tax professionals, bookkeepers',
      language: 'en-GB',
    },
    imageOptions: {
      source: 'aiGenerated',
      model: 'imagen-4-pro',
      style: 'professional, clean, business, minimal, modern',
    },
    cardOptions: {
      dimensions: 'fluid',
    },
    ...options,
  };

  const response = await fetch(`${GAMMA_API_BASE}/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gamma API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Check the status of a Gamma generation
 */
export async function getGammaGenerationStatus(
  generationId: string
): Promise<GammaGenerationResponse> {
  const apiKey = process.env.GAMMA_API_KEY;
  
  if (!apiKey) {
    throw new Error('GAMMA_API_KEY environment variable is not set');
  }

  const response = await fetch(`${GAMMA_API_BASE}/generations/${generationId}`, {
    headers: {
      'X-API-KEY': apiKey,
      'accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gamma API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

/**
 * Poll for Gamma generation completion
 */
export async function pollGammaGeneration(
  generationId: string,
  options?: {
    maxAttempts?: number;
    intervalMs?: number;
    onProgress?: (status: string, attempt: number) => void;
  }
): Promise<GammaGenerationResult> {
  const { maxAttempts = 60, intervalMs = 3000, onProgress } = options || {};

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const status = await getGammaGenerationStatus(generationId);
    
    onProgress?.(status.status, attempt);

    if (status.status === 'completed') {
      // Wait a moment for export URL to be ready
      await new Promise(r => setTimeout(r, 1500));
      
      // Fetch final status with export URL
      const finalStatus = await getGammaGenerationStatus(generationId);
      
      if (!finalStatus.gammaUrl) {
        throw new Error('Gamma generation completed but no URL returned');
      }

      return {
        generationId,
        gammaUrl: finalStatus.gammaUrl,
        exportUrl: finalStatus.exportUrl,
        generatedAt: new Date(),
      };
    }

    if (status.status === 'failed') {
      throw new Error(`Gamma generation failed: ${status.error || 'Unknown error'}`);
    }

    // Wait before next poll
    await new Promise(r => setTimeout(r, intervalMs));
  }

  throw new Error(`Gamma generation timed out after ${maxAttempts} attempts`);
}

/**
 * Generate a Gamma presentation from blog content and wait for completion
 */
export async function generateGammaFromBlog(
  blogMarkdown: string,
  title: string,
  options?: {
    generationOptions?: Partial<GammaGenerationRequest>;
    pollOptions?: {
      maxAttempts?: number;
      intervalMs?: number;
      onProgress?: (status: string, attempt: number) => void;
    };
  }
): Promise<GammaGenerationResult> {
  // Start generation
  const generation = await startGammaGeneration(
    blogMarkdown,
    title,
    options?.generationOptions
  );

  if (!generation.generationId) {
    throw new Error('Failed to start Gamma generation - no generation ID returned');
  }

  // Poll for completion
  return pollGammaGeneration(generation.generationId, options?.pollOptions);
}

/**
 * Convert a Gamma URL to an embeddable URL
 */
export function getGammaEmbedUrl(gammaUrl: string): string {
  // Convert https://gamma.app/docs/xxx to https://gamma.app/embed/xxx
  return gammaUrl.replace('/docs/', '/embed/');
}

/**
 * Check if Gamma API is configured
 */
export function isGammaConfigured(): boolean {
  return !!process.env.GAMMA_API_KEY;
}

