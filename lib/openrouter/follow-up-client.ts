/**
 * Follow-Up Letter Generation
 * 
 * Handles the Tier 1 dialogue lifecycle:
 * 1. Chase - No response yet, checking progress
 * 2. Delayed Response - HMRC responded outside timescales (additional CRG breach)
 * 3. Inadequate Response - Placeholder/partial response, need substantive reply
 * 4. Rebuttal - HMRC denied something incorrectly, need to counter
 * 5. Tier 2 Escalation - ONLY when HMRC says "closed" and we disagree
 * 
 * Note: We do NOT jump to Tier 2 unless HMRC indicates impasse.
 */

import { logger } from '../logger';

const FOLLOW_UP_MODEL = 'anthropic/claude-sonnet-4.5';
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export type FollowUpType = 
  | 'chase'              // No response yet
  | 'delayed_response'   // HMRC responded late
  | 'inadequate_response' // Placeholder/partial
  | 'rebuttal'           // Counter incorrect denial
  | 'tier2_escalation';  // HMRC closed + we disagree

interface FollowUpContext {
  type: FollowUpType;
  originalLetterDate: string;
  originalLetterRef?: string;
  hmrcResponseDate?: string;
  hmrcResponseSummary?: string;
  daysSinceOriginal: number;
  daysOverdue?: number;
  clientReference: string;
  hmrcDepartment: string;
  unaddressedPoints?: string[];
  additionalContext?: string;
  practiceLetterhead?: string;
  chargeOutRate?: number;
  userName?: string;
  userTitle?: string;
  userEmail?: string | null;
  userPhone?: string | null;
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const callOpenRouter = async (messages: OpenRouterMessage[], maxTokens: number = 3000): Promise<string> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured');
  }
  
  logger.info(`🤖 Calling OpenRouter for follow-up letter generation`);

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://lightpoint.app',
      'X-Title': 'Lightpoint HMRC Complaint System',
    },
    body: JSON.stringify({
      model: FOLLOW_UP_MODEL,
      messages,
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    logger.error('❌ OpenRouter API error:', response.status, error);
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

const getFollowUpTypeDescription = (type: FollowUpType): string => {
  switch (type) {
    case 'chase':
      return 'Progress check - no response received yet, within reasonable timeframe';
    case 'delayed_response':
      return 'HMRC responded OUTSIDE their published timescales - this is an additional CRG breach';
    case 'inadequate_response':
      return 'HMRC sent a placeholder/holding response or partial reply - need substantive response';
    case 'rebuttal':
      return 'HMRC denied or disputed points incorrectly - need to counter with evidence';
    case 'tier2_escalation':
      return 'HMRC has indicated they consider the complaint closed but we remain unsatisfied - escalate to Tier 2';
    default:
      return 'Follow-up correspondence';
  }
};

const getSystemPrompt = (context: FollowUpContext): string => {
  const today = new Date().toLocaleDateString('en-GB', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const basePrompt = `You are generating a professional follow-up letter in an ongoing HMRC Tier 1 complaint dialogue.

**CRITICAL UNDERSTANDING:**
- Tier 1 is NOT a single letter - it's an ongoing dialogue until resolution or impasse
- We only escalate to Tier 2 when HMRC explicitly indicates they consider the complaint closed AND we are unsatisfied
- This is a FOLLOW-UP within Tier 1, maintaining pressure professionally

**FOLLOW-UP TYPE:** ${getFollowUpTypeDescription(context.type)}

**TODAY'S DATE:** ${today}

**LETTERHEAD:**
${context.practiceLetterhead || '[Firm Name]\n[Address]\n[Contact details]'}

**CLIENT REFERENCE:** ${context.clientReference}
**HMRC DEPARTMENT:** ${context.hmrcDepartment}
${context.originalLetterRef ? `**ORIGINAL LETTER REFERENCE:** ${context.originalLetterRef}` : ''}

**REAL USER DETAILS FOR CLOSING:**
- Name: ${context.userName || 'NOT PROVIDED'}
- Title: ${context.userTitle || 'NOT PROVIDED'}
- Email: ${context.userEmail || 'NOT PROVIDED'}
- Phone: ${context.userPhone || 'NOT PROVIDED'}

**CHARGE-OUT RATE:** £${context.chargeOutRate || 250}/hour`;

  const typeSpecificPrompt = getTypeSpecificPrompt(context);

  return `${basePrompt}

${typeSpecificPrompt}

**STRUCTURE:**
1. Letterhead with today's date
2. Reference line (include original complaint reference)
3. Dear Sir/Madam
4. **Subject line** referencing this is a FOLLOW-UP
5. Opening paragraph - reference original letter, date, and current status
6. Body - specific to follow-up type
7. Required actions
8. Response deadline (appropriate to type)
9. Professional closing with REAL user details
10. Enclosures (if any)

**CRITICAL FORMATTING:**
- Use **double asterisks** for ALL section headings, dates, and important text
- Maintain organizational voice ("We", "Our firm")
- Be firm but professional
- Reference all dates precisely
- Use the REAL user name "${context.userName}" and title "${context.userTitle}" in closing`;
};

const getTypeSpecificPrompt = (context: FollowUpContext): string => {
  switch (context.type) {
    case 'chase':
      return `**CHASE LETTER SPECIFICS:**
- Politely enquire about progress
- Reference original letter date: ${context.originalLetterDate}
- Note ${context.daysSinceOriginal} days have elapsed
- Request acknowledgment and expected timeline
- Tone: Professional, not aggressive (yet)
- Do NOT threaten Tier 2 (not appropriate at this stage)`;

    case 'delayed_response':
      return `**DELAYED RESPONSE SPECIFICS:**
- HMRC responded on ${context.hmrcResponseDate} - ${context.daysOverdue} days after their 15 working day target
- This delayed response is ITSELF a breach of CRG service standards
- ADD this delay as an additional CRG4025/CRG6150 violation
- Cite the delay specifically: "Your response dated ${context.hmrcResponseDate} was received ${context.daysOverdue} days after our complaint letter of ${context.originalLetterDate}"
- Maintain firm professional tone
- Express disappointment at delay
- Request substantive action within 10 working days
- Still within Tier 1 - do NOT escalate unless HMRC says closed

HMRC RESPONSE SUMMARY:
${context.hmrcResponseSummary || 'Placeholder/holding response received'}`;

    case 'inadequate_response':
      return `**INADEQUATE RESPONSE SPECIFICS:**
- HMRC sent a placeholder/partial response on ${context.hmrcResponseDate}
- Response did not address the substantive issues raised
- Politely but firmly request a full response
- List specific points that remain unaddressed:
${context.unaddressedPoints?.map(p => `  - ${p}`).join('\n') || '  - [Points to be addressed]'}
- Set clear deadline (10 working days)
- Note that continued delay will be considered in any professional costs claim
- Still within Tier 1

HMRC RESPONSE SUMMARY:
${context.hmrcResponseSummary || 'Inadequate response received'}`;

    case 'rebuttal':
      return `**REBUTTAL SPECIFICS:**
- HMRC denied or disputed points in their response of ${context.hmrcResponseDate}
- Counter their assertions with evidence and facts
- Be specific about what they got wrong
- Maintain professional but assertive tone
- Provide evidence/citations to support our position
- Request reconsideration
- Still within Tier 1 unless they say closed

HMRC RESPONSE SUMMARY:
${context.hmrcResponseSummary || 'Response denying complaint grounds'}

POINTS REQUIRING REBUTTAL:
${context.unaddressedPoints?.map(p => `  - ${p}`).join('\n') || '  - [Points to rebut]'}`;

    case 'tier2_escalation':
      return `**TIER 2 ESCALATION SPECIFICS:**
- HMRC has indicated they consider the Tier 1 complaint closed
- We remain unsatisfied with the outcome
- Formally escalate to Tier 2 review
- Reference CHG408 and CHG complaint handling procedures
- Cite specific reasons why Tier 1 resolution is inadequate
- State escalation rights clearly
- Request Tier 2 review within 40 working days per CHG guidelines
- Mention potential Adjudicator referral if Tier 2 inadequate

HMRC's CLOSING RESPONSE SUMMARY:
${context.hmrcResponseSummary || 'HMRC considers complaint closed'}

REASONS FOR ESCALATION:
${context.unaddressedPoints?.map(p => `  - ${p}`).join('\n') || '  - [Reasons for escalation]'}`;

    default:
      return '';
  }
};

export const generateFollowUpLetter = async (context: FollowUpContext): Promise<string> => {
  logger.info(`📝 Generating ${context.type} follow-up letter`);
  logger.info(`📅 Original letter: ${context.originalLetterDate}, Days since: ${context.daysSinceOriginal}`);
  
  const systemPrompt = getSystemPrompt(context);
  
  const userPrompt = `Generate the follow-up letter now.

CONTEXT:
- Original letter sent: ${context.originalLetterDate}
- Days elapsed: ${context.daysSinceOriginal}
${context.hmrcResponseDate ? `- HMRC response received: ${context.hmrcResponseDate}` : '- No HMRC response received yet'}
${context.daysOverdue ? `- Days overdue: ${context.daysOverdue}` : ''}

${context.additionalContext ? `ADDITIONAL CONTEXT FROM USER:\n${context.additionalContext}\n` : ''}

Generate the complete professional follow-up letter now.

REMEMBER:
- All section headings must have **double asterisks**
- All dates must have **double asterisks**
- Use REAL user details in closing: ${context.userName}, ${context.userTitle}
- Organizational voice only ("We", "Our firm")
- ${context.type === 'tier2_escalation' ? 'This IS a Tier 2 escalation letter' : 'This is still within Tier 1 - do NOT threaten Tier 2 unless type is tier2_escalation'}`;

  const letter = await callOpenRouter([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], 3500);

  logger.info(`✅ Follow-up letter generated, length: ${letter.length}`);
  return letter;
};

/**
 * Determine the appropriate follow-up type based on context
 */
export const determineFollowUpType = (
  hasHmrcResponse: boolean,
  hmrcResponseDate: string | null,
  originalLetterDate: string,
  hmrcIndicatedClosed: boolean = false,
  responseWasSubstantive: boolean = true,
): FollowUpType => {
  // If HMRC says closed and we disagree
  if (hmrcIndicatedClosed) {
    return 'tier2_escalation';
  }

  // If no response yet
  if (!hasHmrcResponse || !hmrcResponseDate) {
    return 'chase';
  }

  // Calculate if response was late (15 working days = ~21 calendar days)
  const originalDate = new Date(originalLetterDate);
  const responseDate = new Date(hmrcResponseDate);
  const daysBetween = Math.floor((responseDate.getTime() - originalDate.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysBetween > 21) {
    return 'delayed_response';
  }

  // If response wasn't substantive
  if (!responseWasSubstantive) {
    return 'inadequate_response';
  }

  // Default to rebuttal if they responded on time with substantive content
  return 'rebuttal';
};

export default generateFollowUpLetter;



