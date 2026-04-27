'use client';

import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface StructuredOutputChipProps {
  output: any;
  onConfirm: (output: any) => void;
  onReject: () => void;
  disabled?: boolean;
}

function titleFor(output: any): string {
  switch (output.type) {
    case 'capture_decision':
      return `Decision: ${output.decisionText}`;
    case 'flag_anomaly':
      return `Anomaly: ${output.anomalyType}`;
    case 'propose_research':
      return `Research: ${output.query}`;
    case 'propose_workspace_update':
      return `Workspace update: ${output.action}`;
    case 'propose_draft':
      return `Draft: ${output.outputType}`;
    default:
      return output.type || 'Structured output';
  }
}

export function StructuredOutputChip({ output, onConfirm, onReject, disabled }: StructuredOutputChipProps) {
  return (
    <div className="rounded-lg border border-[#2B80FF]/20 bg-blue-50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="outline" className="bg-white text-[#2B80FF]">
            Proposed action
          </Badge>
          <p className="mt-2 text-sm font-medium text-gray-900">{titleFor(output)}</p>
          {output.reasoning && <p className="mt-1 text-xs text-gray-700">{output.reasoning}</p>}
          {output.description && <p className="mt-1 text-xs text-gray-700">{output.description}</p>}
          {output.outline && <p className="mt-1 text-xs text-gray-700">{output.outline}</p>}
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={() => onConfirm(output)} disabled={disabled}>
            <Check className="mr-1 h-3 w-3" />
            Confirm
          </Button>
          <Button size="sm" variant="outline" onClick={onReject} disabled={disabled}>
            <X className="mr-1 h-3 w-3" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
