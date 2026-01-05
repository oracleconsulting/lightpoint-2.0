'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, AlertTriangle, FileText, Send, ChevronRight, CheckCircle } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { trpc } from '@/lib/trpc/Provider';
import { logger } from '../../lib/logger';

type FollowUpType = 'chase' | 'delayed_response' | 'inadequate_response' | 'rebuttal' | 'tier2_escalation';

interface FollowUpManagerProps {
  complaintId: string;
  lastLetterDate?: string;
  lastLetterRef?: string;
  hmrcResponseDate?: string;
  hmrcResponseSummary?: string;
  hasResponse?: boolean;
  hmrcIndicatedClosed?: boolean;
  onFollowUpGenerated?: (letter: string) => void;
  practiceLetterhead?: string;
  chargeOutRate?: number;
  userName?: string;
  userTitle?: string;
  userEmail?: string | null;
  userPhone?: string | null;
}

const FOLLOW_UP_TYPES: { value: FollowUpType; label: string; description: string }[] = [
  { 
    value: 'chase', 
    label: 'Progress Check', 
    description: 'No response yet - politely enquire about progress' 
  },
  { 
    value: 'delayed_response', 
    label: 'Delayed Response', 
    description: 'HMRC responded outside timescales - cite additional CRG breach' 
  },
  { 
    value: 'inadequate_response', 
    label: 'Inadequate Response', 
    description: 'Placeholder or partial reply - request substantive response' 
  },
  { 
    value: 'rebuttal', 
    label: 'Rebuttal', 
    description: 'Counter incorrect denials with evidence' 
  },
  { 
    value: 'tier2_escalation', 
    label: 'Tier 2 Escalation', 
    description: 'HMRC closed complaint + we disagree - formal escalation' 
  },
];

export function FollowUpManager({ 
  complaintId, 
  lastLetterDate,
  lastLetterRef,
  hmrcResponseDate,
  hmrcResponseSummary,
  hasResponse = false,
  hmrcIndicatedClosed = false,
  onFollowUpGenerated,
  practiceLetterhead,
  chargeOutRate,
  userName,
  userTitle,
  userEmail,
  userPhone,
}: FollowUpManagerProps) {
  const [additionalContext, setAdditionalContext] = useState('');
  const [unaddressedPoints, setUnaddressedPoints] = useState('');
  const [followUpType, setFollowUpType] = useState<FollowUpType | undefined>(undefined);
  const [responseWasSubstantive, setResponseWasSubstantive] = useState<boolean | undefined>(undefined);
  const [generating, setGenerating] = useState(false);
  const [generatedLetter, setGeneratedLetter] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const generateFollowUp = trpc.letters.generateFollowUp.useMutation();

  // Calculate days since last letter
  const daysSince = lastLetterDate 
    ? differenceInDays(new Date(), new Date(lastLetterDate))
    : 0;
  
  const responseDeadline = lastLetterDate 
    ? addDays(new Date(lastLetterDate), 28)
    : null;
  
  const daysUntilDeadline = responseDeadline
    ? differenceInDays(responseDeadline, new Date())
    : 0;

  const isOverdue = daysUntilDeadline < 0;
  const isUrgent = daysUntilDeadline >= 0 && daysUntilDeadline <= 7;

  // Auto-suggest follow-up type based on context
  const getSuggestedType = (): FollowUpType => {
    if (hmrcIndicatedClosed) return 'tier2_escalation';
    if (!hasResponse && !hmrcResponseDate) return 'chase';
    if (hmrcResponseDate) {
      const originalDate = new Date(lastLetterDate || '');
      const respDate = new Date(hmrcResponseDate);
      const daysBetween = differenceInDays(respDate, originalDate);
      if (daysBetween > 21) return 'delayed_response';
    }
    if (hasResponse && responseWasSubstantive === false) return 'inadequate_response';
    if (hasResponse) return 'rebuttal';
    return 'chase';
  };

  const getDeadlineStatus = () => {
    if (!responseDeadline) return null;
    
    if (isOverdue) {
      return {
        label: `${Math.abs(daysUntilDeadline)} days overdue`,
        color: 'bg-red-100 text-red-700 border-red-300',
        icon: <AlertTriangle className="h-4 w-4" />,
      };
    }
    
    if (isUrgent) {
      return {
        label: `${daysUntilDeadline} days remaining`,
        color: 'bg-orange-100 text-orange-700 border-orange-300',
        icon: <Clock className="h-4 w-4" />,
      };
    }
    
    return {
      label: `${daysUntilDeadline} days remaining`,
      color: 'bg-blue-100 text-blue-700 border-blue-300',
      icon: <Clock className="h-4 w-4" />,
    };
  };

  const handleGenerateFollowUp = async () => {
    if (!lastLetterDate) {
      alert('No original letter date found. Please ensure a letter has been sent first.');
      return;
    }

    setGenerating(true);
    try {
      const result = await generateFollowUp.mutateAsync({
        complaintId,
        followUpType: followUpType || getSuggestedType(),
        originalLetterDate: lastLetterDate,
        originalLetterRef: lastLetterRef,
        hmrcResponseDate,
        hmrcResponseSummary,
        hmrcIndicatedClosed,
        responseWasSubstantive,
        unaddressedPoints: unaddressedPoints.split('\n').filter(p => p.trim()),
        additionalContext,
        practiceLetterhead,
        chargeOutRate,
        userName,
        userTitle,
        userEmail,
        userPhone,
      });
      
      setGeneratedLetter(result.letter);
      
      // Log time for preparing follow-up
      await utils.client.time.logActivity.mutate({
        complaintId,
        activity: `${result.followUpType} Follow-up Letter Generation`,
        duration: 20,
      });

      // Refresh letters list
      utils.letters.list.invalidate({ complaintId });

      onFollowUpGenerated?.(result.letter);
      
      logger.info(`✅ Follow-up letter generated: ${result.followUpType}, ${result.daysSinceOriginal} days since original`);
    } catch (error: any) {
      logger.error('Follow-up generation error:', error);
      alert(`Failed to generate follow-up letter: ${error.message || 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  };

  const deadlineStatus = getDeadlineStatus();
  const selectedType = followUpType || getSuggestedType();

  return (
    <Card className={isOverdue ? 'border-red-200 bg-red-50/50' : isUrgent ? 'border-orange-200 bg-orange-50/50' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Follow-Up Management
          </span>
          {deadlineStatus && (
            <Badge className={deadlineStatus.color}>
              {deadlineStatus.icon}
              <span className="ml-1.5">{deadlineStatus.label}</span>
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timeline Info */}
        {lastLetterDate && (
          <div className="p-3 bg-card border rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Letter Sent:</span>
              <span className="font-medium">{format(new Date(lastLetterDate), 'PPP')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Days Since:</span>
              <span className="font-medium">{daysSince} days</span>
            </div>
            {responseDeadline && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Response Due:</span>
                <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                  {format(responseDeadline, 'PPP')}
                </span>
              </div>
            )}
            {hmrcResponseDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">HMRC Response:</span>
                <span className="font-medium">{format(new Date(hmrcResponseDate), 'PPP')}</span>
              </div>
            )}
          </div>
        )}

        {/* Alert Messages */}
        {isOverdue && !hasResponse && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900">
                <p className="font-medium mb-1">Response Overdue!</p>
                <p>HMRC has not responded within 28 days. Generate a follow-up letter to chase progress.</p>
              </div>
            </div>
          </div>
        )}

        {isUrgent && !isOverdue && !hasResponse && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex gap-2">
              <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-orange-900">
                <p className="font-medium mb-1">Deadline Approaching</p>
                <p>Response deadline is within 7 days. Monitor for HMRC response.</p>
              </div>
            </div>
          </div>
        )}

        {/* Follow-Up Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Follow-Up Type
          </label>
          <Select 
            value={followUpType || getSuggestedType()} 
            onValueChange={(v) => setFollowUpType(v as FollowUpType)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select follow-up type" />
            </SelectTrigger>
            <SelectContent>
              {FOLLOW_UP_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{type.label}</span>
                    <span className="text-xs text-muted-foreground">{type.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="mt-1 text-xs text-muted-foreground">
            {selectedType !== 'tier2_escalation' ? 
              '💡 This remains within Tier 1 - we continue the dialogue until resolution or impasse' :
              '⚠️ Tier 2 escalation - only use when HMRC indicates complaint is closed'}
          </p>
        </div>

        {/* Response Quality (if HMRC responded) */}
        {hasResponse && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Was HMRC's response substantive?
            </label>
            <div className="flex gap-4">
              <Button
                variant={responseWasSubstantive === true ? 'default' : 'outline'}
                size="sm"
                onClick={() => setResponseWasSubstantive(true)}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Yes
              </Button>
              <Button
                variant={responseWasSubstantive === false ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setResponseWasSubstantive(false)}
              >
                <AlertTriangle className="h-4 w-4 mr-1" />
                No - Placeholder/Partial
              </Button>
            </div>
          </div>
        )}

        {/* Unaddressed Points */}
        {(selectedType === 'inadequate_response' || selectedType === 'rebuttal' || selectedType === 'tier2_escalation') && (
          <div>
            <label className="block text-sm font-medium mb-2">
              {selectedType === 'rebuttal' ? 'Points to Rebut' : 'Unaddressed Points'}
            </label>
            <Textarea
              value={unaddressedPoints}
              onChange={(e) => setUnaddressedPoints(e.target.value)}
              placeholder={`Enter each point on a new line:\n- HMRC did not address...\n- No explanation for...\n- Failed to compensate for...`}
              rows={4}
            />
          </div>
        )}

        {/* Additional Context */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Additional Context for Follow-Up
          </label>
          <Textarea
            value={additionalContext}
            onChange={(e) => setAdditionalContext(e.target.value)}
            placeholder="Any new information, client updates, or specific points to include in the follow-up letter..."
            rows={4}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Include any developments since the original letter, client feedback, or specific requests.
          </p>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateFollowUp}
          disabled={generating || !lastLetterDate}
          className="w-full"
          variant={selectedType === 'tier2_escalation' ? 'destructive' : isOverdue ? 'destructive' : 'default'}
        >
          <FileText className="h-4 w-4 mr-2" />
          {generating ? 'Generating...' : 
           selectedType === 'tier2_escalation' ? 'Generate Tier 2 Escalation' :
           selectedType === 'delayed_response' ? 'Generate Delayed Response Follow-Up' :
           selectedType === 'inadequate_response' ? 'Generate Inadequate Response Follow-Up' :
           selectedType === 'rebuttal' ? 'Generate Rebuttal Letter' :
           'Generate Progress Check Letter'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          ⏱️ Automatically tracks 20 minutes billable time
        </p>

        {/* Generated Letter Preview */}
        {generatedLetter && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800 mb-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Letter Generated Successfully</span>
            </div>
            <p className="text-sm text-green-700 mb-2">
              Your follow-up letter has been generated and saved. View it in the Letters tab.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setGeneratedLetter(null)}
            >
              Generate Another
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
