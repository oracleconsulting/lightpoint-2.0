'use client';

import { useState } from 'react';
import { Download, FileText, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OutputGeneratorDialog } from './OutputGeneratorDialog';
import { DraftReviewer } from './DraftReviewer';

export function OutputsPanel({ caseId, outputs = [] }: { caseId: string; outputs?: any[] }) {
  const [open, setOpen] = useState(false);
  const exportOutput = trpc.caseOutput.export.useMutation({
    onSuccess: (result: any) => {
      if (result?.signedUrl) window.open(result.signedUrl, '_blank');
    },
  });

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-[#2B80FF]" />
          Outputs
        </CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Generate
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {outputs.length === 0 && (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No generated outputs yet.
          </p>
        )}
        {outputs.map((output) => (
          <div key={output.id} className="rounded-lg border bg-white p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">{output.title}</p>
                <p className="text-xs text-muted-foreground">{String(output.output_type).replace(/_/g, ' ')}</p>
              </div>
              <Badge variant={output.status === 'verified' ? 'default' : 'outline'}>{output.status}</Badge>
            </div>
            {output.content && (
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer font-medium">Preview</summary>
                <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap rounded bg-gray-50 p-3 text-xs">
                  {output.content}
                </p>
              </details>
            )}
            <div className="mt-3 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => exportOutput.mutate({ caseId, outputId: output.id })}
              >
                <Download className="mr-2 h-4 w-4" />
                Download Word
              </Button>
            </div>
            <div className="mt-3">
              <DraftReviewer review={output.metadata?.draft_review} />
            </div>
          </div>
        ))}
      </CardContent>
      <OutputGeneratorDialog caseId={caseId} open={open} onOpenChange={setOpen} />
    </Card>
  );
}
