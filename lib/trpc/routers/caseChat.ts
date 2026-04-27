import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { supabaseAdmin } from '@/lib/supabase/client';
import { logger } from '../../logger';
import { ensureCaseAccess, requireOrg } from './caseUtils';
import { buildWorkspaceContext } from '@/lib/caseWorkspace/buildContext';
import { buildSystemPrompt } from '@/lib/caseWorkspace/systemPrompt';
import { commitStructuredOutput, searchWorkspaceKnowledge } from '@/lib/caseWorkspace/toolHandlers';
import { parseStructuredOutputs, structuredOutputSchema } from '@/lib/caseWorkspace/structuredOutputs';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const CASE_CHAT_MODEL = process.env.CASE_CHAT_MODEL || 'anthropic/claude-opus-4.1';

async function callOpenRouter(system: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: 'OpenRouter is not configured',
    });
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lightpoint.app',
        'X-Title': 'Lightpoint Case Workspace',
      },
      body: JSON.stringify({
        model: CASE_CHAT_MODEL,
        messages: [
          { role: 'system', content: system },
          ...messages,
        ],
        temperature: 0.35,
        max_tokens: 2500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `OpenRouter error ${response.status}: ${text.slice(0, 500)}`,
      });
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || '';
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    const message = error instanceof Error ? error.message : 'Unknown OpenRouter error';
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Case chat failed: ${message}`,
      cause: error,
    });
  }
}

function parseAiJson(raw: string) {
  try {
    const parsed = JSON.parse(raw);
    return {
      content: String(parsed.content || ''),
      structuredOutputs: parseStructuredOutputs(parsed.structuredOutputs),
    };
  } catch {
    return {
      content: raw,
      structuredOutputs: [],
    };
  }
}

export const caseChatRouter = router({
  history: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      const { data, error } = await (supabaseAdmin as any)
        .from('case_messages')
        .select('*')
        .eq('case_id', input.caseId)
        .order('created_at', { ascending: false })
        .limit(input.limit);

      if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      return (data || []).reverse();
    }),

  send: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
      message: z.string().min(1).max(8000),
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);

      logger.warn('caseChat.send', { caseId: input.caseId, userId: ctx.userId, model: CASE_CHAT_MODEL });

      const workspace = await buildWorkspaceContext(input.caseId);
      const systemPrompt = buildSystemPrompt(workspace);
      const { data: historyRows, error: historyError } = await (supabaseAdmin as any)
        .from('case_messages')
        .select('role, content')
        .eq('case_id', input.caseId)
        .order('created_at', { ascending: false })
        .limit(12);

      if (historyError) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: historyError.message });
      }

      const history = (historyRows || [])
        .reverse()
        .filter((message: any) => message.role === 'user' || message.role === 'assistant')
        .map((message: any) => ({ role: message.role, content: message.content }));

      const knowledgeResults = await searchWorkspaceKnowledge(input.message).catch(() => []);
      const augmentedMessage = knowledgeResults.length
        ? `${input.message}\n\nRelevant knowledge base excerpts (do not cite cases unless verified research allows it):\n${knowledgeResults
          .slice(0, 4)
          .map((result: any) => `- ${result.title || 'Knowledge item'}: ${String(result.content || '').slice(0, 700)}`)
          .join('\n')}`
        : input.message;

      await (supabaseAdmin as any)
        .from('case_messages')
        .insert({
          case_id: input.caseId,
          role: 'user',
          content: input.message,
          created_by: ctx.userId,
        });

      const raw = await callOpenRouter(systemPrompt, [
        ...history,
        { role: 'user', content: augmentedMessage },
      ]);
      const parsed = parseAiJson(raw);

      const { data: assistantMessage, error: saveError } = await (supabaseAdmin as any)
        .from('case_messages')
        .insert({
          case_id: input.caseId,
          role: 'assistant',
          content: parsed.content,
          structured_outputs: parsed.structuredOutputs,
          model: CASE_CHAT_MODEL,
          created_by: ctx.userId,
        })
        .select()
        .single();

      if (saveError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: saveError.message });

      return {
        message: assistantMessage,
        content: parsed.content,
        structuredOutputs: parsed.structuredOutputs,
      };
    }),

  stream: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
      message: z.string().min(1).max(8000),
    }))
    .mutation(async () => {
      throw new TRPCError({
        code: 'NOT_IMPLEMENTED',
        message: 'Streaming case chat will be added after the non-streaming Phase 2 endpoint has bedded in.',
      });
    }),

  confirmStructuredOutput: protectedProcedure
    .input(z.object({
      caseId: z.string().uuid(),
      output: structuredOutputSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const organizationId = requireOrg(ctx.organizationId);
      await ensureCaseAccess(input.caseId, organizationId);
      return commitStructuredOutput(input.caseId, input.output, ctx.userId);
    }),
});
