'use client';

import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent } from '@/components/ui/card';
import { CaseWorkspaceLayout } from '@/components/cases/CaseWorkspaceLayout';

export default function CaseWorkspacePage({ params }: { params: { id: string } }) {
  const { data: workspace, isLoading, error } = trpc.case.get.useQuery(params.id);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading case workspace...</p>;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-red-600">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!workspace?.case) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Case not found.</p>
        </CardContent>
      </Card>
    );
  }

  return <CaseWorkspaceLayout workspace={workspace} />;
}
