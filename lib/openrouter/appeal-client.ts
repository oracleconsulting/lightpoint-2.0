/**
 * Three-Stage Appeal Letter Generation Pipeline
 *
 * Parallel to the complaint pipeline but for statutory penalty appeals.
 * Uses different prompts, structure, and tone.
 *
 * Stage 1: Extract penalty appeal facts (Sonnet 4.5, temp 0.2)
 * Stage 2: Structure appeal letter (Opus 4.1, temp 0.2)
 * Stage 3: Add legal argument tone (Opus 4.1, temp 0.3)
 */

import { callOpenRouter } from './client';
import { logger } from '../logger';

const ANALYSIS_MODEL = 'anthropic/claude-sonnet-4.5';
const STRUCTURE_MODEL = 'anthropic/claude-opus-4.1';
const TONE_MODEL = 'anthropic/claude-opus-4.1';

export type AppealProgressCallback = (stage: string, percent: number, message: string) => void;

const STAGE1_SYSTEM_PROMPT = `You are a data extraction specialist for UK tax penalty appeals.
Extract ALL facts relevant to a statutory penalty appeal.

CRITICAL: This is a PENALTY APPEAL, not a complaint.
The legal framework is TMA 1970 / FA 2009 / VATA 1994, NOT the CRG/CHG complaint framework.

Extract:

1. PENALTY FACTS
   - Penalty type (late filing, late payment, inaccuracy, etc.)
   - Penalty amount(s) and calculation
   - Tax year(s) affected
   - Penalty notice date(s) and reference(s)
   - Relevant statutory provision (FA 2009 Sch 55 para X)
   - Appeal deadline
   - Whether appeal is in time or late

2. REASONABLE EXCUSE GROUNDS
   - What prevented compliance (illness, bereavement, fire/flood, HMRC error, postal failure, third-party reliance, etc.)
   - When the impediment arose and when it was removed
   - What action was taken once impediment removed
   - Whether client acted "without unreasonable delay" after
   - TMA 1970 s118(2) or VATA 1994 s71(1) analysis

3. EVIDENCE INVENTORY
   - Documents that support each ground of appeal
   - Dates and details that corroborate the excuse
   - HMRC's own records that support the appeal (NRL status, change of address, online account)
   - Third-party evidence (medical, postal, employer)

4. PROCEDURAL FACTS
   - Whether notices to file were issued and received
   - Whether client was registered / had filing obligation
   - s7 TMA 1970 obligation analysis (income above threshold?)
   - NRL/non-resident status and implications
   - Whether HMRC had correct address on record

5. HMRC INTERACTION FACTS
   - All correspondence with dates
   - Phone calls (dates, duration, what was said)
   - Online account activity
   - Any HMRC guidance or advice given

6. TIMELINE
   - Complete chronological timeline
   - Gap between trigger event and client response
   - Whether client met "without unreasonable delay" test

CRITICAL INTEGRITY: Extract ONLY facts that are TRUE and SUPPORTED by evidence.
Do NOT invent facts, exaggerate, or add persuasive spin.
If the case is weak, say so honestly.

Format as a structured fact sheet with clear sections and bullet points.`;

const STAGE2_SYSTEM_PROMPT = `You are structuring facts into a formal UK tax penalty appeal letter.

CRITICAL DIFFERENCES FROM COMPLAINT LETTERS:
- Addressed to HMRC's Debt Management / Penalties team, NOT Complaints Resolution
- Legal framework is TMA 1970 / FA 2009, NOT CRG/CHG
- Tone is measured statutory argument, NOT professional anger
- Success depends on demonstrating reasonable excuse, NOT documenting service failures

LETTER STRUCTURE (MANDATORY):
1. Firm letterhead and date
2. Recipient: HMRC Penalty Appeals / Debt Management (NOT Complaints Resolution Team)
3. Client reference and penalty reference(s)
4. Subject line: "Statutory Appeal Against [Penalty Type] – [Tax Year(s)] – [Client Name/UTR]"
5. Opening: clear statement this is a statutory appeal under [relevant provision]
6. Background and facts: neutral chronological account
7. Grounds of appeal: each ground numbered with statutory basis
8. Reasonable excuse analysis: applying s118(2) / s71(1) test
9. "Without unreasonable delay" analysis
10. Supporting evidence: numbered list of enclosed documents
11. Relief sought: cancellation / reduction / alternative
12. Alternative submission: if primary ground fails, secondary grounds
13. Right to review/tribunal: noting preserved rights
14. Closing with practitioner details

REASONABLE EXCUSE FRAMEWORK (TMA 1970 s118(2)):
A person has a reasonable excuse if:
(a) They had a reasonable excuse for the failure, AND
(b) They remedied the failure without unreasonable delay after the excuse ceased

PROFESSIONAL STANDARDS:
- Only include grounds supported by the facts
- If a ground is weak, say so and present as alternative
- Cite specific statutory provisions
- Reference relevant tribunal decisions if provided in facts
- Use numbered paragraphs for clarity
- Include evidence schedule

DO NOT:
- Use CRG citations (wrong framework)
- Reference the HMRC Charter (irrelevant to appeal)
- Adopt angry or emotional tone
- Include compensation claims (that is complaint territory)
- Make arguments not supported by facts

Use **bold** for: section headings, paragraph numbers, statute references.
Use real user name and title in the closing — do NOT change to placeholders.`;

const STAGE3_SYSTEM_PROMPT = `You are adding professional tone to a structured penalty appeal letter.

TONE: Measured statutory argument by an experienced tax practitioner.
This is NOT a complaint. Do not express anger, frustration, or indignation.

The reader is an HMRC officer evaluating reasonable excuse.
They want clear evidence, logical argument, and statutory analysis.

VOICE:
- Confident but not aggressive
- Evidence-first, opinion-second
- "Our client" or "the taxpayer", not emotional language
- Statutory references woven naturally into argument
- Concise: say it once, say it well, move on
- Professional courtesy throughout

GOOD PHRASES:
- "It is respectfully submitted that..."
- "The facts demonstrate that..."
- "This ground is supported by [evidence]"
- "In [Case Name], the Tribunal found that..."
- "Our client took immediate steps to remedy the position"
- "HMRC's own records confirm that..."

AVOID:
- "HMRC failed to..." (complaint language)
- "This is outrageous/unacceptable" (emotional)
- "In our 20 years of experience" (complaint style)
- Sarcasm, memorable labeling, or dramatic phrasing
- CRG references or Charter citations
- "Would be comedic if..." patterns

PRESERVE: ALL formatting, real user details, structure from Stage 2.
Organisational voice ("we", not "I").

CRITICAL: Verify ALL section headings and statute references have **double asterisks** before returning.
Keep the real user name and title EXACTLY as provided.`;

async function stage1_extractFacts(
  complaintAnalysis: any,
  clientReference: string,
  hmrcDepartment: string,
  onProgress?: AppealProgressCallback
): Promise<string> {
  logger.info('📊 APPEAL STAGE 1: Extracting penalty appeal facts with Sonnet 4.5');
  onProgress?.('stage1', 0, 'Extracting penalty appeal facts...');

  const response = await callOpenRouter({
    model: ANALYSIS_MODEL,
    messages: [
      { role: 'system', content: STAGE1_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Extract all facts from this analysis for a penalty appeal:

ANALYSIS:
${JSON.stringify(complaintAnalysis, null, 2)}

CLIENT REFERENCE: ${clientReference}
HMRC DEPARTMENT: ${hmrcDepartment}

Extract a complete fact sheet now:`,
      },
    ],
    temperature: 0.2,
    max_tokens: 2500,
  });

  onProgress?.('stage1', 100, 'Facts extracted');
  return response;
}

async function stage2_structureLetter(
  factSheet: string,
  practiceLetterhead?: string,
  chargeOutRate?: number,
  userName?: string,
  userTitle?: string,
  userEmail?: string | null,
  userPhone?: string | null,
  additionalContext?: string,
  onProgress?: AppealProgressCallback
): Promise<string> {
  logger.info('🏗️ APPEAL STAGE 2: Structuring appeal letter with Opus 4.1');
  onProgress?.('stage2', 0, 'Structuring appeal letter...');

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const response = await callOpenRouter({
    model: STRUCTURE_MODEL,
    messages: [
      { role: 'system', content: STAGE2_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Organize these facts into the statutory appeal letter structure:

${factSheet}

${chargeOutRate ? `\nCharge-out rate: £${chargeOutRate}/hour\n` : ''}

${additionalContext ? `\n**ADDITIONAL INSTRUCTIONS:**\n${additionalContext}\n\n` : ''}

REAL USER DETAILS FOR CLOSING:
- Name: ${userName || 'NOT PROVIDED'}
- Title: ${userTitle || 'NOT PROVIDED'}
- Email: ${userEmail || 'NOT PROVIDED - omit'}
- Phone: ${userPhone || 'NOT PROVIDED - omit'}

Date for letter: ${today}

Create the structured appeal letter now (facts only, no tone yet).
REMINDER: Every section heading and statute reference MUST have **double asterisks**.
REMINDER: Use the REAL user name "${userName}" and title "${userTitle}" in the closing.`,
      },
    ],
    temperature: 0.2,
    max_tokens: 2500,
  });

  onProgress?.('stage2', 100, 'Structure complete');
  return response;
}

async function stage3_addTone(
  structuredLetter: string,
  userName?: string,
  userTitle?: string,
  onProgress?: AppealProgressCallback
): Promise<string> {
  logger.info('✍️ APPEAL STAGE 3: Adding legal argument tone with Opus 4.1');
  onProgress?.('stage3', 0, 'Adding professional statutory tone...');

  const response = await callOpenRouter({
    model: TONE_MODEL,
    messages: [
      { role: 'system', content: STAGE3_SYSTEM_PROMPT },
      {
        role: 'user',
        content: `Add professional statutory tone to this appeal letter:

${structuredLetter}

Transform it now (measured statutory argument, organizational voice).

CRITICAL: Verify ALL section headings and statute references have **double asterisks**.
CRITICAL: Keep the real user name "${userName}" and title "${userTitle}" EXACTLY as provided.`,
      },
    ],
    temperature: 0.3,
    max_tokens: 3500,
  });

  onProgress?.('stage3', 100, 'Tone complete');
  return response;
}

export const generateAppealLetterThreeStage = async (
  complaintAnalysis: any,
  clientReference: string,
  hmrcDepartment: string,
  practiceLetterhead?: string,
  chargeOutRate?: number,
  userName?: string,
  userTitle?: string,
  userEmail?: string | null,
  userPhone?: string | null,
  additionalContext?: string,
  onProgress?: AppealProgressCallback
): Promise<string> => {
  logger.info('🚀 Starting three-stage appeal letter generation pipeline');
  const startTime = Date.now();

  try {
    onProgress?.('overall', 10, 'Extracting penalty appeal facts...');
    const factSheet = await stage1_extractFacts(
      complaintAnalysis,
      clientReference,
      hmrcDepartment,
      onProgress
    );

    onProgress?.('overall', 45, 'Structuring appeal letter...');
    const structuredLetter = await stage2_structureLetter(
      factSheet,
      practiceLetterhead,
      chargeOutRate,
      userName,
      userTitle,
      userEmail,
      userPhone,
      additionalContext,
      onProgress
    );

    onProgress?.('overall', 75, 'Adding professional tone...');
    const finalLetter = await stage3_addTone(
      structuredLetter,
      userName,
      userTitle,
      onProgress
    );

    const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`🎉 Appeal pipeline complete! ${totalDuration}s`);
    onProgress?.('overall', 100, 'Appeal letter generation complete!');

    return finalLetter;
  } catch (error: any) {
    logger.error('❌ Appeal pipeline failed:', error);
    onProgress?.('error', 0, `Error: ${error.message}`);
    throw new Error(`Appeal letter generation failed: ${error.message}`);
  }
};
