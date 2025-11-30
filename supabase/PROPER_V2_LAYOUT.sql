-- ============================================================================
-- PROPER V2 LAYOUT - High Quality, Magazine-Style
-- This matches the reference images with:
-- - Large stats cards (92K, 98%, 34%, 88%)
-- - Three-column failure cards with icons
-- - Timeline component
-- - Donut chart for success rates
-- - Proper section grouping
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
        "author": "James Howard",
        "tags": ["HMRC complaints", "tax disputes", "UK accountants", "HMRC appeals"],
        "backgroundGradient": true
      }
    },
    {
      "type": "stats",
      "props": {
        "stats": [
          { "value": "92K", "label": "Annual Complaints", "description": "One complaint every six minutes, all year round" },
          { "value": "98%", "label": "Internal Resolution", "description": "Complaints resolved with template responses that solve nothing" },
          { "value": "34%", "label": "Actually Resolved", "description": "Queries that genuinely get resolved" },
          { "value": "88%", "label": "Call Answering", "description": "Target hit by late 2024" }
        ],
        "variant": "flat",
        "columns": 4
      }
    },
    {
      "type": "textWithImage",
      "props": {
        "paragraphs": [
          "If you are an accountant dealing with HMRC failures, you already know the pattern. You call about a missing VAT registration. You wait 23 minutes. You explain the problem. They promise to look into it. Three months later, nothing has changed except your client patience has run out.",
          "The numbers tell the story: despite HMRC hitting their 88% call answering target by late 2024, only 34% of queries actually get resolved. That means two-thirds of successful calls end with agents still chasing the same issues weeks later."
        ],
        "imageAlt": "Frustrated accountant on phone with HMRC",
        "imagePosition": "right"
      }
    },
    {
      "type": "sectionHeading",
      "props": {
        "title": "The Internal Resolution Trap"
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "HMRC complaint process looks straightforward enough. You write to them explaining what went wrong. They investigate. They respond within 15 working days. Problem solved."
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "Except it rarely works that way."
      }
    },
    {
      "type": "numberedSteps",
      "props": {
        "steps": [
          {
            "title": "Processing Delays",
            "description": "The biggest driver of complaints, jumping 65% to 35,000 cases in 2022-23. Your client R&D claim sits unprocessed for six months."
          },
          {
            "title": "You Complain",
            "description": "HMRC responds saying normal processing times were followed. They close the complaint."
          },
          {
            "title": "Nothing Changes",
            "description": "Your client claim remains stuck. The cycle continues."
          }
        ],
        "variant": "vertical"
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "This happens because Tier One complaint handlers often have limited authority. They can apologise. They can cancel small penalties. But anything requiring actual investigation or admitting systemic failure? That needs escalation—which 98% of complainants never pursue."
      }
    },
    {
      "type": "donutChart",
      "props": {
        "title": "The Adjudicator Office: Your Secret Weapon",
        "segments": [
          { "label": "Upheld", "value": 41 },
          { "label": "Not Upheld", "value": 59 }
        ],
        "showLegend": true,
        "size": 240
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "The Adjudicator Office, which provides independent oversight, upheld 41% of the complaints it reviewed in 2023-24. That nearly half of cases where HMRC said no twice internally, yet an independent review found they were wrong. These successful appeals resulted in £103,063 in compensation, including £45,691 in tax liabilities written off."
      }
    },
    {
      "type": "sectionHeading",
      "props": {
        "title": "Why Most Complaints Fail at First Contact"
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
            "title": "Missing the Target Entirely",
            "description": "Most complaints read like general frustration rather than specific breaches. Writing your service is appalling might feel satisfying, but it gives HMRC an easy dismissal.",
            "callout": {
              "label": "Instead:",
              "text": "HMRC failed to meet its published 15-day response standard for correspondence, as set out in the Taxpayers Charter, resulting in preventable penalties."
            }
          },
          {
            "icon": "📋",
            "title": "No Evidence Trail",
            "description": "Vague timelines kill complaints. We have been trying to contact you for months carries no weight.",
            "callout": {
              "label": "Instead:",
              "text": "17 July: 44-minute hold, call terminated. 24 July: Written to BX9 1AB, proof of delivery attached. 15 August: £100 penalty received despite ongoing correspondence."
            }
          },
          {
            "icon": "⚖️",
            "title": "Wrong Resolution Request",
            "description": "Asking for compensation for all this trouble gets you nowhere. Specific requests get results.",
            "callout": {
              "label": "Instead:",
              "text": "Cancellation of penalty reference [XXX] charged during helpline closure period, plus reimbursement of £825 professional fees (3 hours at £275, invoice attached)."
            }
          }
        ]
      }
    },
    {
      "type": "sectionHeading",
      "props": {
        "title": "The Structure That Actually Works"
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
        "title": "7-Step Complaint Formula",
        "steps": [
          {
            "title": "Classification",
            "description": "Your subject line should read: FORMAL TIER ONE COMPLAINT - [Client Name] - [Tax Reference]. This triggers their formal process rather than general correspondence."
          },
          {
            "title": "Opening Statement",
            "description": "Two sentences maximum: I write to make a formal complaint regarding HMRC failure to process my client VAT registration within published timeframes, resulting in an inability to trade and £2,400 in lost input tax recovery. This complaint evidences breaches of service standards published at [gov.uk reference] and seeks specific redress totalling £3,150."
          },
          {
            "title": "Chronology",
            "description": "Build a bulletproof timeline with specific dates, reference numbers, and outcomes. Not a narrative—evidence."
          },
          {
            "title": "Reference Their Rules",
            "description": "Quote the Compliance Handbook and Taxpayers Charter directly. These aren not just documents—they are commitments HMRC must follow."
          },
          {
            "title": "State the Impact",
            "description": "Quantify losses: lost input tax, lost contracts, professional fees incurred. Make it specific and measurable."
          },
          {
            "title": "Make Specific Demands",
            "description": "List exactly what you want: registration issued, fees reimbursed, written explanation provided."
          },
          {
            "title": "Professional Close",
            "description": "I require acknowledgement within 48 hours and a substantive response within 15 working days per your published standards."
          }
        ],
        "variant": "grid"
      }
    },
    {
      "type": "timeline",
      "props": {
        "title": "Example Timeline: Building Your Case",
        "events": [
          {
            "date": "12 May 2024",
            "description": "VAT1 submitted online, acknowledgement reference [XXX]"
          },
          {
            "date": "12 June 2024",
            "description": "One month passed, no registration received"
          },
          {
            "date": "18 June 2024",
            "description": "Called HMRC, 47 minutes hold, told still processing"
          },
          {
            "date": "12 July 2024",
            "description": "Two months passed, client unable to invoice"
          },
          {
            "date": "19 July 2024",
            "description": "Agent Dedicated Line, promised escalation, reference [XXX]"
          },
          {
            "date": "12 August 2024",
            "description": "Three months passed, no registration, no update"
          }
        ],
        "quote": "The Taxpayers Charter states HMRC will treat you even-handedly, with courtesy and respect. The three-month delay, with no explanation despite repeated contact, fails this commitment."
      }
    },
    {
      "type": "callout",
      "props": {
        "icon": "💡",
        "label": "Pro Tip",
        "text": "The Taxpayers Charter states HMRC will treat you even-handedly, with courtesy and respect. The three-month delay, with no explanation despite repeated contact, fails this commitment.",
        "variant": "blue"
      }
    },
    {
      "type": "sectionHeading",
      "props": {
        "title": "The October 2024 Game Changer"
      }
    },
    {
      "type": "textWithImage",
      "props": {
        "paragraphs": [
          "Since October 2024, HMRC has been trialling a single-tier complaint system for 20% of Customer Compliance Group cases. Selected complaints can skip Tier Two entirely, going straight from initial rejection to independent review.",
          "This cut weeks—sometimes months—from the process. If your complaint gets selected (HMRC will tell you), you have a faster route to that 41% success rate at the Adjudicator."
        ],
        "imageAlt": "Fast-track complaint process illustration",
        "imagePosition": "left"
      }
    },
    {
      "type": "comparisonCards",
      "props": {
        "leftCard": {
          "title": "The Old Way",
          "content": "Tier One rejection → Tier Two escalation → Wait for response → Adjudicator Office → Resolution (if successful)",
          "footer": "Timeline: 3-6 months minimum"
        },
        "rightCard": {
          "title": "The New Way",
          "content": "Tier One rejection → Direct to Adjudicator Office → Resolution (if successful)",
          "footer": "Timeline: 6-8 weeks"
        }
      }
    },
    {
      "type": "sectionHeading",
      "props": {
        "title": "Professional Fee Recovery That Works"
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "HMRC paid out £6,174 in professional costs through the Adjudicator last year. That a fraction of what actually claimed. Most accountants either don claim or claim incorrectly."
      }
    },
    {
      "type": "threeColumnCards",
      "props": {
        "cards": [
          {
            "icon": "🔑",
            "title": "The Key: CRG5275",
            "description": "HMRC internal guidance stating costs should be considered where incurred as a direct result of our mistake or unreasonable delay."
          },
          {
            "icon": "❌",
            "title": "Don''t Claim",
            "description": "Normal tax return preparation or routine compliance work"
          },
          {
            "icon": "✅",
            "title": "Do Claim",
            "description": "Time spent fixing HMRC errors, chasing lost documents, or resubmitting information"
          }
        ]
      }
    },
    {
      "type": "bulletList",
      "props": {
        "title": "What to Include in Your Claim",
        "items": [
          "Itemised time records (date, duration, specific task)",
          "Clear causation (why HMRC failure created this work)",
          "Professional hourly rate",
          "Total calculation with invoice",
          "Request direct payment to your firm"
        ],
        "variant": "check"
      }
    },
    {
      "type": "sectionHeading",
      "props": {
        "title": "Making Complaints Worth the Effort"
      }
    },
    {
      "type": "donutChart",
      "props": {
        "title": "Recovery & Success Rates",
        "segments": [
          { "label": "Annual Recovery", "value": 12 },
          { "label": "Success Rate", "value": 84 },
          { "label": "Average Rate", "value": 41 }
        ],
        "showLegend": true,
        "size": 240,
        "centerLabel": "£12K+"
      }
    },
    {
      "type": "textWithImage",
      "props": {
        "paragraphs": [
          "Through systematic complaint management, practices can typically recover £12,000+ annually in professional fees and prevented penalties. More importantly, documented patterns of HMRC failure strengthen every future complaint.",
          "Start documenting today. Every lost document. Every broken promise. Every hour wasted. Not for anger—for evidence. When HMRC wastes your time, make them pay for it. Literally."
        ],
        "imageAlt": "Organized documentation system",
        "imagePosition": "right"
      }
    },
    {
      "type": "callout",
      "props": {
        "icon": "📅",
        "label": "Coming Next Week",
        "text": "The £3,750 Recovery—exactly how to claim professional fees from HMRC, with word-for-word templates that secure payment.",
        "variant": "gold"
      }
    },
    {
      "type": "paragraph",
      "props": {
        "text": "Lightpoint complaint management system tracks every HMRC failure across your entire client base, identifying patterns and building stronger cases. Current success rate: 84% at Adjudicator level versus 41% average."
      }
    },
    {
      "type": "cta",
      "props": {
        "title": "Ready to Get Started?",
        "description": "Let Lightpoint help you navigate HMRC complaints with confidence.",
        "primaryButton": { "text": "Start Free Trial", "href": "/signup" },
        "secondaryButton": { "text": "Learn More", "href": "/features" }
      }
    }
  ]
}'::jsonb,
updated_at = now()
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

-- Verify the update
SELECT 
  slug,
  jsonb_array_length(structured_layout->'components') as component_count,
  jsonb_pretty(structured_layout->'components'->0) as hero_component,
  jsonb_pretty(structured_layout->'components'->1) as stats_component
FROM blog_posts 
WHERE slug = 'why-hmrc-complaints-fail-how-to-fix';

