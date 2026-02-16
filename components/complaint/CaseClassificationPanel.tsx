'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface Classification {
  primary_type: string;
  secondary_type: string | null;
  confidence: number;
  signals: string[];
  penalty_details?: {
    penalty_type: string;
    penalty_regime: string;
    penalty_amount: number | null;
    tax_years: string[];
    reasonable_excuse_grounds: string[];
    appeal_deadline: string | null;
    appeal_statute: string;
  };
  routing: {
    primary_letter_type: string;
    secondary_letter_type: string | null;
    recipient_team: string;
    pipeline: string;
  };
}

interface CaseClassificationPanelProps {
  classification: Classification;
  onConfirm: (confirmedType: string) => void;
  onOverride: (newType: 'complaint' | 'penalty_appeal' | 'mixed') => void;
  isUpdating?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  complaint: 'Complaint',
  penalty_appeal: 'Penalty Appeal',
  statutory_review: 'Statutory Review',
  mixed: 'Mixed (Complaint + Appeal)',
  tribunal_appeal: 'Tribunal Appeal',
};

export function CaseClassificationPanel({
  classification,
  onConfirm,
  onOverride,
  isUpdating = false,
}: CaseClassificationPanelProps) {
  const isAppeal = classification.primary_type === 'penalty_appeal';
  const isMixed = classification.primary_type === 'mixed';
  const confidencePercent = Math.round((classification.confidence ?? 0) * 100);

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          Case Classification
          <Badge
            variant={isAppeal ? 'destructive' : isMixed ? 'secondary' : 'default'}
          >
            {TYPE_LABELS[classification.primary_type] || classification.primary_type}
          </Badge>
          <Badge variant="outline">{confidencePercent}% confidence</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {classification.penalty_details && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium mb-2">Penalty Details</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>Type: {classification.penalty_details.penalty_type}</li>
              {classification.penalty_details.penalty_amount != null && (
                <li>Amount: £{classification.penalty_details.penalty_amount.toLocaleString()}</li>
              )}
              {classification.penalty_details.tax_years?.length > 0 && (
                <li>Tax years: {classification.penalty_details.tax_years.join(', ')}</li>
              )}
              {classification.penalty_details.appeal_deadline && (
                <li>Appeal deadline: {classification.penalty_details.appeal_deadline}</li>
              )}
              {classification.penalty_details.appeal_statute && (
                <li>Statute: {classification.penalty_details.appeal_statute}</li>
              )}
            </ul>
          </div>
        )}

        {classification.signals && classification.signals.length > 0 && (
          <details className="text-sm text-muted-foreground">
            <summary className="cursor-pointer hover:text-foreground">
              {classification.signals.length} classification signal(s)
            </summary>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              {classification.signals.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </details>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => onConfirm(classification.primary_type)}
            disabled={isUpdating}
          >
            Confirm
          </Button>
          {classification.primary_type !== 'complaint' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOverride('complaint')}
              disabled={isUpdating}
            >
              Change to Complaint
            </Button>
          )}
          {classification.primary_type !== 'mixed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOverride('mixed')}
              disabled={isUpdating}
            >
              Change to Mixed
            </Button>
          )}
          {classification.primary_type !== 'penalty_appeal' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOverride('penalty_appeal')}
              disabled={isUpdating}
            >
              Change to Penalty Appeal
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
