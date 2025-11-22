import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lightpoint.uk';
  
  const robots = `# Lightpoint Robots.txt
User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/
Disallow: /user/

# AI Crawlers (ChatGPT, Perplexity, etc.)
User-agent: GPTBot
Allow: /
Allow: /blog/
Allow: /cpd/
Allow: /webinars/
Allow: /examples/

User-agent: ChatGPT-User
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Claude-Web
Allow: /

# Sitemap
Sitemap: ${baseUrl}/sitemap.xml

# Crawl Delay
Crawl-delay: 1
`;

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, s-maxage=86400',
    },
  });
}

