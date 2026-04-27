'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/lib/trpc/Provider';

interface OutputGeneratorDialogProps {
  caseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OutputGeneratorDialog({ caseId, open, onOpenChange }: OutputGeneratorDialogProps) {
  const utils = trpc.useUtils();
  const [outputType, setOutputType] = useState('compliance_covering_letter');
  const [instructions, setInstructions] = useState('');
  const generate = trpc.caseOutput.generate.useMutation({
    onSuccess: () => {
      utils.case.get.invalidate(caseId);
      onOpenChange(false);
      setInstructions('');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Generate case output</DialogTitle>
          <DialogDescription>
            Outputs are blocked if any citation cannot be verified before save/export.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 p-6 pt-0">
          <Select value={outputType} onValueChange={setOutputType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="compliance_covering_letter">Compliance covering letter</SelectItem>
              <SelectItem value="complaint_letter">Complaint letter</SelectItem>
              <SelectItem value="appeal_grounds">Appeal grounds</SelectItem>
              <SelectItem value="closure_application">Closure application</SelectItem>
              <SelectItem value="tribunal_filing">Tribunal filing</SelectItem>
            </SelectContent>
          </Select>
          <Textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Scope, emphasis, included research, or points to avoid..."
            rows={5}
          />
          {generate.error && <p className="text-sm text-red-600">{generate.error.message}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              onClick={() => generate.mutate({ caseId, outputType: outputType as any, instructions })}
              disabled={generate.isPending}
            >
              {generate.isPending ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
