/**
 * Context Management for LLM Token Limits
 * Ensures we stay within OpenRouter/Claude token limits (200K)
 */

interface ContextBudget {
  total: number;
  documents: number;
  knowledge: number;
  precedents: number;
  systemPrompt: number;
  output: number;
}

// Conservative budget allocation (target 150K to leave room)
const DEFAULT_BUDGET: ContextBudget = {
  total: 150000,
  documents: 60000,    // 40% for document content
  knowledge: 40000,    // 27% for knowledge base
  precedents: 20000,   // 13% for precedents
  systemPrompt: 20000, // 13% for system prompts
  output: 10000,       // 7% for response
};

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to fit within token budget
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const estimatedTokens = estimateTokens(text);
  
  if (estimatedTokens <= maxTokens) {
    return text;
  }
  
  // Calculate character limit
  const maxChars = maxTokens * 4;
  
  // Truncate with ellipsis
  return text.substring(0, maxChars - 100) + '\n\n... [Content truncated due to length] ...';
}

/**
 * Summarize document content for analysis (extract key information)
 */
export function summarizeDocument(documentData: any): string {
  const summary: string[] = [];
  
  // Extract structured data if available
  if (documentData.dates && documentData.dates.length > 0) {
    summary.push(`KEY DATES:\n${documentData.dates.join('\n')}`);
  }
  
  if (documentData.amounts && documentData.amounts.length > 0) {
    summary.push(`AMOUNTS:\n${documentData.amounts.join('\n')}`);
  }
  
  if (documentData.references && documentData.references.length > 0) {
    summary.push(`REFERENCES:\n${documentData.references.join('\n')}`);
  }
  
  if (documentData.issues && documentData.issues.length > 0) {
    summary.push(`ISSUES IDENTIFIED:\n${documentData.issues.join('\n')}`);
  }
  
  // Include raw text but truncated
  if (documentData.text) {
    const truncatedText = truncateToTokens(documentData.text, 5000); // Max 5K tokens per doc
    summary.push(`DOCUMENT TEXT:\n${truncatedText}`);
  }
  
  return summary.join('\n\n');
}

/**
 * Prepare context for LLM analysis with smart token management
 */
export function prepareAnalysisContext(
  complaintContext: string,
  documents: any[],
  knowledgeResults: any[],
  precedentResults: any[]
) {
  const budget = DEFAULT_BUDGET;
  
  console.log('📊 Context budget:', budget);
  
  // 1. DOCUMENTS - Summarize and combine
  const documentSummaries = documents.map(doc => {
    const processed = doc.processed_data || {};
    return `--- DOCUMENT: ${doc.filename || 'Unknown'} ---\n${summarizeDocument(processed)}`;
  });
  
  const allDocumentText = documentSummaries.join('\n\n');
  const documentsContext = truncateToTokens(allDocumentText, budget.documents);
  
  console.log(`📄 Documents context: ${estimateTokens(documentsContext)} tokens (budget: ${budget.documents})`);
  
  // 2. KNOWLEDGE BASE - Keep most relevant, summarize
  const knowledgeSummaries = knowledgeResults
    .slice(0, 10) // Top 10 results only
    .map(kb => {
      const content = truncateToTokens(kb.content || '', 3000); // Max 3K tokens per KB entry
      return `[${kb.category}] ${kb.title}:\n${content}`;
    });
  
  const knowledgeContext = truncateToTokens(
    knowledgeSummaries.join('\n\n--- NEXT GUIDANCE ---\n\n'),
    budget.knowledge
  );
  
  console.log(`📚 Knowledge context: ${estimateTokens(knowledgeContext)} tokens (budget: ${budget.knowledge})`);
  
  // 3. PRECEDENTS - Keep most relevant, extract key info
  const precedentSummaries = precedentResults
    .slice(0, 5) // Top 5 precedents only
    .map(prec => {
      return `PRECEDENT: ${prec.complaint_type} - ${prec.issue_category}
Outcome: ${prec.outcome}
Resolution Time: ${prec.resolution_time_days} days
Compensation: £${prec.compensation_amount}
Key Arguments: ${(prec.key_arguments || []).join('; ')}
Citations: ${(prec.effective_citations || []).join('; ')}`;
    });
  
  const precedentsContext = truncateToTokens(
    precedentSummaries.join('\n\n--- NEXT PRECEDENT ---\n\n'),
    budget.precedents
  );
  
  console.log(`⚖️ Precedents context: ${estimateTokens(precedentsContext)} tokens (budget: ${budget.precedents})`);
  
  // 4. COMPLAINT CONTEXT - Keep full if possible
  const complaintCtx = truncateToTokens(complaintContext, 5000);
  
  // 5. BUILD FINAL CONTEXT
  const finalContext = `
COMPLAINT CONTEXT:
${complaintCtx}

ALL DOCUMENTS (${documents.length} total):
${documentsContext}

RELEVANT HMRC GUIDANCE (${knowledgeResults.length} results, showing top 10):
${knowledgeContext}

SIMILAR PRECEDENT CASES (${precedentResults.length} results, showing top 5):
${precedentsContext}
`.trim();
  
  const totalTokens = estimateTokens(finalContext);
  
  console.log(`✅ Final context: ${totalTokens} tokens (${Math.round(totalTokens / budget.total * 100)}% of budget)`);
  
  if (totalTokens > budget.total) {
    console.warn(`⚠️ Context still exceeds budget! Applying final truncation...`);
    return truncateToTokens(finalContext, budget.total);
  }
  
  return finalContext;
}

/**
 * Prepare guidance and precedents as compact JSON for letter generation
 */
export function prepareCompactGuidance(
  knowledgeResults: any[],
  precedentResults: any[]
) {
  // Extract only essential information for letter generation
  const compactKnowledge = knowledgeResults.slice(0, 5).map(kb => ({
    category: kb.category,
    title: kb.title,
    keyPoints: truncateToTokens(kb.content || '', 1000)
  }));
  
  const compactPrecedents = precedentResults.slice(0, 3).map(prec => ({
    type: prec.complaint_type,
    outcome: prec.outcome,
    compensation: prec.compensation_amount,
    keyArguments: prec.key_arguments?.slice(0, 3),
    citations: prec.effective_citations?.slice(0, 3)
  }));
  
  return {
    guidance: compactKnowledge,
    precedents: compactPrecedents
  };
}

