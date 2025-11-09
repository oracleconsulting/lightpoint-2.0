'use client';

import { ComplaintWizard } from '@/components/complaint/ComplaintWizard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

// Mock data - replace with actual auth
const MOCK_ORGANIZATION_ID = 'org-1';
const MOCK_USER_ID = 'user-1';

export default function NewComplaintPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <ComplaintWizard 
          organizationId={MOCK_ORGANIZATION_ID}
          userId={MOCK_USER_ID}
        />
      </main>
    </div>
  );
}

