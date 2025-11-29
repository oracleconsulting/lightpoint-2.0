// ============================================================================
// EXAMPLE: HMRC COMPLAINTS BLOG POST LAYOUT
// This matches the Gamma PDF output exactly
// ============================================================================

import type { BlogLayout } from './types';

/**
 * This is the structured layout that produces the Gamma-style output.
 * 
 * You can:
 * 1. Store this in your database as JSON
 * 2. Generate it from markdown using the section detector
 * 3. Build it manually in the admin UI
 */
export const hmrcComplaintsBlogLayout: BlogLayout = {
  theme: {
    mode: 'light',
    name: 'lightpoint',
  },
  components: [
    // =========================================================================
    // PAGE 1: Hero Section
    // =========================================================================
    {
      type: 'hero',
      props: {
        title: "The 92,000 Question: Why Your HMRC Complaint Fails (And How to Fix It)",
        subtitle: "Last year, 92,000 people complained about HMRC. That's roughly one complaint every six minutes, all year round. Yet 98% of these complaints get \"resolved\" internally—often with template responses that solve nothing.",
        readingTime: "8 min read",
        author: "James Richardson",
        backgroundGradient: true,
      },
    },

    // =========================================================================
    // PAGE 2: The Broken System - Text + Stats
    // =========================================================================
    {
      type: 'textWithImage',
      props: {
        title: "The Broken System: By the Numbers",
        paragraphs: [
          "If you're an accountant dealing with HMRC failures, you already know the pattern. You call about a missing VAT registration. You wait 23 minutes. You explain the problem. They promise to look into it. Three months later, nothing's changed except your client's patience has run out.",
          "The numbers tell the story: despite HMRC hitting their 88% call answering target by late 2024, only 34% of queries actually get resolved. That means two-thirds of \"successful\" calls end with agents still chasing the same issues weeks later.",
        ],
        imageAlt: "Professional on phone with frustrated expression",
        imagePosition: "right",
      },
    },
    {
      type: 'stats',
      props: {
        stats: [
          { value: "92K", label: "Annual Complaints", description: "One complaint every six minutes, all year round" },
          { value: "98%", label: "Internal Resolution", description: "Complaints \"resolved\" without real solutions" },
          { value: "34%", label: "Actual Resolution", description: "Queries that genuinely get resolved" },
          { value: "88%", label: "Call Answering", description: "Target hit by late 2024" },
        ],
        variant: "flat",
        columns: 4,
      },
    },

    // =========================================================================
    // PAGE 3: The Internal Resolution Trap - Numbered Steps
    // =========================================================================
    {
      type: 'numberedSteps',
      props: {
        title: "The Internal Resolution Trap",
        intro: "HMRC's complaint process looks straightforward enough. You write to them explaining what went wrong. They investigate. They respond within 15 working days. Problem solved. Except it rarely works that way.",
        steps: [
          {
            title: "Processing Delays",
            description: "The biggest driver of complaints, jumping 65% to 35,000 cases in 2022-23. Your client's R&D claim sits unprocessed for six months.",
          },
          {
            title: "You Complain",
            description: "HMRC responds saying \"normal processing times were followed.\" They close the complaint.",
          },
          {
            title: "Nothing Changes",
            description: "Your client's claim remains stuck. The cycle continues.",
          },
        ],
        conclusion: "This happens because Tier One complaint handlers often have limited authority. They can apologise. They can cancel small penalties. But anything requiring actual investigation or admitting systemic failure? That needs escalation—which 98% of complainants never pursue.",
        variant: "vertical",
      },
    },

    // =========================================================================
    // PAGE 4: The Adjudicator's Office - Text + Donut Chart
    // =========================================================================
    {
      type: 'sectionHeading',
      props: {
        title: "The Adjudicator's Office: Your Secret Weapon",
      },
    },
    {
      type: 'textWithImage',
      props: {
        paragraphs: [
          "The Adjudicator's Office, which provides independent oversight, upheld 41% of the complaints it reviewed in 2023-24. That's nearly half of cases where HMRC said \"no\" twice internally, yet an independent review found they were wrong.",
          "These successful appeals resulted in £103,063 in compensation, including £45,691 in tax liabilities written off.",
        ],
        imageAlt: "Professional with scales of justice",
        imagePosition: "right",
      },
    },
    {
      type: 'donutChart',
      props: {
        segments: [
          { label: "Upheld", value: 41, color: "#1e3a5f" },
          { label: "Not Upheld", value: 59, color: "#3b82f6" },
        ],
        size: 220,
      },
    },
    {
      type: 'paragraph',
      props: {
        text: "The 41% success rate at the Adjudicator's Office proves that persistence pays. Most accountants never reach this stage—but those who do have a fighting chance.",
      },
    },

    // =========================================================================
    // PAGE 5: Why Most Complaints Fail - Three Column Cards
    // =========================================================================
    {
      type: 'threeColumnCards',
      props: {
        title: "Why Most Complaints Fail at First Contact",
        intro: "After analysing hundreds of successful escalations, three critical failures emerge in most initial complaints:",
        cards: [
          {
            icon: true,
            title: "Missing the Target Entirely",
            description: "Most complaints read like general frustration rather than specific breaches. Writing \"your service is appalling\" might feel satisfying, but it gives HMRC an easy dismissal.",
            callout: {
              label: "Instead:",
              text: "\"HMRC failed to meet its published 15-day response standard for correspondence, as set out in the Taxpayers' Charter, resulting in preventable penalties.\"",
            },
          },
          {
            icon: true,
            title: "No Evidence Trail",
            description: "Vague timelines kill complaints. \"We've been trying to contact you for months\" carries no weight.",
            callout: {
              label: "Instead:",
              text: "\"17 July: 44-minute hold, call terminated. 24 July: Written to BX9 1AB, proof of delivery attached. 15 August: £100 penalty received despite ongoing correspondence.\"",
            },
          },
          {
            icon: true,
            title: "Wrong Resolution Request",
            description: "Asking for \"compensation for all this trouble\" gets you nowhere. Specific requests get results.",
            callout: {
              label: "Instead:",
              text: "\"Cancellation of penalty reference [XXX] charged during helpline closure period, plus reimbursement of £825 professional fees (3 hours at £275, invoice attached).\"",
            },
          },
        ],
        background: "gray",
      },
    },

    // =========================================================================
    // PAGE 6: The Structure That Actually Works - Grid Steps
    // =========================================================================
    {
      type: 'numberedSteps',
      props: {
        title: "The Structure That Actually Works",
        intro: "Successful complaints follow a precise formula. Not because HMRC appreciates good writing, but because it makes rejection harder.",
        steps: [
          {
            number: "01",
            title: "Classification",
            description: "Your subject line should read: \"FORMAL TIER ONE COMPLAINT - [Client Name] - [Tax Reference]\". This triggers their formal process rather than general correspondence.",
          },
          {
            number: "02",
            title: "Opening Statement",
            description: "Two sentences maximum: \"I write to make a formal complaint regarding HMRC's failure to process my client's VAT registration within published timeframes, resulting in an inability to trade and £2,400 in lost input tax recovery.\"",
          },
          {
            number: "03",
            title: "Chronology",
            description: "Build a bulletproof timeline with specific dates, reference numbers, and outcomes. Not a narrative—evidence.",
          },
          {
            number: "04",
            title: "Reference Their Rules",
            description: "Quote the Compliance Handbook and Taxpayers' Charter directly. These aren't just documents—they're commitments HMRC must follow.",
          },
          {
            number: "05",
            title: "State the Impact",
            description: "Quantify losses: lost input tax, lost contracts, professional fees incurred. Make it specific and measurable.",
          },
          {
            number: "06",
            title: "Make Specific Demands",
            description: "List exactly what you want: registration issued, fees reimbursed, written explanation provided.",
          },
          {
            number: "07",
            title: "Professional Close",
            description: "Set expectations: \"I require acknowledgement within 48 hours and a substantive response within 15 working days per your published standards.\"",
          },
        ],
        variant: "grid",
      },
    },

    // =========================================================================
    // PAGE 7: Example Timeline
    // =========================================================================
    {
      type: 'timeline',
      props: {
        title: "Example Timeline: Building Your Case",
        intro: "A bulletproof chronology is your most powerful weapon. Here's how to structure it:",
        events: [
          { date: "12 May 2024", description: "VAT1 submitted online, acknowledgement reference [XXX]" },
          { date: "12 June 2024", description: "One month passed, no registration received" },
          { date: "18 June 2024", description: "Called HMRC, 47 minutes hold, told \"still processing\"" },
          { date: "12 July 2024", description: "Two months passed, client unable to invoice" },
          { date: "19 July 2024", description: "Agent Dedicated Line, promised escalation, reference [XXX]" },
          { date: "12 August 2024", description: "Three months passed, no registration, no update" },
        ],
        quote: "The Taxpayers' Charter states HMRC will 'treat you even-handedly, with courtesy and respect.' The three-month delay, with no explanation despite repeated contact, fails this commitment.",
      },
    },

    // =========================================================================
    // PAGE 8: The October 2024 Game Changer - Comparison Cards
    // =========================================================================
    {
      type: 'comparisonCards',
      props: {
        title: "The October 2024 Game Changer",
        intro: "Since October 2024, HMRC has been trialling a single-tier complaint system for 20% of Customer Compliance Group cases. Selected complaints can skip Tier Two entirely, going straight from initial rejection to independent review. This cut weeks—sometimes months—from the process.",
        leftCard: {
          title: "The Old Way",
          content: "Tier One rejection → Tier Two escalation → Wait for response → Adjudicator's Office → Resolution (if successful)",
          footer: "Timeline: 3-6 months minimum",
        },
        rightCard: {
          title: "The New Way",
          content: "Tier One rejection → Direct to Adjudicator's Office → Resolution (if successful)",
          footer: "Timeline: 6-8 weeks",
        },
        conclusion: "If your complaint gets selected (HMRC will tell you), you have a faster route to that 41% success rate at the Adjudicator. The trials ran for 6-12 months, with CIOT gathering feedback from members' experiences.",
      },
    },

    // =========================================================================
    // PAGE 9: Professional Fee Recovery - Cards + Checklist
    // =========================================================================
    {
      type: 'sectionHeading',
      props: {
        title: "Professional Fee Recovery That Works",
      },
    },
    {
      type: 'paragraph',
      props: {
        text: "HMRC paid out £6,174 in professional costs through the Adjudicator last year. That's a fraction of what's actually claimed. Most accountants either don't claim or claim incorrectly.",
      },
    },
    {
      type: 'threeColumnCards',
      props: {
        cards: [
          {
            title: "The Key: CRG5275",
            description: "HMRC's internal guidance stating costs should be considered where incurred \"as a direct result of our mistake or unreasonable delay.\"",
          },
          {
            title: "Don't Claim",
            description: "Normal tax return preparation or routine compliance work",
          },
          {
            title: "Do Claim",
            description: "Time spent fixing HMRC errors, chasing lost documents, or resubmitting information",
          },
        ],
        background: "white",
      },
    },
    {
      type: 'bulletList',
      props: {
        title: "What to Include in Your Claim",
        items: [
          "Itemised time records (date, duration, specific task)",
          "Clear causation (why HMRC's failure created this work)",
          "Professional hourly rate",
          "Total calculation with invoice",
          "Request direct payment to your firm",
        ],
        variant: "check",
      },
    },
    {
      type: 'callout',
      props: {
        icon: "💡",
        label: "Pro Tip:",
        text: "When the same HMRC error affects multiple clients, submit one consolidated claim rather than each client claiming separately. This saves everyone time and strengthens your case.",
        variant: "blue",
      },
    },

    // =========================================================================
    // PAGE 10: Making Complaints Worth the Effort - Stats + CTA
    // =========================================================================
    {
      type: 'sectionHeading',
      props: {
        title: "Making Complaints Worth the Effort",
      },
    },
    {
      type: 'paragraph',
      props: {
        text: "Through systematic complaint management, practices can typically recover £12,000+ annually in professional fees and prevented penalties. More importantly, documented patterns of HMRC failure strengthen every future complaint.",
      },
    },
    {
      type: 'stats',
      props: {
        stats: [
          { value: "£12K", label: "Annual Recovery", description: "Typical recovery through systematic complaint management" },
          { value: "84%", label: "Success Rate", description: "Lightpoint's complaint management system at Adjudicator level" },
          { value: "41%", label: "Average Rate", description: "Standard success rate at Adjudicator's Office" },
        ],
        variant: "ring",
        columns: 3,
      },
    },
    {
      type: 'sectionHeading',
      props: {
        title: "Start Documenting Today",
      },
    },
    {
      type: 'paragraph',
      props: {
        text: "Every lost document. Every broken promise. Every hour wasted. Not for anger—for evidence. When HMRC wastes your time, make them pay for it. Literally.",
      },
    },
    {
      type: 'callout',
      props: {
        label: "Next week:",
        text: "The £3,750 Recovery—exactly how to claim professional fees from HMRC, with word-for-word templates that secure payment.",
        variant: "border",
      },
    },
    {
      type: 'quote',
      props: {
        text: "Lightpoint's complaint management system tracks every HMRC failure across your entire client base, identifying patterns and building stronger cases. Current success rate: 84% at Adjudicator level versus 41% average.",
        variant: "border",
      },
    },
  ],
};

export default hmrcComplaintsBlogLayout;

