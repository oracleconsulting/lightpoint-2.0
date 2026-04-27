'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VerificationBadge } from '@/components/citations/VerificationBadge';

interface ExportBlockedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  citations: Array<{ citation: string; status: string; notes?: string }>;
  onVerifyNow?: () => void;
}

export function ExportBlockedDialog({ open, onOpenChange, citations, onVerifyNow }: ExportBlockedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Export blocked</DialogTitle>
          <DialogDescription>
            Client-facing outputs cannot be exported while citations are unverified.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 p-6 pt-0">
          {citations.map((item) => (
            <div key={item.citation} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">{item.citation}</span>
                <VerificationBadge status={item.status} />
              </div>
              {item.notes && <p className="mt-2 text-sm text-muted-foreground">{item.notes}</p>}
            </div>
          ))}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            {onVerifyNow && <Button onClick={onVerifyNow}>Verify now</Button>}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
