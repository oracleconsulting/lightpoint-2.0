'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Play, 
  CheckCircle, 
  Clock, 
  Calendar,
  Building2,
  Mail,
  User,
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

export default function PilotsPage() {
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  
  const { data: pilots, isLoading, error, refetch } = trpc.pilot.listPilots.useQuery();
  const utils = trpc.useUtils();
  
  const activateMutation = trpc.pilot.activatePilot.useMutation({
    onSuccess: () => {
      utils.pilot.listPilots.invalidate();
      setActivatingId(null);
    },
    onError: (error) => {
      alert(`Failed to activate: ${error.message}`);
      setActivatingId(null);
    },
  });

  const completeMutation = trpc.pilot.completePilot.useMutation({
    onSuccess: () => {
      utils.pilot.listPilots.invalidate();
    },
  });

  const handleActivate = (orgId: string) => {
    setActivatingId(orgId);
    activateMutation.mutate({
      organizationId: orgId,
      notes: notes[orgId] || undefined,
    });
  };

  const handleComplete = (orgId: string) => {
    if (confirm('Mark this pilot as complete? They will have full access.')) {
      completeMutation.mutate({ organizationId: orgId });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_call':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Call</Badge>;
      case 'call_scheduled':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Call Scheduled</Badge>;
      case 'pilot_active':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pilot Active</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="flex items-center gap-2 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading pilots...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              Error loading pilots: {error.message}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group by status
  const scheduled = pilots?.filter(p => p.pilot_status === 'call_scheduled') || [];
  const pending = pilots?.filter(p => p.pilot_status === 'pending_call') || [];
  const active = pilots?.filter(p => p.pilot_status === 'pilot_active') || [];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pilot Management</h1>
        <p className="text-gray-600">
          Manage pilot users and activate access during onboarding calls
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{scheduled.length}</p>
                <p className="text-sm text-gray-500">Calls Scheduled</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pending.length}</p>
                <p className="text-sm text-gray-500">Awaiting Booking</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{active.length}</p>
                <p className="text-sm text-gray-500">Active Pilots</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Calls - Priority */}
      {scheduled.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Ready for Activation ({scheduled.length})
          </h2>
          <div className="space-y-4">
            {scheduled.map((org) => (
              <Card key={org.id} className="border-blue-200 bg-gradient-to-r from-blue-50 to-white">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{org.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                          {org.primaryContact && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {org.primaryContact}
                            </span>
                          )}
                          {org.primaryEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {org.primaryEmail}
                            </span>
                          )}
                        </div>
                        {org.pilot_call_scheduled_at && (
                          <p className="text-xs text-blue-600 mt-1">
                            Scheduled: {new Date(org.pilot_call_scheduled_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Input
                        placeholder="Add notes (optional)"
                        className="w-48"
                        value={notes[org.id] || ''}
                        onChange={(e) => setNotes({ ...notes, [org.id]: e.target.value })}
                      />
                      <Button
                        onClick={() => handleActivate(org.id)}
                        disabled={activatingId === org.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {activatingId === org.id ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Activating...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Activate Pilot
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Active Pilots */}
      {active.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-600" />
            Active Pilots ({active.length})
          </h2>
          <div className="space-y-3">
            {active.map((org) => (
              <Card key={org.id} className="border-green-200">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{org.name}</h3>
                        <p className="text-sm text-gray-500">
                          Activated: {org.pilot_activated_at 
                            ? new Date(org.pilot_activated_at).toLocaleDateString()
                            : 'Unknown'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(org.pilot_status)}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleComplete(org.id)}
                      >
                        Mark Complete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pending Booking */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Awaiting Call Booking ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((org) => (
              <Card key={org.id} className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{org.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {org.primaryEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {org.primaryEmail}
                            </span>
                          )}
                          <span>
                            Invited: {new Date(org.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(org.pilot_status)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {(!pilots || pilots.length === 0) && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Pilots</h3>
            <p className="text-gray-500 mb-4">
              Invite organizations to start their pilot journey
            </p>
            <Link href="/admin/invites">
              <Button>Send Invites</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

