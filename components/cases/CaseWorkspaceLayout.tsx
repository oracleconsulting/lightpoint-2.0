'use client';

import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { AnomalyBanner } from './AnomalyBanner';
import { TimelinePanel } from './TimelinePanel';
import { PartiesPanel } from './PartiesPanel';
import { DocumentsPanel } from './DocumentsPanel';
import { DecisionLogPanel } from './DecisionLogPanel';
import { ConversationPanel } from './ConversationPanel';
import { ResearchPanel } from './ResearchPanel';
import { OutputsPanel } from './OutputsPanel';

interface CaseWorkspaceLayoutProps {
  workspace: any;
}

export function CaseWorkspaceLayout({ workspace }: CaseWorkspaceLayoutProps) {
  const caseRecord = workspace?.case;
  const utils = trpc.useUtils();
  const [syncResult, setSyncResult] = useState<any>(null);
  const syncComplaint = trpc.case.syncFromLinkedComplaint.useMutation({
    onSuccess: async (result) => {
      setSyncResult(result);
      await utils.case.get.invalidate(caseRecord.id);
    },
  });
  const hasLinkedComplaint = Boolean(caseRecord?.metadata?.imported_from_complaint_id);

  return (
    <div className="space-y-6">
      {hasLinkedComplaint && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => syncComplaint.mutate({ caseId: caseRecord.id })}
            disabled={syncComplaint.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncComplaint.isPending ? 'animate-spin' : ''}`} />
            {syncComplaint.isPending ? 'Syncing complaint context...' : 'Sync from linked complaint'}
          </Button>
        </div>
      )}
      {syncComplaint.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {syncComplaint.error.message}
        </p>
      )}
      {syncResult?.sync && (
        <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          Sync complete: {syncResult.sync.eventsImported} timeline events, {syncResult.sync.documentsImported} documents/context records, {syncResult.sync.outputsImported} outputs imported.
        </p>
      )}
      <AnomalyBanner anomalies={workspace?.anomalies || []} />
      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <TimelinePanel caseId={caseRecord.id} events={workspace?.events || []} />
          <PartiesPanel caseId={caseRecord.id} parties={workspace?.parties || []} />
        </div>
        <div className="space-y-6">
          <ConversationPanel caseId={caseRecord.id} />
          <DecisionLogPanel caseId={caseRecord.id} decisions={workspace?.decisions || []} />
          <OutputsPanel caseId={caseRecord.id} outputs={workspace?.outputs || []} />
        </div>
        <div className="space-y-6">
          <DocumentsPanel caseId={caseRecord.id} documents={workspace?.documents || []} />
          <ResearchPanel caseId={caseRecord.id} research={workspace?.research || []} />
        </div>
      </div>
    </div>
  );
}
