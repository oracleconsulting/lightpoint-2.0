'use client';

import Link from 'next/link';
import { Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TierBadge } from '@/components/cases/TierBadge';

export default function CasesPage() {
  const [status, setStatus] = useState('all');
  const [tier, setTier] = useState('all');
  const utils = trpc.useUtils();
  const { data: cases = [], isLoading, error } = trpc.case.list.useQuery({
    status: status as any,
    tier: tier === 'all' ? 'all' : Number(tier) as any,
  });
  const deleteCase = trpc.case.delete.useMutation({
    onSuccess: () => utils.case.list.invalidate(),
    onError: (error) => alert(`Failed to delete case: ${error.message}`),
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Case Workspace</h1>
            <p className="text-sm text-muted-foreground">Complex HMRC disputes that need iterative strategy work.</p>
          </div>
          <Link href="/cases/new">
            <Button className="bg-[#2B80FF] hover:bg-[#1f6edc]">
              <Plus className="mr-2 h-4 w-4" />
              New Case
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto space-y-6 px-4 py-8">
        <Card>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Search className="h-4 w-4" />
              Filters
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On hold</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tier} onValueChange={setTier}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All tiers</SelectItem>
                <SelectItem value="1">Tier 1</SelectItem>
                <SelectItem value="2">Tier 2</SelectItem>
                <SelectItem value="3">Tier 3</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {isLoading && <p className="text-sm text-muted-foreground">Loading cases...</p>}
        {error && <p className="text-sm text-red-600">{error.message}</p>}

        <div className="grid gap-4">
          {!isLoading && cases.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-sm text-muted-foreground">No cases match the current filters.</p>
              </CardContent>
            </Card>
          )}
          {cases.map((caseRecord: any) => (
            <Link key={caseRecord.id} href={`/cases/${caseRecord.id}`}>
              <Card className="hover:border-[#2B80FF]/40">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{caseRecord.title}</CardTitle>
                      <p className="mt-1 text-sm text-muted-foreground">{caseRecord.case_reference}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <TierBadge tier={caseRecord.tier} />
                      <Badge variant={caseRecord.status === 'closed' ? 'secondary' : 'default'}>
                        {String(caseRecord.status).replace(/_/g, ' ')}
                      </Badge>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        disabled={deleteCase.isPending}
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          if (confirm(`Delete case "${caseRecord.title}"? This cannot be undone.`)) {
                            deleteCase.mutate(caseRecord.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 text-sm text-gray-700">
                    {caseRecord.summary || 'No summary has been recorded yet.'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {caseRecord.client_name && <span>Client: {caseRecord.client_name}</span>}
                    {caseRecord.hmrc_department && <span>HMRC: {caseRecord.hmrc_department}</span>}
                    {caseRecord.priority && <span>Priority: {caseRecord.priority}</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
