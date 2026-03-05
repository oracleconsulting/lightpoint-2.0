'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { trpc } from '@/lib/trpc/Provider';
import {
  ACTIVITY_TYPES,
  TIME_BENCHMARKS,
  calculateBillableValue,
  formatCurrency,
  formatTimeHHMM,
} from '@/lib/timeCalculations';
import { CheckCircle, Loader2, FileText, FolderArchive } from 'lucide-react';

interface UpheldClosureChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId: string;
  chargeOutRate?: number;
  onAllConfirmed: () => void | Promise<void>;
}

const ITEM_1_ACTIVITY = ACTIVITY_TYPES.UPHELD_RESPONSE_LETTER;
const ITEM_2_ACTIVITY = ACTIVITY_TYPES.CLIENT_OUTCOME_CALL;
const ITEM_2_MINUTES = TIME_BENCHMARKS.CLIENT_OUTCOME_CALL;
const ITEM_3_ACTIVITY = ACTIVITY_TYPES.INVOICE_PREPARATION;
const ITEM_3_MINUTES = TIME_BENCHMARKS.INVOICE_PREPARATION;
const ITEM_4_ACTIVITY = ACTIVITY_TYPES.HMRC_REIMBURSEMENT_PACK;
const ITEM_4_MINUTES = TIME_BENCHMARKS.HMRC_REIMBURSEMENT_PACK;
const ITEM_5_ACTIVITY = ACTIVITY_TYPES.FILE_CLOSING;
const ITEM_5_MINUTES = TIME_BENCHMARKS.FILE_CLOSING;

export function UpheldClosureChecklistModal({
  open,
  onOpenChange,
  complaintId,
  chargeOutRate = 250,
  onAllConfirmed,
}: UpheldClosureChecklistModalProps) {
  const [clientCallDone, setClientCallDone] = useState(false);
  const [invoiceDone, setInvoiceDone] = useState(false);
  const [reimbursementPackDone, setReimbursementPackDone] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const utils = trpc.useUtils();
  const { data: timeData } = trpc.time.getComplaintTime.useQuery(complaintId, { enabled: open });
  const logActivity = trpc.time.logActivity.useMutation({
    onSuccess: () => {
      utils.time.getComplaintTime.invalidate(complaintId);
    },
  });

  const logs = (timeData?.logs as { activity_type: string; minutes_spent: number }[]) || [];
  const hasUpheldLetter = logs.some((l) => l.activity_type === ITEM_1_ACTIVITY);
  const hasClientCall = logs.some((l) => l.activity_type === ITEM_2_ACTIVITY);
  const hasInvoice = logs.some((l) => l.activity_type === ITEM_3_ACTIVITY);
  const hasReimbursementPack = logs.some((l) => l.activity_type === ITEM_4_ACTIVITY);

  const item2Done = hasClientCall || clientCallDone;
  const item3Done = hasInvoice || invoiceDone;
  const item4Done = hasReimbursementPack || reimbursementPackDone;

  const totalMinutes = useMemo(() => {
    let m = 0;
    if (hasUpheldLetter) m += TIME_BENCHMARKS.UPHELD_RESPONSE_LETTER;
    if (item2Done) m += ITEM_2_MINUTES;
    if (item3Done) m += ITEM_3_MINUTES;
    if (item4Done) m += ITEM_4_MINUTES;
    m += ITEM_5_MINUTES; // file closing (logged on confirm)
    return m;
  }, [hasUpheldLetter, item2Done, item3Done, item4Done]);

  const totalValue = calculateBillableValue(totalMinutes, chargeOutRate);
  const canConfirm =
    hasUpheldLetter && item2Done && item3Done && item4Done;

  const handleCheck = async (
    item: 2 | 3 | 4,
    checked: boolean,
    activity: string,
    minutes: number
  ) => {
    if (item === 2) setClientCallDone(checked);
    if (item === 3) setInvoiceDone(checked);
    if (item === 4) setReimbursementPackDone(checked);
    if (checked) {
      await logActivity.mutateAsync({
        complaintId,
        activity,
        duration: minutes,
        rate: chargeOutRate,
        automated: false,
      });
    }
  };

  const handleConfirmClosure = async () => {
    if (!canConfirm) return;
    setConfirming(true);
    try {
      await logActivity.mutateAsync({
        complaintId,
        activity: ITEM_5_ACTIVITY,
        duration: ITEM_5_MINUTES,
        rate: chargeOutRate,
        automated: true,
      });
      await onAllConfirmed();
      onOpenChange(false);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Upheld complaint — closure checklist
          </DialogTitle>
          <DialogDescription>
            Confirm these items before closing. Time and value below will be logged for billing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 1. Upheld response letter — from logs or generate first */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
            {hasUpheldLetter ? (
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            ) : (
              <FileText className="h-5 w-5 text-amber-600 flex-shrink-0" />
            )}
            <div className="flex-1">
              <Label className="font-medium">1. Upheld response letter sent to HMRC</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hasUpheldLetter
                  ? 'Logged on letter generation'
                  : 'Generate the upheld response letter first, then return here.'}
              </p>
            </div>
          </div>

          {/* 2. Client outcome call — checkbox */}
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <Checkbox
              id="item2"
              checked={item2Done}
              onCheckedChange={(c) => handleCheck(2, !!c, ITEM_2_ACTIVITY, ITEM_2_MINUTES)}
              disabled={item2Done || logActivity.isPending}
            />
            <div className="flex-1">
              <Label htmlFor="item2" className="font-medium cursor-pointer">
                2. Client outcome call completed
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Logs {formatTimeHHMM(ITEM_2_MINUTES)} ({formatCurrency(calculateBillableValue(ITEM_2_MINUTES, chargeOutRate))})
              </p>
            </div>
          </div>

          {/* 3. Invoice issued — checkbox */}
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <Checkbox
              id="item3"
              checked={item3Done}
              onCheckedChange={(c) => handleCheck(3, !!c, ITEM_3_ACTIVITY, ITEM_3_MINUTES)}
              disabled={item3Done || logActivity.isPending}
            />
            <div className="flex-1">
              <Label htmlFor="item3" className="font-medium cursor-pointer">
                3. Invoice issued to client
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Logs {formatTimeHHMM(ITEM_3_MINUTES)} ({formatCurrency(calculateBillableValue(ITEM_3_MINUTES, chargeOutRate))})
              </p>
            </div>
          </div>

          {/* 4. HMRC reimbursement pack — checkbox */}
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <Checkbox
              id="item4"
              checked={item4Done}
              onCheckedChange={(c) => handleCheck(4, !!c, ITEM_4_ACTIVITY, ITEM_4_MINUTES)}
              disabled={item4Done || logActivity.isPending}
            />
            <div className="flex-1">
              <Label htmlFor="item4" className="font-medium cursor-pointer">
                4. HMRC reimbursement pack prepared
              </Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Logs {formatTimeHHMM(ITEM_4_MINUTES)} ({formatCurrency(calculateBillableValue(ITEM_4_MINUTES, chargeOutRate))})
              </p>
            </div>
          </div>

          {/* 5. File closed — auto on confirm */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
            <FolderArchive className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1">
              <Label className="font-medium">5. File closed</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Will be logged when you confirm closure ({formatTimeHHMM(ITEM_5_MINUTES)})
              </p>
            </div>
          </div>

          {/* Running total */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex justify-between items-center">
              <span className="font-medium">Total time</span>
              <span>{formatTimeHHMM(totalMinutes)}</span>
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="font-medium">Total value</span>
              <span className="text-lg font-semibold">{formatCurrency(totalValue)}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={confirming}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmClosure}
            disabled={!canConfirm || confirming || logActivity.isPending}
          >
            {confirming ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Closing...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm closure
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
