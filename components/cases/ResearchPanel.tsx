'use client';

import { BookOpen, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VerificationBadge } from '@/components/citations/VerificationBadge';

interface ResearchPanelProps {
  caseId: string;
  research?: any[];
}

export function ResearchPanel({ caseId, research = [] }: ResearchPanelProps) {
  const utils = trpc.useUtils();
  const recheckCase = trpc.verification.recheckCase.useMutation({
    onSuccess: () => utils.case.get.invalidate(caseId),
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#D4A84B]" />
          Research Bank
        </CardTitle>
        <Button size="sm" variant="outline" onClick={() => recheckCase.mutate(caseId)} disabled={recheckCase.isPending}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Re-verify
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {research.length === 0 && (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            Research capture and citation verification come in later phases.
          </p>
        )}
        {research.map((item) => (
          <div key={item.id} className="rounded-lg border bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-semibold text-gray-900">{item.title}</p>
              <VerificationBadge status={item.verification_status} />
            </div>
            {item.proposition && <p className="mt-2 text-sm text-gray-700">{item.proposition}</p>}
            {item.citation && <p className="mt-2 text-xs text-muted-foreground">{item.citation}</p>}
            {item.source_url && (
              <a className="mt-1 block text-xs text-[#2B80FF] underline" href={item.source_url} target="_blank">
                BAILII source
              </a>
            )}
            {item.verification_notes && <p className="mt-2 text-xs text-muted-foreground">{item.verification_notes}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
