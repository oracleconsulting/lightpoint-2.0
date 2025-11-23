'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useAnimation } from 'framer-motion';

interface AnimatedCardProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

/**
 * Card that animates in when scrolled into view with staggered timing
 */
export function AnimatedCard({ children, delay = 0, className = '' }: AnimatedCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    }
  }, [isInView, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Live activity feed showing recent platform activity
 */
export function LiveActivityFeed() {
  const [activities] = useState([
    { firm: 'Professional Services Ltd', amount: 3450, time: '2 min ago' },
    { firm: 'Accounting Associates', amount: 1890, time: '5 min ago' },
    { firm: 'Tax Advisory Group', amount: 5200, time: '8 min ago' },
    { firm: 'Financial Consultants', amount: 2750, time: '12 min ago' },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activities.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [activities.length]);

  return (
    <div className="glass rounded-lg p-4 border border-blue-200/20 overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-xs font-medium text-gray-700">Live Activity</span>
      </div>
      
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.5 }}
        className="space-y-1"
      >
        <p className="text-sm text-gray-900 font-medium">
          {activities[currentIndex].firm}
        </p>
        <p className="text-xs text-gray-600">
          Recovered £{activities[currentIndex].amount.toLocaleString()} • {activities[currentIndex].time}
        </p>
      </motion.div>
    </div>
  );
}

/**
 * Animated SVG illustration that draws in on scroll
 */
export function AnimatedIllustration({ type }: { type: 'success' | 'document' | 'chart' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const illustrations = {
    success: (
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          stroke="currentColor"
          strokeWidth="2"
          className="text-green-500"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
        <motion.path
          d="M30 50 L45 65 L70 35"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-green-500"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.5, ease: 'easeInOut' }}
        />
      </svg>
    ),
    document: (
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
        <motion.rect
          x="25"
          y="15"
          width="50"
          height="70"
          rx="4"
          stroke="currentColor"
          strokeWidth="2"
          className="text-blue-500"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ duration: 1, ease: 'easeInOut' }}
        />
        {[35, 50, 65].map((y, i) => (
          <motion.line
            key={y}
            x1="35"
            y1={y}
            x2="65"
            y2={y}
            stroke="currentColor"
            strokeWidth="2"
            className="text-blue-400"
            initial={{ pathLength: 0 }}
            animate={isInView ? { pathLength: 1 } : {}}
            transition={{ duration: 0.5, delay: 1 + i * 0.2, ease: 'easeInOut' }}
          />
        ))}
      </svg>
    ),
    chart: (
      <svg className="w-full h-full" viewBox="0 0 100 100" fill="none">
        {[30, 50, 70, 90].map((x, i) => (
          <motion.rect
            key={x}
            x={x - 5}
            y={80 - (i + 1) * 15}
            width="10"
            height={(i + 1) * 15}
            rx="2"
            fill="currentColor"
            className="text-purple-500"
            initial={{ scaleY: 0 }}
            animate={isInView ? { scaleY: 1 } : {}}
            transition={{ duration: 0.6, delay: i * 0.2, ease: 'easeOut' }}
            style={{ transformOrigin: 'bottom' }}
          />
        ))}
        <motion.line
          x1="20"
          y1="80"
          x2="95"
          y2="80"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-400"
          initial={{ pathLength: 0 }}
          animate={isInView ? { pathLength: 1 } : {}}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </svg>
    ),
  };

  return (
    <div ref={ref} className="w-full h-full">
      {illustrations[type]}
    </div>
  );
}

/**
 * Staggered grid animation for feature cards
 */
export function StaggeredGrid({ children }: { children: React.ReactNode[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {children.map((child, index) => (
        <AnimatedCard key={index} delay={index * 0.1}>
          {child}
        </AnimatedCard>
      ))}
    </div>
  );
}

