/**
 * OpenRouter API client for Claude Opus 4.1 integration
 */

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
// Using Claude Opus 4.1 (latest model)
const DEFAULT_MODEL = 'anthropic/claude-opus-4.1';

/**
 * Call OpenRouter API with Claude Opus 4.1
 */
export const callOpenRouter = async (
  request: OpenRouterRequest
): Promise<string> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }

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
        model: request.model || DEFAULT_MODEL,
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
    console.error('OpenRouter API call failed:', error);
    throw error;
  }
};

/**
 * Analyze HMRC complaint for violations
 */
export const analyzeComplaint = async (
  documentData: string,
  relevantGuidance: string,
  similarCases: string
) => {
  const response = await callOpenRouter({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an expert HMRC complaint analyst with deep knowledge of:
- HMRC Charter commitments
- Complaint Resolution Guidance (CRG)
- Standard timeframes and service standards
- Precedent cases and outcomes
- HMRC complaints escalation process

CRITICAL KNOWLEDGE BASE PRIORITIZATION:

The provided "Relevant HMRC Guidance" and "Similar Precedents" sections contain AUTHORITATIVE information from the knowledge base. You MUST prioritize this information over general knowledge.

When analyzing:
1. Search the provided guidance for specific CRG references (e.g., CRG4025 for delays, CRG5225 for professional fees, CRG6050-6075 for distress compensation)
2. Look for Charter commitment violations in the document data
3. Verify timelines against standard response times (15 working days for Tier 1, 28 days for processing)
4. Cross-reference against similar precedent cases
5. Extract specific phrases and language from successful cases

HMRC Complaints Escalation Process (MUST FOLLOW EXACTLY):
- Tier 1: Initial complaint handled by HMRC complaints team (15 working days for response)
- Tier 2: Review of Tier 1 decision if not satisfied (internal HMRC review)
- Adjudicator: Independent external review if still not satisfied with Tier 2 decision
- Parliamentary Ombudsman: Final independent review if needed

When recommending escalation:
- First recommend filing Tier 1 complaint with 15 working day response expectation
- If no response or unsatisfactory: escalate to Tier 2 internal review
- If Tier 2 fails or is unsatisfactory: escalate to the Adjudicator's Office
- Only mention Ombudsman as final step after Adjudicator
- NEVER skip directly to Adjudicator without completing Tier 1 and Tier 2

Timeline Requirements (from knowledge base):
- HMRC Tier 1 response: 15 working days expected
- Escalate to Tier 2 if: No response after 15 working days OR unsatisfactory Tier 1 decision
- Standard processing times vary by claim type (e.g., SEIS claims: 28-30 days typical)
- Delays beyond reasonable timeframes constitute Charter violations

Common CRG References (prioritize if found in guidance):
- CRG4025: Unreasonable delays and remedy
- CRG5225: Professional fees reimbursement
- CRG6050-6075: Compensation for distress and inconvenience
- CRG guidance on financial redress for agent fees
- CRG guidance on considering claims for financial redress

Charter Commitments to Check:
- "Being Responsive" - timely responses to correspondence
- "Getting Things Right" - accurate information and consistent guidance
- "Making Things Easy" - clear processes without unnecessary complexity
- "Treating Fairly" - equitable treatment and consideration

Analyze documents for:
1. Specific Charter violations (with citations)
2. Unreasonable delays (beyond standard timeframes - reference actual timeframes from knowledge base)
3. CRG guidance breaches (reference specific CRG sections)
4. Applicable precedents (extract similar case outcomes from provided precedents)
5. Financial impacts (extract specific amounts, fees, interest due)
6. Communication failures (lost correspondence, contradictory instructions)

CRITICAL: Respond with ONLY valid JSON (no markdown, no code blocks, no explanations).

Required format:
{
  "hasGrounds": boolean,
  "violations": [{ 
    "type": string, 
    "description": string, 
    "citation": string (include specific CRG references or Charter commitments)
  }],
  "actions": [string (include specific timelines, CRG references, and escalation steps)],
  "successRate": number (0-100, based on similar precedent outcomes),
  "reasoning": string (reference specific guidance and precedents that support your assessment)
}

CRITICAL: Never process or include personal data. All data should be pre-anonymized.

Quality Checks Before Responding:
- Have I referenced specific CRG sections from the provided guidance?
- Does my escalation path exactly match Tier 1 → Tier 2 → Adjudicator?
- Are all timelines verified against the provided guidance?
- Have I extracted relevant language from precedent cases?
- Is my success rate based on similar case outcomes in the precedents?`
      },
      {
        role: 'user',
        content: `Document Data:\n${documentData}\n\nRelevant HMRC Guidance:\n${relevantGuidance}\n\nSimilar Precedents:\n${similarCases}\n\nProvide your analysis:`
      }
    ],
    temperature: 0.3, // Lower temperature for more consistent analysis
  });

  try {
    // Claude often wraps JSON in markdown code blocks, so extract it
    let jsonText = response.trim();
    
    // Remove markdown code blocks if present
    const jsonBlockMatch = jsonText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonBlockMatch) {
      jsonText = jsonBlockMatch[1].trim();
    }
    
    // Try to parse the JSON
    const parsed = JSON.parse(jsonText);
    console.log('✅ Successfully parsed analysis response');
    return parsed;
  } catch (error: any) {
    console.error('❌ Failed to parse OpenRouter response:', error);
    console.error('Raw response:', response);
    console.error('Response length:', response?.length);
    console.error('Response preview:', response?.substring(0, 500));
    throw new Error(`Invalid analysis response format: ${error.message}`);
  }
};

/**
 * Generate formal complaint letter
 */
export const generateComplaintLetter = async (
  complaintAnalysis: any,
  clientReference: string,
  hmrcDepartment: string
) => {
  const response = await callOpenRouter({
    model: DEFAULT_MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an expert at drafting formal HMRC complaint letters.

Letter Structure:
1. Subject line: "FORMAL COMPLAINT - [Department] - Ref: [Reference]"
2. Opening paragraph: Clear statement this is a formal complaint
3. Background: Chronological timeline of events
4. Specific violations: Reference Charter commitments and CRG guidance
5. Impact statement: Professional impact on accountant/client relationship
6. Required remedies: Specific actions requested
7. Timeframe: Reference 28-day response requirement
8. Fee recovery: Statement of intention to recover professional fees
9. Escalation: Reference to Adjudicator if unresolved

Tone: Professional, assertive, evidence-based, not emotional.

Use UK English and formal business letter format.`
      },
      {
        role: 'user',
        content: `Generate a formal complaint letter based on this analysis:

Analysis: ${JSON.stringify(complaintAnalysis)}
Client Reference: ${clientReference}
HMRC Department: ${hmrcDepartment}

Generate the complete letter:`
      }
    ],
    temperature: 0.7,
    max_tokens: 3000,
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

  const response = await callOpenRouter({
    model: DEFAULT_MODEL,
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

