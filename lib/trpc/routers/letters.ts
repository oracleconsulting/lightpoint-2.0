import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { supabaseAdmin } from '@/lib/supabase/client';
import { generateComplaintLetter } from '@/lib/openrouter/client';
import { generateComplaintLetterThreeStage } from '@/lib/openrouter/three-stage-client';
import { generateAppealLetterThreeStage } from '@/lib/openrouter/appeal-client';
import { generateFollowUpLetter, determineFollowUpType, type FollowUpType } from '@/lib/openrouter/follow-up-client';
import { logger } from '../../logger';

export const lettersRouter = router({
  generateComplaint: protectedProcedure
    .input(z.object({
      complaintId: z.string(),
      analysis: z.any(),
      practiceLetterhead: z.string().optional(),
      chargeOutRate: z.number().optional(),
      userName: z.string().optional(),
      userTitle: z.string().optional(),
      userEmail: z.string().optional().nullable(),
      userPhone: z.string().optional().nullable(),
      useThreeStage: z.boolean().optional(),
      additionalContext: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      logger.info('📝 Starting letter generation for complaint:', input.complaintId);
      
      // Check OpenRouter API key first
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        logger.error('❌ OPENROUTER_API_KEY is not configured!');
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Letter generation service is not configured. Please contact support.',
        });
      }
      
      logger.info('✅ OPENROUTER_API_KEY found (length:', apiKey.length, ')');
      
      try {
        // Get complaint details
        const { data: complaint, error: fetchError } = await supabaseAdmin
          .from('complaints')
          .select('*')
          .eq('id', input.complaintId)
          .single();
        
        if (fetchError) {
          logger.error('❌ Failed to fetch complaint:', fetchError);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Failed to fetch complaint: ${fetchError.message}`,
          });
        }
        
        if (!complaint) {
          logger.error('❌ Complaint not found:', input.complaintId);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Complaint not found',
          });
        }
        
        logger.info('✅ Complaint found:', (complaint as any).complaint_reference);
        
        // Use three-stage pipeline by default
        const useThreeStage = input.useThreeStage !== false;
        
        let letter: string;
        
        if (useThreeStage) {
          logger.info('🚀 Using THREE-STAGE pipeline for letter generation');
          letter = await generateComplaintLetterThreeStage(
            input.analysis,
            (complaint as any).complaint_reference,
            (complaint as any).hmrc_department || 'HMRC',
            input.practiceLetterhead,
            input.chargeOutRate,
            input.userName,
            input.userTitle,
            input.userEmail,
            input.userPhone,
            input.additionalContext
          );
        } else {
          logger.info('📝 Using SINGLE-STAGE letter generation');
          letter = await generateComplaintLetter(
            input.analysis,
            (complaint as any).complaint_reference,
            (complaint as any).hmrc_department || 'HMRC',
            input.practiceLetterhead,
            input.chargeOutRate,
            input.additionalContext
          );
        }
        
        if (!letter || letter.length === 0) {
          logger.error('❌ Letter generation returned empty result');
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Letter generation returned empty result. Please try again.',
          });
        }
        
        logger.info('✅ Letter generated successfully, length:', letter.length);
        
        // Auto-save letter to database
        logger.info('💾 Auto-saving letter to database...');
        const { error: saveError } = await (supabaseAdmin as any)
          .from('generated_letters')
          .insert({
            complaint_id: input.complaintId,
            letter_type: 'initial_complaint',
            letter_content: letter,
            notes: 'Auto-generated via three-stage pipeline',
          });
        
        if (saveError) {
          logger.error('❌ Failed to auto-save letter:', saveError);
          // Don't throw here - letter was generated successfully
        } else {
          logger.info('✅ Letter auto-saved to database');
        }
        
        return { letter };
      } catch (error: any) {
        // If it's already a TRPCError, re-throw it
        if (error.code && error.message) {
          throw error;
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('❌ Letter generation failed:', errorMessage);
        logger.error('❌ Full error:', {
          name: error.name,
          message: error.message,
          stack: error.stack?.substring(0, 500),
        });
        
        // Throw a properly structured TRPC error
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Letter generation failed: ${errorMessage}`,
          cause: error,
        });
      }
    }),

  generateAppeal: protectedProcedure
    .input(z.object({
      complaintId: z.string(),
      analysis: z.any(),
      practiceLetterhead: z.string().optional(),
      chargeOutRate: z.number().optional(),
      userName: z.string().optional(),
      userTitle: z.string().optional(),
      userEmail: z.string().optional().nullable(),
      userPhone: z.string().optional().nullable(),
      additionalContext: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      logger.info('📝 Starting appeal letter generation for complaint:', input.complaintId);

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        logger.error('❌ OPENROUTER_API_KEY is not configured!');
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Letter generation service is not configured. Please contact support.',
        });
      }

      try {
        const { data: complaint, error: fetchError } = await supabaseAdmin
          .from('complaints')
          .select('*')
          .eq('id', input.complaintId)
          .single();

        if (fetchError || !complaint) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Complaint not found',
          });
        }

        const letter = await generateAppealLetterThreeStage(
          input.analysis,
          (complaint as any).complaint_reference,
          (complaint as any).hmrc_department || 'HMRC',
          input.practiceLetterhead,
          input.chargeOutRate,
          input.userName,
          input.userTitle,
          input.userEmail,
          input.userPhone,
          input.additionalContext
        );

        if (!letter || letter.length === 0) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Appeal letter generation returned empty result. Please try again.',
          });
        }

        logger.info('✅ Appeal letter generated successfully, length:', letter.length);

        const { error: saveError } = await (supabaseAdmin as any)
          .from('generated_letters')
          .insert({
            complaint_id: input.complaintId,
            letter_type: 'penalty_appeal',
            letter_content: letter,
            notes: 'Auto-generated via appeal three-stage pipeline',
          });

        if (saveError) {
          logger.error('❌ Failed to auto-save appeal letter:', saveError);
        } else {
          logger.info('✅ Appeal letter auto-saved to database');
        }

        return { letter };
      } catch (error: any) {
        if (error.code && error.message) {
          throw error;
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('❌ Appeal letter generation failed:', errorMessage);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Appeal letter generation failed: ${errorMessage}`,
          cause: error,
        });
      }
    }),

  generateFollowUp: protectedProcedure
    .input(z.object({
      complaintId: z.string(),
      followUpType: z.enum(['chase', 'delayed_response', 'inadequate_response', 'rebuttal', 'tier2_escalation']).optional(),
      originalLetterDate: z.string(),
      originalLetterRef: z.string().optional(),
      hmrcResponseDate: z.string().optional(),
      hmrcResponseSummary: z.string().optional(),
      hmrcIndicatedClosed: z.boolean().optional(),
      responseWasSubstantive: z.boolean().optional(),
      unaddressedPoints: z.array(z.string()).optional(),
      additionalContext: z.string().optional(),
      practiceLetterhead: z.string().optional(),
      chargeOutRate: z.number().optional(),
      userName: z.string().optional(),
      userTitle: z.string().optional(),
      userEmail: z.string().optional().nullable(),
      userPhone: z.string().optional().nullable(),
    }))
    .mutation(async ({ input }) => {
      logger.info('📝 Starting follow-up letter generation for complaint:', input.complaintId);
      
      // Check OpenRouter API key
      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        logger.error('❌ OPENROUTER_API_KEY is not configured!');
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Letter generation service is not configured. Please contact support.',
        });
      }
      
      try {
        // Get complaint details
        const { data: complaint, error: fetchError } = await supabaseAdmin
          .from('complaints')
          .select('*')
          .eq('id', input.complaintId)
          .single();
        
        if (fetchError || !complaint) {
          logger.error('❌ Failed to fetch complaint:', fetchError);
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Complaint not found',
          });
        }
        
        // Calculate days since original letter
        const originalDate = new Date(input.originalLetterDate);
        const now = new Date();
        const daysSinceOriginal = Math.floor((now.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Calculate days overdue if HMRC responded late
        let daysOverdue: number | undefined;
        if (input.hmrcResponseDate) {
          const responseDate = new Date(input.hmrcResponseDate);
          const daysBetween = Math.floor((responseDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysBetween > 21) { // 15 working days ≈ 21 calendar days
            daysOverdue = daysBetween - 21;
          }
        }
        
        // Determine follow-up type if not specified
        const followUpType: FollowUpType = input.followUpType || determineFollowUpType(
          !!input.hmrcResponseDate,
          input.hmrcResponseDate || null,
          input.originalLetterDate,
          input.hmrcIndicatedClosed || false,
          input.responseWasSubstantive !== false,
        );
        
        logger.info(`📋 Follow-up type determined: ${followUpType}`);
        
        // Generate the follow-up letter
        const letter = await generateFollowUpLetter({
          type: followUpType,
          originalLetterDate: input.originalLetterDate,
          originalLetterRef: input.originalLetterRef,
          hmrcResponseDate: input.hmrcResponseDate,
          hmrcResponseSummary: input.hmrcResponseSummary,
          daysSinceOriginal,
          daysOverdue,
          clientReference: (complaint as any).complaint_reference,
          hmrcDepartment: (complaint as any).hmrc_department || 'HMRC',
          unaddressedPoints: input.unaddressedPoints,
          additionalContext: input.additionalContext,
          practiceLetterhead: input.practiceLetterhead,
          chargeOutRate: input.chargeOutRate,
          userName: input.userName,
          userTitle: input.userTitle,
          userEmail: input.userEmail,
          userPhone: input.userPhone,
        });
        
        if (!letter || letter.length === 0) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Follow-up letter generation returned empty result',
          });
        }
        
        logger.info('✅ Follow-up letter generated, length:', letter.length);
        
        // Determine letter type for database
        const letterType = followUpType === 'tier2_escalation' ? 'tier2_escalation' : 
                          followUpType === 'rebuttal' ? 'rebuttal' : 
                          'initial_complaint'; // chase, delayed_response, inadequate_response are still Tier 1
        
        // Auto-save letter to database
        const { error: saveError } = await (supabaseAdmin as any)
          .from('generated_letters')
          .insert({
            complaint_id: input.complaintId,
            letter_type: letterType,
            letter_content: letter,
            notes: `Auto-generated ${followUpType} follow-up letter`,
          });
        
        if (saveError) {
          logger.error('❌ Failed to auto-save letter:', saveError);
        } else {
          logger.info('✅ Follow-up letter auto-saved to database');
        }
        
        return { 
          letter, 
          followUpType,
          daysSinceOriginal,
          daysOverdue,
        };
      } catch (error: any) {
        if (error.code && error.message) {
          throw error;
        }
        
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.error('❌ Follow-up letter generation failed:', errorMessage);
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Follow-up letter generation failed: ${errorMessage}`,
          cause: error,
        });
      }
    }),

  save: protectedProcedure
    .input(z.object({
      complaintId: z.string(),
      letterType: z.enum([
        'initial_complaint', 'tier2_escalation', 'adjudicator_escalation', 'rebuttal', 'acknowledgement',
        'penalty_appeal', 'penalty_appeal_follow_up', 'statutory_review_request', 'tribunal_appeal_notice', 'tribunal_appeal_grounds',
      ]),
      letterContent: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('generated_letters')
        .insert({
          complaint_id: input.complaintId,
          letter_type: input.letterType,
          letter_content: input.letterContent,
          notes: input.notes,
        })
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),

  lock: protectedProcedure
    .input(z.object({
      letterId: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('generated_letters')
        .update({ locked_at: new Date().toISOString() })
        .eq('id', input.letterId)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),

  markAsSent: protectedProcedure
    .input(z.object({
      letterId: z.string(),
      sentBy: z.string(),
      sentMethod: z.enum(['post', 'email', 'post_and_email', 'fax']),
      hmrcReference: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('generated_letters')
        .update({
          sent_at: new Date().toISOString(),
          sent_by: input.sentBy,
          sent_method: input.sentMethod,
          hmrc_reference: input.hmrcReference,
          notes: input.notes,
        })
        .eq('id', input.letterId)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      
      // Add to complaint timeline
      const letter = data;
      const { data: complaint } = await (supabaseAdmin as any)
        .from('complaints')
        .select('timeline')
        .eq('id', letter.complaint_id)
        .single();
      
      if (complaint) {
        const timeline = complaint.timeline || [];
        timeline.push({
          date: new Date().toISOString(),
          type: 'letter_sent',
          summary: `${letter.letter_type.replace('_', ' ')} sent to HMRC via ${input.sentMethod}`,
          details: input.notes,
        });
        
        await (supabaseAdmin as any)
          .from('complaints')
          .update({ timeline })
          .eq('id', letter.complaint_id);
      }
      
      return data;
    }),

  list: protectedProcedure
    .input(z.object({
      complaintId: z.string(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('generated_letters')
        .select('*')
        .eq('complaint_id', input.complaintId)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data;
    }),

  getById: protectedProcedure
    .input(z.string())
    .query(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('generated_letters')
        .select('*')
        .eq('id', input)
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),

  updateContent: protectedProcedure
    .input(z.object({
      letterId: z.string(),
      letterContent: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      // Check if letter is locked
      const { data: existing } = await (supabaseAdmin as any)
        .from('generated_letters')
        .select('locked_at')
        .eq('id', input.letterId)
        .single();
      
      if (existing?.locked_at) {
        throw new Error('Cannot edit a locked letter');
      }
      
      const { data, error } = await (supabaseAdmin as any)
        .from('generated_letters')
        .update({
          letter_content: input.letterContent,
          notes: input.notes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', input.letterId)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),

  delete: protectedProcedure
    .input(z.object({
      letterId: z.string(),
    }))
    .mutation(async ({ input }) => {
      // Check if letter is sent
      const { data: existing } = await (supabaseAdmin as any)
        .from('generated_letters')
        .select('sent_at')
        .eq('id', input.letterId)
        .single();
      
      if (existing?.sent_at) {
        throw new Error('Cannot delete a sent letter');
      }
      
      const { error } = await (supabaseAdmin as any)
        .from('generated_letters')
        .delete()
        .eq('id', input.letterId);
      
      if (error) throw new Error(error.message);
      return { success: true };
    }),

  listActive: protectedProcedure
    .input(z.object({
      complaintId: z.string(),
    }))
    .query(async ({ input }) => {
      const { data, error } = await (supabaseAdmin as any)
        .from('generated_letters')
        .select('*')
        .eq('complaint_id', input.complaintId)
        .is('superseded_by', null)
        .order('created_at', { ascending: false });
      
      if (error) throw new Error(error.message);
      return data;
    }),
});

