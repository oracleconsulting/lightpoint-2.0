'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/Provider';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Scale, 
  Loader2,
  TrendingUp,
  Banknote,
  FileX,
  ArrowUpCircle
} from 'lucide-react';

interface CloseComplaintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId: string;
  complaintRef: string;
  onSuccess?: () => void;
}

type OutcomeType = 
  | 'successful_full'
  | 'successful_partial'
  | 'unsuccessful'
  | 'withdrawn'
  | 'escalated_adjudicator'
  | 'escalated_tribunal'
  | 'settled';

const OUTCOME_OPTIONS: { value: OutcomeType; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    value: 'successful_full',
    label: 'Fully Successful',
    description: 'HMRC fully upheld the complaint',
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'text-green-600 bg-green-50 border-green-200',
  },
  {
    value: 'successful_partial',
    label: 'Partially Successful',
    description: 'HMRC partially upheld the complaint',
    icon: <TrendingUp className="h-5 w-5" />,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    value: 'settled',
    label: 'Settled',
    description: 'Resolved through negotiation before formal decision',
    icon: <Scale className="h-5 w-5" />,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    value: 'unsuccessful',
    label: 'Unsuccessful',
    description: 'HMRC rejected the complaint',
    icon: <XCircle className="h-5 w-5" />,
    color: 'text-red-600 bg-red-50 border-red-200',
  },
  {
    value: 'escalated_adjudicator',
    label: 'Escalated to Adjudicator',
    description: 'Case referred to the Adjudicator\'s Office',
    icon: <ArrowUpCircle className="h-5 w-5" />,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  {
    value: 'escalated_tribunal',
    label: 'Escalated to Tribunal',
    description: 'Case proceeded to Tax Tribunal',
    icon: <Scale className="h-5 w-5" />,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    value: 'withdrawn',
    label: 'Withdrawn',
    description: 'Client decided not to pursue the complaint',
    icon: <FileX className="h-5 w-5" />,
    color: 'text-gray-600 bg-gray-50 border-gray-200',
  },
];

export function CloseComplaintDialog({
  open,
  onOpenChange,
  complaintId,
  complaintRef,
  onSuccess,
}: CloseComplaintDialogProps) {
  const [outcomeType, setOutcomeType] = useState<OutcomeType | ''>('');
  const [compensation, setCompensation] = useState('');
  const [taxCorrected, setTaxCorrected] = useState('');
  const [penaltiesCancelled, setPenaltiesCancelled] = useState('');
  const [interestRefunded, setInterestRefunded] = useState('');
  const [notes, setNotes] = useState('');

  const utils = trpc.useUtils();
  
  const closeMutation = trpc.complaints.closeWithOutcome.useMutation({
    onSuccess: (data) => {
      utils.complaints.list.invalidate();
      utils.complaints.getById.invalidate(complaintId);
      onOpenChange(false);
      onSuccess?.();
      // Reset form
      setOutcomeType('');
      setCompensation('');
      setTaxCorrected('');
      setPenaltiesCancelled('');
      setInterestRefunded('');
      setNotes('');
    },
  });

  const handleSubmit = () => {
    if (!outcomeType) return;

    closeMutation.mutate({
      complaintId,
      outcomeType,
      compensationReceived: compensation ? parseFloat(compensation) : undefined,
      taxPositionCorrected: taxCorrected ? parseFloat(taxCorrected) : undefined,
      penaltiesCancelled: penaltiesCancelled ? parseFloat(penaltiesCancelled) : undefined,
      interestRefunded: interestRefunded ? parseFloat(interestRefunded) : undefined,
      notes: notes || undefined,
    });
  };

  const isSuccessful = outcomeType && ['successful_full', 'successful_partial', 'settled'].includes(outcomeType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Close Complaint
          </DialogTitle>
          <DialogDescription>
            Record the outcome for <span className="font-medium">{complaintRef}</span>. 
            This information will be analyzed to improve future complaints.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Outcome Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">What was the outcome?</Label>
            <RadioGroup
              value={outcomeType}
              onValueChange={(value: string) => setOutcomeType(value as OutcomeType)}
              className="grid grid-cols-1 gap-2"
            >
              {OUTCOME_OPTIONS.map((option) => (
                <div key={option.value}>
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={option.value}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all
                      peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-offset-1
                      hover:bg-gray-50 ${outcomeType === option.value ? option.color : 'border-gray-200'}
                    `}
                  >
                    <div className={outcomeType === option.value ? '' : 'text-gray-400'}>
                      {option.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-gray-500">{option.description}</p>
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Financial Outcomes - Only show for successful outcomes */}
          {isSuccessful && (
            <div className="space-y-4 p-4 bg-green-50 rounded-lg border border-green-100">
              <div className="flex items-center gap-2">
                <Banknote className="h-5 w-5 text-green-600" />
                <Label className="text-base font-medium text-green-900">Financial Outcomes (Optional)</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="compensation">Compensation Received (£)</Label>
                  <Input
                    id="compensation"
                    type="number"
                    placeholder="0.00"
                    value={compensation}
                    onChange={(e) => setCompensation(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taxCorrected">Tax Position Corrected (£)</Label>
                  <Input
                    id="taxCorrected"
                    type="number"
                    placeholder="0.00"
                    value={taxCorrected}
                    onChange={(e) => setTaxCorrected(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="penalties">Penalties Cancelled (£)</Label>
                  <Input
                    id="penalties"
                    type="number"
                    placeholder="0.00"
                    value={penaltiesCancelled}
                    onChange={(e) => setPenaltiesCancelled(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="interest">Interest Refunded (£)</Label>
                  <Input
                    id="interest"
                    type="number"
                    placeholder="0.00"
                    value={interestRefunded}
                    onChange={(e) => setInterestRefunded(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional context about this outcome..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-gray-500">
              These notes will be sanitized and used to improve future letter generation.
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">What happens next?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>The complaint will be marked as closed</li>
                  <li>AI will analyze what worked (and what didn&apos;t)</li>
                  <li>Learnings will be added to improve future letters</li>
                  <li>All client data is automatically anonymized</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={closeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!outcomeType || closeMutation.isPending}
            className={isSuccessful ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {closeMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Closing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Close Complaint
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

