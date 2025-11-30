/**
 * Pilot Management tRPC Router
 * 
 * Handles pilot status, scheduling, and activation
 */

import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../trpc';
import { createClient } from '@supabase/supabase-js';
import { TRPCError } from '@trpc/server';
import { sanitizeLetterForAdmin } from '@/lib/sanitize';

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

  /**
   * Get detailed pilot organization info with activity stats (admin only)
   */
  getPilotDetails: publicProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const cookieStore = await import('next/headers').then(m => m.cookies());
      const { createServerClient } = await import('@supabase/ssr');
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
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

      // Get organization details
      const { data: org } = await supabaseAdmin
        .from('organizations')
        .select('*')
        .eq('id', input.organizationId)
        .single();

      if (!org) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Organization not found' });
      }

      // Get users in this org
      const { data: users } = await supabaseAdmin
        .from('lightpoint_users')
        .select('id, email, full_name, role, created_at, last_login')
        .eq('organization_id', input.organizationId);

      // Get complaint stats (count only, no content)
      const { count: complaintsCount } = await supabaseAdmin
        .from('complaints')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', input.organizationId);

      // Get complaints with letters (for sanitized viewing)
      const { data: complaintsWithLetters } = await supabaseAdmin
        .from('complaints')
        .select('id, client_reference, status, created_at, has_generated_letter')
        .eq('organization_id', input.organizationId)
        .order('created_at', { ascending: false })
        .limit(20);

      // Get document upload stats
      const { count: documentsCount } = await supabaseAdmin
        .from('documents')
        .select('id', { count: 'exact', head: true })
        .in('complaint_id', 
          (complaintsWithLetters || []).map(c => c.id)
        );

      // Get support tickets for this org
      const { data: tickets, count: ticketsCount } = await supabaseAdmin
        .from('support_tickets')
        .select('id, subject, status, priority, created_at', { count: 'exact' })
        .eq('organization_id', input.organizationId)
        .order('created_at', { ascending: false })
        .limit(10);

      return {
        organization: {
          id: org.id,
          name: org.name,
          pilot_status: org.pilot_status,
          pilot_call_scheduled_at: org.pilot_call_scheduled_at,
          pilot_activated_at: org.pilot_activated_at,
          pilot_notes: org.pilot_notes,
          created_at: org.created_at,
        },
        users: users || [],
        stats: {
          complaintsCount: complaintsCount || 0,
          documentsUploaded: documentsCount || 0,
          ticketsCount: ticketsCount || 0,
          usersCount: users?.length || 0,
        },
        recentComplaints: (complaintsWithLetters || []).map(c => ({
          id: c.id,
          // Sanitize client reference
          clientReference: '[PILOT-' + c.id.substring(0, 8).toUpperCase() + ']',
          status: c.status,
          createdAt: c.created_at,
          hasLetter: c.has_generated_letter,
        })),
        recentTickets: tickets || [],
      };
    }),

  /**
   * Get sanitized letter content for admin viewing (admin only)
   */
  getSanitizedLetter: publicProcedure
    .input(z.object({
      complaintId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const cookieStore = await import('next/headers').then(m => m.cookies());
      const { createServerClient } = await import('@supabase/ssr');
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
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

      // Get the complaint with letter
      const { data: complaint } = await supabaseAdmin
        .from('complaints')
        .select('id, generated_letter, complaint_type, hmrc_department, status, created_at')
        .eq('id', input.complaintId)
        .single();

      if (!complaint) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Complaint not found' });
      }

      if (!complaint.generated_letter) {
        return {
          hasLetter: false,
          content: null,
          metadata: null,
        };
      }

      // Sanitize the letter content
      const sanitized = sanitizeLetterForAdmin(complaint.generated_letter);

      return {
        hasLetter: true,
        content: sanitized.content,
        metadata: {
          ...sanitized.metadata,
          complaintType: complaint.complaint_type,
          hmrcDepartment: complaint.hmrc_department,
          status: complaint.status,
          createdAt: complaint.created_at,
        },
      };
    }),

  // ============================================================================
  // SUPPORT TICKET ROUTES
  // ============================================================================

  /**
   * Create a support ticket (pilot users)
   */
  createTicket: publicProcedure
    .input(z.object({
      subject: z.string().min(5).max(200),
      description: z.string().min(10).max(5000),
      category: z.enum(['general', 'bug_report', 'feature_request', 'letter_quality', 'upload_issue', 'account_issue', 'other']).default('general'),
      priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
    }))
    .mutation(async ({ input }) => {
      const cookieStore = await import('next/headers').then(m => m.cookies());
      const { createServerClient } = await import('@supabase/ssr');
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
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

      // Create ticket
      const { data: ticket, error } = await supabaseAdmin
        .from('support_tickets')
        .insert({
          organization_id: user.organization_id,
          created_by: session.user.id,
          subject: input.subject,
          description: input.description,
          category: input.category,
          priority: input.priority,
        })
        .select()
        .single();

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return { success: true, ticketId: ticket.id };
    }),

  /**
   * List tickets for current user's organization
   */
  listMyTickets: publicProcedure.query(async () => {
    const cookieStore = await import('next/headers').then(m => m.cookies());
    const { createServerClient } = await import('@supabase/ssr');
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
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
      return [];
    }

    const { data: tickets } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('organization_id', user.organization_id)
      .order('created_at', { ascending: false });

    return tickets || [];
  }),

  /**
   * List all tickets (admin only)
   */
  listAllTickets: publicProcedure.query(async () => {
    const cookieStore = await import('next/headers').then(m => m.cookies());
    const { createServerClient } = await import('@supabase/ssr');
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
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

    // Get all tickets with org info
    const { data: tickets } = await supabaseAdmin
      .from('support_tickets')
      .select(`
        *,
        organizations:organization_id (name)
      `)
      .order('created_at', { ascending: false });

    return (tickets || []).map(t => ({
      ...t,
      organizationName: (t.organizations as any)?.name || 'Unknown',
    }));
  }),

  /**
   * Get ticket with messages
   */
  getTicket: publicProcedure
    .input(z.object({
      ticketId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const cookieStore = await import('next/headers').then(m => m.cookies());
      const { createServerClient } = await import('@supabase/ssr');
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
            setAll() {},
          },
        }
      );

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      // Get ticket
      const { data: ticket } = await supabaseAdmin
        .from('support_tickets')
        .select('*')
        .eq('id', input.ticketId)
        .single();

      if (!ticket) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      // Check access - either user's org or superadmin
      const { data: user } = await supabaseAdmin
        .from('lightpoint_users')
        .select('organization_id')
        .eq('id', session.user.id)
        .single();

      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'super_admin')
        .is('revoked_at', null)
        .single();

      const isSuperAdmin = !!roleData;
      const isOwnOrg = user?.organization_id === ticket.organization_id;

      if (!isSuperAdmin && !isOwnOrg) {
        throw new TRPCError({ code: 'FORBIDDEN' });
      }

      // Get messages
      const { data: messages } = await supabaseAdmin
        .from('ticket_messages')
        .select('*')
        .eq('ticket_id', input.ticketId)
        .order('created_at', { ascending: true });

      return {
        ticket,
        messages: messages || [],
        canRespond: isSuperAdmin || isOwnOrg,
      };
    }),

  /**
   * Add message to ticket
   */
  addTicketMessage: publicProcedure
    .input(z.object({
      ticketId: z.string().uuid(),
      message: z.string().min(1).max(5000),
    }))
    .mutation(async ({ input }) => {
      const cookieStore = await import('next/headers').then(m => m.cookies());
      const { createServerClient } = await import('@supabase/ssr');
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
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

      const senderType = roleData ? 'admin' : 'user';

      // Add message
      const { error } = await supabaseAdmin
        .from('ticket_messages')
        .insert({
          ticket_id: input.ticketId,
          sender_id: session.user.id,
          sender_type: senderType,
          message: input.message,
        });

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      // Update ticket status if admin is responding
      if (senderType === 'admin') {
        await supabaseAdmin
          .from('support_tickets')
          .update({ status: 'in_progress' })
          .eq('id', input.ticketId)
          .eq('status', 'open');
      } else {
        // User responded, set to waiting
        await supabaseAdmin
          .from('support_tickets')
          .update({ status: 'waiting_response' })
          .eq('id', input.ticketId)
          .in('status', ['in_progress', 'open']);
      }

      return { success: true };
    }),

  /**
   * Update ticket status (admin only)
   */
  updateTicketStatus: publicProcedure
    .input(z.object({
      ticketId: z.string().uuid(),
      status: z.enum(['open', 'in_progress', 'waiting_response', 'resolved', 'closed']),
      resolutionNotes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const cookieStore = await import('next/headers').then(m => m.cookies());
      const { createServerClient } = await import('@supabase/ssr');
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return cookieStore.getAll(); },
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

      const updateData: any = { status: input.status };
      
      if (input.status === 'resolved' || input.status === 'closed') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = session.user.id;
        if (input.resolutionNotes) {
          updateData.resolution_notes = input.resolutionNotes;
        }
      }

      const { error } = await supabaseAdmin
        .from('support_tickets')
        .update(updateData)
        .eq('id', input.ticketId);

      if (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }

      return { success: true };
    }),
});

