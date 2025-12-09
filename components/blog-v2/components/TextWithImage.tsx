'use client';

import React from 'react';

// ============================================================================
// TEXT WITH IMAGE
// Magazine-style two-column layout with text and visual
// ============================================================================

interface TextWithImageProps {
  title?: string;
  paragraphs: string[];
  imageSrc?: string;
  imageAlt: string;
  imagePosition?: 'left' | 'right';
  imageCaption?: string;
}

export function TextWithImage({
  title,
  paragraphs,
  imageSrc,
  imageAlt,
  imagePosition = 'right',
  imageCaption,
}: TextWithImageProps) {
  const isImageLeft = imagePosition === 'left';

  return (
    <div className="w-full">
      {/* Title */}
      {title && (
        <h2 className="text-3xl lg:text-4xl font-bold text-slate-800 mb-10 tracking-tight">
          {title}
        </h2>
      )}

      {/* Two-column layout */}
      <div className={`
        flex flex-col gap-4 items-start
        ${isImageLeft ? 'lg:flex-row-reverse' : 'lg:flex-row'}
      `}>
        {/* Text column - 60% */}
        <div className="flex-1 lg:w-[60%] space-y-3">
          {paragraphs.map((paragraph, index) => {
            // Clean paragraph text
            const cleanParagraph = paragraph
              .replace(/\*\*/g, '') // Remove bold markers
              .replace(/\*/g, '') // Remove italic markers
              .replace(/^\.\s+/, '') // Remove leading periods
              .replace(/\n/g, ' ') // Replace newlines with spaces
              .trim();
            
            if (!cleanParagraph) return null;
            
            return (
              <p 
                key={index} 
                className="text-[20px] lg:text-[22px] text-slate-700 leading-[1.75] font-['Georgia',_'Times_New_Roman',_serif]"
              >
                {cleanParagraph}
              </p>
            );
          })}
        </div>

        {/* Image column - 45% */}
        <div className="flex-shrink-0 w-full lg:w-[40%]">
          <div className="relative rounded-xl overflow-hidden shadow-xl bg-slate-100 aspect-[4/3]">
            {imageSrc ? (
              <img
                src={imageSrc}
                alt={imageAlt}
                className="w-full h-full object-cover"
              />
            ) : (
              <ImagePlaceholder alt={imageAlt} />
            )}
          </div>
          
          {imageCaption && (
            <p className="mt-3 text-sm text-slate-500 text-center italic">
              {imageCaption}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ImagePlaceholder({ alt }: { alt: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 bg-gradient-to-br from-slate-100 to-slate-200">
      <svg 
        className="w-16 h-16 mb-3 opacity-50" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1} 
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
        />
      </svg>
      <span className="text-sm text-center opacity-70">{alt}</span>
    </div>
  );
}

export default TextWithImage;
