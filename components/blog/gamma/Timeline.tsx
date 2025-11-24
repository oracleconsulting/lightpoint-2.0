'use client';

import { motion } from 'framer-motion';
import { Check, Clock, XCircle } from 'lucide-react';

interface TimelineEvent {
  date: string;
  title: string;
  description: string;
  status?: 'completed' | 'pending' | 'failed';
}

interface TimelineProps {
  title: string;
  events: TimelineEvent[];
  orientation?: 'vertical' | 'horizontal';
}

const statusConfig = {
  completed: {
    icon: Check,
    color: 'text-green-400',
    bg: 'bg-green-500/20',
    border: 'border-green-400',
    glow: 'shadow-green-500/50'
  },
  pending: {
    icon: Clock,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-400',
    glow: 'shadow-yellow-500/50'
  },
  failed: {
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/20',
    border: 'border-red-400',
    glow: 'shadow-red-500/50'
  }
};

export default function Timeline({
  title,
  events,
  orientation = 'vertical'
}: TimelineProps) {
  const isVertical = orientation === 'vertical';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className="my-12"
    >
      {/* Title */}
      <h3 className="text-3xl font-bold text-white mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        {title}
      </h3>

      {/* Timeline Container */}
      <div className={`relative ${isVertical ? 'pl-10' : 'flex gap-8 overflow-x-auto pb-4'}`}>
        {/* Timeline line */}
        <div className={`absolute ${
          isVertical 
            ? 'left-4 top-0 bottom-0 w-0.5' 
            : 'top-8 left-0 right-0 h-0.5'
        } bg-gradient-to-${isVertical ? 'b' : 'r'} from-blue-500 via-purple-500 to-cyan-500`} />

        {/* Events */}
        {events.map((event, index) => {
          const StatusIcon = event.status ? statusConfig[event.status].icon : null;
          const statusStyle = event.status ? statusConfig[event.status] : null;

          return (
            <div
              key={index}
              className={`relative ${isVertical ? 'mb-8 last:mb-0' : 'min-w-[300px]'}`}
            >
              {/* Marker dot */}
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className={`absolute ${
                  isVertical 
                    ? '-left-[22px] top-2' 
                    : 'left-1/2 -translate-x-1/2 -top-[18px]'
                } w-5 h-5 bg-cyan-500 rounded-full ring-4 ring-gray-900 z-10
                           shadow-lg ${statusStyle?.glow || 'shadow-cyan-500/50'}`}
              />

              {/* Event Card */}
              <motion.div
                initial={{ opacity: 0, x: isVertical ? -20 : 0, y: !isVertical ? 20 : 0 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-6
                           hover:border-purple-500/50 transition-all duration-300 group"
              >
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 
                                rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative flex items-start justify-between">
                  <div className="flex-1">
                    {/* Date */}
                    <div className="text-cyan-400 text-sm font-semibold mb-2 uppercase tracking-wide">
                      {event.date}
                    </div>

                    {/* Title */}
                    <h4 className="text-xl font-semibold text-white mb-2">
                      {event.title}
                    </h4>

                    {/* Description */}
                    <p className="text-gray-400 leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Status Badge */}
                  {event.status && statusStyle && StatusIcon && (
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full 
                                     ${statusStyle.bg} ${statusStyle.border} border ml-4`}>
                      <StatusIcon className={`w-4 h-4 ${statusStyle.color}`} />
                      <span className={`text-sm font-medium ${statusStyle.color} capitalize`}>
                        {event.status}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

