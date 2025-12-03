/**
 * Edge Caching & CDN Optimization
 * 
 * Configures caching headers for optimal CDN performance.
 * Works with Cloudflare, Vercel Edge, Railway, etc.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '../logger';

// Cache durations in seconds
export const CACHE_DURATIONS = {
  STATIC: 31536000,       // 1 year - immutable assets
  SEMI_STATIC: 86400,     // 1 day - rarely changing
  DYNAMIC: 60,            // 1 minute - frequently changing
  REALTIME: 0,            // No cache - user-specific
  STALE_WHILE_REVALIDATE: 604800, // 1 week stale allowed
};

/**
 * Generate cache control header
 */
export function getCacheControl(options: {
  maxAge: number;
  sMaxAge?: number;
  staleWhileRevalidate?: number;
  staleIfError?: number;
  private?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
}): string {
  if (options.noStore) {
    return 'no-store, no-cache, must-revalidate';
  }

  const directives: string[] = [];
  
  if (options.private) {
    directives.push('private');
  } else {
    directives.push('public');
  }
  
  directives.push(`max-age=${options.maxAge}`);
  
  if (options.sMaxAge !== undefined) {
    directives.push(`s-maxage=${options.sMaxAge}`);
  }
  
  if (options.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`);
  }
  
  if (options.staleIfError !== undefined) {
    directives.push(`stale-if-error=${options.staleIfError}`);
  }
  
  if (options.mustRevalidate) {
    directives.push('must-revalidate');
  }
  
  return directives.join(', ');
}

/**
 * Add caching headers to response
 */
export function withCacheHeaders(
  response: NextResponse,
  cacheType: 'static' | 'semi-static' | 'dynamic' | 'private' | 'none'
): NextResponse {
  switch (cacheType) {
    case 'static':
      response.headers.set('Cache-Control', getCacheControl({
        maxAge: CACHE_DURATIONS.STATIC,
        sMaxAge: CACHE_DURATIONS.STATIC,
        staleWhileRevalidate: CACHE_DURATIONS.STALE_WHILE_REVALIDATE,
      }));
      response.headers.set('CDN-Cache-Control', `max-age=${CACHE_DURATIONS.STATIC}`);
      break;
      
    case 'semi-static':
      response.headers.set('Cache-Control', getCacheControl({
        maxAge: CACHE_DURATIONS.DYNAMIC,
        sMaxAge: CACHE_DURATIONS.SEMI_STATIC,
        staleWhileRevalidate: CACHE_DURATIONS.STALE_WHILE_REVALIDATE,
      }));
      response.headers.set('CDN-Cache-Control', `max-age=${CACHE_DURATIONS.SEMI_STATIC}`);
      break;
      
    case 'dynamic':
      response.headers.set('Cache-Control', getCacheControl({
        maxAge: 0,
        sMaxAge: CACHE_DURATIONS.DYNAMIC,
        staleWhileRevalidate: CACHE_DURATIONS.DYNAMIC * 5,
        mustRevalidate: true,
      }));
      break;
      
    case 'private':
      response.headers.set('Cache-Control', getCacheControl({
        maxAge: CACHE_DURATIONS.DYNAMIC,
        private: true,
      }));
      break;
      
    case 'none':
    default:
      response.headers.set('Cache-Control', getCacheControl({ noStore: true, maxAge: 0 }));
  }
  
  // Add Vary header for proper cache keying
  response.headers.set('Vary', 'Accept-Encoding, Authorization');
  
  return response;
}

/**
 * Determine cache type based on request path
 */
export function getCacheTypeForPath(pathname: string): 'static' | 'semi-static' | 'dynamic' | 'private' | 'none' {
  // Static assets
  if (pathname.match(/\.(js|css|woff2?|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp)$/)) {
    return 'static';
  }
  
  // Public blog and content pages
  if (pathname.startsWith('/blog') && !pathname.includes('/admin')) {
    return 'semi-static';
  }
  
  // Public marketing pages
  if (pathname === '/' || pathname.startsWith('/pricing') || pathname.startsWith('/about')) {
    return 'semi-static';
  }
  
  // API endpoints - mostly dynamic
  if (pathname.startsWith('/api')) {
    // Some API endpoints can be cached
    if (pathname.includes('/public') || pathname.includes('/health')) {
      return 'dynamic';
    }
    return 'none';
  }
  
  // User-specific pages
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/complaints') || pathname.startsWith('/admin')) {
    return 'private';
  }
  
  // Default to no cache for unknown paths
  return 'none';
}

/**
 * Middleware for edge caching
 */
export function edgeCachingMiddleware(request: NextRequest): NextResponse | null {
  const pathname = request.nextUrl.pathname;
  
  // Skip for non-GET requests
  if (request.method !== 'GET') {
    return null;
  }
  
  // Skip for authenticated routes
  if (request.headers.get('authorization') || request.cookies.get('sb-access-token')) {
    return null;
  }
  
  const cacheType = getCacheTypeForPath(pathname);
  
  // For static and semi-static, we can add headers
  // For other types, let the handler decide
  if (cacheType === 'static' || cacheType === 'semi-static') {
    const response = NextResponse.next();
    return withCacheHeaders(response, cacheType);
  }
  
  return null;
}

/**
 * Generate ETag for content
 */
export function generateETag(content: string | Buffer): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(content).digest('hex');
  return `"${hash}"`;
}

/**
 * Check if-none-match header for 304 response
 */
export function shouldReturn304(
  request: NextRequest,
  etag: string
): boolean {
  const ifNoneMatch = request.headers.get('if-none-match');
  return ifNoneMatch === etag;
}

/**
 * Preload hints for critical resources
 */
export function getPreloadHints(pathname: string): string[] {
  const hints: string[] = [];
  
  // Always preload main fonts
  hints.push('</fonts/inter-var.woff2>; rel=preload; as=font; type=font/woff2; crossorigin');
  
  // Page-specific preloads
  if (pathname.startsWith('/blog')) {
    hints.push('</api/blog/featured>; rel=preload; as=fetch');
  }
  
  return hints;
}

/**
 * Add Link headers for resource hints
 */
export function addResourceHints(
  response: NextResponse,
  pathname: string
): NextResponse {
  const hints = getPreloadHints(pathname);
  
  if (hints.length > 0) {
    response.headers.set('Link', hints.join(', '));
  }
  
  return response;
}

/**
 * Compression hints for CDN
 */
export function getCompressionHints(): Record<string, string> {
  return {
    'Accept-Encoding': 'gzip, br',
    'Content-Encoding': 'gzip', // Default, actual encoding set by CDN
  };
}

