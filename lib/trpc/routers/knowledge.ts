import { router, publicProcedure, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/client';
import { searchKnowledgeBase, searchPrecedents } from '@/lib/vectorSearch';
import { generateEmbedding } from '@/lib/embeddings';
import { logger } from '../../logger';

export const knowledgeRouter = router({
  // Public search - can be used without auth for demo purposes
  search: publicProcedure
    .input(z.object({
      query: z.string(),
      threshold: z.number().optional(),
      matchCount: z.number().optional(),
    }))
    .query(async ({ input }) => {
      logger.info('🔍 Knowledge base search:', input.query.substring(0, 50));
      
      const results = await searchKnowledgeBase(
        input.query,
        input.threshold ?? 0.7,
        input.matchCount ?? 10
      );
      
      return results;
    }),

  // List all knowledge base items
  list: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      let query = supabaseAdmin
        .from('knowledge_base')
        .select('id, title, category, source, created_at')
        .order('created_at', { ascending: false });
      
      if (input?.category) {
        query = query.eq('category', input.category);
      }
      
      if (input?.limit) {
        query = query.limit(input.limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw new Error(error.message);
      return data;
    }),

  // Search precedents (similar cases)
  searchPrecedents: protectedProcedure
    .input(z.object({
      query: z.string(),
      threshold: z.number().optional(),
      matchCount: z.number().optional(),
    }))
    .query(async ({ input }) => {
      logger.info('🔍 Precedent search:', input.query.substring(0, 50));
      
      const results = await searchPrecedents(
        input.query,
        input.threshold ?? 0.75,
        input.matchCount ?? 5
      );
      
      return results;
    }),

  // Add a new precedent from a closed complaint
  addPrecedent: protectedProcedure
    .input(z.object({
      complaintId: z.string(),
      title: z.string(),
      summary: z.string(),
      issueCategory: z.string(),
      successFactors: z.array(z.string()),
      keyArguments: z.array(z.string()),
      hmrcWeakPoints: z.array(z.string()).optional(),
      outcomeType: z.string(),
      compensationReceived: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      logger.info('📚 Adding precedent from complaint:', input.complaintId);
      
      // Generate embedding for the precedent
      const contentForEmbedding = `${input.title}. ${input.summary}. Issues: ${input.issueCategory}. Success factors: ${input.successFactors.join(', ')}. Key arguments: ${input.keyArguments.join(', ')}`;
      
      const embedding = await generateEmbedding(contentForEmbedding);
      
      const { data, error } = await (supabaseAdmin as any)
        .from('precedents')
        .insert({
          complaint_id: input.complaintId,
          title: input.title,
          summary: input.summary,
          issue_category: input.issueCategory,
          success_factors: input.successFactors,
          key_arguments: input.keyArguments,
          hmrc_weak_points: input.hmrcWeakPoints || [],
          outcome_type: input.outcomeType,
          compensation_received: input.compensationReceived,
          embedding,
        })
        .select()
        .single();
      
      if (error) {
        logger.error('❌ Failed to add precedent:', error);
        throw new Error(error.message);
      }
      
      logger.info('✅ Precedent added:', data.id);
      return data;
    }),

  // Get timeline of KB updates for RSS feed
  getTimeline: publicProcedure
    .input(z.object({
      limit: z.number().optional(),
    }).optional())
    .query(async ({ input }) => {
      const { data, error } = await supabaseAdmin
        .from('knowledge_base')
        .select('id, title, category, source, created_at, updated_at')
        .order('updated_at', { ascending: false })
        .limit(input?.limit ?? 20);
      
      if (error) throw new Error(error.message);
      return data;
    }),

  // Get categories
  getCategories: protectedProcedure
    .query(async () => {
      const { data, error } = await (supabaseAdmin as any)
        .from('knowledge_base')
        .select('category')
        .order('category');
      
      if (error) throw new Error(error.message);
      
      // Get unique categories
      const categories = [...new Set((data || []).map((d: any) => d.category))];
      return categories;
    }),

  // Upload and stage document for KB
  uploadForComparison: protectedProcedure
    .input(z.object({
      title: z.string(),
      content: z.string(),
      category: z.string(),
      source: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      logger.info('📤 Staging document for KB:', input.title);
      
      const { data, error } = await (supabaseAdmin as any)
        .from('kb_staging')
        .insert({
          title: input.title,
          content: input.content,
          category: input.category,
          source: input.source,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    }),

  // Approve staged document
  approveStaged: protectedProcedure
    .input(z.object({
      stagedId: z.string(),
    }))
    .mutation(async ({ input }) => {
      logger.info('✅ Approving staged document:', input.stagedId);
      
      // Get staged document
      const { data: staged, error: fetchError } = await (supabaseAdmin as any)
        .from('kb_staging')
        .select('*')
        .eq('id', input.stagedId)
        .single();
      
      if (fetchError || !staged) {
        throw new Error('Staged document not found');
      }
      
      // Generate embedding
      const embedding = await generateEmbedding(staged.content);
      
      // Add to knowledge base
      const { data: kbEntry, error: insertError } = await (supabaseAdmin as any)
        .from('knowledge_base')
        .insert({
          title: staged.title,
          content: staged.content,
          category: staged.category,
          source: staged.source,
          embedding,
        })
        .select()
        .single();
      
      if (insertError) throw new Error(insertError.message);
      
      // Mark staged as approved
      await (supabaseAdmin as any)
        .from('kb_staging')
        .update({ status: 'approved', approved_at: new Date().toISOString() })
        .eq('id', input.stagedId);
      
      logger.info('✅ Document added to KB:', kbEntry.id);
      return kbEntry;
    }),
});

