'use client';

import React from 'react';

interface TextSectionProps {
  content: string;
  style?: 'single-column' | 'two-column';
}

export default function TextSection({ content, style = 'single-column' }: TextSectionProps) {
  return (
    <div 
      className={`
        my-6 
        prose prose-xl prose-invert 
        max-w-4xl mx-auto 
        px-4
        prose-headings:font-bold prose-headings:text-white prose-headings:mb-4
        prose-p:text-white prose-p:leading-relaxed prose-p:mb-4 prose-p:text-lg
        prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline
        prose-strong:text-white prose-strong:font-semibold
        prose-ul:list-disc prose-ul:ml-6 prose-ol:list-decimal prose-ol:ml-6
        prose-li:text-white prose-li:mb-2
        prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-200
        ${style === 'two-column' ? 'md:columns-2 md:gap-8' : ''}
      `}
    >
      <div dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

