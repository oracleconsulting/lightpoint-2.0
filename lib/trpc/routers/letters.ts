import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/client';
import { generateComplaintLetter } from '@/lib/openrouter/client';
import { generateComplaintLetterThreeStage } from '@/lib/openrouter/three-stage-client';
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
      // Get complaint details
      const { data: complaint } = await supabaseAdmin
        .from('complaints')
        .select('*')
        .eq('id', input.complaintId)
        .single();
      
      if (!complaint) throw new Error('Complaint not found');
      
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
      } else {
        logger.info('✅ Letter auto-saved to database');
      }
      
      return { letter };
    }),

  save: protectedProcedure
    .input(z.object({
      complaintId: z.string(),
      letterType: z.enum(['initial_complaint', 'tier2_escalation', 'adjudicator_escalation', 'rebuttal', 'acknowledgement']),
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

