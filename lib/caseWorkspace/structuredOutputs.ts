import { z } from 'zod';

export const structuredOutputSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('propose_workspace_update'),
    action: z.string(),
    details: z.record(z.unknown()),
    requiresConfirmation: z.literal(true).default(true),
  }),
  z.object({
    type: z.literal('propose_research'),
    query: z.string(),
    reasoning: z.string(),
    requiresConfirmation: z.literal(true).default(true),
  }),
  z.object({
    type: z.literal('capture_decision'),
    decisionText: z.string(),
    reasoning: z.string(),
    alternativesConsidered: z.string().optional().default(''),
    requiresConfirmation: z.boolean().default(true),
  }),
  z.object({
    type: z.literal('flag_anomaly'),
    anomalyType: z.string(),
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    requiresConfirmation: z.boolean().default(true),
  }),
  z.object({
    type: z.literal('propose_draft'),
    outputType: z.string(),
    outline: z.string(),
    requiresConfirmation: z.literal(true).default(true),
  }),
]);

export const structuredOutputsSchema = z.array(structuredOutputSchema).default([]);

export type StructuredOutput = z.infer<typeof structuredOutputSchema>;

export function parseStructuredOutputs(value: unknown): StructuredOutput[] {
  const result = structuredOutputsSchema.safeParse(value);
  return result.success ? result.data : [];
}
