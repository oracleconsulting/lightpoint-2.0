# Knowledge Base Seeding Guide

This guide explains how to populate the Lightpoint knowledge base with HMRC guidance and precedents.

## Overview

The knowledge base uses vector embeddings for semantic search. You need to add:
1. HMRC Charter commitments
2. Complaint Resolution Guidance (CRG) sections
3. Historical precedent cases

## Method 1: Using API Script

Create a Node.js script to populate the database.

### 1. Create Seeding Script

Create `scripts/seed-knowledge.ts`:

```typescript
import { addToKnowledgeBase, addPrecedent } from '@/lib/vectorSearch';

// HMRC Charter Commitments
const charterCommitments = [
  {
    category: 'HMRC Charter',
    title: 'Respect You',
    content: `HMRC will treat you with courtesy and respect at all times. 
    We will provide a professional service and treat you as honest unless we have reason 
    to think otherwise. We will respect your privacy and recognise your need for 
    confidentiality in your tax and customs affairs.`,
    source: 'HMRC Charter 2020'
  },
  {
    category: 'HMRC Charter',
    title: 'Help and Support',
    content: `HMRC will provide you with accurate and complete information that is easy 
    to understand and tailored to your circumstances. We will provide information and 
    support to help you understand what you have to do and when. We will make it as 
    easy as possible for you to get things right.`,
    source: 'HMRC Charter 2020'
  },
  {
    category: 'HMRC Charter',
    title: 'Right of Appeal',
    content: `You have the right to appeal against decisions made by HMRC. HMRC will 
    explain clearly what your appeal rights are, how to use them and what happens next. 
    We will handle appeals as quickly as possible.`,
    source: 'HMRC Charter 2020'
  },
  {
    category: 'HMRC Charter',
    title: 'Get Things Right',
    content: `HMRC will be professional, consistent and fair in everything we do. 
    We will work with you to get things right. If we make mistakes we will apologise 
    and put things right as soon as possible.`,
    source: 'HMRC Charter 2020'
  },
  {
    category: 'HMRC Charter',
    title: 'Tackle People Who Bend or Break the Rules',
    content: `HMRC will take firm action against the minority who bend or break the 
    rules. We will use all the information we collect to tackle people and businesses 
    who try to cheat the system and pursue criminal prosecution where appropriate.`,
    source: 'HMRC Charter 2020'
  }
];

// CRG Guidance
const crgGuidance = [
  {
    category: 'CRG',
    title: 'Standard Response Timeframes',
    content: `HMRC should respond to complaints within 15 working days. If this is 
    not possible, they should write to explain why and give a revised date. For complex 
    cases, HMRC may need up to 40 working days but should keep you informed.`,
    source: 'Complaint Resolution Guidance'
  },
  {
    category: 'CRG',
    title: 'Escalation to Adjudicator',
    content: `If you are unhappy with HMRC's response to your complaint, you can ask 
    the Adjudicator's Office to review it. The Adjudicator is independent of HMRC. 
    You must wait for HMRC's final response before contacting the Adjudicator.`,
    source: 'Complaint Resolution Guidance'
  },
  {
    category: 'CRG',
    title: 'Compensation for Errors',
    content: `HMRC may pay compensation if their mistakes have led to you incurring 
    costs that you would not otherwise have incurred, or suffering worry and distress. 
    Professional costs may be reimbursed if they were necessarily incurred as a direct 
    result of HMRC's error.`,
    source: 'Complaint Resolution Guidance'
  },
  {
    category: 'CRG',
    title: 'Complaints about Delays',
    content: `Unreasonable delays in dealing with your tax affairs can be grounds for 
    complaint. HMRC publish service standards for different types of work. Delays 
    beyond these standards, especially if they impact your business, should be raised 
    as complaints.`,
    source: 'Complaint Resolution Guidance'
  }
];

// Sample Precedents
const precedents = [
  {
    complaint_type: 'Unreasonable Delay',
    issue_category: 'VAT Repayment',
    outcome: 'Upheld - Compensation awarded',
    resolution_time_days: 45,
    compensation_amount: 850,
    key_arguments: [
      'Delay exceeded published standards by 8 weeks',
      'Client suffered cash flow impact',
      'Professional fees incurred for repeated chasing'
    ],
    effective_citations: [
      'HMRC Charter - Help and Support',
      'CRG Standard Response Timeframes',
      'CRG Compensation for Errors'
    ]
  },
  {
    complaint_type: 'Poor Communication',
    issue_category: 'Self Assessment',
    outcome: 'Upheld - Apology and compensation',
    resolution_time_days: 30,
    compensation_amount: 450,
    key_arguments: [
      'Multiple contradictory pieces of advice given',
      'Client acted on incorrect HMRC guidance',
      'Penalties applied due to HMRC error'
    ],
    effective_citations: [
      'HMRC Charter - Get Things Right',
      'HMRC Charter - Help and Support',
      'CRG Compensation for Errors'
    ]
  },
  {
    complaint_type: 'Incorrect Penalty',
    issue_category: 'PAYE',
    outcome: 'Upheld - Penalty cancelled',
    resolution_time_days: 60,
    compensation_amount: 0,
    key_arguments: [
      'HMRC failed to process correspondence',
      'Penalty applied despite reasonable excuse',
      'Client provided evidence which was ignored'
    ],
    effective_citations: [
      'HMRC Charter - Right of Appeal',
      'HMRC Charter - Get Things Right'
    ]
  }
];

async function seedKnowledge() {
  console.log('Seeding knowledge base...');
  
  // Add charter commitments
  for (const item of charterCommitments) {
    console.log(`Adding: ${item.title}`);
    await addToKnowledgeBase(
      item.category,
      item.title,
      item.content,
      item.source
    );
  }
  
  // Add CRG guidance
  for (const item of crgGuidance) {
    console.log(`Adding: ${item.title}`);
    await addToKnowledgeBase(
      item.category,
      item.title,
      item.content,
      item.source
    );
  }
  
  // Add precedents
  for (const item of precedents) {
    console.log(`Adding precedent: ${item.complaint_type} - ${item.issue_category}`);
    await addPrecedent(
      item.complaint_type,
      item.issue_category,
      item.outcome,
      item.resolution_time_days,
      item.compensation_amount,
      item.key_arguments,
      item.effective_citations
    );
  }
  
  console.log('Knowledge base seeding complete!');
}

seedKnowledge().catch(console.error);
```

### 2. Run the Script

```bash
npm install ts-node
npx ts-node scripts/seed-knowledge.ts
```

## Method 2: Using Supabase SQL

Insert data directly via SQL:

```sql
-- Insert Charter Commitment
INSERT INTO knowledge_base (category, title, content, source, embedding)
VALUES (
  'HMRC Charter',
  'Respect You',
  'HMRC will treat you with courtesy and respect...',
  'HMRC Charter 2020',
  -- Generate embedding via OpenAI API first
  '{...}'::vector(1536)
);
```

## Method 3: Admin Interface (Future Enhancement)

Create an admin page in the app:

```typescript
// app/admin/knowledge/page.tsx
export default function AdminKnowledgePage() {
  // Form to add knowledge base entries
  // Automatically generates embeddings
}
```

## Sources to Include

### Must-Have Content

1. **HMRC Charter** (complete document)
   - All 5 main commitments
   - Sub-commitments and details

2. **Complaint Resolution Guidance**
   - Response timeframes
   - Escalation procedures
   - Compensation rules
   - What can be complained about

3. **Service Standards**
   - VAT processing times
   - Self Assessment turnaround
   - PAYE query response times
   - CIS verification times

4. **Adjudicator's Office Guidelines**
   - When to escalate
   - What the Adjudicator can review
   - Expected timelines

### Precedent Cases

Add sanitized examples of:
- Successful complaints
- Compensation awards
- Effective arguments used
- Relevant citations

**Important**: All precedent cases MUST be fully anonymized.

## Verification

After seeding, verify using the Knowledge page:

1. Go to http://localhost:3004/knowledge
2. Try semantic search queries:
   - "delays in VAT repayment"
   - "compensation for HMRC mistakes"
   - "escalation process"

## Maintenance

- Review and update quarterly
- Add new precedents as cases are resolved
- Update Charter when HMRC publishes new versions
- Remove outdated guidance

---

**Initial Seeding Required**: Yes, before production use

