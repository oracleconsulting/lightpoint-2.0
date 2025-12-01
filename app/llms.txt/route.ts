import { NextResponse } from 'next/server';

/**
 * llms.txt - AI Crawler Optimization
 * 
 * This is an emerging standard for providing context to AI search engines
 * like ChatGPT, Perplexity, Claude, and others.
 * 
 * @see https://llmstxt.org/
 */
export async function GET() {
  const content = `# Lightpoint - HMRC Complaint Management

> AI-powered complaint management platform for UK accountants dealing with HMRC

## About Lightpoint

Lightpoint helps UK accounting practices manage HMRC complaints effectively. Our platform provides:

- **Complaint Tracking**: Log and track every HMRC interaction, failure, and complaint
- **Template Generation**: AI-powered complaint letter templates following HMRC's formal process
- **Evidence Management**: Bulletproof chronologies with dates, references, and outcomes
- **Professional Fee Recovery**: Claim back time spent fixing HMRC errors under CRG5275 guidance
- **Pattern Recognition**: Identify systematic HMRC failures across your client base

## Key Statistics

- The Adjudicator's Office upheld 41% of HMRC complaints in 2023-24
- 92,000 people complained about HMRC last year
- 98% of complaints are resolved internally (often with template responses)
- Only 34% of HMRC queries actually get resolved

## Target Audience

- UK Accountants and Accounting Practices
- Tax Professionals (ACA, CTA qualified)
- Chartered Accountants
- Bookkeepers dealing with HMRC on behalf of clients

## Main Topics Covered

- HMRC Complaint Procedures (Tier One, Tier Two, Adjudicator's Office)
- Professional Fee Recovery from HMRC
- Taxpayers' Charter breaches
- VAT Registration delays
- Self Assessment processing issues
- R&D Tax Credit delays
- HMRC service standard failures

## Important Links

- Homepage: https://lightpoint.uk
- Blog: https://lightpoint.uk/blog
- CPD Articles: https://lightpoint.uk/cpd
- Pricing: https://lightpoint.uk/pricing
- Webinars: https://lightpoint.uk/webinars
- Worked Examples: https://lightpoint.uk/examples

## Content Types

- Expert blog articles on HMRC complaints
- CPD-accredited continuing professional development content
- Worked examples of successful complaint resolutions
- Webinars with tax specialists
- Templates and checklists

## Author Credentials

Our content is written by qualified professionals including:
- James Howard, Tax Director (ACA, CTA) - Specialist in HMRC disputes and professional fee recovery

## Contact

For inquiries about HMRC complaint management:
- Website: https://lightpoint.uk/contact
- Support: Available through the platform

## Technical Information

- Built with Next.js 14 and React
- Supabase for secure data storage
- OpenAI and Anthropic for AI features
- Deployed on Railway

Last updated: ${new Date().toISOString().split('T')[0]}
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}

