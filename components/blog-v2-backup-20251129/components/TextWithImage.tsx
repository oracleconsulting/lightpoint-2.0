'use client';

import React from 'react';
import type { TextWithImageProps } from '../types';

/**
 * TextWithImage - Two-column layout with text and image
 * 
 * Matches Gamma page 2 style:
 * - 55/45 or 60/40 split
 * - Image on left or right
 * - Multiple paragraphs
 * - Optional title above
 */
export function TextWithImage({
  title,
  paragraphs,
  imageSrc,
  imageAlt,
  imagePosition = 'right',
  imageCaption,
  className = '',
}: TextWithImageProps) {
  const isImageLeft = imagePosition === 'left';

  return (
    <div className={`bg-white py-16 px-8 ${className}`}>
      <div className="max-w-5xl mx-auto">
        {/* Title */}
        {title && (
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-8">
            {title}
          </h2>
        )}

        {/* Content grid */}
        <div className={`flex flex-col gap-12 items-start ${
          isImageLeft ? 'md:flex-row-reverse' : 'md:flex-row'
        }`}>
          {/* Text column */}
          <div className="flex-1 space-y-4">
            {paragraphs.map((paragraph, index) => (
              <p 
                key={index} 
                className="text-lg text-gray-600 leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Image column */}
          <div className="flex-shrink-0 w-full md:w-2/5">
            <div className="bg-gray-100 rounded-lg overflow-hidden aspect-[4/3]">
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
              <p className="mt-2 text-sm text-gray-500 text-center">
                {imageCaption}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ImagePlaceholderProps {
  alt: string;
}

function ImagePlaceholder({ alt }: ImagePlaceholderProps) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-8">
      <svg 
        className="w-16 h-16 mb-2" 
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
      <span className="text-sm text-center">{alt}</span>
    </div>
  );
}

export default TextWithImage;

