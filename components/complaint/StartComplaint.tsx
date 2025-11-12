'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/lib/trpc/Provider';

interface StartComplaintProps {
  complaintId: string;
  hasGeneratedLetter: boolean;
  onComplaintStarted: () => void;
}

export function StartComplaint({ 
  complaintId, 
  hasGeneratedLetter,
  onComplaintStarted 
}: StartComplaintProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  
  const updateStatus = trpc.complaints.updateStatus.useMutation({
    onSuccess: () => {
      onComplaintStarted();
    },
    onError: (error) => {
      alert(`Failed to start complaint: ${error.message}`);
    }
  });

  const saveLetter = trpc.letters.save.useMutation();
  const logTime = trpc.time.logActivity.useMutation();

  const handleStartComplaint = async () => {
    if (!hasGeneratedLetter) {
      alert('Please generate a complaint letter first');
      return;
    }

    // Update status to active
    await updateStatus.mutateAsync({
      id: complaintId,
      status: 'active',
    });

    // Log time for file opening (12 minutes)
    await logTime.mutateAsync({
      complaintId,
      activity: 'File Opening',
      duration: 12,
    });

    setShowConfirm(false);
  };

  if (!hasGeneratedLetter) {
    return (
      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <Alert className="bg-gray-50">
            <AlertCircle className="h-4 w-4 text-gray-600" />
            <AlertDescription className="text-sm text-gray-700">
              Generate and save a complaint letter before starting the complaint process.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Play className="h-5 w-5 text-green-600" />
          Ready to Start Complaint
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showConfirm ? (
          <>
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-900">
                <strong>Letter is ready to send to HMRC.</strong>
                <br />
                Starting the complaint will:
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>Lock the current letter to prevent accidental changes</li>
                  <li>Move complaint to "Active" status</li>
                  <li>Start the 28-day response timer</li>
                  <li>Enable response tracking and follow-up management</li>
                  <li>Log 12 minutes for file opening</li>
                </ul>
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => setShowConfirm(true)}
              className="w-full"
              size="lg"
            >
              <Play className="h-4 w-4 mr-2" />
              Start Complaint
            </Button>
          </>
        ) : (
          <>
            <Alert className="bg-yellow-50 border-yellow-200">
              <Lock className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-900">
                <strong>Confirm you're ready:</strong>
                <br />
                Have you printed, signed, and sent the letter to HMRC? 
                This action will lock the letter and start the complaint timeline.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button
                onClick={handleStartComplaint}
                disabled={updateStatus.isPending}
                className="flex-1"
                size="lg"
              >
                <Lock className="h-4 w-4 mr-2" />
                {updateStatus.isPending ? 'Starting...' : 'Confirm & Start'}
              </Button>
              <Button
                onClick={() => setShowConfirm(false)}
                variant="outline"
                className="flex-1"
                disabled={updateStatus.isPending}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

