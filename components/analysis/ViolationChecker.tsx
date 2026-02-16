'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface Violation {
  type: string;
  description: string;
  citation: string;
}

interface Classification {
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
  routing?: {
    primary_letter_type: string;
    recipient_team: string;
  };
}

interface Analysis {
  hasGrounds: boolean;
  violations: Violation[];
  actions: string[];
  successRate: number;
  reasoning: string;
  classification?: Classification;
}

interface ViolationCheckerProps {
  analysis: Analysis;
}

function AppealGroundsContent({
  analysis,
}: {
  analysis: Analysis;
}) {
  const pd = analysis.classification?.penalty_details;
  const grounds = pd?.reasonable_excuse_grounds ?? [];

  return (
    <>
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted mb-6">
        <CheckCircle className="h-8 w-8 text-green-500" />
        <div>
          <p className="font-semibold">Appeal Grounds Identified</p>
          <p className="text-sm text-muted-foreground">
            Appeal strength: {analysis.successRate}%
          </p>
        </div>
      </div>

      {pd && (
        <div className="mb-6 rounded-lg border p-4">
          <h3 className="font-semibold mb-3">Penalty Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <span className="text-muted-foreground">Type:</span>
            <span>{pd.penalty_type}</span>
            {pd.penalty_amount != null && (
              <>
                <span className="text-muted-foreground">Amount:</span>
                <span>£{pd.penalty_amount.toLocaleString()}</span>
              </>
            )}
            {pd.tax_years?.length > 0 && (
              <>
                <span className="text-muted-foreground">Tax year(s):</span>
                <span>{pd.tax_years.join(', ')}</span>
              </>
            )}
            {pd.appeal_deadline && (
              <>
                <span className="text-muted-foreground">Appeal deadline:</span>
                <span>{pd.appeal_deadline}</span>
              </>
            )}
            {pd.appeal_statute && (
              <>
                <span className="text-muted-foreground">Statutory basis:</span>
                <span>{pd.appeal_statute}</span>
              </>
            )}
          </div>
        </div>
      )}

      {grounds.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Reasonable Excuse Grounds</h3>
          <div className="space-y-2">
            {grounds.map((g, i) => (
              <div key={i} className="flex items-start gap-2">
                <Badge variant="secondary" className="shrink-0">
                  Ground {i + 1}
                </Badge>
                <span className="text-sm">{g}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.actions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Recommended Actions</h3>
          <ul className="space-y-2">
            {analysis.actions.map((action, index) => (
              <li key={index} className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 mt-1 text-primary shrink-0" />
                <span className="text-sm">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function ComplaintViolationsContent({
  analysis,
}: {
  analysis: Analysis;
}) {
  return (
    <>
      <div className="flex items-center gap-4 p-4 rounded-lg bg-muted mb-6">
        {analysis.hasGrounds ? (
          <CheckCircle className="h-8 w-8 text-green-500" />
        ) : (
          <AlertCircle className="h-8 w-8 text-yellow-500" />
        )}
        <div>
          <p className="font-semibold">
            {analysis.hasGrounds ? 'Valid Complaint Grounds Found' : 'No Strong Grounds Identified'}
          </p>
          <p className="text-sm text-muted-foreground">
            Estimated success rate: {analysis.successRate}%
          </p>
        </div>
      </div>

      {analysis.violations.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3">Charter & CRG Violations</h3>
          <div className="space-y-3">
            {analysis.violations.map((violation, index) => (
              <div key={index} className="border-l-4 border-destructive pl-4 py-2">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{violation.type}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {violation.description}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="mt-2">
                  {violation.citation}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.actions.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Recommended Actions</h3>
          <ul className="space-y-2">
            {analysis.actions.map((action, index) => (
              <li key={index} className="flex items-start gap-2">
                <TrendingUp className="h-4 w-4 mt-1 text-primary" />
                <span className="text-sm">{action}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export function ViolationChecker({ analysis }: ViolationCheckerProps) {
  const primaryType = analysis.classification?.primary_type ?? 'complaint';
  const isAppeal = primaryType === 'penalty_appeal';
  const isMixed = primaryType === 'mixed';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isAppeal ? 'Appeal Analysis' : isMixed ? 'Case Analysis' : 'Complaint Analysis'}
          {isAppeal && (
            <Badge variant="destructive">Penalty Appeal</Badge>
          )}
          {isMixed && (
            <Badge variant="secondary">Mixed</Badge>
          )}
          {primaryType === 'complaint' && (
            <Badge variant="default">Complaint</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {isMixed ? (
          <Tabs defaultValue="complaint">
            <TabsList>
              <TabsTrigger value="complaint">Complaint Grounds</TabsTrigger>
              <TabsTrigger value="appeal">Appeal Grounds</TabsTrigger>
            </TabsList>
            <TabsContent value="complaint" className="mt-4">
              <ComplaintViolationsContent analysis={analysis} />
            </TabsContent>
            <TabsContent value="appeal" className="mt-4">
              <AppealGroundsContent analysis={analysis} />
            </TabsContent>
          </Tabs>
        ) : isAppeal ? (
          <AppealGroundsContent analysis={analysis} />
        ) : (
          <ComplaintViolationsContent analysis={analysis} />
        )}

        {/* Reasoning - always show */}
        <div>
          <h3 className="font-semibold mb-2">Analysis Summary</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {analysis.reasoning}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

