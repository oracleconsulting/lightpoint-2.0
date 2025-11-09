'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Clock, Banknote } from 'lucide-react';

interface Precedent {
  id: string;
  complaint_type: string;
  issue_category: string;
  outcome: string;
  resolution_time_days: number;
  compensation_amount: number;
  key_arguments: string[];
  effective_citations: string[];
  similarity: number;
}

interface PrecedentMatcherProps {
  precedents: Precedent[];
}

export function PrecedentMatcher({ precedents }: PrecedentMatcherProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Similar Precedent Cases</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {precedents.map((precedent) => (
            <div key={precedent.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{precedent.complaint_type}</p>
                  <p className="text-sm text-muted-foreground">
                    {precedent.issue_category}
                  </p>
                </div>
                <Badge variant="secondary">
                  {(precedent.similarity * 100).toFixed(0)}% match
                </Badge>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground">Outcome:</span>
                  <span className="font-medium">{precedent.outcome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">{precedent.resolution_time_days} days</span>
                </div>
                {precedent.compensation_amount > 0 && (
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-green-500" />
                    <span className="text-muted-foreground">Compensation:</span>
                    <span className="font-medium">£{precedent.compensation_amount}</span>
                  </div>
                )}
              </div>

              {precedent.key_arguments.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Key Arguments:</p>
                  <div className="flex flex-wrap gap-2">
                    {precedent.key_arguments.map((arg, index) => (
                      <Badge key={index} variant="outline">
                        {arg}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {precedent.effective_citations.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Effective Citations:</p>
                  <div className="flex flex-wrap gap-2">
                    {precedent.effective_citations.map((citation, index) => (
                      <Badge key={index} variant="secondary">
                        {citation}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          {precedents.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No similar precedents found
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

