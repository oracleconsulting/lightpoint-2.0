/**
 * HMRC Manual Ingestion Service
 * 
 * Orchestrates the full ingestion pipeline:
 * 1. Crawl manual from GOV.UK
 * 2. Chunk sections with hierarchy preservation
 * 3. Generate embeddings (text-embedding-3-large)
 * 4. Upsert to Supabase knowledge base
 * 5. Log ingestion for audit trail
 */

import { createClient } from '@supabase/supabase-js';
import { 
  HMRCManualConfig, 
  ManualIngestionSummary, 
  IngestionResult,
  IngestionProgressCallback,
  HMRC_MANUAL_CONFIGS,
  getManualConfigsByPriority,
} from './types';
import { crawlManual, checkManualAccessible } from './hmrcManualCrawler';
import { chunkManualSections, ManualChunk, estimateEmbeddingCost } from './hmrcChunking';
import { generateEmbeddingsBatch } from '../embeddings';
import { logger } from '../logger';

// Initialize Supabase client
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }
  
  return createClient(url, key);
}

/**
 * Check if a section already exists and if content has changed
 */
async function checkExistingSection(
  supabase: ReturnType<typeof getSupabaseClient>,
  sectionReference: string,
  manualCode: string,
  chunkIndex: number,
  newContent: string
): Promise<{ exists: boolean; changed: boolean; existingId?: string }> {
  const { data, error } = await supabase
    .from('knowledge_base')
    .select('id, content')
    .eq('section_reference', sectionReference)
    .eq('manual_code', manualCode)
    .eq('verification_status', 'verified')
    .single();
  
  if (error || !data) {
    return { exists: false, changed: false };
  }
  
  // Compare content (simple string comparison)
  const changed = data.content !== newContent;
  
  return { exists: true, changed, existingId: data.id };
}

/**
 * Insert or update a chunk in the knowledge base
 */
async function upsertChunk(
  supabase: ReturnType<typeof getSupabaseClient>,
  chunk: ManualChunk,
  embedding: number[],
  config: HMRCManualConfig
): Promise<IngestionResult> {
  const { exists, changed, existingId } = await checkExistingSection(
    supabase,
    chunk.sectionReference,
    chunk.manualCode,
    chunk.chunkIndex,
    chunk.content
  );
  
  const now = new Date().toISOString();
  
  const record = {
    category: config.category,
    title: chunk.title,
    content: chunk.content,
    source: `HMRC ${config.code}`,
    source_url: chunk.sourceUrl,
    source_verified_at: now,
    verification_status: 'verified',
    section_reference: chunk.sectionReference,
    manual_code: chunk.manualCode,
    parent_section: chunk.parentSection,
    breadcrumb: chunk.breadcrumb,
    citation_format: chunk.citationFormat,
    document_type: config.documentType,
    embedding,
    last_checked_at: now,
    metadata: {
      chunkIndex: chunk.chunkIndex,
      totalChunks: chunk.totalChunks,
      ingestedAt: now,
    },
  };
  
  try {
    if (!exists) {
      // Insert new record
      const { error } = await supabase
        .from('knowledge_base')
        .insert(record);
      
      if (error) {
        logger.error(`Insert error for ${chunk.sectionReference}:`, error);
        return { sectionReference: chunk.sectionReference, status: 'error', error: error.message };
      }
      return { sectionReference: chunk.sectionReference, status: 'added' };
    }
    
    if (changed) {
      // Update existing record
      const { error } = await supabase
        .from('knowledge_base')
        .update(record)
        .eq('id', existingId);
      
      if (error) {
        logger.error(`Update error for ${chunk.sectionReference}:`, error);
        return { sectionReference: chunk.sectionReference, status: 'error', error: error.message };
      }
      return { sectionReference: chunk.sectionReference, status: 'updated' };
    }
    
    // Update only last_checked_at if unchanged
    await supabase
      .from('knowledge_base')
      .update({ last_checked_at: now })
      .eq('id', existingId);
    
    return { sectionReference: chunk.sectionReference, status: 'unchanged' };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { sectionReference: chunk.sectionReference, status: 'error', error: errorMessage };
  }
}

/**
 * Log ingestion run to database
 */
async function logIngestion(
  supabase: ReturnType<typeof getSupabaseClient>,
  config: HMRCManualConfig,
  summary: ManualIngestionSummary,
  startedAt: Date
): Promise<void> {
  try {
    await supabase.from('knowledge_ingestion_log').insert({
      source_type: 'hmrc_manual',
      source_identifier: config.code,
      ingestion_started_at: startedAt.toISOString(),
      ingestion_completed_at: new Date().toISOString(),
      sections_found: summary.sectionsFound,
      sections_added: summary.sectionsAdded,
      sections_updated: summary.sectionsUpdated,
      sections_unchanged: summary.sectionsUnchanged,
      errors: summary.errors,
      status: summary.errors.length > 0 ? 'partial' : 'completed',
    });
  } catch (err) {
    logger.error('Failed to log ingestion:', err);
  }
}

/**
 * Ingest a single HMRC manual
 * 
 * Full pipeline:
 * 1. Crawl all sections from GOV.UK
 * 2. Chunk sections while preserving hierarchy
 * 3. Generate embeddings in batches
 * 4. Upsert chunks to database
 * 5. Log ingestion run
 * 
 * @param config - Manual configuration
 * @param onProgress - Optional progress callback
 * @returns Summary of ingestion run
 */
export async function ingestHMRCManual(
  config: HMRCManualConfig,
  onProgress?: IngestionProgressCallback
): Promise<ManualIngestionSummary> {
  const startTime = Date.now();
  const startedAt = new Date();
  const supabase = getSupabaseClient();
  
  logger.info(`\n${'='.repeat(60)}`);
  logger.info(`🚀 Starting ingestion of ${config.code}: ${config.name}`);
  logger.info(`${'='.repeat(60)}\n`);
  
  try {
    // Check if manual is accessible
    const accessible = await checkManualAccessible(config);
    if (!accessible) {
      throw new Error(`Manual ${config.code} is not accessible at ${config.baseUrl}${config.indexPath}`);
    }
    
    // Stage 1: Crawl
    logger.info('📥 Stage 1: Crawling manual from GOV.UK...');
    onProgress?.('crawling', 0, 0);
    
    const sections = await crawlManual(config, (current, total) => {
      onProgress?.('crawling', current, total);
    });
    
    if (sections.length === 0) {
      throw new Error(`No sections found in manual ${config.code}`);
    }
    
    logger.info(`   ✅ Crawled ${sections.length} sections\n`);
    
    // Stage 2: Chunk
    logger.info('📦 Stage 2: Chunking sections...');
    onProgress?.('chunking', 0, sections.length);
    
    const chunks = chunkManualSections(sections, config.code);
    
    // Estimate embedding cost
    const { tokens, cost } = estimateEmbeddingCost(chunks);
    logger.info(`   📊 Estimated: ${tokens.toLocaleString()} tokens, $${cost.toFixed(4)} cost\n`);
    
    // Stage 3: Generate embeddings in batches
    logger.info('🧠 Stage 3: Generating embeddings (text-embedding-3-large)...');
    onProgress?.('embedding', 0, chunks.length);
    
    const embeddingTexts = chunks.map(c => c.embeddingText);
    const embeddings = await generateEmbeddingsBatch(embeddingTexts, 'primary', 50);
    
    logger.info(`   ✅ Generated ${embeddings.length} embeddings\n`);
    
    // Stage 4: Upsert to database
    logger.info('💾 Stage 4: Storing in knowledge base...');
    const results: IngestionResult[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
      onProgress?.('storing', i + 1, chunks.length);
      
      const result = await upsertChunk(supabase, chunks[i], embeddings[i], config);
      results.push(result);
      
      // Log progress periodically
      if ((i + 1) % 100 === 0) {
        logger.info(`   Progress: ${i + 1}/${chunks.length}`);
      }
    }
    
    // Build summary
    const summary: ManualIngestionSummary = {
      manualCode: config.code,
      sectionsFound: sections.length,
      sectionsAdded: results.filter(r => r.status === 'added').length,
      sectionsUpdated: results.filter(r => r.status === 'updated').length,
      sectionsUnchanged: results.filter(r => r.status === 'unchanged').length,
      errors: results
        .filter(r => r.status === 'error')
        .map(r => ({ section: r.sectionReference, error: r.error || 'Unknown error' })),
      duration: Date.now() - startTime,
    };
    
    // Log ingestion run
    await logIngestion(supabase, config, summary, startedAt);
    
    // Final summary
    logger.info(`\n${'='.repeat(60)}`);
    logger.info(`✅ Ingestion complete: ${config.code}`);
    logger.info(`${'='.repeat(60)}`);
    logger.info(`   Sections crawled:  ${summary.sectionsFound}`);
    logger.info(`   Chunks added:      ${summary.sectionsAdded}`);
    logger.info(`   Chunks updated:    ${summary.sectionsUpdated}`);
    logger.info(`   Chunks unchanged:  ${summary.sectionsUnchanged}`);
    logger.info(`   Errors:            ${summary.errors.length}`);
    logger.info(`   Duration:          ${(summary.duration / 1000).toFixed(1)}s`);
    logger.info(`${'='.repeat(60)}\n`);
    
    if (summary.errors.length > 0 && summary.errors.length <= 10) {
      logger.warn('Errors:');
      summary.errors.forEach(e => logger.warn(`   - ${e.section}: ${e.error}`));
    }
    
    return summary;
    
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`❌ Ingestion failed for ${config.code}: ${errorMessage}`);
    
    const failedSummary: ManualIngestionSummary = {
      manualCode: config.code,
      sectionsFound: 0,
      sectionsAdded: 0,
      sectionsUpdated: 0,
      sectionsUnchanged: 0,
      errors: [{ section: 'FATAL', error: errorMessage }],
      duration: Date.now() - startTime,
    };
    
    await logIngestion(supabase, config, failedSummary, startedAt);
    
    return failedSummary;
  }
}

/**
 * Ingest all configured HMRC manuals in priority order
 * 
 * @param onProgress - Optional progress callback (manual, stage, current, total)
 * @returns Array of summaries for each manual
 */
export async function ingestAllHMRCManuals(
  onProgress?: (manual: string, stage: string, current: number, total: number) => void
): Promise<ManualIngestionSummary[]> {
  const summaries: ManualIngestionSummary[] = [];
  const configs = getManualConfigsByPriority();
  
  logger.info(`\n${'#'.repeat(60)}`);
  logger.info(`# HMRC Manual Ingestion: ${configs.length} manuals`);
  logger.info(`${'#'.repeat(60)}\n`);
  
  for (let i = 0; i < configs.length; i++) {
    const config = configs[i];
    
    logger.info(`\n[${i + 1}/${configs.length}] Processing ${config.code}...`);
    
    const summary = await ingestHMRCManual(config, (stage, current, total) => {
      onProgress?.(config.code, stage, current, total);
    });
    
    summaries.push(summary);
    
    // Brief pause between manuals to avoid overwhelming servers
    if (i < configs.length - 1) {
      logger.info('   Pausing 2s before next manual...');
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  // Final summary
  const totalAdded = summaries.reduce((sum, s) => sum + s.sectionsAdded, 0);
  const totalUpdated = summaries.reduce((sum, s) => sum + s.sectionsUpdated, 0);
  const totalErrors = summaries.reduce((sum, s) => sum + s.errors.length, 0);
  const totalDuration = summaries.reduce((sum, s) => sum + s.duration, 0);
  
  logger.info(`\n${'#'.repeat(60)}`);
  logger.info(`# ALL INGESTION COMPLETE`);
  logger.info(`${'#'.repeat(60)}`);
  logger.info(`   Total manuals:     ${summaries.length}`);
  logger.info(`   Total chunks added:   ${totalAdded}`);
  logger.info(`   Total chunks updated: ${totalUpdated}`);
  logger.info(`   Total errors:         ${totalErrors}`);
  logger.info(`   Total duration:       ${(totalDuration / 1000 / 60).toFixed(1)} minutes`);
  logger.info(`${'#'.repeat(60)}\n`);
  
  return summaries;
}

/**
 * Ingest a single manual by code
 */
export async function ingestManualByCode(
  manualCode: string,
  onProgress?: IngestionProgressCallback
): Promise<ManualIngestionSummary> {
  const config = HMRC_MANUAL_CONFIGS.find(c => c.code === manualCode);
  
  if (!config) {
    throw new Error(`Unknown manual code: ${manualCode}. Available: ${HMRC_MANUAL_CONFIGS.map(c => c.code).join(', ')}`);
  }
  
  return ingestHMRCManual(config, onProgress);
}

/**
 * Check which manuals need updating (haven't been checked in N days)
 */
export async function checkManualsNeedingUpdate(
  staleDays: number = 30
): Promise<Array<{ code: string; staleCount: number }>> {
  const supabase = getSupabaseClient();
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - staleDays);
  
  const results: Array<{ code: string; staleCount: number }> = [];
  
  for (const config of HMRC_MANUAL_CONFIGS) {
    const { count } = await supabase
      .from('knowledge_base')
      .select('id', { count: 'exact', head: true })
      .eq('manual_code', config.code)
      .lt('last_checked_at', staleDate.toISOString());
    
    if (count && count > 0) {
      results.push({ code: config.code, staleCount: count });
    }
  }
  
  return results;
}

/**
 * Get ingestion statistics for a manual
 */
export async function getIngestionStats(manualCode: string): Promise<{
  totalChunks: number;
  lastIngestion: Date | null;
  oldestChunk: Date | null;
}> {
  const supabase = getSupabaseClient();
  
  const { count } = await supabase
    .from('knowledge_base')
    .select('id', { count: 'exact', head: true })
    .eq('manual_code', manualCode);
  
  const { data: latestLog } = await supabase
    .from('knowledge_ingestion_log')
    .select('ingestion_completed_at')
    .eq('source_identifier', manualCode)
    .eq('status', 'completed')
    .order('ingestion_completed_at', { ascending: false })
    .limit(1)
    .single();
  
  const { data: oldestChunk } = await supabase
    .from('knowledge_base')
    .select('last_checked_at')
    .eq('manual_code', manualCode)
    .order('last_checked_at', { ascending: true })
    .limit(1)
    .single();
  
  return {
    totalChunks: count || 0,
    lastIngestion: latestLog?.ingestion_completed_at ? new Date(latestLog.ingestion_completed_at) : null,
    oldestChunk: oldestChunk?.last_checked_at ? new Date(oldestChunk.last_checked_at) : null,
  };
}

