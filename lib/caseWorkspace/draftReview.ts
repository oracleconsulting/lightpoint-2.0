const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function runDraftReview(draft: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return 'Draft review skipped: OpenRouter is not configured.';

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lightpoint.app',
      'X-Title': 'Lightpoint Case Workspace',
    },
    body: JSON.stringify({
      model: process.env.CASE_REVIEW_MODEL || 'anthropic/claude-sonnet-4.5',
      temperature: 0.2,
      max_tokens: 1200,
      messages: [
        {
          role: 'system',
          content: 'You are reviewing an HMRC dispute draft for weaknesses. Be direct. Identify HMRC counterpoints, missing evidence, overstatement, and citation risks. British English. No em dashes.',
        },
        { role: 'user', content: draft },
      ],
    }),
  });

  if (!response.ok) return `Draft review failed: ${response.status}`;
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || 'No review returned.';
}
