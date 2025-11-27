'use client';

import { motion } from 'framer-motion';

interface StatOverlay {
  metric: string;
  label: string;
}

interface HeroGradientProps {
  headline: string;
  subheadline: string;
  statOverlay?: StatOverlay;
  ctaText?: string;
  onCtaClick?: () => void;
}

export default function HeroGradient({
  headline,
  subheadline,
  statOverlay,
  ctaText,
  onCtaClick
}: HeroGradientProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative w-full min-h-[500px] md:min-h-[600px] flex items-center justify-center 
                 overflow-hidden rounded-3xl mb-12"
    >
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f0f1e] 
                      animate-gradient-shift" />

      {/* Overlay patterns */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] 
                        bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgyNTUsMjU1LDI1NSwwLjAzKSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] 
               opacity-30" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 text-center">
        {/* Headline - Large, impactful, responsive */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 
                     font-bold mb-6 md:mb-8
                     bg-gradient-to-r from-white via-cyan-100 to-blue-100 
                     bg-clip-text text-transparent 
                     leading-[1.1] tracking-tight"
        >
          {headline}
        </motion.h1>

        {/* Subheadline - Larger, more readable */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-lg sm:text-xl md:text-2xl lg:text-[1.625rem]
                     text-gray-300 mb-8 md:mb-10
                     max-w-4xl mx-auto 
                     leading-relaxed"
        >
          {subheadline}
        </motion.p>

        {/* Stat Overlay */}
        {statOverlay && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="inline-block mb-8"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-cyan-500/30 blur-2xl rounded-2xl" />
              
              {/* Stat card */}
              <div className="relative bg-gray-900/80 backdrop-blur-md border border-cyan-500/30 
                              rounded-2xl px-8 py-6 shadow-2xl">
                <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 
                                bg-clip-text text-transparent mb-2">
                  {statOverlay.metric}
                </div>
                <div className="text-gray-300 text-sm uppercase tracking-wider font-semibold">
                  {statOverlay.label}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* CTA Button */}
        {ctaText && (
          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            onClick={onCtaClick}
            className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 
                       text-white font-semibold rounded-full overflow-hidden
                       hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300
                       hover:scale-105"
          >
            <span className="relative z-10">{ctaText}</span>
            
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                            translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          </motion.button>
        )}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

