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

  return (
    <div className="space-y-6">
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
