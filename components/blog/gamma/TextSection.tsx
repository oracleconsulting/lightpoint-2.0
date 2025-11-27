'use client';

import React from 'react';

interface TextSectionProps {
  readonly content: string;
  readonly style?: 'single-column' | 'two-column';
}

export default function TextSection({ content, style = 'single-column' }: TextSectionProps) {
  return (
    <div 
      className={`
        w-full
        ${style === 'two-column' ? 'md:columns-2 md:gap-12' : ''}
      `}
    >
      {/* Clean, flowing text - no background, generous line height */}
      <div 
        className="
          text-lg md:text-xl leading-relaxed
          text-slate-300
          [&>p]:mb-6
          [&>p]:text-lg [&>p]:md:text-xl
          [&>p]:leading-[1.85]
          [&>h2]:text-2xl [&>h2]:md:text-3xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-10 [&>h2]:mb-5
          [&>h3]:text-xl [&>h3]:md:text-2xl [&>h3]:font-semibold [&>h3]:text-white [&>h3]:mt-8 [&>h3]:mb-4
          [&>strong]:text-white [&>strong]:font-semibold
          [&_strong]:text-white [&_strong]:font-semibold
          [&>em]:text-cyan-300
          [&_em]:text-cyan-300
          [&>a]:text-cyan-400 [&>a]:underline [&>a]:underline-offset-2 hover:[&>a]:text-cyan-300
          [&_a]:text-cyan-400 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-cyan-300
          [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-5
          [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-5
          [&>li]:mb-3 [&>li]:text-lg [&>li]:md:text-xl
          [&_li]:mb-3 [&_li]:text-lg [&_li]:md:text-xl
          [&>blockquote]:border-l-4 [&>blockquote]:border-cyan-500/60 [&>blockquote]:pl-5 [&>blockquote]:italic [&>blockquote]:text-slate-300 [&>blockquote]:my-8
        "
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
