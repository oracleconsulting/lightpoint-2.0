import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from './lib/logger';

// Rate limiting store (in-memory for single instance, use Redis for multi-instance)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute for general routes
const API_RATE_LIMIT_MAX = 30; // 30 requests per minute for API routes

function getRateLimitKey(req: NextRequest): string {
  // Use IP address for rate limiting
  const forwardedFor = req.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0]?.trim() || 'unknown';
  return `${ip}:${req.nextUrl.pathname.startsWith('/api') ? 'api' : 'general'}`;
}

function checkRateLimit(key: string, maxRequests: number): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: maxRequests - 1, resetIn: RATE_LIMIT_WINDOW_MS };
  }
  
  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
  }
  
  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetIn: record.resetTime - now };
}

// Security headers
function addSecurityHeaders(res: NextResponse): void {
  // Prevent clickjacking
  res.headers.set('X-Frame-Options', 'DENY');
  // Prevent MIME type sniffing
  res.headers.set('X-Content-Type-Options', 'nosniff');
  // Enable XSS protection
  res.headers.set('X-XSS-Protection', '1; mode=block');
  // Referrer policy
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // Permissions policy
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // Content Security Policy (adjust as needed for your app)
  res.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://plausible.io; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https: blob:; " +
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://openrouter.ai https://api.stripe.com https://plausible.io; " +
    "frame-src 'self' https://js.stripe.com; " +
    "object-src 'none';"
  );
  // Strict Transport Security (HSTS) - only in production
  if (process.env.NODE_ENV === 'production') {
    res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
}

export async function middleware(req: NextRequest) {
  // Rate limiting check
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  const maxRequests = isApiRoute ? API_RATE_LIMIT_MAX : RATE_LIMIT_MAX_REQUESTS;
  const rateLimitKey = getRateLimitKey(req);
  const rateLimit = checkRateLimit(rateLimitKey, maxRequests);
  
  if (!rateLimit.allowed) {
    logger.warn('🚫 Rate limit exceeded:', { key: rateLimitKey, resetIn: rateLimit.resetIn });
    return new NextResponse(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      { 
        status: 429, 
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil(rateLimit.resetIn / 1000).toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(rateLimit.resetIn / 1000).toString(),
        }
      }
    );
  }

  const res = NextResponse.next();
  
  // Add security headers
  addSecurityHeaders(res);
  
  // Add rate limit headers
  res.headers.set('X-RateLimit-Remaining', rateLimit.remaining.toString());
  res.headers.set('X-RateLimit-Reset', Math.ceil(rateLimit.resetIn / 1000).toString());
  
  // Debug: Log available cookies
  const allCookies = req.cookies.getAll();
  logger.info('🍪 Available cookies:', allCookies.map(c => ({ name: c.name, valueLength: c.value.length })));
  
  // Create Supabase client with proper cookie handling for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookies = req.cookies.getAll();
          logger.info('📖 Supabase requesting cookies, found:', cookies.length);
          return cookies;
        },
        setAll(cookiesToSet) {
          logger.info('📝 Supabase setting cookies:', cookiesToSet.map(c => c.name));
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  
  if (sessionError) {
    logger.error('❌ Session error:', sessionError.message);
  }

  // Debug logging
  logger.info('🔐 Middleware check:', {
    path: req.nextUrl.pathname,
    hasSession: !!session,
    userId: session?.user?.id,
  });

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',                          // Homepage - public for marketing
    '/login',                     // Login page
    '/logout',                    // Logout page
    '/signup',                    // Signup page
    '/auth/callback',             // OAuth callback
    '/auth/reset-password',       // Password reset
    '/pricing',                   // Pricing page
    '/blog',                      // Blog listing and posts
    '/cpd',                       // CPD resources (or make subscription-only later)
    '/webinars',                  // Webinars (or make subscription-only later)
    '/examples',                  // Worked examples (or make subscription-only later)
    '/admin-debug',               // Debug page for admin access
  ];
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route));
  
  // Admin routes (require login, super admin check done in pages)
  const isAdminRoute = req.nextUrl.pathname.startsWith('/admin');

  // Protect all routes except public ones
  if (!session && !isPublicRoute && !isAdminRoute) {
    logger.info('❌ No session, redirecting to login from:', req.nextUrl.pathname);
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  // Admin routes require session (super admin check done in page)
  if (isAdminRoute && !session) {
    logger.info('❌ Admin route without session, redirecting to login');
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (session) {
    logger.info('✅ Session valid, allowing access to:', req.nextUrl.pathname);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (tRPC handles its own auth)
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

