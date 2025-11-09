'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';

interface Violation {
  type: string;
  description: string;
  citation: string;
}

interface Analysis {
  hasGrounds: boolean;
  violations: Violation[];
  actions: string[];
  successRate: number;
  reasoning: string;
}

interface ViolationCheckerProps {
  analysis: Analysis;
}

export function ViolationChecker({ analysis }: ViolationCheckerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Complaint Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Assessment */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
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

        {/* Violations */}
        {analysis.violations.length > 0 && (
          <div>
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

        {/* Recommended Actions */}
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

        {/* Reasoning */}
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

