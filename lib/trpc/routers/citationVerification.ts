import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { supabaseAdmin } from '@/lib/supabase/client';
import { verifyCitation } from '@/lib/citationVerification/verifier';
import { extractCitationsFromText } from '@/lib/citationVerification/parser';
import { ensureCaseAccess, requireOrg } from './caseUtils';

export const citationVerificationRouter = router({
  checkCitation: protectedProcedure
    .input(z.object({
      citation: z.string().min(1),
      claimedCaseName: z.string().optional(),
    }))
    .mutation(async ({ input }) => verifyCitation(input.citation, input.claimedCaseName)),

  checkBatch: protectedProcedure
    .input(z.object({
      citations: z.array(z.object({
        citation: z.string().min(1),
        claimedCaseName: z.string().optional(),
      })).min(1).max(25),
    }))
    .mutation(async ({ input }) => Promise.all(
      input.citations.map((item) => verifyCitation(item.citation, item.claimedCaseName))
    )),

  recheckCase: protectedProcedure
    .input(z.string().uuid())
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input, organizationId);

      const { data: research, error } = await (supabaseAdmin as any)
        .from('case_research')
        .select('*')
        .eq('case_id', input);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });

      const results = [];
      for (const item of research || []) {
        const citations = item.citation ? [{ raw: item.citation }] : extractCitationsFromText(`${item.title}\n${item.proposition || ''}`);
        for (const citation of citations) {
          const result = await verifyCitation(citation.raw, item.title);
          results.push(result);
          await (supabaseAdmin as any)
            .from('case_research')
            .update({
              verification_status: result.status,
              source_url: result.sourceUrl || item.source_url,
              verification_notes: result.notes,
              citation: result.citation,
            })
            .eq('id', item.id);
        }
      }
      return results;
    }),
});
