import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Debug: Log available cookies
  const allCookies = req.cookies.getAll();
  console.log('🍪 Available cookies:', allCookies.map(c => c.name));
  
  // Create Supabase client with proper cookie handling for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Debug logging
  console.log('🔐 Middleware check:', {
    path: req.nextUrl.pathname,
    hasSession: !!session,
    userId: session?.user?.id,
  });

  // Public routes that don't require authentication
  const publicRoutes = ['/login', '/logout', '/auth/callback', '/auth/reset-password'];
  const isPublicRoute = publicRoutes.some(route => req.nextUrl.pathname.startsWith(route));

  // Protect all routes except public ones
  if (!session && !isPublicRoute) {
    console.log('❌ No session, redirecting to login from:', req.nextUrl.pathname);
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (session) {
    console.log('✅ Session valid, allowing access to:', req.nextUrl.pathname);
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

