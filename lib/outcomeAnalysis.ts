/**
 * Outcome Analysis Service
 * 
 * Analyzes closed complaints to extract learnings and add them
 * to the precedent database for future reference.
 * 
 * All client data is sanitized before storage.
 */

import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from './embeddings';
import { sanitizeContent } from './sanitize';
import { logger } from './logger';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || ''
);

// Outcome types for classification
export type OutcomeType = 
  | 'successful_full'
  | 'successful_partial'
  | 'unsuccessful'
  | 'withdrawn'
  | 'escalated_adjudicator'
  | 'escalated_tribunal'
  | 'settled';

export interface OutcomeData {
  outcomeType: OutcomeType;
  compensationReceived?: number;
  taxPositionCorrected?: number;
  penaltiesCancelled?: number;
  interestRefunded?: number;
  notes?: string;
}

export interface ExtractedLearnings {
  effectiveArguments: string[];
  ineffectiveArguments: string[];
  keyCitations: string[];
  hmrcWeakPoints: string[];
  hmrcObjections: string[];
  successfulRebuttals: string[];
  keyLearnings: string;
  recommendationsForSimilar: string;
  letterQualityScore: number;
  argumentStrengthScore: number;
  evidenceQualityScore: number;
  issueCategories: string[];
}

/**
 * Record an outcome when a complaint is closed
 */
export async function recordComplaintOutcome(
  complaintId: string,
  outcomeData: OutcomeData
): Promise<{ success: boolean; outcomeId?: string; error?: string }> {
  try {
    logger.info(`📊 Recording outcome for complaint ${complaintId}`, { outcomeType: outcomeData.outcomeType });

    // Call the database function
    const { data, error } = await supabaseAdmin.rpc('record_complaint_outcome', {
      p_complaint_id: complaintId,
      p_outcome_type: outcomeData.outcomeType,
      p_compensation: outcomeData.compensationReceived || 0,
      p_tax_corrected: outcomeData.taxPositionCorrected || 0,
      p_penalties_cancelled: outcomeData.penaltiesCancelled || 0,
      p_interest_refunded: outcomeData.interestRefunded || 0,
      p_notes: outcomeData.notes || null,
    });

    if (error) {
      logger.error('Failed to record outcome:', error);
      return { success: false, error: error.message };
    }

    logger.info(`✅ Outcome recorded: ${data}`);
    
    // Trigger async learning extraction
    extractLearningsAsync(data as string).catch(err => {
      logger.error('Background learning extraction failed:', err);
    });

    return { success: true, outcomeId: data as string };
  } catch (err: any) {
    logger.error('recordComplaintOutcome error:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Extract learnings from a closed complaint (async background job)
 */
async function extractLearningsAsync(outcomeId: string): Promise<void> {
  try {
    logger.info(`🧠 Starting learning extraction for outcome ${outcomeId}`);

    // Get outcome with complaint data
    const { data: outcome, error: fetchError } = await supabaseAdmin
      .from('pending_outcome_analysis')
      .select('*')
      .eq('id', outcomeId)
      .single();

    if (fetchError || !outcome) {
      logger.error('Failed to fetch outcome for analysis:', fetchError);
      return;
    }

    // Sanitize the letter content
    const letterContent = outcome.generated_letter || '';
    const sanitizedLetter = sanitizeContent(letterContent, {
      redactNames: true,
      redactClientRefs: true,
    });

    // Extract learnings using AI
    const learnings = await extractLearningsWithAI(
      sanitizedLetter.sanitized,
      outcome.analysis_result,
      outcome.outcome_type,
      outcome.is_successful
    );

    // Generate embedding for the learnings
    const embeddingText = [
      `Complaint Type: ${outcome.complaint_type}`,
      `Department: ${outcome.hmrc_department}`,
      `Outcome: ${outcome.outcome_type}`,
      `Key Learnings: ${learnings.keyLearnings}`,
      `Effective Arguments: ${learnings.effectiveArguments.join(', ')}`,
      `Issue Categories: ${learnings.issueCategories.join(', ')}`,
    ].join('\n');

    const embedding = await generateEmbedding(embeddingText);

    // Update the outcome record
    const { error: updateError } = await supabaseAdmin
      .from('case_outcomes')
      .update({
        effective_arguments: learnings.effectiveArguments,
        ineffective_arguments: learnings.ineffectiveArguments,
        key_citations: learnings.keyCitations,
        hmrc_weak_points: learnings.hmrcWeakPoints,
        hmrc_objections: learnings.hmrcObjections,
        successful_rebuttals: learnings.successfulRebuttals,
        key_learnings: learnings.keyLearnings,
        recommendations_for_similar: learnings.recommendationsForSimilar,
        letter_quality_score: learnings.letterQualityScore,
        argument_strength_score: learnings.argumentStrengthScore,
        evidence_quality_score: learnings.evidenceQualityScore,
        issue_categories: learnings.issueCategories,
        embedding: embedding,
        learning_extracted: true,
        analyzed_at: new Date().toISOString(),
      })
      .eq('id', outcomeId);

    if (updateError) {
      logger.error('Failed to update outcome with learnings:', updateError);
      return;
    }

    // If successful, add to precedents database
    if (outcome.is_successful) {
      await addToPrecedents(outcomeId, outcome, learnings, embedding);
    }

    logger.info(`✅ Learning extraction complete for outcome ${outcomeId}`);
  } catch (err) {
    logger.error('extractLearningsAsync error:', err);
  }
}

/**
 * Use AI to extract learnings from the complaint
 */
async function extractLearningsWithAI(
  sanitizedLetter: string,
  analysisResult: any,
  outcomeType: string,
  isSuccessful: boolean
): Promise<ExtractedLearnings> {
  const prompt = `Analyze this closed HMRC complaint case and extract learnings for future reference.

OUTCOME: ${outcomeType} (${isSuccessful ? 'SUCCESSFUL' : 'UNSUCCESSFUL'})

LETTER (sanitized):
${sanitizedLetter.substring(0, 8000)}

ORIGINAL ANALYSIS:
${JSON.stringify(analysisResult || {}, null, 2).substring(0, 4000)}

Extract the following in JSON format:
{
  "effectiveArguments": ["argument that worked well", ...],
  "ineffectiveArguments": ["argument that didn't help", ...],
  "keyCitations": ["CHG section X", "CRG paragraph Y", ...],
  "hmrcWeakPoints": ["where HMRC's position was weak", ...],
  "hmrcObjections": ["common objections HMRC raised", ...],
  "successfulRebuttals": ["how objections were overcome", ...],
  "keyLearnings": "Summary of what we learned from this case...",
  "recommendationsForSimilar": "For similar cases, we should...",
  "letterQualityScore": 8.5,
  "argumentStrengthScore": 7.0,
  "evidenceQualityScore": 8.0,
  "issueCategories": ["Payment Allocation", "Time to Pay", ...]
}

Focus on:
1. What made the difference in this case
2. Which arguments were most persuasive
3. How to handle similar cases in future
4. Patterns in HMRC's response that can be exploited

Be specific and actionable. Score from 0-10 where 10 is excellent.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://lightpoint.uk',
        'X-Title': 'Lightpoint Outcome Analysis',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages: [
          { role: 'system', content: 'You are an expert at analyzing HMRC complaint outcomes to extract learnings. Always respond with valid JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '{}';
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        effectiveArguments: parsed.effectiveArguments || [],
        ineffectiveArguments: parsed.ineffectiveArguments || [],
        keyCitations: parsed.keyCitations || [],
        hmrcWeakPoints: parsed.hmrcWeakPoints || [],
        hmrcObjections: parsed.hmrcObjections || [],
        successfulRebuttals: parsed.successfulRebuttals || [],
        keyLearnings: parsed.keyLearnings || '',
        recommendationsForSimilar: parsed.recommendationsForSimilar || '',
        letterQualityScore: parsed.letterQualityScore || 5,
        argumentStrengthScore: parsed.argumentStrengthScore || 5,
        evidenceQualityScore: parsed.evidenceQualityScore || 5,
        issueCategories: parsed.issueCategories || [],
      };
    }
  } catch (err) {
    logger.error('AI extraction failed:', err);
  }

  // Return defaults if AI fails
  return {
    effectiveArguments: [],
    ineffectiveArguments: [],
    keyCitations: [],
    hmrcWeakPoints: [],
    hmrcObjections: [],
    successfulRebuttals: [],
    keyLearnings: 'Analysis pending',
    recommendationsForSimilar: '',
    letterQualityScore: 5,
    argumentStrengthScore: 5,
    evidenceQualityScore: 5,
    issueCategories: [],
  };
}

/**
 * Add successful case learnings to the precedents database
 */
async function addToPrecedents(
  outcomeId: string,
  outcome: any,
  learnings: ExtractedLearnings,
  embedding: number[]
): Promise<void> {
  try {
    // Create precedent entry (sanitized, no client data)
    const precedentData = {
      complaint_type: outcome.complaint_type || 'General',
      issue_category: learnings.issueCategories[0] || 'Unspecified',
      outcome: outcome.outcome_type,
      resolution_time_days: outcome.days_to_resolution,
      compensation_amount: outcome.compensation_received,
      key_arguments: learnings.effectiveArguments.slice(0, 10),
      effective_citations: learnings.keyCitations.slice(0, 10),
      embedding: embedding,
      metadata: {
        source: 'case_outcome',
        outcome_id: outcomeId,
        learnings: learnings.keyLearnings,
        recommendations: learnings.recommendationsForSimilar,
        hmrc_department: outcome.hmrc_department,
        letter_quality_score: learnings.letterQualityScore,
        argument_strength_score: learnings.argumentStrengthScore,
        analyzed_at: new Date().toISOString(),
      },
    };

    const { data: precedent, error } = await supabaseAdmin
      .from('precedents')
      .insert(precedentData)
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to create precedent:', error);
      return;
    }

    // Link precedent to outcome
    await supabaseAdmin
      .from('case_outcomes')
      .update({
        added_to_precedents: true,
        precedent_id: precedent.id,
      })
      .eq('id', outcomeId);

    logger.info(`✅ Added to precedents database: ${precedent.id}`);
  } catch (err) {
    logger.error('addToPrecedents error:', err);
  }
}

/**
 * Get outcome statistics for a complaint type
 */
export async function getOutcomeStats(
  complaintType?: string,
  hmrcDepartment?: string
): Promise<{
  totalCases: number;
  successRate: number;
  avgResolutionDays: number;
  avgCompensation: number;
  topEffectiveArguments: string[];
}> {
  let query = supabaseAdmin
    .from('case_outcomes')
    .select('*')
    .eq('learning_extracted', true);

  if (complaintType) {
    query = query.eq('complaint_type', complaintType);
  }
  if (hmrcDepartment) {
    query = query.eq('hmrc_department', hmrcDepartment);
  }

  const { data: outcomes } = await query;

  if (!outcomes || outcomes.length === 0) {
    return {
      totalCases: 0,
      successRate: 0,
      avgResolutionDays: 0,
      avgCompensation: 0,
      topEffectiveArguments: [],
    };
  }

  const successful = outcomes.filter(o => o.is_successful);
  const allArguments: Record<string, number> = {};
  
  outcomes.forEach(o => {
    (o.effective_arguments || []).forEach((arg: string) => {
      allArguments[arg] = (allArguments[arg] || 0) + 1;
    });
  });

  const topArguments = Object.entries(allArguments)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([arg]) => arg);

  return {
    totalCases: outcomes.length,
    successRate: (successful.length / outcomes.length) * 100,
    avgResolutionDays: outcomes.reduce((sum, o) => sum + (o.days_to_resolution || 0), 0) / outcomes.length,
    avgCompensation: outcomes.reduce((sum, o) => sum + (o.compensation_received || 0), 0) / outcomes.length,
    topEffectiveArguments: topArguments,
  };
}

/**
 * Process any pending outcome analyses (batch job)
 */
export async function processPendingAnalyses(): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  const { data: pending } = await supabaseAdmin
    .from('pending_outcome_analysis')
    .select('id')
    .limit(10);

  for (const outcome of pending || []) {
    try {
      await extractLearningsAsync(outcome.id);
      processed++;
    } catch (err) {
      errors++;
      logger.error(`Failed to process outcome ${outcome.id}:`, err);
    }
    // Rate limit
    await new Promise(r => setTimeout(r, 2000));
  }

  return { processed, errors };
}

