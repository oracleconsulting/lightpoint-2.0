'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  description: string;
  type: 'inbound' | 'outbound' | 'milestone' | 'escalation';
  department?: string;
  documentUrl?: string;
  documentName?: string;
  status?: 'pending' | 'completed' | 'overdue';
}

interface InteractiveTimelineProps {
  events: TimelineEvent[];
  onEventClick?: (event: TimelineEvent) => void;
  onExportPDF?: () => void;
}

const eventColors = {
  inbound: 'from-brand-blurple to-purple-600',
  outbound: 'from-brand-primary to-blue-600',
  milestone: 'from-success to-green-600',
  escalation: 'from-red-500 to-orange-600',
};

const eventIcons = {
  inbound: FileText,
  outbound: Send,
  milestone: CheckCircle,
  escalation: AlertTriangle,
};

export default function InteractiveTimeline({
  events,
  onEventClick,
  onExportPDF,
}: InteractiveTimelineProps) {
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [zoom, setZoom] = useState(1);
  const [scrollPosition, setScrollPosition] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const sortedEvents = [...events].sort((a, b) => a.date.getTime() - b.date.getTime());

  const handleEventClick = (event: TimelineEvent) => {
    setSelectedEvent(event);
    onEventClick?.(event);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 2));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.6));
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative bg-white rounded-card border border-gray-100 shadow-sm overflow-hidden">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-gray-600" />
          <h3 className="font-heading font-semibold text-gray-900">
            Complaint Timeline
          </h3>
          <span className="text-sm text-gray-500">({sortedEvents.length} events)</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 border border-gray-200 rounded-button overflow-hidden">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-gray-50 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4 text-gray-600" />
            </button>
            <div className="px-2 text-sm font-medium text-gray-700 border-x border-gray-200">
              {Math.round(zoom * 100)}%
            </div>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-gray-50 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Export Button */}
          {onExportPDF && (
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPDF}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          )}
        </div>
      </div>

      {/* Scroll Navigation */}
      <div className="relative">
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>

        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>

        {/* Timeline Container */}
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 p-8"
          style={{ scrollBehavior: 'smooth' }}
        >
          <div
            className="relative flex items-center gap-8 min-w-max"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'left center' }}
          >
            {/* Timeline Line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-brand-primary via-brand-blurple to-success" />

            {/* Timeline Events */}
            {sortedEvents.map((event, index) => {
              const Icon = eventIcons[event.type];
              const gradient = eventColors[event.type];
              const isSelected = selectedEvent?.id === event.id;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative flex flex-col items-center"
                >
                  {/* Event Dot */}
                  <motion.button
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleEventClick(event)}
                    className={`relative z-10 w-16 h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg transition-all ${
                      isSelected ? 'ring-4 ring-offset-2 ring-brand-primary' : ''
                    }`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </motion.button>

                  {/* Event Card */}
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute top-20 w-64 bg-white rounded-card border border-gray-200 shadow-xl p-4 z-20"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${gradient}`}>
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          {event.status && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full font-medium ${
                                event.status === 'completed'
                                  ? 'bg-success/10 text-success'
                                  : event.status === 'overdue'
                                  ? 'bg-red-50 text-red-600'
                                  : 'bg-amber-50 text-amber-600'
                              }`}
                            >
                              {event.status}
                            </span>
                          )}
                        </div>

                        <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>

                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <Clock className="h-3 w-3" />
                          {event.date.toLocaleDateString()}
                        </div>

                        {event.department && (
                          <div className="text-xs text-gray-500 mb-2">
                            Department: <span className="font-medium">{event.department}</span>
                          </div>
                        )}

                        {event.documentUrl && (
                          <a
                            href={event.documentUrl}
                            className="flex items-center gap-2 text-sm text-brand-primary hover:text-brand-blurple transition-colors mt-2"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Download className="h-4 w-4" />
                            {event.documentName || 'View Document'}
                          </a>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Date Label */}
                  <div className="mt-4 text-xs font-medium text-gray-600 whitespace-nowrap">
                    {event.date.toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 p-4 border-t border-gray-100 bg-gray-50">
        {Object.entries(eventColors).map(([type, gradient]) => {
          const Icon = eventIcons[type as keyof typeof eventIcons];
          return (
            <div key={type} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${gradient}`} />
              <span className="text-xs font-medium text-gray-600 capitalize">{type}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

