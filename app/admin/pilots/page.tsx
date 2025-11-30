'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Sparkles,
  FileText,
  Eye,
  MessageSquare,
  X,
  Upload,
  Ticket,
  ChevronRight,
  Shield
} from 'lucide-react';
import Link from 'next/link';

export default function PilotsPage() {
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [viewingLetterId, setViewingLetterId] = useState<string | null>(null);
  
  const { data: pilots, isLoading, error } = trpc.pilot.listPilots.useQuery();
  const utils = trpc.useUtils();
  
  const { data: pilotDetails, isLoading: detailsLoading } = trpc.pilot.getPilotDetails.useQuery(
    { organizationId: selectedOrgId! },
    { enabled: !!selectedOrgId }
  );

  const { data: letterData, isLoading: letterLoading } = trpc.pilot.getSanitizedLetter.useQuery(
    { complaintId: viewingLetterId! },
    { enabled: !!viewingLetterId }
  );
  
  const activateMutation = trpc.pilot.activatePilot.useMutation({
    onSuccess: () => {
      utils.pilot.listPilots.invalidate();
      utils.pilot.getPilotDetails.invalidate();
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
      utils.pilot.getPilotDetails.invalidate();
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Pilot Management</h1>
        <p className="text-gray-600">
          Manage pilot users, activate access, and view activity (sanitized for privacy)
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
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

      {/* Scheduled Calls - Priority - These need activation */}
      {scheduled.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Ready for Activation ({scheduled.length})
          </h2>
          <div className="space-y-4">
            {scheduled.map((org) => (
              <Card key={org.id} className="border-blue-200 bg-gradient-to-r from-blue-50 to-white">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex items-center gap-4 cursor-pointer hover:opacity-80"
                      onClick={() => setSelectedOrgId(org.id)}
                    >
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Building2 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          {org.name}
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </h3>
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
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-green-600" />
            Active Pilots ({active.length})
          </h2>
          <div className="space-y-3">
            {active.map((org) => (
              <Card 
                key={org.id} 
                className="border-green-200 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedOrgId(org.id)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          {org.name}
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </h3>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleComplete(org.id);
                        }}
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
              <Card 
                key={org.id} 
                className="border-yellow-200 bg-yellow-50/50 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedOrgId(org.id)}
              >
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          {org.name}
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </h3>
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
            <Link href="/admin/customers">
              <Button>Manage Invites</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Pilot Details Modal */}
      <Dialog open={!!selectedOrgId} onOpenChange={() => setSelectedOrgId(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {pilotDetails?.organization.name || 'Pilot Details'}
            </DialogTitle>
            <DialogDescription>
              View pilot activity and sanitized letters (all client data is redacted)
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : pilotDetails ? (
            <Tabs defaultValue="overview" className="mt-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="letters">Letters ({pilotDetails.recentComplaints.filter(c => c.hasLetter).length})</TabsTrigger>
                <TabsTrigger value="tickets">Tickets ({pilotDetails.stats.ticketsCount})</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Status Card */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Pilot Status</p>
                        <div className="mt-1">{getStatusBadge(pilotDetails.organization.pilot_status)}</div>
                      </div>
                      {pilotDetails.organization.pilot_status === 'call_scheduled' && (
                        <Button
                          onClick={() => handleActivate(pilotDetails.organization.id)}
                          disabled={activatingId === pilotDetails.organization.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {activatingId === pilotDetails.organization.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4 mr-2" />
                          )}
                          Activate Pilot Now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <FileText className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                        <p className="text-2xl font-bold">{pilotDetails.stats.complaintsCount}</p>
                        <p className="text-xs text-gray-500">Complaints</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <Upload className="h-6 w-6 mx-auto text-green-600 mb-2" />
                        <p className="text-2xl font-bold">{pilotDetails.stats.documentsUploaded}</p>
                        <p className="text-xs text-gray-500">Documents</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <User className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                        <p className="text-2xl font-bold">{pilotDetails.stats.usersCount}</p>
                        <p className="text-xs text-gray-500">Users</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 pb-4">
                      <div className="text-center">
                        <Ticket className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                        <p className="text-2xl font-bold">{pilotDetails.stats.ticketsCount}</p>
                        <p className="text-xs text-gray-500">Tickets</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Users List */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {pilotDetails.users.map((user) => (
                        <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{user.full_name || 'Unnamed'}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">{user.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="letters" className="mt-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-900">Privacy Protected View</p>
                      <p className="text-sm text-amber-700">
                        All personal information (names, addresses, NINOs, phone numbers, etc.) 
                        is automatically redacted when viewing letters.
                      </p>
                    </div>
                  </div>
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {pilotDetails.recentComplaints.filter(c => c.hasLetter).length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No letters generated yet</p>
                      </div>
                    ) : (
                      pilotDetails.recentComplaints
                        .filter(c => c.hasLetter)
                        .map((complaint) => (
                          <Card key={complaint.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="py-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{complaint.clientReference}</p>
                                  <p className="text-sm text-gray-500">
                                    {new Date(complaint.createdAt).toLocaleDateString()} · Status: {complaint.status}
                                  </p>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setViewingLetterId(complaint.id)}
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Sanitized
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="tickets" className="mt-4">
                <div className="flex justify-end mb-4">
                  <Link href="/admin/tickets">
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      View All Tickets
                    </Button>
                  </Link>
                </div>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {pilotDetails.recentTickets.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No support tickets yet</p>
                      </div>
                    ) : (
                      pilotDetails.recentTickets.map((ticket: any) => (
                        <Card key={ticket.id}>
                          <CardContent className="py-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{ticket.subject}</p>
                                <p className="text-sm text-gray-500">
                                  {new Date(ticket.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{ticket.priority}</Badge>
                                <Badge 
                                  variant="outline"
                                  className={
                                    ticket.status === 'open' ? 'bg-red-50 text-red-700' :
                                    ticket.status === 'resolved' ? 'bg-green-50 text-green-700' :
                                    'bg-yellow-50 text-yellow-700'
                                  }
                                >
                                  {ticket.status}
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Sanitized Letter View Modal */}
      <Dialog open={!!viewingLetterId} onOpenChange={() => setViewingLetterId(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Sanitized Letter View
            </DialogTitle>
            <DialogDescription>
              All personal identifiable information has been automatically redacted
            </DialogDescription>
          </DialogHeader>

          {letterLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : letterData?.hasLetter ? (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm">
                <Badge variant="outline">{letterData.metadata?.complaintType}</Badge>
                <Badge variant="outline">{letterData.metadata?.hmrcDepartment}</Badge>
                <span className="text-gray-500">
                  {letterData.metadata?.redactionCount} items redacted
                </span>
              </div>

              {/* Redaction info */}
              {letterData.metadata?.redactedTypes && letterData.metadata.redactedTypes.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {letterData.metadata.redactedTypes.map((type: string) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Letter content */}
              <ScrollArea className="h-[500px] border rounded-lg p-4 bg-gray-50">
                <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800">
                  {letterData.content}
                </pre>
              </ScrollArea>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No letter found for this complaint</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
