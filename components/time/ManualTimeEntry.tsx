'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Phone, Mail, Users, Clock, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ManualTimeEntryProps {
  complaintId: string;
  onTimeLogged: () => void;
}

const ACTIVITY_TYPES = [
  { value: 'CLIENT_CALL', label: 'Client Phone Call', icon: Phone, defaultMinutes: 12 },
  { value: 'CLIENT_EMAIL', label: 'Client Email', icon: Mail, defaultMinutes: 12 },
  { value: 'CLIENT_MEETING', label: 'Client Meeting', icon: Users, defaultMinutes: 24 },
  { value: 'DOCUMENT_REVIEW', label: 'Document Review', icon: Clock, defaultMinutes: 24 },
  { value: 'RESEARCH', label: 'Research', icon: Clock, defaultMinutes: 24 },
  { value: 'OTHER', label: 'Other Activity', icon: Clock, defaultMinutes: 12 },
];

const TIME_INCREMENTS = [
  { value: 12, label: '12 min (1 unit)' },
  { value: 24, label: '24 min (2 units)' },
  { value: 36, label: '36 min (3 units)' },
  { value: 48, label: '48 min (4 units)' },
  { value: 60, label: '60 min (5 units)' },
  { value: 72, label: '72 min (6 units)' },
  { value: 84, label: '84 min (7 units)' },
  { value: 96, label: '96 min (8 units)' },
  { value: 108, label: '108 min (9 units)' },
  { value: 120, label: '120 min (10 units)' },
];

export function ManualTimeEntry({ complaintId, onTimeLogged }: ManualTimeEntryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activityType, setActivityType] = useState('CLIENT_CALL');
  const [duration, setDuration] = useState('12');
  const [notes, setNotes] = useState('');

  const logTime = trpc.time.logActivity.useMutation({
    onSuccess: () => {
      // Reset form
      setActivityType('CLIENT_CALL');
      setDuration('12');
      setNotes('');
      setIsOpen(false);
      onTimeLogged();
    },
    onError: (error) => {
      alert(`Failed to log time: ${error.message}`);
    }
  });

  const selectedActivity = ACTIVITY_TYPES.find(a => a.value === activityType);

  const handleSubmit = () => {
    if (!notes.trim()) {
      alert('Please add notes about this activity');
      return;
    }

    const activityLabel = ACTIVITY_TYPES.find(a => a.value === activityType)?.label || 'Activity';

    logTime.mutate({
      complaintId,
      activity: activityLabel,
      duration: parseInt(duration),
      notes: notes.trim(),
      automated: false, // Manual entry
    });
  };

  if (!isOpen) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={() => setIsOpen(true)}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Log Manual Activity
          </Button>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Phone calls, meetings, emails, research
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {selectedActivity && <selectedActivity.icon className="h-5 w-5 text-blue-600" />}
          Log Manual Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Activity Type */}
        <div className="space-y-2">
          <Label htmlFor="activity-type">Activity Type</Label>
          <Select value={activityType} onValueChange={setActivityType}>
            <SelectTrigger id="activity-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_TYPES.map(activity => {
                const Icon = activity.icon;
                return (
                  <SelectItem key={activity.value} value={activity.value}>
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      {activity.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration">Duration (12-minute increments)</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger id="duration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_INCREMENTS.map(time => (
                <SelectItem key={time.value} value={time.value.toString()}>
                  {time.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (Required)</Label>
          <Textarea
            id="notes"
            placeholder="Details about this activity:
            
• Who you spoke with
• What was discussed
• Key outcomes or decisions
• Follow-up actions needed"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={5}
            disabled={logTime.isPending}
          />
          <p className="text-xs text-muted-foreground">
            These notes will appear in the timeline
          </p>
        </div>

        {/* Billing Preview */}
        <div className="bg-muted/50 rounded-lg p-3 border">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Time:</span>
            <span className="font-medium">
              {parseInt(duration) >= 60 
                ? `${Math.floor(parseInt(duration) / 60)}h ${parseInt(duration) % 60}m`
                : `${duration}m`
              }
            </span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-muted-foreground">Value (£275/hr):</span>
            <span className="font-medium">
              £{((parseInt(duration) / 60) * 275).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!notes.trim() || logTime.isPending}
            className="flex-1"
          >
            {logTime.isPending ? 'Logging...' : 'Log Activity'}
          </Button>
          <Button
            onClick={() => {
              setIsOpen(false);
              setNotes('');
            }}
            disabled={logTime.isPending}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

