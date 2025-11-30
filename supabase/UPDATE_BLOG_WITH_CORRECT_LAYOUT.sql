-- ============================================================================
-- UPDATE BLOG POST WITH CORRECT V2 LAYOUT
-- Run this in Supabase SQL Editor to fix the blog layout
-- ============================================================================

UPDATE blog_posts
SET structured_layout = '{
  "theme": {
    "mode": "light",
    "name": "lightpoint"
  },
  "components": [
    {
      "type": "hero",
      "props": {
        "title": "The 92,000 Question: Why Your HMRC Complaint Fails (And How to Fix It)",
        "subtitle": "Last year, 92,000 people complained about HMRC, yet 98% get resolved internally with template responses. Learn the precise formula that actually works.",
        "readingTime": "6 min read",
        "author": "James Howard ACA, CTA",
        "tags": ["HMRC complaints", "tax disputes", "UK accountants", "HMRC appeals"],
        "backgroundGradient": true
      }
    },
    {
      "type": "stats",
      "props": {
        "stats": [
          { "value": "92K", "label": "Annual Complaints", "description": "One complaint every six minutes" },
          { "value": "98%", "label": "Internal Resolution", "description": "Template responses that solve nothing" },
          { "value": "34%", "label": "Actually Resolved", "description": "Two-thirds still chasing issues" }
        ],
        "variant": "flat",
        "columns": 3
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "Last year, 92,000 people complained about HMRC. That''s roughly one complaint every six minutes, all year round. Yet 98% of these complaints get \"resolved\" internally - often with template responses that solve nothing.",
        "dropcap": true
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "If you''re an accountant dealing with HMRC failures, you already know the pattern."
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "You call about a missing VAT registration. You wait 23 minutes. You explain the problem. They promise to look into it. Three months later, nothing''s changed except your client''s patience has run out."
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "The numbers tell the story: despite HMRC hitting their 88% call answering target by late 2024, only 34% of queries actually get resolved. That means two-thirds of \"successful\" calls end with agents still chasing the same issues weeks later."
      }
    },
    {
      "type": "sectionHeading",
      "props": {
        "title": "The internal resolution trap",
        "decorated": true
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "HMRC''s complaint process looks straightforward enough."
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "You write to them explaining what went wrong. They investigate. They respond within 15 working days. Problem solved."
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "Except it rarely works that way."
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "Take processing delays - the biggest driver of complaints, jumping 65% to 35,000 cases in 2022-23."
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "A typical scenario: your client''s R&D claim sits unprocessed for six months. You complain. HMRC responds saying \"normal processing times were followed.\" They close the complaint. Your client''s claim remains stuck."
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "This happens because Tier One complaint handlers often have limited authority. They can apologise. They can cancel small penalties. But anything requiring actual investigation or admitting systemic failure? That needs escalation - which 98% of complainants never pursue."
      }
    },
    {
      "type": "callout",
      "props": {
        "icon": "📊",
        "label": "Key Statistic",
        "text": "The Adjudicator''s Office, which provides independent oversight, upheld 41% of the complaints it reviewed in 2023-24. That''s nearly half of cases where HMRC said \"no\" twice internally, yet an independent review found they were wrong.",
        "variant": "blue"
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "These successful appeals resulted in £103,063 in compensation, including £45,691 in tax liabilities written off."
      }
    },
    {
      "type": "sectionHeading",
      "props": {
        "title": "Why most complaints fail at first contact",
        "decorated": true
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "After analysing hundreds of successful escalations, three critical failures emerge in most initial complaints:"
      }
    },
    {
      "type": "threeColumnCards",
      "props": {
        "cards": [
          {
            "icon": "🎯",
            "title": "Missing the target entirely",
            "description": "Most complaints read like general frustration rather than specific breaches. Writing \"your service is appalling\" might feel satisfying, but it gives HMRC an easy dismissal.",
            "callout": {
              "label": "Instead:",
              "text": "HMRC failed to meet its published 15-day response standard for correspondence, as set out in the Taxpayers'' Charter, resulting in preventable penalties."
            }
          },
          {
            "icon": "📋",
            "title": "No evidence trail",
            "description": "Vague timelines kill complaints. \"We''ve been trying to contact you for months\" carries no weight.",
            "callout": {
              "label": "Instead:",
              "text": "17 July: 44-minute hold, call terminated. 24 July: Written to BX9 1AB, proof of delivery attached. 15 August: £100 penalty received despite ongoing correspondence."
            }
          },
          {
            "icon": "❌",
            "title": "Wrong resolution request",
            "description": "Asking for \"compensation for all this trouble\" gets you nowhere. Specific requests get results.",
            "callout": {
              "label": "Instead:",
              "text": "Cancellation of penalty reference [XXX] charged during helpline closure period, plus reimbursement of £825 professional fees (3 hours at £275, invoice attached)."
            }
          }
        ],
        "background": "gray"
      }
    },
    {
      "type": "sectionHeading",
      "props": {
        "title": "The structure that actually works",
        "decorated": true
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "Successful complaints follow a precise formula. Not because HMRC appreciates good writing, but because it makes rejection harder."
      }
    },
    {
      "type": "numberedSteps",
      "props": {
        "title": "Start with classification",
        "steps": [
          {
            "number": "01",
            "title": "Subject Line",
            "description": "Your subject line should read: \"FORMAL TIER ONE COMPLAINT - [Client Name] - [Tax Reference]\". This triggers their formal process rather than general correspondence."
          },
          {
            "number": "02",
            "title": "Opening Paragraph",
            "description": "Two sentences maximum: \"I write to make a formal complaint regarding HMRC''s failure to process my client''s VAT registration within published timeframes, resulting in an inability to trade and £2,400 in lost input tax recovery.\""
          },
          {
            "number": "03",
            "title": "Build Your Chronology",
            "description": "Not a narrative - a bulletproof timeline with specific dates, reference numbers, and outcomes."
          },
          {
            "number": "04",
            "title": "Reference Their Rules",
            "description": "The Compliance Handbook and Taxpayers'' Charter aren''t just documents - they''re commitments HMRC must follow. Quote them directly."
          },
          {
            "number": "05",
            "title": "State the Impact",
            "description": "Be specific: \"Due to HMRC''s delay: Client cannot submit VAT returns or reclaim input tax (£2,400 accumulated). Client has lost a contract worth £15,000 due to inability to provide VAT number.\""
          },
          {
            "number": "06",
            "title": "Make Specific Demands",
            "description": "Issue VAT registration immediately, backdated to application date. Reimburse professional fees of £1650 (breakdown attached). Provide written explanation for the delay."
          },
          {
            "number": "07",
            "title": "Professional Close",
            "description": "\"I require acknowledgement within 48 hours and a substantive response within 15 working days per your published standards.\""
          }
        ],
        "variant": "grid"
      }
    },
    {
      "type": "timeline",
      "props": {
        "title": "Example: Building Your Chronology",
        "events": [
          { "date": "12 May 2024", "description": "VAT1 submitted online, acknowledgement reference [XXX]" },
          { "date": "12 June 2024", "description": "One month passed, no registration received" },
          { "date": "18 June 2024", "description": "Called HMRC, 47 minutes hold, told \"still processing\"" },
          { "date": "12 July 2024", "description": "Two months passed, client unable to invoice" },
          { "date": "19 July 2024", "description": "Agent Dedicated Line, promised escalation, reference [XXX]" },
          { "date": "12 August 2024", "description": "Three months passed, no registration, no update" }
        ],
        "quote": "The Taxpayers'' Charter states HMRC will ''treat you even-handedly, with courtesy and respect.'' The three-month delay, with no explanation despite repeated contact, fails this commitment."
      }
    },
    {
      "type": "sectionHeading",
      "props": {
        "title": "The October 2024 change",
        "decorated": true
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "Since October 2024, HMRC has been trialling a single-tier complaint system for 20% of Customer Compliance Group cases. Selected complaints can skip Tier Two entirely, going straight from initial rejection to independent review."
      }
    },
    {
      "type": "comparisonCards",
      "props": {
        "leftCard": {
          "title": "The Old Way",
          "content": "Tier One rejection → Tier Two escalation → Wait for response → Adjudicator''s Office → Resolution",
          "footer": "Timeline: 3-6 months minimum"
        },
        "rightCard": {
          "title": "The New Way",
          "content": "Tier One rejection → Direct to Adjudicator''s Office → Resolution",
          "footer": "Timeline: 6-8 weeks"
        },
        "conclusion": "If your complaint gets selected (HMRC will tell you), you have a faster route to that 41% success rate at the Adjudicator."
      }
    },
    {
      "type": "sectionHeading",
      "props": {
        "title": "Professional fee recovery that works",
        "decorated": true
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "HMRC paid out £6,174 in professional costs through the Adjudicator last year. That''s a fraction of what''s actually claimed. Most accountants either don''t claim or claim incorrectly."
      }
    },
    {
      "type": "callout",
      "props": {
        "icon": "🔑",
        "label": "The Key: CRG5275",
        "text": "HMRC''s internal guidance stating costs should be considered where incurred \"as a direct result of our mistake or unreasonable delay.\"",
        "variant": "gold"
      }
    },
    {
      "type": "bulletList",
      "props": {
        "title": "What to include in your claim:",
        "items": [
          "Itemised time records (date, duration, specific task)",
          "Clear causation (why HMRC''s failure created this work)",
          "Professional hourly rate",
          "Total calculation with invoice"
        ],
        "variant": "check"
      }
    },
    {
      "type": "callout",
      "props": {
        "icon": "💡",
        "label": "Pro Tip",
        "text": "Request direct payment to your firm when the same HMRC error affects multiple clients. Rather than each client claiming separately, one consolidated claim saves everyone time.",
        "variant": "blue"
      }
    },
    {
      "type": "sectionHeading",
      "props": {
        "title": "Making complaints worth the effort",
        "decorated": true
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "Through systematic complaint management, practices can typically recover £12,000+ annually in professional fees and prevented penalties. More importantly, documented patterns of HMRC failure strengthen every future complaint."
      }
    },
    {
      "type": "stats",
      "props": {
        "stats": [
          { "value": "£12K", "label": "Annual Recovery", "description": "Typical recovery through systematic management" },
          { "value": "84%", "label": "Success Rate", "description": "Lightpoint''s rate at Adjudicator level" },
          { "value": "41%", "label": "Average Rate", "description": "Standard success rate" }
        ],
        "variant": "ring",
        "columns": 3
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "Start documenting today. Every lost document. Every broken promise. Every hour wasted. Not for anger - for evidence."
      }
    },
    {
      "type": "quote",
      "props": {
        "text": "When HMRC wastes your time, make them pay for it. Literally.",
        "variant": "large"
      }
    },
    {
      "type": "callout",
      "props": {
        "icon": "📅",
        "label": "Next week",
        "text": "The £3,750 Recovery - exactly how to claim professional fees from HMRC, with word-for-word templates that secure payment.",
        "variant": "border"
      }
    },
    {
      "type": "cta",
      "props": {
        "title": "Ready to Get Started?",
        "description": "Lightpoint''s complaint management system tracks every HMRC failure across your entire client base, identifying patterns and building stronger cases. Current success rate: 84% at Adjudicator level versus 41% average.",
        "buttonText": "Start Free Trial",
        "buttonHref": "/signup",
        "variant": "highlight"
      }
    }
  ]
}'::jsonb,
is_published = true
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Verify the update
SELECT 
  slug,
  is_published,
  jsonb_array_length(structured_layout->'components') as component_count,
  (structured_layout->'components'->0->>'type') as first_type,
  (structured_layout->'components'->1->>'type') as second_type,
  (structured_layout->'components'->17->>'type') as cards_type
FROM blog_posts 
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

