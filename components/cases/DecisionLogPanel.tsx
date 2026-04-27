'use client';

import { useState } from 'react';
import { Brain, Plus } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface DecisionLogPanelProps {
  caseId: string;
  decisions?: any[];
}

export function DecisionLogPanel({ caseId, decisions = [] }: DecisionLogPanelProps) {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    decisionText: '',
    reasoning: '',
    alternativesConsidered: '',
  });

  const logDecision = trpc.caseDecision.log.useMutation({
    onSuccess: () => {
      utils.case.get.invalidate(caseId);
      setShowForm(false);
      setForm({ decisionText: '', reasoning: '', alternativesConsidered: '' });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    logDecision.mutate({ caseId, ...form });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-[#D4A84B]" />
          Decision Log
        </CardTitle>
        <Button size="sm" onClick={() => setShowForm((value) => !value)}>
          <Plus className="mr-2 h-4 w-4" />
          Decision
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border bg-amber-50/40 p-3">
            <Textarea
              value={form.decisionText}
              onChange={(e) => setForm({ ...form, decisionText: e.target.value })}
              placeholder="Decision taken"
              required
            />
            <Textarea
              value={form.reasoning}
              onChange={(e) => setForm({ ...form, reasoning: e.target.value })}
              placeholder="Reasoning"
            />
            <Textarea
              value={form.alternativesConsidered}
              onChange={(e) => setForm({ ...form, alternativesConsidered: e.target.value })}
              placeholder="Alternatives considered"
            />
            <Button type="submit" disabled={logDecision.isPending || !form.decisionText.trim()}>
              Save decision
            </Button>
          </form>
        )}

        <div className="space-y-3">
          {decisions.length === 0 && (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No decisions logged yet.
            </p>
          )}
          {decisions.map((decision) => (
            <div key={decision.id} className="rounded-lg border bg-white p-3">
              <p className="font-semibold text-gray-900">{decision.decision_text}</p>
              {decision.reasoning && (
                <p className="mt-2 text-sm text-gray-700">
                  <span className="font-medium">Reasoning:</span> {decision.reasoning}
                </p>
              )}
              {decision.alternatives_considered && (
                <p className="mt-2 text-sm text-gray-700">
                  <span className="font-medium">Alternatives:</span> {decision.alternatives_considered}
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
