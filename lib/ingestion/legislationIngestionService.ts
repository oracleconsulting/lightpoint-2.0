/**
 * UK Legislation Ingestion Service
 *
 * Ingests UK tax legislation from legislation.gov.uk into the knowledge base.
 * Priority acts: TMA 1970, FA 2009 Schedules 55/56, FA 2007 Schedule 24,
 * VATA 1994 ss59/62/63/71, FA 2021 Schedule 26.
 *
 * Each section is stored as a separate knowledge base entry with category 'Legislation'.
 */

import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '@/lib/embeddings';
import { logger } from '@/lib/logger';
import type { LegislationConfig, LegislationSection } from './types';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error('Supabase credentials not configured');
  }
  return createClient(url, key);
}

export interface LegislationIngestionSummary {
  actIdentifier: string;
  sectionsFound: number;
  sectionsAdded: number;
  sectionsUpdated: number;
  errors: Array<{ section: string; error: string }>;
  duration: number;
}

/** Priority legislation for penalty appeals */
export const LEGISLATION_CONFIGS: LegislationConfig[] = [
  { identifier: 'TMA1970', name: 'Taxes Management Act 1970', shortName: 'TMA 1970', sourceUrl: 'https://www.legislation.gov.uk/ukpga/1970/9', category: 'Legislation', documentType: 'legislation' },
  { identifier: 'FA2009', name: 'Finance Act 2009', shortName: 'FA 2009', sourceUrl: 'https://www.legislation.gov.uk/ukpga/2009/10', category: 'Legislation', documentType: 'legislation' },
  { identifier: 'FA2007', name: 'Finance Act 2007', shortName: 'FA 2007', sourceUrl: 'https://www.legislation.gov.uk/ukpga/2007/11', category: 'Legislation', documentType: 'legislation' },
  { identifier: 'VATA1994', name: 'Value Added Tax Act 1994', shortName: 'VATA 1994', sourceUrl: 'https://www.legislation.gov.uk/ukpga/1994/23', category: 'Legislation', documentType: 'legislation' },
  { identifier: 'FA2021', name: 'Finance Act 2021', shortName: 'FA 2021', sourceUrl: 'https://www.legislation.gov.uk/ukpga/2021/26', category: 'Legislation', documentType: 'legislation' },
];

/**
 * Fetch and parse legislation XML from legislation.gov.uk.
 * Uses the legislation.gov.uk API /data.xml endpoint.
 */
async function fetchLegislationSections(
  config: LegislationConfig,
  sectionIds: string[]
): Promise<LegislationSection[]> {
  const sections: LegislationSection[] = [];

  for (const sectionId of sectionIds) {
    try {
      const url = `${config.sourceUrl}/data.xml`;
      const res = await fetch(url, { headers: { Accept: 'application/xml' } });
      if (!res.ok) continue;

      const xml = await res.text();
      // Parse XML to extract section - simplified; full impl would use xml2js or similar
      const sectionMatch = xml.match(new RegExp(`<primary:P[^>]*id="${sectionId}"[^>]*>([\\s\\S]*?)</primary:P>`, 'i'));
      if (sectionMatch) {
        const content = sectionMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        sections.push({
          actIdentifier: config.identifier,
          sectionNumber: sectionId,
          title: `${config.shortName} ${sectionId}`,
          content: content || `Section ${sectionId} of ${config.name}`,
          relatedSections: [],
          sourceUrl: `${config.sourceUrl}#${sectionId}`,
          effectiveDate: null,
          amendments: [],
        });
      }
    } catch (e) {
      logger.warn(`Could not fetch ${config.shortName} ${sectionId}:`, e);
    }
  }

  return sections;
}

/**
 * Ingest legislation sections into the knowledge base.
 */
export async function ingestLegislationSections(
  config: LegislationConfig,
  sectionIds: string[],
  onProgress?: (current: number, total: number) => void
): Promise<LegislationIngestionSummary> {
  const start = Date.now();
  const summary: LegislationIngestionSummary = {
    actIdentifier: config.identifier,
    sectionsFound: 0,
    sectionsAdded: 0,
    sectionsUpdated: 0,
    errors: [],
    duration: 0,
  };

  const supabase = getSupabaseClient();
  const sections = await fetchLegislationSections(config, sectionIds);
  summary.sectionsFound = sections.length;

  for (let i = 0; i < sections.length; i++) {
    onProgress?.(i + 1, sections.length);
    const section = sections[i];
    try {
      const embedding = await generateEmbedding(
        `${config.shortName} ${section.sectionNumber}\n${section.title}\n${section.content}`
      );
      const citationFormat = `${config.shortName} ${section.sectionNumber}`;

      const record = {
        category: config.category,
        title: section.title,
        content: section.content,
        source: config.name,
        source_url: section.sourceUrl,
        source_verified_at: new Date().toISOString(),
        verification_status: 'verified',
        section_reference: section.sectionNumber,
        manual_code: config.identifier,
        citation_format: citationFormat,
        document_type: config.documentType,
        embedding,
        last_checked_at: new Date().toISOString(),
        metadata: { actIdentifier: config.identifier },
      };

      const { data: existing } = await supabase
        .from('knowledge_base')
        .select('id')
        .eq('section_reference', section.sectionNumber)
        .eq('manual_code', config.identifier)
        .eq('verification_status', 'verified')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase.from('knowledge_base').update(record).eq('id', existing.id);
        if (error) summary.errors.push({ section: section.sectionNumber, error: error.message });
        else summary.sectionsUpdated++;
      } else {
        const { error } = await supabase.from('knowledge_base').insert(record);
        if (error) summary.errors.push({ section: section.sectionNumber, error: error.message });
        else summary.sectionsAdded++;
      }
    } catch (e: any) {
      summary.errors.push({ section: section.sectionNumber, error: e?.message || String(e) });
    }
  }

  summary.duration = Date.now() - start;
  logger.info(`Legislation ingestion complete: ${config.shortName} ${sections.length} sections in ${summary.duration}ms`);
  return summary;
}

/** Key sections for penalty appeals - TMA 1970 */
export const TMA1970_SECTIONS = ['s7', 's8', 's9A', 's59B', 's93', 's100', 's118'];

/** Ingest TMA 1970 key sections */
export async function ingestTMA1970KeySections(): Promise<LegislationIngestionSummary> {
  const config = LEGISLATION_CONFIGS.find(c => c.identifier === 'TMA1970');
  if (!config) throw new Error('TMA 1970 config not found');
  return ingestLegislationSections(config, TMA1970_SECTIONS);
}
