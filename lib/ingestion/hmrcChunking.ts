/**
 * Section-Aware Chunking for HMRC Manuals
 * 
 * Chunking strategy optimised for HMRC manual content:
 * 
 * 1. Preserve section boundaries - never split mid-section if possible
 * 2. Include hierarchical context (breadcrumb) in each chunk for better retrieval
 * 3. Keep chunks under 2000 chars for optimal embedding quality
 * 4. If section exceeds limit, split at paragraph boundaries with overlap
 * 5. Include manual code and section reference in embedding text
 */

import { HMRCManualSection } from './types';
import { logger } from '../logger';

/**
 * Chunked content ready for embedding and storage
 */
export interface ManualChunk {
  /** Original section reference (e.g., 'DMBM210105') */
  sectionReference: string;
  /** Chunk index within section (0 for single-chunk sections) */
  chunkIndex: number;
  /** Total chunks for this section */
  totalChunks: number;
  /** Section title */
  title: string;
  /** Chunk content (stored in database) */
  content: string;
  /** Text used for embedding (includes context) */
  embeddingText: string;
  /** Parent section reference (for hierarchy) */
  parentSection: string | null;
  /** Navigation breadcrumb */
  breadcrumb: string[];
  /** Source URL */
  sourceUrl: string;
  /** Manual code */
  manualCode: string;
  /** Formatted citation for referencing */
  citationFormat: string;
}

// Chunking configuration
const MAX_CHUNK_SIZE = 2000;     // Characters per chunk
const MIN_CHUNK_SIZE = 200;      // Minimum viable chunk size
const OVERLAP_SIZE = 100;        // Character overlap between chunks
const CONTEXT_PREFIX_MAX = 200;  // Max chars for context prefix

/**
 * Build context prefix for embedding
 * 
 * This hierarchical context helps retrieval by including:
 * - Manual name and code
 * - Breadcrumb navigation
 * - Section reference and title
 */
function buildEmbeddingContext(
  section: HMRCManualSection, 
  manualCode: string
): string {
  const parts: string[] = [];
  
  // Add manual context
  const manualNames: Record<string, string> = {
    'DMBM': 'Debt Management and Banking Manual',
    'ARTG': 'Appeals Reviews and Tribunals Guidance',
    'CH': 'Compliance Handbook',
    'SAM': 'Self Assessment Manual',
    'EM': 'Enquiry Manual',
    'PAYE': 'PAYE Manual',
  };
  
  const manualName = manualNames[manualCode] || `${manualCode} Manual`;
  parts.push(`HMRC ${manualCode}: ${manualName}`);
  
  // Add breadcrumb context (truncated if too long)
  if (section.breadcrumb.length > 0) {
    const breadcrumbText = section.breadcrumb.join(' > ');
    if (breadcrumbText.length <= 100) {
      parts.push(breadcrumbText);
    } else {
      // Take first and last two breadcrumb items
      const first = section.breadcrumb.slice(0, 1);
      const last = section.breadcrumb.slice(-2);
      parts.push([...first, '...', ...last].join(' > '));
    }
  }
  
  // Add section reference and title
  parts.push(`Section ${section.sectionReference}: ${section.title}`);
  
  // Ensure context doesn't exceed max length
  let context = parts.join(' | ');
  if (context.length > CONTEXT_PREFIX_MAX) {
    context = context.substring(0, CONTEXT_PREFIX_MAX - 3) + '...';
  }
  
  return context;
}

/**
 * Split content at paragraph boundaries
 */
function splitAtParagraphs(content: string): string[] {
  return content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 0);
}

/**
 * Split content at sentence boundaries (fallback for large paragraphs)
 */
function splitAtSentences(content: string): string[] {
  // Split on sentence-ending punctuation followed by space or newline
  return content
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Chunk a single manual section
 * 
 * Strategy:
 * 1. If section fits in one chunk, use it as-is
 * 2. If section is too large, split at paragraph boundaries
 * 3. Merge small paragraphs together
 * 4. Add overlap between chunks for context continuity
 */
export function chunkManualSection(
  section: HMRCManualSection,
  manualCode: string
): ManualChunk[] {
  const contextPrefix = buildEmbeddingContext(section, manualCode);
  const baseCitation = section.sectionReference;
  
  // If section is small enough, keep as single chunk
  if (section.content.length <= MAX_CHUNK_SIZE) {
    return [{
      sectionReference: section.sectionReference,
      chunkIndex: 0,
      totalChunks: 1,
      title: section.title,
      content: section.content,
      embeddingText: `${contextPrefix}\n\n${section.content}`,
      parentSection: section.parentSection,
      breadcrumb: section.breadcrumb,
      sourceUrl: section.sourceUrl,
      manualCode,
      citationFormat: baseCitation,
    }];
  }
  
  // Split at paragraph boundaries
  const paragraphs = splitAtParagraphs(section.content);
  const chunks: ManualChunk[] = [];
  let currentChunk = '';
  let chunkIndex = 0;
  
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    
    // If paragraph itself is too large, split at sentences
    if (paragraph.length > MAX_CHUNK_SIZE) {
      // First, save current chunk if we have one
      if (currentChunk.length >= MIN_CHUNK_SIZE) {
        chunks.push(createChunk(
          section, manualCode, contextPrefix, currentChunk, chunkIndex, baseCitation
        ));
        chunkIndex++;
        currentChunk = '';
      }
      
      // Split large paragraph at sentences
      const sentences = splitAtSentences(paragraph);
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length + 1 > MAX_CHUNK_SIZE && currentChunk.length >= MIN_CHUNK_SIZE) {
          chunks.push(createChunk(
            section, manualCode, contextPrefix, currentChunk, chunkIndex, baseCitation
          ));
          chunkIndex++;
          
          // Start new chunk with overlap
          const overlap = currentChunk.slice(-OVERLAP_SIZE);
          currentChunk = overlap + ' ' + sentence;
        } else {
          currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
        }
      }
      continue;
    }
    
    // If adding this paragraph would exceed limit, save current chunk
    if (currentChunk.length + paragraph.length + 2 > MAX_CHUNK_SIZE && currentChunk.length >= MIN_CHUNK_SIZE) {
      chunks.push(createChunk(
        section, manualCode, contextPrefix, currentChunk, chunkIndex, baseCitation
      ));
      chunkIndex++;
      
      // Start new chunk with overlap from end of previous
      const overlap = currentChunk.slice(-OVERLAP_SIZE);
      currentChunk = overlap + '\n\n' + paragraph;
    } else {
      // Add paragraph to current chunk
      currentChunk = currentChunk ? `${currentChunk}\n\n${paragraph}` : paragraph;
    }
  }
  
  // Don't forget the last chunk
  if (currentChunk.length >= MIN_CHUNK_SIZE) {
    chunks.push(createChunk(
      section, manualCode, contextPrefix, currentChunk, chunkIndex, baseCitation
    ));
  } else if (currentChunk.length > 0 && chunks.length > 0) {
    // Append small remainder to last chunk
    const lastChunk = chunks[chunks.length - 1];
    lastChunk.content += '\n\n' + currentChunk;
    lastChunk.embeddingText = `${contextPrefix}\n\n${lastChunk.content}`;
  }
  
  // Update totalChunks for all chunks
  const totalChunks = chunks.length;
  chunks.forEach(chunk => {
    chunk.totalChunks = totalChunks;
  });
  
  return chunks;
}

/**
 * Helper to create a chunk object
 */
function createChunk(
  section: HMRCManualSection,
  manualCode: string,
  contextPrefix: string,
  content: string,
  chunkIndex: number,
  baseCitation: string
): ManualChunk {
  const trimmedContent = content.trim();
  return {
    sectionReference: section.sectionReference,
    chunkIndex,
    totalChunks: 0, // Will be updated after all chunks created
    title: section.title,
    content: trimmedContent,
    embeddingText: `${contextPrefix}\n\n${trimmedContent}`,
    parentSection: section.parentSection,
    breadcrumb: section.breadcrumb,
    sourceUrl: section.sourceUrl,
    manualCode,
    citationFormat: chunkIndex > 0 ? `${baseCitation} (part ${chunkIndex + 1})` : baseCitation,
  };
}

/**
 * Chunk all sections from a manual
 * 
 * @param sections - Parsed manual sections
 * @param manualCode - Manual code (e.g., 'DMBM')
 * @returns Array of chunks ready for embedding
 */
export function chunkManualSections(
  sections: HMRCManualSection[],
  manualCode: string
): ManualChunk[] {
  const allChunks: ManualChunk[] = [];
  let totalOriginalChars = 0;
  
  for (const section of sections) {
    totalOriginalChars += section.content.length;
    const chunks = chunkManualSection(section, manualCode);
    allChunks.push(...chunks);
  }
  
  // Log statistics
  const avgChunkSize = allChunks.length > 0 
    ? Math.round(allChunks.reduce((sum, c) => sum + c.content.length, 0) / allChunks.length)
    : 0;
  
  logger.info(`📦 Chunking complete for ${manualCode}:`);
  logger.info(`   ${sections.length} sections → ${allChunks.length} chunks`);
  logger.info(`   ${Math.round(totalOriginalChars / 1000)}K chars total`);
  logger.info(`   Average chunk size: ${avgChunkSize} chars`);
  
  return allChunks;
}

/**
 * Estimate embedding cost for chunks
 */
export function estimateEmbeddingCost(
  chunks: ManualChunk[],
  costPer1MTokens: number = 0.13 // text-embedding-3-large
): { tokens: number; cost: number } {
  // Rough estimate: 4 chars per token
  const totalChars = chunks.reduce((sum, c) => sum + c.embeddingText.length, 0);
  const estimatedTokens = Math.ceil(totalChars / 4);
  const cost = (estimatedTokens / 1_000_000) * costPer1MTokens;
  
  return { tokens: estimatedTokens, cost };
}

