import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';

// Type assertion for tables not yet in schema
const supabase = supabaseAdmin as any;

export const adminRouter = router({
  // ═══════════════════════════════════════════════════════════════════════════
  // ORGANIZATION INVITES
  // ═══════════════════════════════════════════════════════════════════════════

  // List all organization invites (superadmin only)
  listOrganizationInvites: publicProcedure
    .query(async () => {
      const { data, error } = await supabase
        .from('organization_invites')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        logger.error('Failed to fetch organization invites:', error);
        throw new Error(error.message);
      }
      
      return data || [];
    }),

  // Create organization invite
  createOrganizationInvite: publicProcedure
    .input(z.object({
      email: z.string().email(),
      organizationName: z.string().min(1),
      contactName: z.string().optional(),
      notes: z.string().optional(),
      trialDays: z.number().min(7).max(90).default(30),
      tierId: z.string().uuid().optional(),
    }))
    .mutation(async ({ input }) => {
      // Generate unique token
      const token = crypto.randomUUID() + '-' + Date.now().toString(36);
      
      // Calculate expiry (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      // Create invite
      const { data: invite, error } = await supabase
        .from('organization_invites')
        .insert({
          email: input.email,
          organization_name: input.organizationName,
          contact_name: input.contactName,
          notes: input.notes,
          trial_days: input.trialDays,
          tier_id: input.tierId,
          token,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) {
        logger.error('Failed to create organization invite:', error);
        throw new Error(error.message);
      }
      
      logger.info(`📨 Organization invite created for ${input.organizationName} (${input.email})`);
      logger.info(`   Invite link: /accept-invite?token=${token}`);
      
      // TODO: Send email via Resend when API key is configured
      // For now, admin can copy the link manually
      
      return invite;
    }),

  // Resend organization invite
  resendOrganizationInvite: publicProcedure
    .input(z.object({
      inviteId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      // Get the invite
      const { data: invite, error: fetchError } = await supabase
        .from('organization_invites')
        .select('*')
        .eq('id', input.inviteId)
        .single();
      
      if (fetchError || !invite) {
        throw new Error('Invite not found');
      }
      
      if (invite.status !== 'pending') {
        throw new Error('Can only resend pending invites');
      }
      
      // Generate new token and extend expiry
      const newToken = crypto.randomUUID() + '-' + Date.now().toString(36);
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 7);
      
      // Update invite
      const { error: updateError } = await supabase
        .from('organization_invites')
        .update({
          token: newToken,
          expires_at: newExpiry.toISOString(),
        })
        .eq('id', input.inviteId);
      
      if (updateError) {
        throw new Error(updateError.message);
      }
      
      logger.info(`🔄 Organization invite resent: ${invite.email}`);
      logger.info(`   New invite link: /accept-invite?token=${newToken}`);
      
      return { success: true, token: newToken };
    }),

  // Cancel organization invite
  cancelOrganizationInvite: publicProcedure
    .input(z.object({
      inviteId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('organization_invites')
        .update({ status: 'cancelled' })
        .eq('id', input.inviteId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      logger.info(`❌ Organization invite cancelled: ${input.inviteId}`);
      
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ORGANIZATIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // List all organizations
  listOrganizations: publicProcedure
    .query(async () => {
      // Get organizations with user and complaint counts
      const { data: orgs, error } = await supabase
        .from('organizations')
        .select(`
          *,
          lightpoint_users(count),
          complaints(count)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        logger.error('Failed to fetch organizations:', error);
        throw new Error(error.message);
      }
      
      // Transform the data to include counts
      const organizations = orgs?.map((org: any) => ({
        ...org,
        user_count: org.lightpoint_users?.[0]?.count || 0,
        complaint_count: org.complaints?.[0]?.count || 0,
      }));
      
      return organizations || [];
    }),

  // Get organization details
  getOrganization: publicProcedure
    .input(z.string().uuid())
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('organizations')
        .select(`
          *,
          lightpoint_users(*),
          complaints(count),
          user_subscriptions(*)
        `)
        .eq('id', input)
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data;
    }),

  // ═══════════════════════════════════════════════════════════════════════════
  // TEAM INVITES (for org admins)
  // ═══════════════════════════════════════════════════════════════════════════

  // List team invites for an organization
  listTeamInvites: publicProcedure
    .input(z.object({
      organizationId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await supabase
        .from('team_invites')
        .select('*')
        .eq('organization_id', input.organizationId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(error.message);
      }
      
      return data || [];
    }),

  // Create team invite
  createTeamInvite: publicProcedure
    .input(z.object({
      email: z.string().email(),
      organizationId: z.string().uuid(),
      role: z.enum(['admin', 'user']).default('user'),
    }))
    .mutation(async ({ input }) => {
      const token = crypto.randomUUID() + '-' + Date.now().toString(36);
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const { data, error } = await supabase
        .from('team_invites')
        .insert({
          email: input.email,
          organization_id: input.organizationId,
          role: input.role,
          token,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) {
        throw new Error(error.message);
      }
      
      // Get organization name for logging
      const { data: org } = await supabase
        .from('organizations')
        .select('name')
        .eq('id', input.organizationId)
        .single();
      
      logger.info(`📨 Team invite created for ${input.email} to join ${org?.name || 'organization'}`);
      logger.info(`   Invite link: /accept-team-invite?token=${token}`);
      
      return data;
    }),

  // Cancel team invite
  cancelTeamInvite: publicProcedure
    .input(z.object({
      inviteId: z.string().uuid(),
    }))
    .mutation(async ({ input }) => {
      const { error } = await supabase
        .from('team_invites')
        .update({ status: 'cancelled' })
        .eq('id', input.inviteId);
      
      if (error) {
        throw new Error(error.message);
      }
      
      return { success: true };
    }),
});
