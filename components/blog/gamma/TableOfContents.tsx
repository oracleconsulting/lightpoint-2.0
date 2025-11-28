'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { List, ChevronDown, ChevronUp } from 'lucide-react';

interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  readonly items: TocItem[];
  readonly variant?: 'sidebar' | 'inline' | 'collapsible';
  readonly accent?: 'cyan' | 'purple' | 'amber';
}

/**
 * TableOfContents - Navigation component for long-form blog content
 * 
 * AUDIT REQUIREMENT: Add TOC for long articles (score 0/10 → 8/10)
 * 
 * Variants:
 * - sidebar: Fixed position on desktop, hidden on mobile
 * - inline: Full-width block at top of article
 * - collapsible: Expandable block (best for mobile)
 */
export default function TableOfContents({ 
  items, 
  variant = 'collapsible',
  accent = 'cyan' 
}: TableOfContentsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeId, setActiveId] = useState<string>('');

  // Track scroll position to highlight active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
      }
    );

    // Observe all section headings
    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100; // Account for fixed header
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
    
    // Collapse on mobile after clicking
    if (variant === 'collapsible') {
      setIsExpanded(false);
    }
  };

  const accentColors = {
    cyan: {
      active: 'text-cyan-400 border-cyan-400',
      hover: 'hover:text-cyan-300',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/30',
    },
    purple: {
      active: 'text-purple-400 border-purple-400',
      hover: 'hover:text-purple-300',
      bg: 'bg-purple-500/10',
      border: 'border-purple-500/30',
    },
    amber: {
      active: 'text-amber-400 border-amber-400',
      hover: 'hover:text-amber-300',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/30',
    },
  };

  const colors = accentColors[accent];

  // Don't render if no items
  if (!items || items.length === 0) {
    return null;
  }

  // Collapsible variant (best for mobile and inline use)
  if (variant === 'collapsible') {
    return (
      <div className={`w-full rounded-xl border ${colors.border} ${colors.bg} backdrop-blur-sm overflow-hidden`}>
        {/* Toggle header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-6 py-4 text-white hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <List className="w-5 h-5 text-slate-400" />
            <span className="font-semibold text-lg">Table of Contents</span>
            <span className="text-sm text-slate-500">({items.length} sections)</span>
          </div>
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </button>

        {/* Expandable content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <nav className="px-6 pb-6">
                <ul className="space-y-2">
                  {items.map((item, index) => (
                    <motion.li
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <button
                        onClick={() => scrollToSection(item.id)}
                        className={`
                          w-full text-left py-2 px-3 rounded-lg
                          text-slate-300 ${colors.hover}
                          transition-all duration-200
                          ${item.level > 1 ? 'ml-4 text-sm' : 'text-base font-medium'}
                          ${activeId === item.id ? `${colors.active} ${colors.bg}` : ''}
                        `}
                      >
                        <span className="text-slate-500 mr-2">{String(index + 1).padStart(2, '0')}</span>
                        {item.title}
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Inline variant (full-width block)
  if (variant === 'inline') {
    return (
      <div className={`w-full rounded-xl border ${colors.border} ${colors.bg} backdrop-blur-sm p-6`}>
        <div className="flex items-center gap-3 mb-4">
          <List className="w-5 h-5 text-slate-400" />
          <h3 className="font-semibold text-lg text-white">In This Article</h3>
        </div>
        
        <nav>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {items.map((item, index) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollToSection(item.id)}
                  className={`
                    w-full text-left py-2 px-3 rounded-lg
                    text-slate-300 ${colors.hover}
                    transition-all duration-200
                    ${item.level > 1 ? 'text-sm' : 'text-base font-medium'}
                    ${activeId === item.id ? `${colors.active} ${colors.bg}` : ''}
                  `}
                >
                  <span className="text-slate-500 mr-2">{String(index + 1).padStart(2, '0')}</span>
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    );
  }

  // Sidebar variant (fixed position on desktop)
  return (
    <aside className="hidden xl:block fixed left-8 top-1/2 -translate-y-1/2 w-64 z-40">
      <div className={`rounded-xl border ${colors.border} ${colors.bg} backdrop-blur-sm p-4`}>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
          <List className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-white">Contents</span>
        </div>
        
        <nav>
          <ul className="space-y-1">
            {items.map((item, index) => (
              <li key={item.id}>
                <button
                  onClick={() => scrollToSection(item.id)}
                  className={`
                    w-full text-left py-1.5 px-2 rounded-md text-sm
                    text-slate-400 ${colors.hover}
                    transition-all duration-200
                    border-l-2 border-transparent
                    ${item.level > 1 ? 'ml-3 text-xs' : ''}
                    ${activeId === item.id 
                      ? `${colors.active} ${colors.bg}` 
                      : 'hover:bg-white/5'
                    }
                  `}
                >
                  <span className="text-slate-600 mr-1.5 text-xs">{String(index + 1).padStart(2, '0')}</span>
                  <span className="line-clamp-2">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}

/**
 * Generate TOC items from layout components
 * Use this in the blog page to extract headings from the structured layout
 */
export function generateTocItems(layout: any[]): TocItem[] {
  const items: TocItem[] = [];
  let headingIndex = 0;

  layout.forEach((item) => {
    if (item.type === 'SectionHeading') {
      const title = item.props?.title || item.props?.text || '';
      if (title) {
        headingIndex++;
        const id = `section-${headingIndex}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)}`;
        items.push({
          id,
          title,
          level: 1,
        });
      }
    }
  });

  return items;
}

