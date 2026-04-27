import * as cheerio from 'cheerio';
import type { ParsedCitation } from './parser';

export interface BailiiResult {
  found: boolean;
  url: string;
  caseName?: string;
  title?: string;
  details?: Record<string, unknown>;
  error?: string;
}

function padFtNumber(number: number): string {
  return `TC${String(number).padStart(5, '0')}`;
}

export function buildBailiiUrl(parsed: ParsedCitation): string | null {
  if (parsed.court === 'EWCA Civ') {
    return `https://www.bailii.org/ew/cases/EWCA/Civ/${parsed.year}/${parsed.number}.html`;
  }
  if (parsed.court === 'EWHC Admin') {
    return `https://www.bailii.org/ew/cases/EWHC/Admin/${parsed.year}/${parsed.number}.html`;
  }
  if (parsed.court === 'UKFTT' && parsed.division === 'TC') {
    return `https://www.bailii.org/uk/cases/UKFTT/TC/${parsed.year}/${padFtNumber(parsed.number)}.html`;
  }
  if (parsed.court === 'UKUT' && parsed.division === 'TCC') {
    return `https://www.bailii.org/uk/cases/UKUT/TCC/${parsed.year}/${parsed.number}.html`;
  }
  if (parsed.court === 'UKSC') {
    return `https://www.bailii.org/uk/cases/UKSC/${parsed.year}/${parsed.number}.html`;
  }
  return null;
}

export async function fetchFromBailii(parsed: ParsedCitation): Promise<BailiiResult> {
  const url = buildBailiiUrl(parsed);
  if (!url) {
    return { found: false, url: '', error: `Unsupported citation court/division: ${parsed.raw}` };
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Lightpoint citation verifier (professional legal research; contact: support@lightpoint.app)',
      },
    });
    if (!response.ok) {
      return { found: false, url, error: `BAILII returned ${response.status}` };
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const title = $('title').text().replace(/\s+/g, ' ').trim();
    const h1 = $('h1').first().text().replace(/\s+/g, ' ').trim();
    const h2 = $('h2').first().text().replace(/\s+/g, ' ').trim();
    const caseName = h1 || h2 || title.replace(/\s*\[.*$/, '').trim();

    return {
      found: true,
      url,
      caseName,
      title,
      details: {
        h1,
        h2,
        title,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown BAILII fetch error';
    return { found: false, url, error: message };
  }
}
