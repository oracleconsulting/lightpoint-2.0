/**
 * Knowledge Base Seeding Script
 * 
 * Run this to populate the Lightpoint knowledge base with:
 * - HMRC Charter commitments
 * - Complaint Resolution Guidance (CRG)
 * - Standard timeframes and service standards
 * - Sample precedent cases
 * 
 * Usage:
 * 1. Set up your .env.local with Supabase and OpenAI credentials
 * 2. Run: npx tsx scripts/seed-knowledge.ts
 */

import { addToKnowledgeBase, addPrecedent } from '../lib/vectorSearch';

// =======================
// HMRC CHARTER CONTENT
// =======================

const charterCommitments = [
  {
    category: 'HMRC Charter',
    title: 'Respect You - Charter Commitment 1',
    content: `HMRC will respect you by:
- Treating you with courtesy and respect at all times
- Providing a professional service
- Treating you as honest unless we have reason to think otherwise
- Respecting your privacy and need for confidentiality
- Recognising that you have your own priorities

What you can expect:
- We will use plain language and explain things clearly
- We will listen to you and respond appropriately
- We will be professional and courteous
- We will maintain confidentiality
- We will treat you without prejudice

If we don't meet these standards, you have the right to complain.`,
    source: 'Your Charter - HMRC (2020)'
  },
  {
    category: 'HMRC Charter',
    title: 'Help and Support You - Charter Commitment 2',
    content: `HMRC will help and support you by:
- Providing accurate and complete information that is easy to understand
- Tailoring information to your circumstances
- Making it easy for you to get things right
- Helping you understand what you have to do and when
- Providing information and support to help you

What you can expect:
- Clear guidance on GOV.UK and in HMRC publications
- Accessible services (online, phone, post)
- Help to understand your responsibilities
- Extra support if you need it (disabilities, language needs)
- Proactive guidance on common issues

If guidance is unclear, incomplete, or incorrect, this breaches the Charter.`,
    source: 'Your Charter - HMRC (2020)'
  },
  {
    category: 'HMRC Charter',
    title: 'Right of Appeal and Complaint - Charter Commitment 3',
    content: `HMRC will give you the right to appeal and complain by:
- Explaining clearly what your appeal and complaint rights are
- Explaining how to use these rights
- Explaining what happens next
- Handling appeals and complaints as quickly as possible

Your Rights:
- Right to appeal against most HMRC decisions
- Right to complain about service issues
- Right to escalate to Adjudicator's Office
- Right to go to tribunal

Response Times:
- We aim to respond to complaints within 15 working days
- For complex cases, up to 40 working days
- We will keep you informed if we need more time

If we fail to respond within these timeframes, this is grounds for escalation.`,
    source: 'Your Charter - HMRC (2020)'
  },
  {
    category: 'HMRC Charter',
    title: 'Get Things Right - Charter Commitment 4',
    content: `HMRC will get things right by:
- Being professional, consistent and fair in everything we do
- Working with you to get things right
- If we make mistakes, we will apologise and put things right quickly

What you can expect:
- Consistent application of tax law
- Fair treatment in all dealings
- Acknowledgement of our errors
- Swift remedial action when we make mistakes
- Compensation if our mistakes cause you costs

Examples of getting things wrong:
- Giving incorrect advice that you acted upon
- Losing your correspondence or documents
- Unreasonable delays in processing
- Incorrect calculations or penalties
- System errors that disadvantage you

If HMRC errors cause you financial loss, worry, distress or costs, you may be entitled to compensation.`,
    source: 'Your Charter - HMRC (2020)'
  },
  {
    category: 'HMRC Charter',
    title: 'Tackle Rule Breakers - Charter Commitment 5',
    content: `HMRC will tackle people who bend or break the rules by:
- Taking firm action against the minority who try to cheat
- Using all information we collect appropriately
- Pursuing criminal prosecution where appropriate

This commitment is rarely relevant to complaints, but is included for completeness.

Relevant if:
- You are accused of deliberately breaking rules but this is incorrect
- HMRC uses disproportionate enforcement action
- You are treated as dishonest without evidence

You have the right to be treated as honest unless HMRC has clear reason to think otherwise (see Commitment 1).`,
    source: 'Your Charter - HMRC (2020)'
  }
];

// =======================
// COMPLAINT RESOLUTION GUIDANCE (CRG)
// =======================

const crgGuidance = [
  {
    category: 'CRG',
    title: 'Standard Response Timeframes - CRG1',
    content: `HMRC Standard Response Times for Complaints:

Primary Response:
- Stage 1 complaint: 15 working days
- Extension possible for complex cases: up to 40 working days
- HMRC must inform you if they need more time

If HMRC Fails to Respond:
- Send chaser after 15 working days
- If no response after 30 working days, escalate to Adjudicator
- Unreasonable delays are themselves grounds for complaint

What counts as "unreasonable delay":
- No response after 15 working days without explanation
- No substantive progress after 40 working days
- Repeated promises of responses that don't materialise
- Delays that cause financial detriment

Compensation may be available for:
- Time you've wasted chasing
- Professional fees incurred
- Stress and inconvenience
- Financial impact of the delay`,
    source: 'Complaint Resolution Guidance - HMRC'
  },
  {
    category: 'CRG',
    title: 'Escalation to Adjudicator - CRG2',
    content: `When and How to Escalate to the Adjudicator's Office:

When to Escalate:
- You've received HMRC's final response and remain dissatisfied
- HMRC has failed to respond after 40 working days
- Your complaint involves serious misconduct
- You've exhausted HMRC's internal complaint process

What the Adjudicator Can Do:
- Independently review your complaint
- Recommend compensation for poor service
- Recommend changes to HMRC procedures
- Cannot overturn tax decisions (use appeals for that)

Adjudicator Contact:
- Website: gov.uk/complain-about-hmrc
- Post: The Adjudicator's Office, 8th Floor, Euston Tower, 286 Euston Road, London, NW1 3US
- Phone: 0300 057 1111

Evidence to Provide:
- Copy of original complaint
- HMRC's responses (or evidence of no response)
- Timeline of events
- Impact on you or your client
- What resolution you're seeking

Typical Outcomes:
- Apology from HMRC
- Compensation (£25-£1000+ depending on impact)
- Changes to HMRC procedures
- Recommendations for process improvements`,
    source: 'Complaint Resolution Guidance - HMRC & Adjudicator'
  },
  {
    category: 'CRG',
    title: 'Compensation for HMRC Errors - CRG3',
    content: `HMRC Compensation Guidelines:

When Compensation May Be Paid:
- HMRC errors led to costs you wouldn't otherwise have incurred
- Delays caused financial detriment (e.g., loss of interest, penalties)
- You suffered worry, distress, or significant inconvenience
- Professional fees necessarily incurred due to HMRC's error

Types of Compensation:

1. Financial Costs:
- Professional fees (accountant, tax advisor)
- Interest lost on delayed repayments
- Bank charges due to cash flow problems
- Travel expenses for unnecessary meetings

2. Worry and Distress:
- £25-£100 for minor inconvenience
- £100-£500 for significant stress
- £500-£1000 for serious distress
- £1000+ for exceptional circumstances

3. Time and Trouble:
- £25-£50 per hour for time wasted
- Additional for repeated chasing
- More if multiple errors

What You Need to Prove:
- HMRC made an error (with evidence)
- The error caused you costs/distress (with evidence)
- The costs were reasonable and necessary
- You acted reasonably to mitigate the impact

Evidence to Provide:
- Invoices from professional advisors
- Bank statements showing financial impact
- Diary of time spent dealing with the issue
- Correspondence showing repeated attempts to resolve
- Medical evidence if stress caused health issues`,
    source: 'Complaint Resolution Guidance - HMRC'
  },
  {
    category: 'CRG',
    title: 'Complaint About Delays - CRG4',
    content: `Complaining About Unreasonable Delays:

HMRC Service Standards (When Delays Become Unreasonable):

VAT:
- VAT repayments: 30 calendar days (5 days for monthly filers)
- VAT registration: 30 working days
- VAT queries: 15 working days

Self Assessment:
- Refunds: 5 weeks (online), 12 weeks (paper)
- Tax calculation: 3 months after return filed
- Queries: 15 working days

PAYE:
- Tax code changes: 2 weeks
- Refunds: 5 weeks
- Queries: 15 working days

Corporation Tax:
- Refunds: 6 weeks
- Queries: 15 working days

When to Complain:
- Processing exceeds standard times by >50%
- No communication about delays
- Repeated chasing gets no response
- Delay causes business impact

How to Frame the Complaint:
- Reference specific service standards
- Detail the impact (cash flow, business decisions)
- Quantify the delay (e.g., "8 weeks overdue")
- Specify the Charter breach (usually Commitment 2 & 4)
- State the remedy you seek (processing + compensation)

Strengthening Your Complaint:
- Show multiple chase attempts
- Evidence business impact
- Compare to standard timeframes
- Reference similar cases from Adjudicator`,
    source: 'HMRC Service Standards & CRG'
  },
  {
    category: 'CRG',
    title: 'What Can Be Complained About - CRG5',
    content: `Valid Grounds for Complaint:

Service Issues (Can Complain):
- Delays beyond standard timeframes
- Discourteous or unprofessional behaviour
- Incorrect information or advice
- Lost correspondence or documents
- Failure to follow proper procedures
- System errors affecting your position
- Lack of response to queries
- Poor communication
- Accessibility issues

Tax Decisions (Cannot Complain - Must Appeal):
- Amount of tax owed
- Penalty decisions
- Interest calculations
- Tax code decisions
Note: If you've missed the appeal deadline due to HMRC error, complain about that error.

Mixed Issues:
- If HMRC gave wrong advice leading to a penalty, you can:
  * Appeal the penalty (citing the wrong advice)
  * Complain about the wrong advice being given
  * Seek compensation for professional fees incurred

How to Structure Mixed Complaints:
1. Appeal the tax/penalty decision (separate process)
2. Complain about the service failure that caused it
3. Link the two in your complaint
4. Seek compensation for additional costs

Evidence Needed:
- For service complaints: Timeline, correspondence, impact
- For appeals: Legal/technical grounds
- For compensation: Invoices, costs, time spent`,
    source: 'Complaint Resolution Guidance - HMRC'
  }
];

// =======================
// HMRC SERVICE STANDARDS
// =======================

const serviceStandards = [
  {
    category: 'Service Standards',
    title: 'VAT Processing Timeframes',
    content: `Official HMRC VAT Processing Times:

VAT Repayments:
- Monthly filers: 5 working days
- Quarterly filers: 30 calendar days
- Annual filers: 30 calendar days

When Delays Are Unreasonable:
- Monthly: >10 working days without explanation
- Quarterly/Annual: >45 days without explanation

VAT Registration:
- Standard applications: 30 working days
- If delayed beyond 40 working days: grounds for complaint

VAT Queries:
- Written queries: 15 working days
- Complex queries: 40 working days with explanation

Common Delay Complaints:
- Repayment held for "security checks" without explanation
- Registration delayed affecting trade
- No response to queries about delays

Charter Breaches:
- Commitment 2: If delays aren't explained
- Commitment 4: If delays are due to HMRC error`,
    source: 'HMRC Service Standards'
  },
  {
    category: 'Service Standards',
    title: 'Self Assessment Timeframes',
    content: `Official HMRC Self Assessment Processing Times:

Refunds:
- Online returns: 5 weeks
- Paper returns: 12 weeks

Tax Calculations:
- Calculation notice: 3 months after return filed

Queries:
- Simple queries: 15 working days
- Complex queries: 40 working days

When to Complain:
- Refund delayed >7 weeks (online) or >14 weeks (paper)
- No tax calculation after 4 months
- No response to query after 20 working days

Impact to Highlight:
- Financial planning affected
- Interest on borrowing
- Penalties if calculation delayed affecting next return

Common Issues:
- System showing refund due but not paid
- Conflicting information on calculation
- Unable to get through on helpline`,
    source: 'HMRC Service Standards'
  }
];

// =======================
// PRECEDENT CASES
// =======================

const precedents = [
  {
    complaint_type: 'Unreasonable delay',
    issue_category: 'VAT repayment',
    outcome: 'Upheld - Compensation £850',
    resolution_time_days: 45,
    compensation_amount: 850,
    key_arguments: [
      'Delay exceeded published 30-day standard by 8 weeks',
      'Client suffered cash flow impact requiring bank overdraft',
      'Professional fees incurred for repeated chasing (6 calls, 4 emails)',
      'HMRC failed to explain reason for delay despite multiple requests'
    ],
    effective_citations: [
      'HMRC Charter Commitment 2 - Help and Support',
      'HMRC Charter Commitment 4 - Get Things Right',
      'CRG Standard Timeframes - 30 days for VAT repayments',
      'Service Standard breach: >100% over expected timeframe'
    ]
  },
  {
    complaint_type: 'Incorrect advice',
    issue_category: 'Self Assessment penalty',
    outcome: 'Upheld - Penalty cancelled + £450 compensation',
    resolution_time_days: 60,
    compensation_amount: 450,
    key_arguments: [
      'HMRC advisor confirmed wrong filing date on helpline call',
      'Client acted on this incorrect advice and filed accordingly',
      'Penalty applied despite client following HMRC guidance',
      'Recording of call confirmed advisor error'
    ],
    effective_citations: [
      'HMRC Charter Commitment 2 - Accurate information',
      'HMRC Charter Commitment 4 - Get things right and apologise for mistakes',
      'CRG Compensation - Costs incurred due to HMRC error',
      'Established principle: Cannot be penalised for following HMRC advice'
    ]
  },
  {
    complaint_type: 'Lost correspondence',
    issue_category: 'PAYE dispute',
    outcome: 'Upheld - Compensation £650',
    resolution_time_days: 50,
    compensation_amount: 650,
    key_arguments: [
      'Client sent evidence by recorded delivery twice - both lost',
      'HMRC insisted no evidence received despite tracking proof',
      'Dispute escalated unnecessarily due to lost documents',
      'Professional fees for duplicate submissions and follow-up'
    ],
    effective_citations: [
      'HMRC Charter Commitment 1 - Respect privacy and professional service',
      'HMRC Charter Commitment 4 - Get things right',
      'CRG Compensation - Professional fees for unnecessary work',
      'Adjudicator precedent: Lost documents are serious service failure'
    ]
  },
  {
    complaint_type: 'Poor communication',
    issue_category: 'Corporation Tax',
    outcome: 'Upheld - Apology + £300 compensation',
    resolution_time_days: 35,
    compensation_amount: 300,
    key_arguments: [
      'Multiple contradictory pieces of advice from different HMRC staff',
      'Client acted on advice from HMRC website which was outdated',
      'Company made business decision based on incorrect information',
      'Financial impact from following wrong guidance'
    ],
    effective_citations: [
      'HMRC Charter Commitment 2 - Accurate and complete information',
      'HMRC Charter Commitment 4 - Professional and consistent',
      'Duty to provide current and accurate guidance',
      'Compensation for business decisions based on HMRC error'
    ]
  },
  {
    complaint_type: 'System error',
    issue_category: 'Tax code',
    outcome: 'Upheld - Compensation £200',
    resolution_time_days: 40,
    compensation_amount: 200,
    key_arguments: [
      'HMRC system repeatedly reset tax code to incorrect amount',
      'Multiple corrections made but system reverted each time',
      'Client overpaid tax for 6 months before issue resolved',
      'Time and stress dealing with recurring problem'
    ],
    effective_citations: [
      'HMRC Charter Commitment 4 - Get things right',
      'Systemic failures require full investigation and compensation',
      'CRG - Time and trouble compensation',
      'Refund of overpaid tax plus interest plus compensation'
    ]
  },
  {
    complaint_type: 'Failure to respond',
    issue_category: 'VAT registration',
    outcome: 'Upheld - Fast-track registration + £500 compensation',
    resolution_time_days: 55,
    compensation_amount: 500,
    key_arguments: [
      'No response to VAT registration application for 3 months',
      'Business unable to trade with VAT-registered customers',
      'Lost contracts worth £50k+ due to lack of VAT number',
      'Multiple chase attempts ignored'
    ],
    effective_citations: [
      'HMRC Charter Commitment 3 - Handle as quickly as possible',
      'Service Standard: 30 days for VAT registration',
      'Serious business impact from delay',
      'CRG - Compensation for financial loss due to HMRC error'
    ]
  }
];

// =======================
// LLM PROMPT TEMPLATES
// =======================

const llmPrompts = [
  {
    category: 'LLM Prompts',
    title: 'Complaint Analysis System Prompt',
    content: `You are an expert HMRC complaint analyst with deep knowledge of:
- HMRC Charter commitments and what constitutes a breach
- Complaint Resolution Guidance (CRG) procedures
- Standard timeframes and when delays become unreasonable
- Precedent cases and successful complaint strategies
- Compensation levels and what can be claimed

When analyzing a complaint, you must:

1. IDENTIFY CHARTER VIOLATIONS
- Review each of the 5 Charter commitments
- Identify specific breaches with evidence
- Quote the relevant Charter section
- Explain why this is a breach

2. ASSESS UNREASONABLE DELAYS
- Compare actual timeframe to published standards
- Calculate percentage over standard time
- Identify impact of the delay
- Assess whether explanations were provided

3. FIND RELEVANT PRECEDENTS
- Match similar fact patterns from precedent library
- Identify successful arguments used previously
- Note compensation levels awarded
- Highlight effective Charter citations

4. EVALUATE STRENGTH OF COMPLAINT
- Assess likelihood of success (as percentage)
- Identify strongest arguments
- Note any weaknesses
- Suggest additional evidence needed

5. RECOMMEND NEXT STEPS
- Suggest whether to complain formally
- Recommend whether to escalate to Adjudicator
- Estimate potential compensation range
- Provide tactical advice

CRITICAL RULES:
- Never process or reference any personal data (PII)
- All data must be pre-anonymized
- Base analysis only on factual service failures
- Reference specific Charter commitments and CRG guidance
- Provide specific, actionable recommendations`,
    source: 'Lightpoint System'
  },
  {
    category: 'LLM Prompts',
    title: 'Letter Generation System Prompt',
    content: `You are an expert at drafting formal HMRC complaint letters for accounting professionals.

LETTER STRUCTURE (Must Follow):

1. SUBJECT LINE:
Format: "FORMAL COMPLAINT - [Department] - Client Ref: [Reference]"

2. OPENING (Paragraph 1):
- State this is a formal complaint under HMRC Charter
- Name the client (use anonymized reference only)
- State you are acting as the client's accountant/tax advisor

3. BACKGROUND (Paragraphs 2-3):
- Chronological timeline of key events
- Dates, actions, responses (or lack thereof)
- Be factual and specific
- Use bullet points for clarity if timeline is complex

4. CHARTER VIOLATIONS (Paragraph 4-5):
- Identify EACH Charter commitment breached
- Quote the specific commitment
- Explain how HMRC's actions breach it
- Provide evidence for each breach

5. IMPACT STATEMENT (Paragraph 6):
- Financial impact (amounts, cash flow, interest lost)
- Business impact (decisions delayed, contracts affected)
- Professional fees incurred (your fees for dealing with this)
- Stress and inconvenience to client

6. REQUIRED REMEDIES (Paragraph 7):
- Primary remedy (e.g., process the repayment, cancel the penalty)
- Compensation for costs incurred (be specific with amounts)
- Compensation for time, trouble, worry and distress
- Apology

7. TIMEFRAME (Paragraph 8):
- Reference CRG 15-day response requirement
- State you expect a substantive response
- Note that failure to respond will lead to Adjudicator escalation

8. FEE RECOVERY (Paragraph 9):
- State your professional fees for this complaint
- Reference CRG compensation for professional fees
- Note these fees were necessarily incurred due to HMRC failure

9. CLOSING (Paragraph 10):
- Professional but firm tone
- Request written response
- Provide contact details
- Sign off professionally

TONE REQUIREMENTS:
- Professional and businesslike throughout
- Assertive but not aggressive
- Evidence-based and factual
- No emotional language
- UK formal business letter style

CRITICAL RULES:
- NEVER include any personal data (PII) - use anonymized references only
- Quote Charter commitments verbatim where relevant
- Include specific dates, timeframes, and amounts
- Reference CRG guidance where applicable
- Make clear this is a formal complaint requiring response`,
    source: 'Lightpoint System'
  }
];

// =======================
// SEEDING FUNCTION
// =======================

async function seedKnowledgeBase() {
  console.log('🌱 Starting Lightpoint Knowledge Base Seeding...\n');
  
  let successCount = 0;
  let errorCount = 0;

  // Seed HMRC Charter
  console.log('📚 Seeding HMRC Charter commitments...');
  for (const item of charterCommitments) {
    try {
      await addToKnowledgeBase(
        item.category,
        item.title,
        item.content,
        item.source
      );
      console.log(`✅ Added: ${item.title}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed: ${item.title}`, error);
      errorCount++;
    }
  }

  // Seed CRG Guidance
  console.log('\n📋 Seeding Complaint Resolution Guidance...');
  for (const item of crgGuidance) {
    try {
      await addToKnowledgeBase(
        item.category,
        item.title,
        item.content,
        item.source
      );
      console.log(`✅ Added: ${item.title}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed: ${item.title}`, error);
      errorCount++;
    }
  }

  // Seed Service Standards
  console.log('\n⏱️  Seeding Service Standards...');
  for (const item of serviceStandards) {
    try {
      await addToKnowledgeBase(
        item.category,
        item.title,
        item.content,
        item.source
      );
      console.log(`✅ Added: ${item.title}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed: ${item.title}`, error);
      errorCount++;
    }
  }

  // Seed LLM Prompts
  console.log('\n🤖 Seeding LLM Prompts...');
  for (const item of llmPrompts) {
    try {
      await addToKnowledgeBase(
        item.category,
        item.title,
        item.content,
        item.source
      );
      console.log(`✅ Added: ${item.title}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed: ${item.title}`, error);
      errorCount++;
    }
  }

  // Seed Precedents
  console.log('\n⚖️  Seeding Precedent Cases...');
  for (const item of precedents) {
    try {
      await addPrecedent(
        item.complaint_type,
        item.issue_category,
        item.outcome,
        item.resolution_time_days,
        item.compensation_amount,
        item.key_arguments,
        item.effective_citations
      );
      console.log(`✅ Added precedent: ${item.complaint_type} - ${item.issue_category}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Failed precedent: ${item.complaint_type}`, error);
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('🎉 Knowledge Base Seeding Complete!');
  console.log('='.repeat(50));
  console.log(`✅ Successfully added: ${successCount} items`);
  console.log(`❌ Failed: ${errorCount} items`);
  console.log('\n📊 Summary:');
  console.log(`   - Charter Commitments: ${charterCommitments.length}`);
  console.log(`   - CRG Guidance: ${crgGuidance.length}`);
  console.log(`   - Service Standards: ${serviceStandards.length}`);
  console.log(`   - LLM Prompts: ${llmPrompts.length}`);
  console.log(`   - Precedent Cases: ${precedents.length}`);
  console.log(`   - Total: ${charterCommitments.length + crgGuidance.length + serviceStandards.length + llmPrompts.length + precedents.length}`);
  console.log('\n✨ Your Lightpoint knowledge base is ready to use!');
}

// Run if called directly
if (require.main === module) {
  seedKnowledgeBase()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

export { seedKnowledgeBase };
