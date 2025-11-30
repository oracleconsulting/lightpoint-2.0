/**
 * Pilot Management tRPC Router
 * 
 * Handles pilot status, scheduling, and activation
 */

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { createClient } from '@supabase/supabase-js';
import { TRPCError } from '@trpc/server';

// Supabase admin client for RLS bypass
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
);

export const pilotRouter = router({
  /**
   * Get current pilot status for the user's organization
   */
  getStatus: publicProcedure.query(async () => {
    // Get current user session
    const cookieStore = await import('next/headers').then(m => m.cookies());
    const { createServerClient } = await import('@supabase/ssr');
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return { status: 'pending_call' as const };
    }

    // Get user's organization
    const { data: user } = await supabaseAdmin
      .from('lightpoint_users')
      .select('organization_id')
      .eq('id', session.user.id)
      .single();

    if (!user?.organization_id) {
      return { status: 'pending_call' as const };
    }

    // Get organization's pilot status
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('pilot_status, pilot_call_scheduled_at, pilot_activated_at')
      .eq('id', user.organization_id)
      .single();

    return {
      status: (org?.pilot_status || 'pending_call') as 'pending_call' | 'call_scheduled' | 'pilot_active' | 'pilot_complete',
      callScheduledAt: org?.pilot_call_scheduled_at,
      activatedAt: org?.pilot_activated_at,
    };
  }),

  /**
   * Mark that user has scheduled a call (clicks Calendly link)
   */
  scheduleCall: publicProcedure
    .input(z.object({
      calendlyEventUri: z.string().optional(),
    }).optional())
    .mutation(async ({ input }) => {
      const cookieStore = await import('next/headers').then(m => m.cookies());
      const { createServerClient } = await import('@supabase/ssr');
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll() {},
          },
        }
      );

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Get user's organization
      const { data: user } = await supabaseAdmin
        .from('lightpoint_users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      if (!user?.organization_id) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Organization not found' });
      }

      // Update status
      const { error } = await supabaseAdmin
        .from('organizations')
        .update({
          pilot_status: 'call_scheduled',
          pilot_call_scheduled_at: new Date().toISOString(),
          calendly_event_uri: input?.calendlyEventUri || null,
        })
        .eq('id', user.organization_id);

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return { success: true, status: 'call_scheduled' };
    }),

  /**
   * List all pilot organizations (admin only)
   */
  listPilots: publicProcedure.query(async () => {
    const cookieStore = await import('next/headers').then(m => m.cookies());
    const { createServerClient } = await import('@supabase/ssr');
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      throw new TRPCError({ code: 'UNAUTHORIZED' });
    }

    // Check if superadmin
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'super_admin')
      .is('revoked_at', null)
      .single();

    if (!roleData) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'Superadmin access required' });
    }

    // Get all pilot organizations with their primary user
    const { data: orgs, error } = await supabaseAdmin
      .from('organizations')
      .select(`
        id,
        name,
        pilot_status,
        pilot_call_scheduled_at,
        pilot_activated_at,
        pilot_notes,
        calendly_event_uri,
        created_at
      `)
      .in('pilot_status', ['pending_call', 'call_scheduled', 'pilot_active'])
      .order('pilot_call_scheduled_at', { ascending: false, nullsFirst: false });

    if (error) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
    }

    // Get primary contact for each org
    const orgsWithUsers = await Promise.all(
      (orgs || []).map(async (org) => {
        const { data: users } = await supabaseAdmin
          .from('lightpoint_users')
          .select('email, full_name')
          .eq('organization_id', org.id)
          .eq('role', 'admin')
          .limit(1);

        return {
          ...org,
          primaryEmail: users?.[0]?.email || null,
          primaryContact: users?.[0]?.full_name || null,
        };
      })
    );

    return orgsWithUsers;
  }),

  /**
   * Activate a pilot (admin only)
   */
  activatePilot: publicProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const cookieStore = await import('next/headers').then(m => m.cookies());
      const { createServerClient } = await import('@supabase/ssr');
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll() {},
          },
        }
      );

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Check if superadmin
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'super_admin')
        .is('revoked_at', null)
        .single();

      if (!roleData) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Superadmin access required' });
      }

      // Activate the pilot
      const { error } = await supabaseAdmin
        .from('organizations')
        .update({
          pilot_status: 'pilot_active',
          pilot_activated_at: new Date().toISOString(),
          pilot_activated_by: session.user.id,
          pilot_notes: input.notes || null,
        })
        .eq('id', input.organizationId);

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return { success: true, status: 'pilot_active' };
    }),

  /**
   * Complete a pilot (convert to full user)
   */
  completePilot: publicProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      const cookieStore = await import('next/headers').then(m => m.cookies());
      const { createServerClient } = await import('@supabase/ssr');
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll() {},
          },
        }
      );

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Check if superadmin
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'super_admin')
        .is('revoked_at', null)
        .single();

      if (!roleData) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Superadmin access required' });
      }

      // Complete the pilot
      const { error } = await supabaseAdmin
        .from('organizations')
        .update({
          pilot_status: 'pilot_complete',
        })
        .eq('id', input.organizationId);

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return { success: true, status: 'pilot_complete' };
    }),
});

