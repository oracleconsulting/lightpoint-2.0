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
        max-w-4xl mx-auto my-6 px-4
        ${style === 'two-column' ? 'md:columns-2 md:gap-8' : ''}
      `}
    >
      {/* V4: Larger body text - 20px minimum for readability */}
      <div 
        className="
          text-xl leading-relaxed
          text-slate-200
          [&>p]:mb-5
          [&>p]:text-xl
          [&>p]:leading-[1.8]
          [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-white [&>h2]:mt-8 [&>h2]:mb-4
          [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:text-white [&>h3]:mt-6 [&>h3]:mb-3
          [&>strong]:text-white [&>strong]:font-semibold
          [&_strong]:text-white [&_strong]:font-semibold
          [&>em]:text-cyan-300
          [&_em]:text-cyan-300
          [&>a]:text-cyan-400 [&>a]:underline [&>a]:underline-offset-2 hover:[&>a]:text-cyan-300
          [&_a]:text-cyan-400 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-cyan-300
          [&>ul]:list-disc [&>ul]:ml-6 [&>ul]:my-4
          [&>ol]:list-decimal [&>ol]:ml-6 [&>ol]:my-4
          [&>li]:mb-2 [&>li]:text-xl
          [&_li]:mb-2 [&_li]:text-xl
          [&>blockquote]:border-l-4 [&>blockquote]:border-cyan-500 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-slate-300 [&>blockquote]:my-6
        "
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
