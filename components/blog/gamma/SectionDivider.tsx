'use client';

import React from 'react';

export default function SectionDivider() {
  return (
    <div className="section-divider max-w-4xl mx-auto my-12 flex items-center gap-4 px-4">
      <div 
        className="flex-1 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(79, 134, 249, 0.4) 50%, transparent 100%)'
        }}
      />
      <div 
        className="w-3 h-3 rotate-45"
        style={{
          background: 'linear-gradient(135deg, #4F86F9 0%, #00D4FF 100%)',
          boxShadow: '0 0 20px rgba(79, 134, 249, 0.5)'
        }}
      />
      <div 
        className="flex-1 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(79, 134, 249, 0.4) 50%, transparent 100%)'
        }}
      />
    </div>
  );
}

