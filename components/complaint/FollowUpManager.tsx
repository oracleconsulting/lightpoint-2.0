'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, FileText, Send } from 'lucide-react';
import { format, differenceInDays, addDays } from 'date-fns';
import { trpc } from '@/lib/trpc/Provider';
import { logger } from '../../lib/logger';


interface FollowUpManagerProps {
  complaintId: string;
  lastLetterDate?: string;
  hasResponse?: boolean;
  onFollowUpGenerated?: () => void;
}

export function FollowUpManager({ 
  complaintId, 
  lastLetterDate, 
  hasResponse = false,
  onFollowUpGenerated 
}: FollowUpManagerProps) {
  const [additionalContext, setAdditionalContext] = useState('');
  const [generating, setGenerating] = useState(false);

  const utils = trpc.useUtils();

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
    setGenerating(true);
    try {
      // Prepare follow-up context
      const followUpContext = `
FOLLOW-UP LETTER CONTEXT:

Original letter sent: ${lastLetterDate ? format(new Date(lastLetterDate), 'PPP') : 'Unknown'}
Days since sent: ${daysSince} days
Response deadline: ${responseDeadline ? format(responseDeadline, 'PPP') : 'N/A'}
Status: ${isOverdue ? 'OVERDUE - No response received' : hasResponse ? 'Response received' : 'Awaiting response'}

${hasResponse ? 'HMRC has responded. Review their response and prepare appropriate follow-up.' : 
  isOverdue ? 'HMRC has NOT responded within 28 days. Escalate with stronger language.' : 
  'Preparing follow-up to check on progress.'}

Additional Context from User:
${additionalContext}

INSTRUCTIONS:
- Reference the original letter and date
- ${isOverdue ? 'Use escalatory language due to missed deadline' : 'Maintain professional but firm tone'}
- Request immediate action
- ${isOverdue ? 'Mention potential escalation to Tier 2/Adjudicator' : 'Request update on progress'}
- Include all previous reference numbers
      `.trim();

      // For now, just alert with the context - user can manually generate
      // TODO: Implement proper follow-up letter generation flow
      alert(`Follow-up letter generation coming soon!\n\nFor now:\n1. Add your context above\n2. Generate a new letter with this information\n3. The system will include follow-up language automatically`);
      
      // Log time for preparing follow-up
      await utils.client.time.logActivity.mutate({
        complaintId,
        activity: isOverdue ? 'Follow-up Letter Preparation (Overdue)' : 'Follow-up Letter Preparation',
        duration: 20,
      });

      setAdditionalContext('');
      onFollowUpGenerated?.();
    } catch (error) {
      logger.error('Follow-up preparation error:', error);
      alert('Failed to prepare follow-up');
    } finally {
      setGenerating(false);
    }
  };

  const deadlineStatus = getDeadlineStatus();

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
          </div>
        )}

        {/* Alert Messages */}
        {isOverdue && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-900">
                <p className="font-medium mb-1">Response Overdue!</p>
                <p>HMRC has not responded within 28 days. Consider generating an escalated follow-up letter or escalating to Tier 2.</p>
              </div>
            </div>
          </div>
        )}

        {isUrgent && !isOverdue && (
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
          variant={isOverdue ? 'destructive' : 'default'}
        >
          <FileText className="h-4 w-4 mr-2" />
          {generating ? 'Generating...' : isOverdue ? 'Generate Escalated Follow-Up' : 'Generate Follow-Up Letter'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          ⏱️ Automatically tracks 20 minutes billable time
        </p>
      </CardContent>
    </Card>
  );
}

