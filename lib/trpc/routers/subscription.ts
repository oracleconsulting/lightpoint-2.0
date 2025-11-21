// lib/trpc/routers/subscription.ts
import { z } from 'zod';
import { publicProcedure, protectedProcedure, router } from '../trpc';
import { supabaseAdmin } from '@/lib/supabase/client';
import { TRPCError } from '@trpc/server';

export const subscriptionRouter = router({
  /**
   * List all subscription tiers (public)
   */
  listTiers: publicProcedure
    .input(
      z.object({
        includeHidden: z.boolean().optional().default(false),
      })
    )
    .query(async ({ input }) => {
      let query = supabaseAdmin
        .from('subscription_tiers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (!input.includeHidden) {
        query = query.eq('is_visible', true);
      }
      
      const { data, error } = await query;
      
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch subscription tiers',
        });
      }
      
      return data;
    }),
  
  /**
   * Get a single tier by ID (admin)
   */
  getTier: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('subscription_tiers')
        .select('*')
        .eq('id', input.id)
        .single();
      
      if (error || !data) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Tier not found',
        });
      }
      
      return data;
    }),
  
  /**
   * Update a tier (admin only)
   */
  updateTier: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        display_name: z.string().optional(),
        description: z.string().optional(),
        tagline: z.string().optional(),
        monthly_price: z.number().int().min(0).optional(),
        annual_price: z.number().int().min(0).optional(),
        is_popular: z.boolean().optional(),
        is_visible: z.boolean().optional(),
        features: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { id, ...updates } = input;
      
      // TODO: Check if user is admin
      // For now, allow any authenticated user (you'll want to add admin check)
      
      const { data, error } = await (supabaseAdmin as any)
        .from('subscription_tiers')
        .update({
          ...updates,
          updated_by: ctx.user?.id,
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update tier',
        });
      }
      
      return data;
    }),
  
  /**
   * Create a new tier (admin only)
   */
  createTier: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        display_name: z.string(),
        description: z.string().optional(),
        tagline: z.string().optional(),
        monthly_price: z.number().int().min(0),
        annual_price: z.number().int().min(0),
        features: z.record(z.any()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // TODO: Check if user is admin
      
      const { data, error } = await (supabaseAdmin as any)
        .from('subscription_tiers')
        .insert({
          ...input,
          created_by: ctx.user?.id,
        })
        .select()
        .single();
      
      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create tier',
        });
      }
      
      return data;
    }),
  
  /**
   * Get organization's current subscription
   */
  getCurrentSubscription: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Organization required',
      });
    }
    
    const { data, error } = await (supabaseAdmin as any)
      .from('user_subscriptions')
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq('organization_id', ctx.organizationId)
      .in('status', ['trial', 'active'])
      .single();
    
    if (error) {
      // No active subscription
      return null;
    }
    
    return data as any;
  }),
  
  /**
   * Get usage stats for current organization
   */
  getUsage: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Organization required',
      });
    }
    
    const { data: subscription, error } = await (supabaseAdmin as any)
      .from('user_subscriptions')
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq('organization_id', ctx.organizationId)
      .in('status', ['trial', 'active'])
      .single();
    
    if (error || !subscription) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No active subscription found',
      });
    }
    
    const complaintsLimit = subscription.tier.features.complaints.max_per_month;
    const complaintsUsed = subscription.complaints_used_this_period;
    const complaintsRemaining = complaintsLimit === -1 
      ? -1 
      : Math.max(0, complaintsLimit - complaintsUsed);
    
    return {
      tier: subscription.tier,
      complaints_used: complaintsUsed,
      complaints_limit: complaintsLimit,
      complaints_remaining: complaintsRemaining,
      period_end: subscription.current_period_end,
      features: subscription.tier.features,
    };
  }),
  
  /**
   * Check if organization can create more complaints
   */
  canCreateComplaint: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.organizationId) {
      return { allowed: false, reason: 'No organization' };
    }
    
    const { data: subscription } = await (supabaseAdmin as any)
      .from('user_subscriptions')
      .select(`
        *,
        tier:subscription_tiers(*)
      `)
      .eq('organization_id', ctx.organizationId)
      .in('status', ['trial', 'active'])
      .single();
    
    if (!subscription) {
      return { allowed: false, reason: 'No active subscription' };
    }
    
    const limit = subscription.tier.features.complaints.max_per_month;
    
    // Unlimited
    if (limit === -1) {
      return { allowed: true, remaining: -1 };
    }
    
    const used = subscription.complaints_used_this_period;
    
    if (used >= limit) {
      return { 
        allowed: false, 
        reason: `Monthly limit of ${limit} complaints reached`,
        used,
        limit
      };
    }
    
    return { 
      allowed: true, 
      remaining: limit - used,
      used,
      limit
    };
  }),
  
  /**
   * Increment complaint usage (called when complaint is created)
   */
  incrementComplaintUsage: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.organizationId) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Organization required',
      });
    }
    
    const { error } = await (supabaseAdmin as any).rpc('increment_complaint_usage', {
      org_id: ctx.organizationId,
    });
    
    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update usage',
      });
    }
    
    return { success: true };
  }),
  
  /**
   * Check feature access
   */
  hasFeatureAccess: protectedProcedure
    .input(
      z.object({
        feature: z.string(), // e.g., 'complaints.ai_generation'
      })
    )
    .query(async ({ input, ctx }) => {
      if (!ctx.organizationId) {
        return false;
      }
      
      const { data } = await (supabaseAdmin as any).rpc('has_feature_access', {
        org_id: ctx.organizationId,
        feature_path: input.feature,
      });
      
      return data === true;
    }),
});

