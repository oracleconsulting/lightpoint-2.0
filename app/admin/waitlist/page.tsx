'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { trpc } from '@/lib/trpc/Provider';
import { Users, Mail, Phone, Building2, Calendar, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

export default function WaitlistManagement() {
  const [statusFilter, setStatusFilter] = useState<'pending' | 'contacted' | 'converted' | 'declined' | undefined>(undefined);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const { data: waitlistData, refetch } = trpc.cms.getWaitlist.useQuery({
    status: statusFilter,
    limit: 100,
  });

  const updateStatus = trpc.cms.updateWaitlistStatus.useMutation({
    onSuccess: () => {
      refetch();
      setSelectedEntry(null);
    },
  });

  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Pending' },
    contacted: { icon: AlertCircle, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Contacted' },
    converted: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', label: 'Converted' },
    declined: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Declined' },
  };

  const handleStatusUpdate = (id: string, newStatus: 'pending' | 'contacted' | 'converted' | 'declined') => {
    updateStatus.mutate({ id, status: newStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-gray-900">Waitlist Management</h1>
          <p className="text-gray-600 mt-2">
            {waitlistData?.total || 0} total signups
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === undefined ? 'default' : 'outline'}
              onClick={() => setStatusFilter(undefined)}
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              All ({waitlistData?.total || 0})
            </Button>
            {Object.entries(statusConfig).map(([status, config]) => {
              const Icon = config.icon;
              const count = waitlistData?.entries?.filter((e: any) => e.status === status).length || 0;
              return (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status as any)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {config.label} ({count})
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Waitlist Entries */}
      {!waitlistData?.entries || waitlistData.entries.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No waitlist entries yet</p>
            <p className="text-sm text-gray-400">Share your /subscription/checkout page to start collecting signups</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {waitlistData.entries.map((entry: any) => {
            const statusInfo = statusConfig[entry.status as keyof typeof statusConfig];
            const StatusIcon = statusInfo.icon;

            return (
              <Card key={entry.id} className={`border-l-4 ${statusInfo.border}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header Row */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="h-4 w-4" />
                          {statusInfo.label}
                        </div>
                        {entry.selected_tier_name && (
                          <span className="text-xs font-medium px-2 py-1 rounded-button bg-brand-blurple/10 text-brand-blurple">
                            {entry.selected_tier_name}
                          </span>
                        )}
                      </div>

                      {/* Contact Info */}
                      <div className="grid md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <a href={`mailto:${entry.email}`} className="text-brand-primary hover:underline font-medium">
                              {entry.email}
                            </a>
                          </div>
                          {entry.full_name && (
                            <p className="text-gray-700 font-medium mb-1">{entry.full_name}</p>
                          )}
                          {entry.company_name && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building2 className="h-4 w-4 text-gray-400" />
                              {entry.company_name}
                            </div>
                          )}
                          {entry.phone && (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <a href={`tel:${entry.phone}`} className="hover:underline">
                                {entry.phone}
                              </a>
                            </div>
                          )}
                        </div>

                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Signed up: {new Date(entry.signed_up_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          {entry.estimated_complaints_per_month && (
                            <p>Est. complaints/month: <span className="font-medium">{entry.estimated_complaints_per_month}</span></p>
                          )}
                          {entry.referral_source && (
                            <p>Source: <span className="font-medium capitalize">{entry.referral_source}</span></p>
                          )}
                          {entry.priority && entry.priority !== 'normal' && (
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              entry.priority === 'urgent' ? 'bg-red-100 text-red-700' : 
                              entry.priority === 'high' ? 'bg-orange-100 text-orange-700' : 
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {entry.priority.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {entry.notes && (
                        <div className="bg-gray-50 rounded-card p-3 text-sm text-gray-700 mb-4">
                          <p className="font-medium text-gray-900 mb-1">Notes:</p>
                          {entry.notes}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {entry.status !== 'contacted' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(entry.id, 'contacted')}
                            disabled={updateStatus.isPending}
                          >
                            Mark as Contacted
                          </Button>
                        )}
                        {entry.status !== 'converted' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(entry.id, 'converted')}
                            disabled={updateStatus.isPending}
                            className="text-success hover:text-success"
                          >
                            Mark as Converted
                          </Button>
                        )}
                        {entry.status !== 'declined' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(entry.id, 'declined')}
                            disabled={updateStatus.isPending}
                            className="text-red-600 hover:text-red-700"
                          >
                            Mark as Declined
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

