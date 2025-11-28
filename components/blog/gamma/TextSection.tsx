'use client';

import React from 'react';

interface TextSectionProps {
  readonly content?: string;
  readonly paragraphs?: readonly string[];
  readonly style?: 'single-column' | 'two-column';
}

/**
 * TextSection - Renders paragraph content with proper typography
 * 
 * AUDIT FIXES (Nov 2025):
 * - Body text: 18-20px (was 16px) ✓
 * - Line height: 1.75-1.8 (was 1.5) ✓
 * - Paragraph spacing: mb-8 (was mb-4) ✓
 * - Max width: 720px for optimal reading ✓
 * 
 * Supports two formats:
 * 1. content: Single HTML string (legacy)
 * 2. paragraphs: Array of paragraph strings (preferred - creates visible breaks)
 */
export default function TextSection({ content, paragraphs, style = 'single-column' }: TextSectionProps) {
  // Build the HTML content
  const htmlContent = React.useMemo(() => {
    if (paragraphs && paragraphs.length > 0) {
      // Each paragraph gets its own <p> tag with spacing
      return paragraphs.map(p => `<p>${p}</p>`).join('');
    }
    return content || '';
  }, [content, paragraphs]);
  
  return (
    <div 
      className={`
        w-full
        ${style === 'two-column' ? 'lg:columns-2 lg:gap-16' : ''}
      `}
    >
      {/* 
        AUDIT-OPTIMIZED TYPOGRAPHY:
        - Base: 18px mobile → 20px desktop (was 16px)
        - Line height: 1.75 → 1.85 for better readability
        - Paragraph spacing: mb-8 (was mb-4)
        - Max-width: optimal 720px reading width
      */}
      <div 
        className="
          max-w-[720px]
          text-[1.125rem] md:text-[1.25rem] lg:text-[1.3125rem]
          leading-[1.75] md:leading-[1.85]
          tracking-[-0.01em]
          text-slate-300
          
          [&>p]:mb-8 [&>p]:md:mb-10
          [&>p]:text-[1.125rem] [&>p]:md:text-[1.25rem] [&>p]:lg:text-[1.3125rem]
          [&>p]:leading-[1.75] [&>p]:md:leading-[1.85]
          [&>p:last-child]:mb-0
          
          [&>h2]:text-2xl [&>h2]:sm:text-3xl [&>h2]:md:text-4xl 
          [&>h2]:font-bold [&>h2]:text-white 
          [&>h2]:mt-14 [&>h2]:md:mt-20 [&>h2]:mb-6 [&>h2]:md:mb-8
          [&>h2]:leading-tight [&>h2]:tracking-tight
          
          [&>h3]:text-xl [&>h3]:sm:text-2xl [&>h3]:md:text-[1.75rem]
          [&>h3]:font-semibold [&>h3]:text-white 
          [&>h3]:mt-12 [&>h3]:md:mt-16 [&>h3]:mb-4 [&>h3]:md:mb-6
          [&>h3]:leading-snug
          
          [&>strong]:text-white [&>strong]:font-semibold
          [&_strong]:text-white [&_strong]:font-semibold
          [&>em]:text-cyan-300
          [&_em]:text-cyan-300
          
          [&>a]:text-cyan-400 [&>a]:underline [&>a]:underline-offset-4 hover:[&>a]:text-cyan-300
          [&_a]:text-cyan-400 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-cyan-300
          
          [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-8 [&>ul]:md:my-10
          [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-8 [&>ol]:md:my-10
          [&>li]:mb-4 [&>li]:md:mb-5 [&>li]:text-[1.125rem] [&>li]:md:text-[1.25rem] [&>li]:leading-relaxed
          [&_li]:mb-4 [&_li]:md:mb-5 [&_li]:text-[1.125rem] [&_li]:md:text-[1.25rem] [&_li]:leading-relaxed
          
          [&>blockquote]:border-l-4 [&>blockquote]:border-cyan-500/60 
          [&>blockquote]:pl-6 [&>blockquote]:md:pl-8
          [&>blockquote]:italic [&>blockquote]:text-slate-300 
          [&>blockquote]:my-10 [&>blockquote]:md:my-14
          [&>blockquote]:text-xl [&>blockquote]:md:text-2xl
        "
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
