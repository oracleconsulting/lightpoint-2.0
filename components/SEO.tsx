'use client';

import React from 'react';
import Head from 'next/head';
import { trpc } from '@/lib/trpc/Provider';

interface SEOProps {
  pagePath: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

export default function SEO({ pagePath, fallbackTitle, fallbackDescription }: SEOProps) {
  const { data: seoData } = trpc.cms.getSEOMetadata.useQuery(pagePath);
  const seo = seoData as any;

  const title = seo?.meta_title || fallbackTitle || 'Lightpoint - HMRC Complaint Management';
  const description = seo?.meta_description || fallbackDescription || 'AI-powered HMRC complaint management for UK accountants';
  const keywords = seo?.meta_keywords?.join(', ') || '';
  const canonicalUrl = seo?.canonical_url || `https://lightpoint.uk${pagePath}`;
  
  const ogTitle = seo?.og_title || title;
  const ogDescription = seo?.og_description || description;
  const ogImage = seo?.og_image_url || 'https://lightpoint.uk/og-image.png';
  
  const twitterTitle = seo?.twitter_title || title;
  const twitterDescription = seo?.twitter_description || description;
  const twitterImage = seo?.twitter_image_url || ogImage;

  const robotsContent = seo?.robots_index && seo?.robots_follow
    ? 'index, follow'
    : !seo?.robots_index && !seo?.robots_follow
    ? 'noindex, nofollow'
    : seo?.robots_index
    ? 'index, nofollow'
    : 'noindex, follow';

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />
      <meta name="robots" content={robotsContent} />

      {/* Open Graph */}
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={seo?.og_type || 'website'} />
      <meta property="og:site_name" content="Lightpoint" />

      {/* Twitter Card */}
      <meta name="twitter:card" content={seo?.twitter_card || 'summary_large_image'} />
      <meta name="twitter:title" content={twitterTitle} />
      <meta name="twitter:description" content={twitterDescription} />
      <meta name="twitter:image" content={twitterImage} />

      {/* Structured Data */}
      {seo?.structured_data && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(seo.structured_data)
          }}
        />
      )}
    </Head>
  );
}

