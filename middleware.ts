import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from './lib/logger';


export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
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
  ];
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route));

  // Protect all routes except public ones
  if (!session && !isPublicRoute) {
    logger.info('❌ No session, redirecting to login from:', req.nextUrl.pathname);
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

