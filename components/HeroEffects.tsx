import React from 'react';

export function AnimatedGradientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Moving Mesh Gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute -inset-[100%] animate-[spin_20s_linear_infinite]">
          <div className="h-full w-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 blur-3xl" />
        </div>
      </div>

      {/* Animated Blobs */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/20 to-transparent" />
    </div>
  );
}

/**
 * Floating decorative elements for the hero section
 */
export function FloatingElements() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating Documents */}
      <div className="absolute top-20 left-10 animate-float">
        <svg className="w-16 h-16 text-white/10" fill="currentColor" viewBox="0 0 24 24">
          <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
        </svg>
      </div>
      
      <div className="absolute top-40 right-20 animate-float" style={{ animationDelay: '1s' }}>
        <svg className="w-12 h-12 text-white/10" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9,20.42L2.79,14.21L5.62,11.38L9,14.77L18.88,4.88L21.71,7.71L9,20.42Z" />
        </svg>
      </div>
      
      <div className="absolute bottom-32 left-1/4 animate-float" style={{ animationDelay: '2s' }}>
        <svg className="w-20 h-20 text-white/10" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M16.59,7.58L10,14.17L7.41,11.59L6,13L10,17L18,9L16.59,7.58Z" />
        </svg>
      </div>
      
      {/* Particle Dots */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full animate-float"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 4}s`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Animated statistics display for hero section
 */
export function HeroStats({ stats }: { stats: Array<{ value: string; label: string }> }) {
  return (
    <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="text-center glass rounded-lg p-4 hover-glow animate-slide-in"
          style={{ animationDelay: `${0.3 + index * 0.1}s` }}
        >
          <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
          <div className="text-sm text-blue-200">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}

