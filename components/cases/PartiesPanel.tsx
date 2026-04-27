'use client';

import { useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PartiesPanelProps {
  caseId: string;
  parties?: any[];
}

export function PartiesPanel({ caseId, parties = [] }: PartiesPanelProps) {
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    role: 'client',
    organisation: '',
    email: '',
    phone: '',
    notes: '',
  });

  const createParty = trpc.caseParty.create.useMutation({
    onSuccess: () => {
      utils.case.get.invalidate(caseId);
      setShowForm(false);
      setForm({ name: '', role: 'client', organisation: '', email: '', phone: '', notes: '' });
    },
  });

  const deleteParty = trpc.caseParty.delete.useMutation({
    onSuccess: () => utils.case.get.invalidate(caseId),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createParty.mutate({ caseId, ...form });
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-[#2B80FF]" />
          Parties
        </CardTitle>
        <Button size="sm" onClick={() => setShowForm((value) => !value)}>
          <Plus className="mr-2 h-4 w-4" />
          Party
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border bg-blue-50/40 p-3">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
              required
            />
            <Select value={form.role} onValueChange={(value) => setForm({ ...form, role: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="agent">Agent</SelectItem>
                <SelectItem value="hmrc_officer">HMRC officer</SelectItem>
                <SelectItem value="hmrc_team">HMRC team</SelectItem>
                <SelectItem value="third_party">Third party</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Input
              value={form.organisation}
              onChange={(e) => setForm({ ...form, organisation: e.target.value })}
              placeholder="Organisation"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email"
              />
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone"
              />
            </div>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Notes"
            />
            <Button type="submit" disabled={createParty.isPending || !form.name.trim()}>
              Save party
            </Button>
          </form>
        )}

        <div className="space-y-3">
          {parties.length === 0 && (
            <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              No parties have been added yet.
            </p>
          )}
          {parties.map((party) => (
            <div key={party.id} className="rounded-lg border bg-white p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">{party.name}</div>
                  <div className="text-xs uppercase tracking-wide text-[#2B80FF]">
                    {String(party.role).replace(/_/g, ' ')}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteParty.mutate({ id: party.id, caseId })}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {party.organisation && <p className="mt-1 text-sm text-gray-700">{party.organisation}</p>}
              {(party.email || party.phone) && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {[party.email, party.phone].filter(Boolean).join(' · ')}
                </p>
              )}
              {party.notes && <p className="mt-2 text-sm text-gray-700">{party.notes}</p>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
