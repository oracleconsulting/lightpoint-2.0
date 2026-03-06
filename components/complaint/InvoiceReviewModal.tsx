'use client';

import { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/lib/trpc/Provider';
import {
  ACTIVITY_TYPES,
  isBillableActivity,
  calculateBillableValue,
  formatCurrency,
  formatTimeHHMM,
  TIME_BENCHMARKS,
} from '@/lib/timeCalculations';
import { getPracticeLetterhead } from '@/lib/practiceSettings';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import { AlertTriangle, Download, FileText, ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react';

const NAVY = '#1e3a5f';
const GOLD = '#d4a84b';

const ACTIVITY_TYPES_LIST = Object.entries(ACTIVITY_TYPES).map(([_, label]) => ({ value: label, label }));

type Step = 1 | 2 | 3;

interface InvoiceReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  complaintId: string;
  complaintReference: string;
  chargeOutRate?: number;
  onClosed?: () => void;
}

interface TimeEntryRow {
  id: string;
  date: string;
  activity_type: string;
  description: string;
  minutes: number;
  rate: number;
}

export function InvoiceReviewModal({
  open,
  onOpenChange,
  complaintId,
  complaintReference,
  chargeOutRate = 250,
  onClosed,
}: InvoiceReviewModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editMinutes, setEditMinutes] = useState<string>('');
  const [showAddRow, setShowAddRow] = useState(false);
  const [newActivityType, setNewActivityType] = useState(ACTIVITY_TYPES.INITIAL_ANALYSIS);
  const [newDescription, setNewDescription] = useState('');
  const [newMinutes, setNewMinutes] = useState(12);

  const [clientName, setClientName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [matterDescription, setMatterDescription] = useState(`HMRC Complaint – ${complaintReference}`);
  const [paymentTerms, setPaymentTerms] = useState<string>('On receipt');
  const [includeReimbursementNote, setIncludeReimbursementNote] = useState(false);

  const utils = trpc.useUtils();
  const { data: timeData } = trpc.time.getComplaintTime.useQuery(complaintId, { enabled: open });
  const updateEntry = trpc.time.updateEntry.useMutation({ onSuccess: () => utils.time.getComplaintTime.invalidate(complaintId) });
  const deleteEntry = trpc.time.deleteEntry.useMutation({ onSuccess: () => utils.time.getComplaintTime.invalidate(complaintId) });
  const addEntry = trpc.time.addEntry.useMutation({ onSuccess: () => { utils.time.getComplaintTime.invalidate(complaintId); setShowAddRow(false); setNewDescription(''); setNewMinutes(12); } });
  const logActivity = trpc.time.logActivity.useMutation({ onSuccess: () => utils.time.getComplaintTime.invalidate(complaintId) });
  const updateStatus = trpc.complaints.updateStatus.useMutation({ onSuccess: () => { utils.complaints.getById.invalidate(complaintId); onClosed?.(); onOpenChange(false); } });

  const logs = (timeData?.logs as { id: string; created_at: string; activity_type: string; minutes_spent: number; notes?: string }[]) || [];
  const rows: TimeEntryRow[] = useMemo(() => logs.map((log) => ({
    id: log.id,
    date: log.created_at,
    activity_type: log.activity_type,
    description: log.notes || '',
    minutes: log.minutes_spent,
    rate: chargeOutRate,
  })), [logs, chargeOutRate]);

  const billableRows = useMemo(() => rows.filter((r) => isBillableActivity(r.activity_type)), [rows]);
  const nonBillableMinutes = useMemo(() => rows.filter((r) => !isBillableActivity(r.activity_type)).reduce((s, r) => s + r.minutes, 0), [rows]);
  const totalBillableMinutes = useMemo(() => billableRows.reduce((s, r) => s + r.minutes, 0), [billableRows]);
  const totalExVat = useMemo(() => billableRows.reduce((s, r) => s + calculateBillableValue(r.minutes, r.rate), 0), [billableRows]);
  const vat = totalExVat * 0.2;
  const totalIncVat = totalExVat + vat;

  const handleSaveEdit = async (id: string, minutes: number) => {
    await updateEntry.mutateAsync({ id, minutes });
    setEditingId(null);
    setEditMinutes('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Remove this time entry?')) deleteEntry.mutate(id);
  };

  const handleAddEntry = async () => {
    await addEntry.mutateAsync({
      complaintId,
      activityType: newActivityType,
      description: newDescription,
      minutes: newMinutes,
      rate: chargeOutRate,
    });
  };

  const handleDownloadWord = async () => {
    const letterhead = getPracticeLetterhead();
    const children: (Paragraph | Table)[] = [
      ...letterhead.split('\n').map((line) => new Paragraph({ children: [new TextRun({ text: line, font: 'Calibri', size: 22 })], spacing: { after: 80 } })),
      new Paragraph({ text: '', spacing: { after: 200 } }),
      new Paragraph({ children: [new TextRun({ text: 'INVOICE', bold: true, font: 'Calibri', size: 32 })], spacing: { after: 400 } }),
      new Paragraph({ children: [new TextRun({ text: `Invoice number: ${invoiceNumber || 'TBC'}`, font: 'Calibri', size: 24 })], spacing: { after: 120 } }),
      new Paragraph({ children: [new TextRun({ text: `Date: ${invoiceDate}`, font: 'Calibri', size: 24 })], spacing: { after: 120 } }),
      new Paragraph({ children: [new TextRun({ text: `Client: ${clientName || 'Client'}`, font: 'Calibri', size: 24 })], spacing: { after: 200 } }),
      new Paragraph({ children: [new TextRun({ text: `Matter: ${matterDescription}`, font: 'Calibri', size: 24 })], spacing: { after: 400 } }),
    ];

    const tableRows = [
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Date', bold: true })], alignment: AlignmentType.LEFT })], width: { size: 15, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Description', bold: true })], alignment: AlignmentType.LEFT })], width: { size: 40, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Hours', bold: true })], alignment: AlignmentType.RIGHT })], width: { size: 15, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Rate', bold: true })], alignment: AlignmentType.RIGHT })], width: { size: 15, type: WidthType.PERCENTAGE } }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Amount', bold: true })], alignment: AlignmentType.RIGHT })], width: { size: 15, type: WidthType.PERCENTAGE } }),
        ],
      }),
      ...billableRows.map(
        (r) =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph({ text: new Date(r.date).toLocaleDateString('en-GB') })], width: { size: 15, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ text: r.activity_type + (r.description ? ` – ${r.description}` : '') })], width: { size: 40, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ text: (r.minutes / 60).toFixed(2), alignment: AlignmentType.RIGHT })], width: { size: 15, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ text: `£${r.rate}`, alignment: AlignmentType.RIGHT })], width: { size: 15, type: WidthType.PERCENTAGE } }),
              new TableCell({ children: [new Paragraph({ text: formatCurrency(calculateBillableValue(r.minutes, r.rate)), alignment: AlignmentType.RIGHT })], width: { size: 15, type: WidthType.PERCENTAGE } }),
            ],
          })
      ),
    ];
    const table = new Table({ rows: tableRows, width: { size: 100, type: WidthType.PERCENTAGE } });
    children.push(new Paragraph({ text: '', spacing: { after: 120 } }), table);
    children.push(
      new Paragraph({ children: [new TextRun({ text: `Subtotal (ex VAT): ${formatCurrency(totalExVat)}`, font: 'Calibri', size: 24 })], alignment: AlignmentType.RIGHT, spacing: { after: 80 } }),
      new Paragraph({ children: [new TextRun({ text: `VAT (20%): ${formatCurrency(vat)}`, font: 'Calibri', size: 24 })], alignment: AlignmentType.RIGHT, spacing: { after: 80 } }),
      new Paragraph({ children: [new TextRun({ text: `Total: ${formatCurrency(totalIncVat)}`, bold: true, font: 'Calibri', size: 26 })], alignment: AlignmentType.RIGHT, spacing: { after: 200 } }),
      new Paragraph({ children: [new TextRun({ text: `Payment terms: ${paymentTerms}`, font: 'Calibri', size: 24 })], spacing: { after: 400 } })
    );
    if (includeReimbursementNote) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'You should pay this invoice in the first instance. HMRC has agreed to reimburse our fees in this matter. Once paid, please submit the receipted invoice and proof of payment to HMRC to claim reimbursement.',
              font: 'Calibri',
              size: 22,
              italics: true,
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }
    const doc = new Document({ sections: [{ properties: {}, children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Invoice_${complaintReference}_${invoiceDate}.docx`);
  };

  const handleDownloadCsv = () => {
    const headers = 'date,activity_type,description,minutes,hours,rate,value_ex_vat';
    const lines = rows.map(
      (r) =>
        `${new Date(r.date).toISOString().split('T')[0]},"${r.activity_type}","${(r.description || '').replace(/"/g, '""')}",${r.minutes},${(r.minutes / 60).toFixed(2)},${r.rate},${calculateBillableValue(r.minutes, r.rate).toFixed(2)}`
    );
    const csv = [headers, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `TimeLog_${complaintReference}.csv`);
  };

  const hasFileClosing = useMemo(() => rows.some((r) => r.activity_type === ACTIVITY_TYPES.FILE_CLOSING), [rows]);
  const handleConfirmAndClose = async () => {
    if (!hasFileClosing) {
      await logActivity.mutateAsync({
        complaintId,
        activity: ACTIVITY_TYPES.FILE_CLOSING,
        duration: TIME_BENCHMARKS.FILE_CLOSING,
        rate: chargeOutRate,
        automated: true,
      });
    }
    updateStatus.mutate({ id: complaintId, status: 'resolved' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" style={{ borderTop: `4px solid ${GOLD}` }}>
        <DialogHeader>
          <DialogTitle className="text-xl" style={{ color: NAVY }}>
            Close & Invoice
          </DialogTitle>
          <DialogDescription>
            Review time, set invoice details, and export. Then confirm to mark the complaint as resolved.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 border-b border-slate-200 pb-4 mb-4">
          {([1, 2, 3] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded font-medium ${step === s ? 'text-white' : 'text-slate-600'}`}
              style={{ backgroundColor: step === s ? NAVY : undefined }}
            >
              {s === 1 && 'Time Review'}
              {s === 2 && 'Invoice Details'}
              {s === 3 && 'Export'}
              {step === s && <ChevronRight className="h-4 w-4" />}
            </button>
          ))}
        </div>

        {step === 1 && (
          <div className="space-y-4">
            {nonBillableMinutes > 0 && (
              <div className="p-3 rounded-lg flex items-start gap-2" style={{ backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}>
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  {nonBillableMinutes} minutes of HMRC response review have been excluded from the billable total.
                </p>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b" style={{ borderColor: GOLD }}>
                    <th className="text-left py-2 font-semibold" style={{ color: NAVY }}>Date</th>
                    <th className="text-left py-2 font-semibold" style={{ color: NAVY }}>Activity Type</th>
                    <th className="text-left py-2 font-semibold" style={{ color: NAVY }}>Description</th>
                    <th className="text-right py-2 font-semibold" style={{ color: NAVY }}>Duration</th>
                    <th className="text-right py-2 font-semibold" style={{ color: NAVY }}>Rate</th>
                    <th className="text-right py-2 font-semibold" style={{ color: NAVY }}>Value</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100">
                      <td className="py-2">{new Date(r.date).toLocaleDateString('en-GB')}</td>
                      <td className="py-2">{r.activity_type}</td>
                      <td className="py-2">{r.description || '—'}</td>
                      <td className="py-2 text-right">
                        {editingId === r.id ? (
                          <Input
                            type="number"
                            value={editMinutes}
                            onChange={(e) => setEditMinutes(e.target.value)}
                            onBlur={() => handleSaveEdit(r.id, parseInt(editMinutes, 10) || r.minutes)}
                            className="w-20 h-8 text-right"
                            autoFocus
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => { setEditingId(r.id); setEditMinutes(String(r.minutes)); }}
                            className="underline text-right w-full"
                          >
                            {formatTimeHHMM(r.minutes)}
                          </button>
                        )}
                      </td>
                      <td className="py-2 text-right">£{r.rate}</td>
                      <td className="py-2 text-right">{formatCurrency(isBillableActivity(r.activity_type) ? calculateBillableValue(r.minutes, r.rate) : 0)}</td>
                      <td className="py-2">
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDelete(r.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {showAddRow && (
                    <tr className="bg-slate-50">
                      <td className="py-2">{new Date().toLocaleDateString('en-GB')}</td>
                      <td className="py-2">
                        <Select value={newActivityType} onValueChange={setNewActivityType}>
                          <SelectTrigger className="h-8 w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ACTIVITY_TYPES_LIST.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="py-2">
                        <Input
                          placeholder="Description"
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          className="h-8"
                        />
                      </td>
                      <td className="py-2">
                        <Input
                          type="number"
                          value={newMinutes}
                          onChange={(e) => setNewMinutes(parseInt(e.target.value, 10) || 0)}
                          className="h-8 w-20"
                        />
                      </td>
                      <td className="py-2">£{chargeOutRate}</td>
                      <td className="py-2" />
                      <td className="py-2">
                        <Button size="sm" onClick={handleAddEntry} disabled={addEntry.isPending}>Add</Button>
                        <Button size="sm" variant="ghost" className="ml-1" onClick={() => setShowAddRow(false)}>Cancel</Button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowAddRow(true)} className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Activity
            </Button>
            <div className="mt-6 p-4 rounded-lg border-2" style={{ borderColor: GOLD, backgroundColor: `${NAVY}08` }}>
              <div className="flex justify-between text-sm font-medium">
                <span>Total Time</span>
                <span>{formatTimeHHMM(totalBillableMinutes)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium mt-1">
                <span>Total Value (ex VAT)</span>
                <span>{formatCurrency(totalExVat)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium mt-1">
                <span>VAT (20%)</span>
                <span>{formatCurrency(vat)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold mt-2 pt-2 border-t" style={{ borderColor: GOLD }}>
                <span>Total inc VAT</span>
                <span>{formatCurrency(totalIncVat)}</span>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="grid gap-4">
            <div>
              <Label>Client name</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" className="mt-1" />
            </div>
            <div>
              <Label>Invoice date</Label>
              <Input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Invoice number</Label>
              <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Your invoice number" className="mt-1" />
            </div>
            <div>
              <Label>Matter description</Label>
              <Input value={matterDescription} onChange={(e) => setMatterDescription(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>Payment terms</Label>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="On receipt">On receipt</SelectItem>
                  <SelectItem value="14 days">14 days</SelectItem>
                  <SelectItem value="30 days">30 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox id="reimb" checked={includeReimbursementNote} onCheckedChange={(c) => setIncludeReimbursementNote(!!c)} />
              <Label htmlFor="reimb">Include HMRC reimbursement instructions on invoice</Label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="flex gap-4">
              <Button onClick={handleDownloadWord} style={{ backgroundColor: NAVY }} className="text-white">
                <Download className="h-4 w-4 mr-2" />
                Download Invoice (Word)
              </Button>
              <Button variant="outline" onClick={handleDownloadCsv} style={{ borderColor: GOLD, color: NAVY }}>
                <FileText className="h-4 w-4 mr-2" />
                Download Time Log (CSV)
              </Button>
            </div>
            <div className="pt-4 border-t">
              <Button onClick={handleConfirmAndClose} disabled={updateStatus.isPending} style={{ backgroundColor: GOLD }} className="text-white">
                {updateStatus.isPending ? 'Closing...' : 'Confirm & Close Complaint'}
              </Button>
              <p className="text-xs text-slate-500 mt-2">
                Marks the complaint as resolved and logs file closing time if not already present.
              </p>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-slate-200 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {step < 3 ? (
            <Button onClick={() => setStep((s) => (s + 1) as Step)} style={{ backgroundColor: NAVY }} className="text-white">
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => setStep(2)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
