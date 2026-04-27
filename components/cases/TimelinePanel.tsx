'use client';

import { useMemo, useState } from 'react';
import { format, isBefore, isWithinInterval, addDays, parseISO } from 'date-fns';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TimelinePanelProps {
  caseId: string;
  events?: any[];
}

function deadlineClass(event: any): string {
  if (event.deadline_status === 'met') return 'border-green-200 bg-green-50';
  if (event.deadline_status === 'extended') return 'border-gray-200 bg-gray-50';
  if (event.deadline_status === 'passed') return 'border-red-200 bg-red-50';
  if (event.deadline_status === 'live') {
    const date = parseISO(event.event_date);
    const soon = isWithinInterval(date, { start: new Date(), end: addDays(new Date(), 14) });
    if (isBefore(date, new Date()) || soon) return 'border-amber-200 bg-amber-50';
    return 'border-blue-200 bg-blue-50';
  }
  return 'border-gray-100 bg-white';
}

export function TimelinePanel({ caseId, events = [] }: TimelinePanelProps) {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    eventDate: new Date().toISOString().slice(0, 10),
    eventType: 'note',
    title: '',
    description: '',
    deadlineStatus: 'none',
    statutoryAuthority: '',
  });

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => String(a.event_date).localeCompare(String(b.event_date))),
    [events]
  );

  const createEvent = trpc.caseEvent.create.useMutation({
    onSuccess: () => {
      utils.case.get.invalidate(caseId);
      setShowForm(false);
      setForm({
        eventDate: new Date().toISOString().slice(0, 10),
        eventType: 'note',
        title: '',
        description: '',
        deadlineStatus: 'none',
        statutoryAuthority: '',
      });
    },
  });

  const deleteEvent = trpc.caseEvent.delete.useMutation({
    onSuccess: () => utils.case.get.invalidate(caseId),
  });

  const markDeadlineStatus = trpc.caseEvent.markDeadlineStatus.useMutation({
    onSuccess: () => utils.case.get.invalidate(caseId),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent.mutate({
      caseId,
      eventDate: form.eventDate,
      eventType: form.eventType,
      title: form.title,
      description: form.description || undefined,
      deadlineStatus: form.deadlineStatus === 'none' ? undefined : form.deadlineStatus as any,
      statutoryAuthority: form.statutoryAuthority || undefined,
    });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-[#2B80FF]" />
          Timeline
        </CardTitle>
        <Button size="sm" onClick={() => setShowForm((value) => !value)}>
          <Plus className="mr-2 h-4 w-4" />
          Event
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border bg-blue-50/40 p-3">
            <Input
              type="date"
              value={form.eventDate}
              onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={form.eventType}
                onChange={(e) => setForm({ ...form, eventType: e.target.value })}
                placeholder="Type, e.g. deadline"
              />
              <Select
                value={form.deadlineStatus}
                onValueChange={(value) => setForm({ ...form, deadlineStatus: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Deadline status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No deadline status</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="passed">Passed</SelectItem>
                  <SelectItem value="met">Met</SelectItem>
                  <SelectItem value="extended">Extended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Event title"
              required
            />
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What happened?"
            />
            <Input
              value={form.statutoryAuthority}
              onChange={(e) => setForm({ ...form, statutoryAuthority: e.target.value })}
              placeholder="Statutory authority, if relevant"
            />
            <Button type="submit" disabled={createEvent.isPending || !form.title.trim()}>
              Save event
            </Button>
          </form>
        )}

        <div className="space-y-3">
          {sortedEvents.length === 0 && (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No timeline events yet. Add the key procedural steps and deadlines manually for Phase 1.
            </p>
          )}
          {sortedEvents.map((event) => (
            <div key={event.id} className={`rounded-lg border p-3 ${deadlineClass(event)}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-900">{event.title}</div>
                  <div className="mt-1 text-xs text-gray-600">
                    {format(parseISO(event.event_date), 'dd MMM yyyy')} · {event.event_type}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {event.deadline_status && (
                    <Select
                      value={event.deadline_status}
                      onValueChange={(value) =>
                        markDeadlineStatus.mutate({ id: event.id, caseId, deadlineStatus: value as any })
                      }
                    >
                      <SelectTrigger className="h-8 w-[112px] bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="live">Live</SelectItem>
                        <SelectItem value="passed">Passed</SelectItem>
                        <SelectItem value="met">Met</SelectItem>
                        <SelectItem value="extended">Extended</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteEvent.mutate({ id: event.id, caseId })}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {event.description && <p className="mt-2 text-sm text-gray-700">{event.description}</p>}
              {event.statutory_authority && (
                <Badge variant="outline" className="mt-2 bg-white">
                  {event.statutory_authority}
                </Badge>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
