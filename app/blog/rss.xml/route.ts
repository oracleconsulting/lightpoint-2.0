import { createBrowserClient } from '@supabase/ssr';

/**
 * RSS Feed Generator for Lightpoint Blog
 * Route: /blog/rss.xml
 * 
 * Generates an RSS 2.0 feed for all published blog posts
 * Compatible with: Buffer, Zapier, IFTTT, Feedly, RSS readers
 */

// Force dynamic rendering - don't try to generate at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch published blog posts (most recent 50)
    const { data: posts, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching blog posts for RSS:', error);
      throw new Error('Failed to fetch blog posts');
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://lightpoint.uk';
    const buildDate = new Date().toUTCString();

    // Generate RSS XML
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" 
     xmlns:atom="http://www.w3.org/2005/Atom"
     xmlns:dc="http://purl.org/dc/elements/1.1/"
     xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Lightpoint Blog - HMRC Complaint Management Insights</title>
    <link>${siteUrl}/blog</link>
    <atom:link href="${siteUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>Expert insights on HMRC complaints, tax compliance, and professional services. Stay updated with the latest strategies and case studies.</description>
    <language>en-GB</language>
    <lastBuildDate>${buildDate}</lastBuildDate>
    <generator>Lightpoint RSS Generator</generator>
    <image>
      <url>${siteUrl}/logo.png</url>
      <title>Lightpoint</title>
      <link>${siteUrl}</link>
    </image>
    ${posts?.map(post => {
      const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : buildDate;
      const postUrl = `${siteUrl}/blog/${post.slug}`;
      
      // Extract plain text from content (rough conversion)
      let contentText = '';
      try {
        if (typeof post.content === 'string') {
          contentText = post.content;
        } else if (post.content && typeof post.content === 'object') {
          // TipTap content - extract text nodes
          const extractText = (node: any): string => {
            if (node.type === 'text') return node.text || '';
            if (node.content) {
              return node.content.map((child: any) => extractText(child)).join('');
            }
            return '';
          };
          contentText = extractText(post.content);
        }
      } catch (e) {
        contentText = post.excerpt || '';
      }

      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <dc:creator><![CDATA[${post.author_name || 'Lightpoint Team'}]]></dc:creator>
      ${post.category ? `<category><![CDATA[${post.category}]]></category>` : ''}
      ${post.tags?.map((tag: string) => `<category><![CDATA[${tag}]]></category>`).join('\n      ') || ''}
      <description><![CDATA[${post.excerpt || post.seo_description || ''}]]></description>
      <content:encoded><![CDATA[
        ${post.featured_image_url ? `<img src="${post.featured_image_url}" alt="${post.featured_image_alt || post.title}" style="max-width: 100%; height: auto; margin-bottom: 1em;" />` : ''}
        ${contentText.substring(0, 5000)}
        <p><a href="${postUrl}">Read more on Lightpoint Blog</a></p>
      ]]></content:encoded>
      ${post.featured_image_url ? `
      <enclosure url="${post.featured_image_url}" type="image/jpeg" />
      <media:content url="${post.featured_image_url}" medium="image">
        <media:title>${post.featured_image_alt || post.title}</media:title>
      </media:content>` : ''}
    </item>`;
    }).join('')}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });

  } catch (error) {
    console.error('Error generating RSS feed:', error);
    return new Response('Error generating RSS feed', { status: 500 });
  }
}

