'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewCasePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    caseReference: `CASE-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
    title: '',
    clientName: '',
    hmrcReference: '',
    hmrcDepartment: '',
    tier: '3',
    priority: 'normal',
    summary: '',
  });

  const createCase = trpc.case.create.useMutation({
    onSuccess: (caseRecord) => router.push(`/cases/${caseRecord.id}`),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCase.mutate({
      caseReference: form.caseReference,
      title: form.title,
      clientName: form.clientName || undefined,
      hmrcReference: form.hmrcReference || undefined,
      hmrcDepartment: form.hmrcDepartment || undefined,
      tier: Number(form.tier) as 1 | 2 | 3,
      priority: form.priority as any,
      summary: form.summary || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Link href="/cases" className="inline-flex items-center text-sm text-muted-foreground hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to cases
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">Create Case Workspace</h1>
          <p className="text-sm text-muted-foreground">Set up a Tier 3 workspace for a complex HMRC dispute.</p>
        </div>
      </header>

      <main className="container mx-auto max-w-3xl px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Case metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Case reference</label>
                  <Input
                    value={form.caseReference}
                    onChange={(e) => setForm({ ...form, caseReference: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Client name</label>
                  <Input
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Sch 36 compliance dispute and complaint strategy"
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">HMRC reference</label>
                  <Input
                    value={form.hmrcReference}
                    onChange={(e) => setForm({ ...form, hmrcReference: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">HMRC department/team</label>
                  <Input
                    value={form.hmrcDepartment}
                    onChange={(e) => setForm({ ...form, hmrcDepartment: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Tier</label>
                  <Select value={form.tier} onValueChange={(value) => setForm({ ...form, tier: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Tier 1</SelectItem>
                      <SelectItem value="2">Tier 2</SelectItem>
                      <SelectItem value="3">Tier 3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Opening summary</label>
                <Textarea
                  value={form.summary}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  placeholder="Short working summary of the procedural posture and current problem."
                />
              </div>
              {createCase.error && <p className="text-sm text-red-600">{createCase.error.message}</p>}
              <Button
                type="submit"
                disabled={createCase.isPending || !form.caseReference.trim() || !form.title.trim()}
                className="bg-[#2B80FF] hover:bg-[#1f6edc]"
              >
                {createCase.isPending ? 'Creating...' : 'Create case'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
