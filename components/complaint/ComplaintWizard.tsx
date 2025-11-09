'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { DocumentUploader } from './DocumentUploader';
import { useRouter } from 'next/navigation';

interface ComplaintWizardProps {
  organizationId: string;
  userId: string;
}

export function ComplaintWizard({ organizationId, userId }: ComplaintWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    clientReference: '',
    hmrcDepartment: '',
    complaintType: '',
  });

  const createComplaint = trpc.complaints.create.useMutation({
    onSuccess: (data) => {
      router.push(`/complaints/${data.id}`);
    },
  });

  const handleSubmit = () => {
    createComplaint.mutate({
      organizationId,
      createdBy: userId,
      clientReference: formData.clientReference,
      hmrcDepartment: formData.hmrcDepartment,
      complaintType: formData.complaintType,
    });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">New Complaint</h1>
        <div className="text-sm text-muted-foreground">
          Step {step} of 2
        </div>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Complaint Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Client Reference</label>
              <Input
                placeholder="Anonymized client identifier"
                value={formData.clientReference}
                onChange={(e) =>
                  setFormData({ ...formData, clientReference: e.target.value })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use an anonymized reference (e.g., CLIENT-001)
              </p>
            </div>

            <div>
              <label className="text-sm font-medium">HMRC Department</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.hmrcDepartment}
                onChange={(e) =>
                  setFormData({ ...formData, hmrcDepartment: e.target.value })
                }
              >
                <option value="">Select department</option>
                <option value="VAT">VAT</option>
                <option value="Self Assessment">Self Assessment</option>
                <option value="PAYE">PAYE</option>
                <option value="Corporation Tax">Corporation Tax</option>
                <option value="CIS">CIS</option>
                <option value="Compliance">Compliance</option>
                <option value="Debt Management">Debt Management</option>
                <option value="Tax Credits">Tax Credits</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Complaint Type</label>
              <Input
                placeholder="e.g., Unreasonable delay, Poor communication"
                value={formData.complaintType}
                onChange={(e) =>
                  setFormData({ ...formData, complaintType: e.target.value })
                }
              />
            </div>

            <Button
              onClick={() => setStep(2)}
              disabled={!formData.clientReference || !formData.hmrcDepartment}
              className="w-full"
            >
              Continue to Document Upload
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Button variant="ghost" onClick={() => setStep(1)}>
            ← Back
          </Button>
          
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-4">
                Upload HMRC correspondence to begin analysis
              </p>
              <Button onClick={handleSubmit} className="w-full">
                Create Complaint
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

