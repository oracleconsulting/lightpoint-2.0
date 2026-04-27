import { TRPCError } from '@trpc/server';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { supabaseAdmin } from '@/lib/supabase/client';
import { buildWorkspaceContext } from './buildContext';
import { buildSystemPrompt } from './systemPrompt';
import { runDraftReview } from './draftReview';
import { OUTPUT_TEMPLATES, type OutputType } from './outputTemplates';
import { extractCitationsFromText } from '@/lib/citationVerification/parser';
import { verifyCitation } from '@/lib/citationVerification/verifier';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'OpenRouter is not configured' });

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lightpoint.app',
      'X-Title': 'Lightpoint Case Workspace',
    },
    body: JSON.stringify({
      model: process.env.CASE_OUTPUT_MODEL || 'anthropic/claude-opus-4.1',
      temperature: 0.35,
      max_tokens: 4500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `OpenRouter output failed: ${response.status}` });
  }
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

async function makeDocx(content: string): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      children: content.split('\n').filter(Boolean).map((line) => new Paragraph({
        children: [new TextRun(line)],
        spacing: { after: 180 },
      })),
    }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}

export async function generateOutput(
  caseId: string,
  outputType: OutputType,
  options: { title?: string; instructions?: string; userId?: string | null } = {}
) {
  const template = OUTPUT_TEMPLATES[outputType];
  if (!template) throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unsupported output type' });

  const workspace = await buildWorkspaceContext(caseId);
  const verifiedResearch = workspace.research.filter((item) => item.verification_status === 'verified');
  const prompt = `${buildSystemPrompt(workspace)}

Generate a full ${template.title}.

Template structure:
${template.structure.map((section) => `- ${section}`).join('\n')}

Tone: ${template.tone}

Use only this verified research if citing authority:
${verifiedResearch.map((item) => `- ${item.title}: ${item.citation || ''} ${item.proposition || ''}`).join('\n') || 'No verified research available.'}

Additional instructions:
${options.instructions || 'None'}

Return the draft only, not JSON.`;

  const content = await callOpenRouter(prompt);
  const citations = extractCitationsFromText(content);
  const verificationResults = await Promise.all(citations.map((citation) => verifyCitation(citation.raw)));
  const failed = verificationResults.filter((result) => result.status !== 'verified');
  if (failed.length) {
    throw new TRPCError({
      code: 'PRECONDITION_FAILED',
      message: `Export blocked: ${failed.map((item) => `${item.citation} (${item.status})`).join(', ')}`,
    });
  }

  const review = await runDraftReview(content).catch((error) => `Draft review failed: ${error instanceof Error ? error.message : 'unknown error'}`);
  const buffer = await makeDocx(content);
  const storagePath = `${caseId}/${Date.now()}-${outputType}.docx`;
  const { error: uploadError } = await (supabaseAdmin as any).storage
    .from('case-documents')
    .upload(storagePath, buffer, {
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      upsert: true,
    });
  if (uploadError) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: uploadError.message });

  const { data, error } = await (supabaseAdmin as any)
    .from('case_outputs')
    .insert({
      case_id: caseId,
      output_type: outputType,
      title: options.title || template.title,
      content,
      storage_path: storagePath,
      status: 'verified',
      citations_used: verificationResults,
      metadata: { draft_review: review },
      created_by: options.userId || null,
    })
    .select()
    .single();

  if (error) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
  return data;
}
