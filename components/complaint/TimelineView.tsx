'use client';

import { format } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Clock, AlertCircle } from 'lucide-react';

interface TimelineEvent {
  date: string;
  type: string;
  summary: string;
  responseDeadline?: string;
}

interface TimelineViewProps {
  events: TimelineEvent[];
}

export function TimelineView({ events }: TimelineViewProps) {
  const getEventIcon = (type: string) => {
    switch (type) {
      case 'sent':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'received':
        return <Circle className="h-5 w-5 text-green-500" />;
      case 'internal':
        return <Clock className="h-5 w-5 text-gray-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event, index) => (
            <div key={index} className="flex gap-4">
              <div className="flex-shrink-0 mt-1">
                {getEventIcon(event.type)}
              </div>
              <div className="flex-1 pb-4 border-l-2 border-border pl-4 ml-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{event.summary}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.date), 'PPP')}
                    </p>
                    {event.responseDeadline && (
                      <div className="mt-2">
                        <Badge variant={isOverdue(event.responseDeadline) ? "destructive" : "secondary"}>
                          Response due: {format(new Date(event.responseDeadline), 'PP')}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <Badge variant="outline">{event.type}</Badge>
                </div>
              </div>
            </div>
          ))}
          {events.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No timeline events yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

