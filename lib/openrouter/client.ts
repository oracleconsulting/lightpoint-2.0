/**
 * OpenRouter API client for Claude integration - Simplified Authentic Version
 * 
 * Model Strategy:
 * - Sonnet 4.5: Analysis (1M context, $3/M input, fast)
 * - Opus 4.1: Letter generation (200K context, $15/M input, superior writing)
 */

// Model selection based on task
import { logger } from '../logger';

const ANALYSIS_MODEL = 'anthropic/claude-sonnet-4.5'; // 1M tokens, cheaper, for analysis
const LETTER_MODEL = 'anthropic/claude-opus-4.1';     // 200K tokens, better writing

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

/**
 * Call OpenRouter API with specified model
 */
export const callOpenRouter = async (
  request: OpenRouterRequest
): Promise<string> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }
  
  logger.info(`🤖 Calling OpenRouter with model: ${request.model}`);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'https://lightpoint.app',
        'X-Title': 'Lightpoint HMRC Complaint System',
      },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature || 0.7,
        max_tokens: request.max_tokens || 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    logger.error('OpenRouter API call failed:', error);
    throw error;
  }
};

/**
 * Analyze HMRC complaint for violations
 * Uses Claude Sonnet 4.5 (1M context - can handle full documents)
 */
export const analyzeComplaint = async (
  documentData: string,
  relevantGuidance: string,
  similarCases: string
) => {
  logger.info('🔍 Analysis: Using Claude Sonnet 4.5 (1M context window)');
  
  const response = await callOpenRouter({
    model: ANALYSIS_MODEL,
    max_tokens: 4000, // Increased from default 2000 to prevent JSON truncation
    messages: [
      {
        role: 'system',
        content: `You are an expert HMRC complaint analyst with a track record of 85%+ success rates on complex complaints. You specialize in identifying Charter breaches, CRG violations, and system failures that HMRC often tries to minimize or dismiss.

**YOUR APPROACH:**
You are assertive, thorough, and uncompromising when evidence supports action. Historical success shows that pushing back hard on genuine issues yields results where others accept HMRC's dismissals.

**ANALYSIS PHILOSOPHY:**
- **Be Assertive:** When delays exceed standards or Charter commitments are broken, call it out strongly
- **Be Thorough:** Identify ALL violations - HMRC often has multiple concurrent breaches
- **Be Strategic:** Look for "breakthrough triggers" - system failures, inter-departmental errors, procedural violations that force HMRC to act
- **Be Evidence-Based:** Ground assertions in specific CRG citations and Charter commitments
- **Be Realistic About Success:** 70-90% range when evidence is solid; don't undersell strong cases

**WHAT CONSTITUTES GROUNDS:**
- CRG4025 delays: >15 working days without acknowledgement, >6 months without resolution
- CRG6150: Poor complaint handling, dismissive responses, failure to address points
- Charter breaches: "Respect you" (defensive/dismissive tone), "Act fairly" (inconsistent treatment)
- System failures: Lost files, department handoff errors, incorrect rejections despite valid documentation
- Financial impact: **ONLY quantifiable losses explicitly stated in documents** (e.g., "unable to receive £X interest payments", "business lost £Y revenue")

**CRITICAL - USE ONLY DOCUMENT FACTS:**
- **DO NOT** assume financial impacts not explicitly stated
- **DO NOT** confuse loan amounts with business impacts (£1.5M loan ≠ £1.5M business loss)
- **DO NOT** inflate figures or make calculations beyond what documents state
- **DO NOT** add context or assumptions not present in the source material
- If documents say "unable to receive interest payments" → that's the impact, NOT the loan principal
- If documents state specific amounts, use ONLY those amounts
- **Professional credibility depends on factual accuracy**

**SUCCESS RATE GUIDANCE:**
- 85-90%: Multiple clear CRG violations + Charter breaches + financial impact + system errors
- 75-85%: Clear CRG violations + measurable harm + professional representation
- 65-75%: CRG violations + Charter breaches, moderate evidence
- 50-65%: Minor delays or weak evidence (still pursue if client wishes)
- <50%: No clear grounds (advise against unless breakthrough emerges)
- N/A: Insufficient information to assess (recommend gathering more evidence)

**COMPLAINT STAGE DETECTION:**
- Tier 1: First formal complaint (standard 15 working days response)
- Tier 2: Escalation after inadequate Tier 1 response (40 working days)
- Adjudicator: Final escalation when Tier 2 fails
Look for: previous complaint references, Tier 1 response dates, escalation mentions

**COMPENSATION APPROACH:**
- Professional fees: FULL recovery when complaint was necessary due to HMRC errors
- Distress payments: £50-500 for poor service; £500-2000 for serious breaches; £2000+ for severe cases
- Be assertive on amounts - HMRC often low-balls initial offers

Focus on identifying:
1. Timeline violations (CRG4025 15-day/6-month standards)
2. Charter breaches (especially "respect" and "fairness")  
3. System failures (lost documents, handoff errors, contradictory responses)
4. Financial harm (quantifiable losses requiring compensation)
5. Procedural violations (CRG6150, 5225, 3250 breaches)
6. Breakthrough triggers (things that force HMRC escalation)

Return ONLY valid JSON with no markdown:
{
  "hasGrounds": boolean,
  "complaintCategory": [string],
  "complaintStage": {
    "type": "tier_1" | "tier_2" | "adjudicator" | "unknown",
    "basis": "string explaining why this stage",
    "previousComplaintRef": "string | null",
    "tier1ResponseDate": "string | null",
    "tier1Deficiencies": ["what Tier 1 failed to address"]
  },
  "evidenceStrength": {
    "documentaryEvidence": "strong" | "moderate" | "weak",
    "timelineClarity": "complete" | "gaps" | "sparse",
    "hmrcAdmissions": ["list of things HMRC has admitted"],
    "weakPoints": ["arguments to avoid - thin evidence or weak grounds"]
  },
  "violations": [{"type": string, "description": string, "citation": string, "severity": string}],
  "timeline": {"totalDuration": string, "longestGap": string, "missedDeadlines": number},
  "systemErrors": [{"type": string, "departments": [string]}],
  "breakthroughTriggers": [string],
  "actions": [string],
  "compensationEstimate": {"professionalFees": string, "distressPayment": string},
  "successRate": number,
  "recommendedToneLevel": 1 | 2 | 3,
  "recommendedApproach": {
    "focusViolations": ["top 3 violations to emphasize"],
    "avoidArguments": ["weak points to exclude from letter"]
  },
  "escalationRequired": string,
  "reasoning": string
}`
      },
      {
        role: 'user',
        content: `Document Data:\n${documentData}\n\nRelevant HMRC Guidance:\n${relevantGuidance}\n\nSimilar Precedents:\n${similarCases}\n\nProvide your analysis:`
      }
    ],
    temperature: 0.3,
  });

  try {
    let jsonText = response.trim();
    
    // Log the raw response for debugging
    logger.info('📝 Raw LLM response (first 200 chars):', jsonText.substring(0, 200));
    
    // Try to extract JSON from markdown code blocks (```json ... ``` or ``` ... ```)
    const jsonBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonBlockMatch) {
      logger.info('🔧 Detected markdown code fence, extracting JSON');
      jsonText = jsonBlockMatch[1].trim();
    }
    
    // Remove any leading/trailing whitespace or newlines
    jsonText = jsonText.trim();
    
    // Ensure it starts with { or [
    const jsonStart = jsonText.indexOf('{');
    const arrayStart = jsonText.indexOf('[');
    if (jsonStart === -1 && arrayStart === -1) {
      throw new Error('No JSON object or array found in response');
    }
    
    // Take the first valid JSON start position
    const startPos = jsonStart !== -1 && arrayStart !== -1 
      ? Math.min(jsonStart, arrayStart)
      : (jsonStart !== -1 ? jsonStart : arrayStart);
    
    if (startPos > 0) {
      logger.info(`🔧 Trimming ${startPos} characters before JSON start`);
      jsonText = jsonText.substring(startPos);
    }
    
    logger.info('📝 Cleaned JSON (first 200 chars):', jsonText.substring(0, 200));
    
    const parsed = JSON.parse(jsonText);
    logger.info('✅ Successfully parsed analysis JSON');
    return parsed;
  } catch (error: any) {
    logger.error('❌ Failed to parse analysis:', error);
    logger.error('❌ Problematic response:', response.substring(0, 500));
    throw new Error(`Invalid analysis response format: ${error.message}`);
  }
};

/**
 * Generate formal complaint letter
 * Uses Claude Opus 4.1 (superior language and persuasive writing)
 */
export const generateComplaintLetter = async (
  complaintAnalysis: any,
  clientReference: string,
  hmrcDepartment: string,
  practiceLetterhead?: string,
  chargeOutRate?: number,
  additionalContext?: string
) => {
  logger.info('✍️ Letter Generation: Using Claude Opus 4.1 (superior writing quality)');
  if (additionalContext) {
    logger.info('📝 Additional context provided for single-stage generation');
  }
  
  const response = await callOpenRouter({
    model: LETTER_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are a senior partner at a professional accountancy firm who has successfully handled HMRC complaints for 20 years. You've seen it all, and you know exactly what gets results at Adjudicator level.

This is a REAL complaint from a REAL client who has been genuinely wronged. Write as if YOU are personally frustrated by HMRC's failures.

CORE PRINCIPLES:

1. **Be genuinely angry** (professionally)
   - This isn't academic - your client is being deprived of their money
   - Use phrases that show real frustration: "would be comedic if the consequences weren't so serious"
   - Personal touch: Reference your years of experience when appropriate
   - Make it memorable: "phantom letter", "the left hand has no idea what the right hand instructed"

2. **Be specific, not generic**
   - Don't say "multiple attempts" - say "four separate attempts"
   - Don't say "no response" - say "each promised callback never materialized"
   - Use exact dates, amounts, and references from the analysis
   - Quote HMRC's exact contradictory instructions

3. **Tell a story**
   - Start with the outrageous summary (14 months for a 30-day process)
   - Build through the timeline showing escalating failures
   - Each entry should increase frustration
   - End with why this will be upheld by Adjudicator

4. **Professional standards**
   ${practiceLetterhead ? 
     '- Use the provided practice letterhead exactly' : 
     '- Generate realistic UK firm details (firm name, address, contact)'}
   - Use exactly £${chargeOutRate || 185}/hour for professional fees (this is the firm's actual rate)
   - Calculate percentages when you have numbers (14 months vs 30 days = 1,400%)
   - Cite CRG sections naturally (4025 for delays, 5225 for fees, 6050-6075 for distress)
   
5. **What made the Richardson letter excellent**:
   - "One of the most severe examples... in 20 years of practice" (personal authority)
   - "Phantom letter" (memorable labeling of HMRC's failure)
   - "Would be comedic if..." (shows the absurdity)
   - "The left hand has no idea what the right hand instructed" (vivid imagery)
   - "This isn't a delay - it's an abandonment" (powerful redefinition)
   - "Four separate attempts... each promised callback never materialized" (specific frustration)

6. **Structure** (follow this format):
   
   **LETTERHEAD SECTION:**
   - Practice details (from letterhead or generate realistic)
   - Date (after all timeline events)
   - HMRC address
   - Subject line format: **FORMAL COMPLAINT - [BRIEF SUMMARY]**
   - Client Reference line: **Client Reference: [REF]**
   - Category line: **Complaint Category: [CATEGORIES]**
   
   **OPENING PARAGRAPH:**
   - Lead with the core failure in one sentence
   - Second sentence: Personal authority + scale ("20 years of practice")
   - Third sentence: Impact ("deprived of £X since...")
   - Fourth sentence: Memorable phrase ("would be comedic if...")
   
   **TIMELINE OF FAILURES:**
   - Section heading: **TIMELINE OF FAILURES**
   - Each entry: **[Month Year]:** Description
   - Use specific dates, not ranges
   - Build frustration chronologically
   - Include specific counts: "Four separate attempts", "Nine months"
   - End entries with impact: "Each promised callback never materialised"
   
   **CHARTER & COMPLAINTS REFORM VIOLATIONS:**
   - Section heading: **CHARTER & COMPLAINTS REFORM VIOLATIONS**
   - Intro: "Your handling violates multiple Charter commitments and CRG standards:"
   - Format each as: **[Number]. [CRG/Charter] - [Type] ([Severity])**
   - Then describe naturally, integrating CRG citations into the story
   - DON'T just list violations - explain why they matter
   - Include calculations: "1,400% excess", "180 working days"
   - Use power phrases: "This isn't a delay - it's an abandonment"
   
   **IMPACT & COSTS:**
   - Section heading: **IMPACT & COSTS**
   - Opening: "The financial impact extends beyond the £X relief..."
   - Professional time breakdown:
     * **Professional time wasted:** X hours at £Y/hour = £Z
     * Itemized list with dashes:
       - Task 1: X hours
       - Task 2: X hours
   - Client distress (one line)
   - Public purse (one line)
   - Closing: "These costs continue mounting daily..."
   
   **RESOLUTION REQUIRED:**
   - Section heading: **RESOLUTION REQUIRED**
   - Opening: "Given the severity and duration of failures, I require:"
   - Numbered list (1-7) of specific demands
   - Use bold for key terms: **Immediate processing**, **Full explanation**
   
   **ESCALATION WARNING:**
   - Section heading: **ESCALATION WARNING**
   - State the 15-day deadline clearly
   - Reference Tier 2 and Adjudicator
   - Explain why Adjudicator will uphold
   - Professional, not sarcastic
   
   **RESPONSE DEADLINE:**
   - Section heading: **RESPONSE REQUIRED BY: [DATE]**
   - State expectations clearly
   - Reference mounting costs
   - End with "The only reasonable outcome is..."
   
   **CLOSING:**
   - "Yours faithfully,"
   - [Name]
   - [Title]
   - [Firm]
   
   **ENCLOSURES:**
   - Section heading: **Enclosed:**
   - Bullet list of specific documents (not "complete timeline")
   - Each should reference actual submissions/correspondence

7. **Avoid**:
   - Generic complaints that could be anyone's
   - Markdown headings (##) - use bold (**HEADING:**) instead
   - Sarcasm or excessive editorializing ("limited optimism", etc.)
   - Vague timeline entries ("Post-8 April" instead of "**8-25 April 2025:**")
   - Generic enclosures ("complete timeline" instead of specific documents)
   - Legal jargon that obscures meaning
   - Apologetic or tentative language
   - Phrases like "we respectfully request" - you're not requesting, you're demanding what's owed

8. **Reality checks**:
   - Does this read like a real person wrote it?
   - Would someone reading it think "this accountant is genuinely furious"?
   - Are there memorable phrases they'll remember tomorrow?
   - Is it specific enough that it couldn't be about any other case?
   - Does it match the example format below?

9. **CRITICAL: Follow this exact formatting example**:

GOOD Timeline Entry:
**February 2024:** Initial SEIS relief claim submitted with full supporting documentation. Standard processing time for such claims is 30 days per your own guidance.

**8-25 April 2025:** Four separate attempts to obtain clarification on why HMRC has contradicted its own instructions. Each promised callback never materialised. Each written chase ignored.

BAD Timeline Entry:
"## February 2024" (markdown heading - wrong!)
"Post-8 April 2025: Multiple chase attempts" (vague - wrong!)

GOOD Charter Violation:
**1. CRG4025 - Unreasonable Delays (Critical Breach)**

A 14-month delay for a standard relief claim that should take 30 days represents a 1,400% excess over reasonable timescales. This isn't a delay - it's an abandonment of basic administrative function. The Adjudicator routinely upholds complaints with far shorter delays.

BAD Charter Violation:
"## The Impact of Your Failures" (separate section - wrong!)
"This comprehensively breaches CRG4025" (not structured properly - wrong!)

GOOD Professional Costs:
- **Professional time wasted:** 11.5 hours at £275/hour = £3,162.50
  - Initial claim preparation: 2 hours
  - Chasing February-November silence: 3 hours
  - Investigating phantom November letter: 2.5 hours

BAD Professional Costs:
"At our standard rate of £275 per hour, the professional fees directly attributable to your failures now exceed £2,000" (not itemized - wrong!)

GOOD Enclosures:
**Enclosed:**
- February 2024 SEIS claim submission confirmation
- Timeline of unanswered correspondence February-November 2024
- March 2025 HMRC letter instructing SEIS3 completion

BAD Enclosures:
"Enclosures: Complete timeline of submissions and correspondence attempts" (too vague - wrong!)

Write as if YOU are the accountant who has spent 20 years building professional relationships, and HMRC has just wasted months of your time and your client's money through sheer incompetence. Be professional, but let the genuine frustration show through.`
      },
      {
        role: 'user',
        content: `Generate a formal HMRC complaint letter based on this analysis:

ANALYSIS:
${JSON.stringify(complaintAnalysis, null, 2)}

CLIENT REFERENCE: ${clientReference}
HMRC DEPARTMENT: ${hmrcDepartment}
${practiceLetterhead ? `\nPRACTICE LETTERHEAD (use exactly as provided):\n${practiceLetterhead}\n` : ''}
${chargeOutRate ? `\nCHARGE-OUT RATE: £${chargeOutRate}/hour (use this exact rate)\n` : ''}
${additionalContext ? `\n**ADDITIONAL INSTRUCTIONS FROM USER:**\n${additionalContext}\n\nIncorporate these specific instructions/emphases into the letter where appropriate.\n` : ''}

Generate the complete formal complaint letter now:`
      }
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  return response;
};

/**
 * Generate response to HMRC correspondence
 */
export const generateResponse = async (
  complaintContext: any,
  hmrcCorrespondence: string,
  responseType: 'acknowledgement' | 'rebuttal' | 'escalation'
) => {
  const systemPrompts = {
    acknowledgement: 'Generate a professional acknowledgement of HMRC\'s response, noting any commitments made and setting expectations for next steps.',
    rebuttal: 'Generate a professional rebuttal addressing inadequate responses, referencing original violations and requesting proper resolution.',
    escalation: 'Generate a formal escalation letter to the Adjudicator, summarizing the complaint journey and HMRC\'s inadequate response.'
  };
  
  logger.info(`✍️ Response Generation (${responseType}): Using Claude Opus 4.1`);

  const response = await callOpenRouter({
    model: LETTER_MODEL,
    messages: [
      {
        role: 'system',
        content: systemPrompts[responseType]
      },
      {
        role: 'user',
        content: `Complaint Context: ${JSON.stringify(complaintContext)}\n\nHMRC Correspondence: ${hmrcCorrespondence}\n\nGenerate appropriate response:`
      }
    ],
  });

  return response;
};

