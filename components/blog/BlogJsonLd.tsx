'use client';

interface BlogJsonLdProps {
  title: string;
  description: string;
  slug: string;
  author: string;
  publishedAt?: string;
  updatedAt?: string;
  imageUrl?: string;
  tags?: string[];
}

/**
 * JSON-LD Structured Data for Blog Articles
 * 
 * This helps search engines and AI understand the content structure.
 * Implements Article schema with author/organization details.
 */
export function BlogJsonLd({
  title,
  description,
  slug,
  author,
  publishedAt,
  updatedAt,
  imageUrl,
  tags = [],
}: BlogJsonLdProps) {
  const baseUrl = 'https://lightpoint.uk';
  
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    image: imageUrl || `${baseUrl}/og-image.png`,
    author: {
      '@type': 'Person',
      name: author,
      url: baseUrl,
      jobTitle: 'Tax Director',
      worksFor: {
        '@type': 'Organization',
        name: 'Lightpoint',
        url: baseUrl,
      },
    },
    publisher: {
      '@type': 'Organization',
      name: 'Lightpoint',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    datePublished: publishedAt || new Date().toISOString(),
    dateModified: updatedAt || publishedAt || new Date().toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${slug}`,
    },
    keywords: tags.join(', '),
    articleSection: 'HMRC Complaints',
    inLanguage: 'en-GB',
  };

  // Organization schema for the site
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Lightpoint',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'AI-powered HMRC complaint management for UK accountants',
    sameAs: [
      'https://www.linkedin.com/company/lightpoint-uk',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      url: `${baseUrl}/contact`,
    },
  };

  // Breadcrumb schema for navigation
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: baseUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${baseUrl}/blog`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: title,
        item: `${baseUrl}/blog/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}

export default BlogJsonLd;

