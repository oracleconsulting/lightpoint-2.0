/**
 * AI Layout Generator Utility
 * Client-side helper to call the AI layout generation API
 * Uses Claude via OpenRouter + NanoBanana for images
 */

import type { BlogLayout } from '../types';

export interface AILayoutRequest {
  title: string;
  subtitle?: string;
  content: string;
  authorName?: string;
  category?: string;
}

export interface AILayoutResponse {
  success: boolean;
  layout?: BlogLayout;
  stats?: {
    componentCount: number;
    componentTypes: string[];
  };
  error?: string;
}

/**
 * Generate a layout using AI (Claude via OpenRouter)
 * This produces higher quality layouts than pattern detection
 * Images are generated with NanoBanana (Gemini 3 Pro)
 */
export async function generateLayoutWithAI(
  request: AILayoutRequest
): Promise<BlogLayout> {
  const response = await fetch('/api/blog/generate-layout-ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(errorData.error || `AI layout generation failed: ${response.status}`);
  }

  const data: AILayoutResponse = await response.json();

  if (!data.success || !data.layout) {
    throw new Error(data.error || 'AI layout generation returned empty result');
  }

  return data.layout;
}

/**
 * Check if AI layout generation is available
 * (API key configured)
 */
export async function isAILayoutAvailable(): Promise<boolean> {
  try {
    const response = await fetch('/api/blog/generate-layout-ai', {
      method: 'GET',
    });
    const data = await response.json();
    return data.status === 'ok' && data.hasApiKey;
  } catch {
    return false;
  }
}

