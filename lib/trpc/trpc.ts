import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

// ============================================================================
// Context Definition
// ============================================================================

export interface Context {
  user: User | null;
  userId: string | null;
  organizationId: string | null;
}

/**
 * Create tRPC context with authenticated user from Supabase
 * This runs on every tRPC request
 */
export async function createContext(
  _opts?: FetchCreateContextFnOptions
): Promise<Context> {
  // Create Supabase server client with proper cookie handling
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Cookie setting might fail in read-only contexts (like tRPC queries)
            // This is expected and safe to ignore
          }
        },
      },
    }
  );

  // Get authenticated user
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const user = session?.user ?? null;
  const userId = user?.id ?? null;

  // Get user's organization ID if authenticated
  // Use service role to bypass RLS issues
  let organizationId: string | null = null;
  if (userId) {
    try {
      console.log('🔍 Fetching organization for user:', userId);
      
      // Create admin client with service key to bypass RLS
      const adminSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!, // Service key bypasses RLS
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              try {
                cookiesToSet.forEach(({ name, value, options }) => {
                  cookieStore.set(name, value, options);
                });
              } catch {
                // Ignore
              }
            },
          },
        }
      );
      
      const { data: userData, error: orgError } = await adminSupabase
        .from('lightpoint_users')
        .select('organization_id, email, role, id, updated_at')
        .eq('id', userId)
        .single();
      
      console.log('📊 Raw Supabase response:', { 
        data: userData, 
        error: orgError?.message,
        hasData: !!userData,
        orgId: userData?.organization_id 
      });
      
      if (orgError) {
        console.error('❌ Error fetching user org:', orgError.message);
        console.error('Full error:', JSON.stringify(orgError, null, 2));
      } else {
        console.log('✅ User data:', { 
          id: userData?.id,
          email: userData?.email, 
          role: userData?.role,
          organization_id: userData?.organization_id,
          updated_at: userData?.updated_at
        });
      }
      
      organizationId = userData?.organization_id ?? null;
      
      if (!organizationId) {
        console.warn('⚠️ User has no organization_id!');
        console.warn('User ID:', userId);
        console.warn('User data:', JSON.stringify(userData, null, 2));
      } else {
        console.log('🎉 Organization ID found:', organizationId);
      }
    } catch (error) {
      console.error('❌ Failed to fetch user organization:', error);
    }
  }

  console.log('📋 tRPC Context:', { userId, organizationId });

  return {
    user,
    userId,
    organizationId,
  };
}

// ============================================================================
// tRPC Initialization
// ============================================================================

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

// ============================================================================
// Reusable Pieces
// ============================================================================

export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 * Use this for all endpoints that need user context
 */
export const protectedProcedure = t.procedure.use(async (opts) => {
  const { ctx } = opts;

  // Check if user is authenticated
  if (!ctx.user || !ctx.userId) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access this endpoint',
    });
  }

  // Check if user has organization
  if (!ctx.organizationId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'User must belong to an organization',
    });
  }

  // Pass authenticated context to procedure
  return opts.next({
    ctx: {
      ...ctx,
      user: ctx.user, // Now guaranteed to be non-null
      userId: ctx.userId, // Now guaranteed to be non-null
      organizationId: ctx.organizationId, // Now guaranteed to be non-null
    },
  });
});

/**
 * Admin-only procedure - requires admin role
 * Use this for sensitive operations like user management
 */
export const adminProcedure = protectedProcedure.use(async (opts) => {
  const { ctx } = opts;

  // Get user role from database using service key (bypasses RLS)
  const cookieStore = cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!, // Use service key for admin checks
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignore cookie setting errors in read-only contexts
          }
        },
      },
    }
  );

  const { data: userData, error } = await supabase
    .from('lightpoint_users')
    .select('role')
    .eq('id', ctx.userId)
    .single();

  if (error || !userData) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to verify user role',
    });
  }

  // Only allow admin and manager roles
  if (userData.role !== 'admin' && userData.role !== 'manager') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin or manager access required',
    });
  }

  return opts.next({ ctx });
});
