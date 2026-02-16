/**
 * HMRC Knowledge Ingestion Module
 * 
 * This module provides the infrastructure for ingesting HMRC internal manuals,
 * tribunal case law, and legislation into the Lightpoint knowledge base.
 * 
 * Usage:
 * ```typescript
 * import { 
 *   ingestHMRCManual, 
 *   ingestManualByCode,
 *   HMRC_MANUAL_CONFIGS 
 * } from '@/lib/ingestion';
 * 
 * // Ingest a single manual
 * const summary = await ingestManualByCode('DMBM');
 * 
 * // Ingest all manuals
 * const summaries = await ingestAllHMRCManuals();
 * ```
 */

// Types
export type {
  HMRCManualConfig,
  HMRCManualSection,
  IngestionResult,
  ManualIngestionSummary,
  IngestionProgressCallback,
  TribunalConfig,
  TribunalCase,
  LegislationConfig,
  LegislationSection,
} from './types';

// Constants
export { HMRC_MANUAL_CONFIGS, getManualConfig, getManualConfigsByPriority } from './types';

// Crawler
export { 
  crawlManual, 
  getManualSectionUrls, 
  parseManualSection,
  getSectionByReference,
  checkManualAccessible,
} from './hmrcManualCrawler';

// Chunking
export { 
  chunkManualSection, 
  chunkManualSections, 
  estimateEmbeddingCost,
} from './hmrcChunking';
export type { ManualChunk } from './hmrcChunking';

// Ingestion Service
export {
  ingestHMRCManual,
  ingestAllHMRCManuals,
  ingestManualByCode,
  checkManualsNeedingUpdate,
  getIngestionStats,
} from './hmrcIngestionService';

export {
  ingestLegislationSections,
  ingestTMA1970KeySections,
  LEGISLATION_CONFIGS,
  TMA1970_SECTIONS,
} from './legislationIngestionService';

export { ingestCaseLaw, PRIORITY_CASES } from './caseLawIngestionService';

