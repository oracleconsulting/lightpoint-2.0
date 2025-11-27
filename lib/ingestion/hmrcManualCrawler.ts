/**
 * HMRC Manual Crawler
 * 
 * Crawls HMRC internal manuals from GOV.UK to extract structured content.
 * 
 * GOV.UK structure:
 * - Index page lists all sections with links
 * - Each section page has consistent HTML structure
 * - Section references follow pattern: {MANUAL_CODE}{SECTION_NUMBER}
 * 
 * Rate limiting is applied to be respectful to GOV.UK servers.
 */

import * as cheerio from 'cheerio';
import { HMRCManualConfig, HMRCManualSection } from './types';
import { logger } from '../logger';

// Configuration
const RATE_LIMIT_MS = 250; // 250ms between requests - be polite to GOV.UK
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Custom user agent identifying the crawler
 */
const USER_AGENT = 'Lightpoint-KB-Ingestion/1.0 (Professional tax complaint system; contact: support@lightpoint.app)';

/**
 * Fetch with retry logic and timeout
 */
async function fetchWithRetry(url: string, retries = MAX_RETRIES): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-GB,en;q=0.9',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.text();
    } catch (error) {
      if (attempt === retries) {
        logger.error(`Failed to fetch ${url} after ${retries} attempts:`, error);
        throw error;
      }
      logger.warn(`Retry ${attempt}/${retries} for ${url}`);
      await new Promise(r => setTimeout(r, RATE_LIMIT_MS * attempt));
    }
  }
  throw new Error('Max retries exceeded');
}

/**
 * Sleep for rate limiting
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract all section URLs from manual index page
 * 
 * GOV.UK manual index pages have a nested structure with links to all sections.
 */
export async function getManualSectionUrls(config: HMRCManualConfig): Promise<string[]> {
  const indexUrl = `${config.baseUrl}${config.indexPath}`;
  logger.info(`📚 Fetching manual index: ${indexUrl}`);
  
  const html = await fetchWithRetry(indexUrl);
  const $ = cheerio.load(html);
  
  const sectionUrls: Set<string> = new Set();
  const manualSlug = config.indexPath.split('/').pop() || '';
  
  // GOV.UK manual pages have section links in various places
  // Look for links that match the manual pattern
  $('a').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;
    
    // Check if this is a link to a manual section
    const isManualLink = href.includes('/hmrc-internal-manuals/') && 
                         href.includes(manualSlug) &&
                         href !== config.indexPath;
    
    if (isManualLink) {
      // Normalize to absolute URL
      const fullUrl = href.startsWith('/') 
        ? `${config.baseUrl}${href}` 
        : href;
      
      // Skip the index page itself and anchor links
      if (!fullUrl.includes('#') && fullUrl !== indexUrl) {
        sectionUrls.add(fullUrl);
      }
    }
  });
  
  const urls = Array.from(sectionUrls);
  logger.info(`📖 Found ${urls.length} sections in ${config.code}`);
  
  return urls;
}

/**
 * Parse a single manual section page
 * 
 * Extracts:
 * - Section reference from URL
 * - Title from h1
 * - Breadcrumb navigation
 * - Main content
 * - Internal links to other sections
 */
export async function parseManualSection(
  url: string,
  config: HMRCManualConfig
): Promise<HMRCManualSection | null> {
  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);
    
    // Extract section reference from URL
    // URL pattern: /hmrc-internal-manuals/debt-management-and-banking/dmbm210105
    const urlParts = url.split('/');
    const sectionSlug = urlParts[urlParts.length - 1];
    const sectionReference = sectionSlug.toUpperCase();
    
    // Validate section reference matches expected pattern
    if (!sectionReference.startsWith(config.code)) {
      logger.warn(`Section ${sectionReference} doesn't match manual ${config.code}, skipping`);
      return null;
    }
    
    // Extract title - GOV.UK uses h1 for page title
    let title = $('h1').first().text().trim();
    
    // Sometimes the title includes the section reference, clean it up
    title = title.replace(new RegExp(`^${sectionReference}\\s*[-–:]?\\s*`, 'i'), '').trim();
    
    // If no title found, use section reference
    if (!title) {
      title = sectionReference;
    }
    
    // Extract breadcrumb
    const breadcrumb: string[] = [];
    const breadcrumbSelectors = [
      '.gem-c-breadcrumbs__list-item',
      '.govuk-breadcrumbs__list-item',
      '.breadcrumb-trail li',
    ];
    
    for (const selector of breadcrumbSelectors) {
      $(selector).each((_, el) => {
        const text = $(el).text().trim();
        if (text && !['Home', 'HMRC internal manuals', 'Contents'].includes(text)) {
          breadcrumb.push(text);
        }
      });
      if (breadcrumb.length > 0) break;
    }
    
    // Extract main content
    let content = '';
    const contentSelectors = [
      '.gem-c-govspeak',
      '.govuk-govspeak', 
      '.manual-body',
      '.manuals-frontend-content',
      'article .content',
      '#guide-content',
      'main article',
    ];
    
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        // Remove navigation elements, headers, footers from content
        element.find('nav, .gem-c-breadcrumbs, .govuk-breadcrumbs, .gem-c-document-list').remove();
        content = element.text().trim();
        break;
      }
    }
    
    // If still no content, fall back to main element
    if (!content) {
      const main = $('main');
      main.find('nav, header, footer, .gem-c-breadcrumbs').remove();
      content = main.text().trim();
    }
    
    // Clean up content - remove excessive whitespace
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/^\s+|\s+$/gm, '')
      .trim();
    
    // Extract internal links to other manual sections
    const internalLinks: Set<string> = new Set();
    const manualSlug = config.indexPath.split('/').pop() || '';
    
    $('a').each((_, element) => {
      const href = $(element).attr('href');
      if (href && href.includes('/hmrc-internal-manuals/') && href.includes(manualSlug)) {
        const linkSlug = href.split('/').pop();
        if (linkSlug) {
          const linkSection = linkSlug.toUpperCase();
          if (linkSection !== sectionReference && linkSection.startsWith(config.code)) {
            internalLinks.add(linkSection);
          }
        }
      }
    });
    
    // Try to find parent section from navigation
    let parentSection: string | null = null;
    const parentLink = $('a.govuk-back-link, .gem-c-pagination__link--previous, .previous-page').attr('href');
    if (parentLink && parentLink.includes('/hmrc-internal-manuals/')) {
      const parentSlug = parentLink.split('/').pop()?.toUpperCase();
      if (parentSlug && parentSlug !== sectionReference && parentSlug.startsWith(config.code)) {
        parentSection = parentSlug;
      }
    }
    
    // Skip sections with no meaningful content
    if (!content || content.length < 50) {
      logger.debug(`Skipping ${sectionReference}: no meaningful content (${content.length} chars)`);
      return null;
    }
    
    return {
      sectionReference,
      title,
      content,
      parentSection,
      breadcrumb,
      sourceUrl: url,
      internalLinks: Array.from(internalLinks),
      lastModified: null, // Could extract from page metadata if available
    };
    
  } catch (error) {
    logger.error(`Error parsing ${url}:`, error);
    return null;
  }
}

/**
 * Crawl entire manual with rate limiting
 * 
 * @param config - Manual configuration
 * @param onProgress - Progress callback (current, total)
 * @returns Array of parsed sections
 */
export async function crawlManual(
  config: HMRCManualConfig,
  onProgress?: (current: number, total: number) => void
): Promise<HMRCManualSection[]> {
  logger.info(`🕷️ Starting crawl of ${config.code}: ${config.name}`);
  
  const sectionUrls = await getManualSectionUrls(config);
  const sections: HMRCManualSection[] = [];
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < sectionUrls.length; i++) {
    const url = sectionUrls[i];
    
    try {
      const section = await parseManualSection(url, config);
      if (section) {
        sections.push(section);
        successCount++;
      }
    } catch (error) {
      errorCount++;
      logger.error(`Failed to parse section at ${url}:`, error);
    }
    
    // Progress callback
    if (onProgress) {
      onProgress(i + 1, sectionUrls.length);
    }
    
    // Rate limiting between requests
    if (i < sectionUrls.length - 1) {
      await sleep(RATE_LIMIT_MS);
    }
    
    // Log progress periodically
    if ((i + 1) % 50 === 0) {
      logger.info(`  Progress: ${i + 1}/${sectionUrls.length} (${sections.length} sections extracted)`);
    }
  }
  
  logger.info(`✅ Crawl complete: ${sections.length} sections from ${sectionUrls.length} URLs`);
  if (errorCount > 0) {
    logger.warn(`  ⚠️ ${errorCount} errors during crawl`);
  }
  
  return sections;
}

/**
 * Get a single section by reference (for targeted updates)
 */
export async function getSectionByReference(
  config: HMRCManualConfig,
  sectionReference: string
): Promise<HMRCManualSection | null> {
  const sectionSlug = sectionReference.toLowerCase();
  const url = `${config.baseUrl}${config.indexPath}/${sectionSlug}`;
  
  logger.info(`Fetching single section: ${url}`);
  return parseManualSection(url, config);
}

/**
 * Check if a manual index is accessible
 */
export async function checkManualAccessible(config: HMRCManualConfig): Promise<boolean> {
  try {
    const indexUrl = `${config.baseUrl}${config.indexPath}`;
    const response = await fetch(indexUrl, {
      method: 'HEAD',
      headers: { 'User-Agent': USER_AGENT },
    });
    return response.ok;
  } catch {
    return false;
  }
}

