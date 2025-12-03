import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '../../logger';

export const usersRouter = router({
  list: protectedProcedure
    .input(z.object({
      organizationId: z.string().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      // Use context org if not specified
      const orgId = input?.organizationId || ctx.organizationId;
      
      const { data, error } = await (supabaseAdmin as any)
        .from('user_profiles')
        .select('id, email, full_name, role, is_active, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data;
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('user_profiles')
        .select('*')
        .eq('id', input)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),

  create: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      fullName: z.string(),
      role: z.enum(['admin', 'manager', 'user']),
      organizationId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const orgId = input.organizationId || ctx.organizationId;
      
      logger.info('👤 Creating user:', input.email);
      
      const { data, error } = await (supabaseAdmin as any)
        .from('user_profiles')
        .insert({
          email: input.email,
          full_name: input.fullName,
          role: input.role,
          organization_id: orgId,
          is_active: true,
        })
        .select()
        .single();
      
      if (error) {
        logger.error('❌ Failed to create user:', error);
        throw new Error(error.message);
      }
      
      logger.info('✅ User created:', data.id);
      return data;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.string(),
      email: z.string().email().optional(),
      fullName: z.string().optional(),
      role: z.enum(['admin', 'manager', 'user']).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      
      const updateData: Record<string, any> = {};
      if (updates.email) updateData.email = updates.email;
      if (updates.fullName) updateData.full_name = updates.fullName;
      if (updates.role) updateData.role = updates.role;
      updateData.updated_at = new Date().toISOString();
      
      const { data, error } = await (supabaseAdmin as any)
        .from('user_profiles')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),

  toggleStatus: protectedProcedure
    .input(z.object({
      userId: z.string(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      logger.info(`👤 ${input.isActive ? 'Activating' : 'Deactivating'} user:`, input.userId);
      
      const { data, error } = await (supabaseAdmin as any)
        .from('user_profiles')
        .update({ 
          is_active: input.isActive,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.userId)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),

  invite: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(['admin', 'manager', 'user']),
      organizationId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const orgId = input.organizationId || ctx.organizationId;
      
      logger.info('📧 Sending invite to:', input.email);
      
      // Create pending invitation
      const { data, error } = await (supabaseAdmin as any)
        .from('invitations')
        .insert({
          email: input.email,
          role: input.role,
          organization_id: orgId,
          invited_by: ctx.userId,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        })
        .select()
        .single();
      
      if (error) {
        logger.error('❌ Failed to create invitation:', error);
        throw new Error(error.message);
      }
      
      // TODO: Send invitation email
      logger.info('✅ Invitation created:', data.id);
      return data;
    }),

  getCurrentUser: protectedProcedure
    .query(async ({ ctx }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('user_profiles')
        .select('*')
        .eq('id', ctx.userId)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),

  updateProfile: protectedProcedure
    .input(z.object({
      fullName: z.string().optional(),
      phone: z.string().optional(),
      jobTitle: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const updateData: Record<string, any> = {};
      if (input.fullName) updateData.full_name = input.fullName;
      if (input.phone) updateData.phone = input.phone;
      if (input.jobTitle) updateData.job_title = input.jobTitle;
      updateData.updated_at = new Date().toISOString();
      
      const { data, error } = await (supabaseAdmin as any)
        .from('user_profiles')
        .update(updateData)
        .eq('id', ctx.userId)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),
});

