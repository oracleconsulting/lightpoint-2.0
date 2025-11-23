'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface ResourcePageHeaderProps {
  badge: {
    icon: LucideIcon;
    text: string;
  };
  title: string;
  description: string;
  gradient?: string;
}

export function ResourcePageHeader({ badge, title, description, gradient = 'from-blue-600 via-indigo-600 to-purple-700' }: ResourcePageHeaderProps) {
  const BadgeIcon = badge.icon;
  
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} text-white`}>
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
      <div className="absolute inset-0 bg-gradient-to-t from-blue-600/20 to-transparent" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-white/30 mb-6 bg-white/10">
            <BadgeIcon className="h-4 w-4" />
            <span className="text-sm font-semibold">{badge.text}</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-heading font-bold mb-4">
            {title}
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            {description}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

interface ResourceCardProps {
  children: ReactNode;
  index: number;
  href?: string;
}

export function ResourceCard({ children, index, href }: ResourceCardProps) {
  const content = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-blue-300 hover:-translate-y-2 p-6"
    >
      {children}
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} className="block group">
        {content}
      </a>
    );
  }

  return content;
}

