/**
 * Multi-Region Configuration
 * 
 * Configures the application for multi-region deployment.
 * Supports Railway, Vercel, and other cloud providers.
 */

import { logger } from '../logger';

// Supported regions
export const REGIONS = {
  'eu-west-1': { name: 'Europe (London)', timezone: 'Europe/London' },
  'eu-central-1': { name: 'Europe (Frankfurt)', timezone: 'Europe/Berlin' },
  'us-east-1': { name: 'US East (Virginia)', timezone: 'America/New_York' },
  'us-west-2': { name: 'US West (Oregon)', timezone: 'America/Los_Angeles' },
  'ap-southeast-1': { name: 'Asia Pacific (Singapore)', timezone: 'Asia/Singapore' },
} as const;

export type Region = keyof typeof REGIONS;

/**
 * Get current region from environment
 */
export function getCurrentRegion(): Region {
  // Railway
  const railwayRegion = process.env.RAILWAY_REGION;
  if (railwayRegion && railwayRegion in REGIONS) {
    return railwayRegion as Region;
  }
  
  // Vercel
  const vercelRegion = process.env.VERCEL_REGION;
  if (vercelRegion) {
    // Map Vercel regions to our regions
    const vercelMap: Record<string, Region> = {
      'lhr1': 'eu-west-1',
      'fra1': 'eu-central-1',
      'iad1': 'us-east-1',
      'pdx1': 'us-west-2',
      'sin1': 'ap-southeast-1',
    };
    if (vercelMap[vercelRegion]) {
      return vercelMap[vercelRegion];
    }
  }
  
  // AWS Lambda
  const awsRegion = process.env.AWS_REGION;
  if (awsRegion && awsRegion in REGIONS) {
    return awsRegion as Region;
  }
  
  // Default to EU
  return 'eu-west-1';
}

/**
 * Get region-specific configuration
 */
export function getRegionConfig(region: Region = getCurrentRegion()): {
  region: Region;
  name: string;
  timezone: string;
  supabaseUrl: string;
  redisUrl: string | undefined;
} {
  const regionInfo = REGIONS[region];
  
  // In a full multi-region setup, you'd have per-region URLs
  // For now, we use environment variables with region fallback
  const supabaseUrl = process.env[`SUPABASE_URL_${region.toUpperCase().replace(/-/g, '_')}`] 
    || process.env.NEXT_PUBLIC_SUPABASE_URL 
    || '';
  
  const redisUrl = process.env[`REDIS_URL_${region.toUpperCase().replace(/-/g, '_')}`]
    || process.env.REDIS_URL;
  
  return {
    region,
    name: regionInfo.name,
    timezone: regionInfo.timezone,
    supabaseUrl,
    redisUrl,
  };
}

/**
 * Get nearest region for a given country code
 */
export function getNearestRegion(countryCode: string): Region {
  const regionMap: Record<string, Region> = {
    // Europe
    'GB': 'eu-west-1', 'IE': 'eu-west-1', 'FR': 'eu-west-1', 'ES': 'eu-west-1', 'PT': 'eu-west-1',
    'DE': 'eu-central-1', 'AT': 'eu-central-1', 'CH': 'eu-central-1', 'NL': 'eu-central-1', 'BE': 'eu-central-1',
    'IT': 'eu-central-1', 'PL': 'eu-central-1', 'CZ': 'eu-central-1', 'DK': 'eu-central-1', 'SE': 'eu-central-1',
    
    // Americas
    'US': 'us-east-1', 'CA': 'us-east-1', 'MX': 'us-west-2', 'BR': 'us-east-1',
    
    // Asia Pacific
    'SG': 'ap-southeast-1', 'MY': 'ap-southeast-1', 'AU': 'ap-southeast-1', 'NZ': 'ap-southeast-1',
    'JP': 'ap-southeast-1', 'KR': 'ap-southeast-1', 'IN': 'ap-southeast-1', 'HK': 'ap-southeast-1',
  };
  
  return regionMap[countryCode.toUpperCase()] || 'eu-west-1';
}

/**
 * Health check for multi-region setup
 */
export async function multiRegionHealthCheck(): Promise<{
  region: Region;
  healthy: boolean;
  latencies: Record<string, number>;
}> {
  const currentRegion = getCurrentRegion();
  const latencies: Record<string, number> = {};
  
  // Test connectivity to regional services
  const config = getRegionConfig(currentRegion);
  
  // Test Supabase
  try {
    const start = Date.now();
    const response = await fetch(`${config.supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '' },
    });
    latencies['supabase'] = Date.now() - start;
  } catch {
    latencies['supabase'] = -1;
  }
  
  // Test Redis
  if (config.redisUrl) {
    try {
      const { getRedisClient } = await import('../cache/redis');
      const redis = await getRedisClient();
      if (redis) {
        const start = Date.now();
        await redis.ping();
        latencies['redis'] = Date.now() - start;
      }
    } catch {
      latencies['redis'] = -1;
    }
  }
  
  const healthy = Object.values(latencies).every(l => l >= 0);
  
  return {
    region: currentRegion,
    healthy,
    latencies,
  };
}

/**
 * Region-aware request routing hints
 */
export function getRoutingHeaders(region: Region): Record<string, string> {
  return {
    'X-Region': region,
    'X-Region-Name': REGIONS[region].name,
    'X-Timezone': REGIONS[region].timezone,
  };
}

/**
 * Data residency check - ensure data stays in correct region
 */
export function isDataResidencyCompliant(
  userRegion: Region,
  dataRegion: Region
): boolean {
  // For GDPR, EU data must stay in EU
  const euRegions: Region[] = ['eu-west-1', 'eu-central-1'];
  
  if (euRegions.includes(userRegion)) {
    return euRegions.includes(dataRegion);
  }
  
  // For other regions, any region is acceptable
  return true;
}

/**
 * Get regional database connection string
 */
export function getRegionalDatabaseUrl(region: Region = getCurrentRegion()): string {
  // Check for region-specific override
  const envKey = `DATABASE_URL_${region.toUpperCase().replace(/-/g, '_')}`;
  const regionalUrl = process.env[envKey];
  
  if (regionalUrl) {
    return regionalUrl;
  }
  
  // Fall back to default
  return process.env.DATABASE_URL || '';
}

/**
 * Initialize region-specific services
 */
export async function initializeRegionalServices(): Promise<void> {
  const region = getCurrentRegion();
  const config = getRegionConfig(region);
  
  logger.info(`🌍 Initializing services for region: ${config.name} (${region})`);
  
  // Validate configuration
  if (!config.supabaseUrl) {
    logger.warn('⚠️ Supabase URL not configured for region');
  }
  
  if (!config.redisUrl) {
    logger.warn('⚠️ Redis URL not configured for region - caching disabled');
  }
  
  logger.info(`✅ Regional services initialized`);
}

