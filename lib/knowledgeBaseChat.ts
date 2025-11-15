/**
 * Knowledge Base Chat Engine
 * 
 * Conversational interface powered by Claude Opus 4.1
 * Searches knowledge base to answer HMRC complaint questions
 */

import { searchKnowledgeBase } from '@/lib/vectorSearch';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const CHAT_MODEL = 'anthropic/claude-opus-4.1'; // Best conversational AI

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface KnowledgeChunk {
  id: string;
  title: string;
  category: string;
  content: string;
  similarity: number;
}

interface ChatResponse {
  answer: string;
  sources: Array<{
    title: string;
    category: string;
    excerpt: string;
    relevance: number;
  }>;
  knowledgeChunks: KnowledgeChunk[];
}

/**
 * Chat with the knowledge base using Opus 4.1
 */
export async function chatWithKnowledgeBase(
  userQuestion: string,
  conversationHistory: ChatMessage[] = []
): Promise<ChatResponse> {
  console.log('💬 KB Chat: Processing question:', userQuestion);

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  // Step 1: Search knowledge base for relevant information
  const knowledgeResults = await searchKnowledgeBase(
    userQuestion,
    0.7, // Similarity threshold
    10   // Top 10 results
  );

  console.log(`📚 Found ${knowledgeResults.length} relevant KB entries`);

  // Step 2: Prepare context from knowledge base
  const kbContext = knowledgeResults
    .map((result: any, index: number) => `
[Source ${index + 1}: ${result.title} - ${result.category}]
${result.content.substring(0, 800)}${result.content.length > 800 ? '...' : ''}
Relevance: ${(result.similarity * 100).toFixed(0)}%
`)
    .join('\n\n');

  // Step 3: Build conversation with Opus 4.1
  const systemPrompt = `You are an expert HMRC complaints advisor with deep knowledge of UK tax law, HMRC procedures, and complaint handling.

You have access to a comprehensive knowledge base including:
- Complaint Handling Guidance (CHG) - HMRC's internal procedures
- Complaints Resolution Guidance (CRG) - Technical guidance
- Charter Standards - HMRC service commitments
- Historical precedents and successful complaints
- Tax legislation and case law

Your role is to:
1. Answer questions clearly and accurately using the knowledge base
2. Cite specific CHG/CRG sections when relevant
3. Explain HMRC procedures and what they SHOULD do
4. Provide practical advice on complaint strategy
5. Suggest whether a formal complaint is warranted

KNOWLEDGE BASE CONTEXT FOR THIS QUESTION:
${kbContext || 'No directly relevant knowledge base entries found.'}

Guidelines:
- Be conversational but professional
- Cite sources when making specific claims (e.g., "According to CHG Section 4.2.1...")
- If the KB doesn't have relevant info, say so honestly
- Suggest what additional information might be helpful
- Keep responses focused and actionable`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userQuestion }
  ];

  try {
    const startTime = Date.now();

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lightpoint.app',
        'X-Title': 'Lightpoint Knowledge Base Chat',
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages,
        temperature: 0.7, // Balanced between creative and factual
        max_tokens: 2000, // Detailed but not excessive responses
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    const answer = data.choices[0].message.content;
    const processingTime = Date.now() - startTime;

    console.log(`✅ KB Chat response generated in ${processingTime}ms`);

    // Step 4: Extract sources cited in the response
    const sources = knowledgeResults.slice(0, 5).map((result: any) => ({
      title: result.title,
      category: result.category,
      excerpt: result.content.substring(0, 200) + '...',
      relevance: Math.round(result.similarity * 100),
    }));

    return {
      answer,
      sources,
      knowledgeChunks: knowledgeResults,
    };
  } catch (error: any) {
    console.error('❌ KB Chat error:', error);
    throw new Error(`Chat failed: ${error.message}`);
  }
}

/**
 * Generate a conversation title from the first message
 */
export async function generateConversationTitle(
  firstMessage: string
): Promise<string> {
  // Simple title generation - can enhance with AI later
  const title = firstMessage.length > 50
    ? firstMessage.substring(0, 47) + '...'
    : firstMessage;
  
  return title;
}

/**
 * Generate a conversation summary
 */
export async function generateConversationSummary(
  messages: ChatMessage[]
): Promise<string> {
  if (messages.length === 0) return '';
  
  const userMessages = messages.filter(m => m.role === 'user');
  const topics = userMessages.map(m => m.content.substring(0, 100)).join('; ');
  
  return `Discussion about: ${topics.substring(0, 200)}${topics.length > 200 ? '...' : ''}`;
}

