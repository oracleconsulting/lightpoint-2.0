'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc/Provider';
import { 
  Building2, 
  Mail, 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Users,
  RefreshCw,
  Copy,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';

export default function CustomersPage() {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    organizationName: '',
    contactName: '',
    notes: '',
    trialDays: 30,
  });

  const utils = trpc.useUtils();
  
  // Get all organization invites
  const { data: invites, isLoading: invitesLoading } = trpc.admin.listOrganizationInvites.useQuery();
  
  // Get all organizations (customers)
  const { data: organizations, isLoading: orgsLoading } = trpc.admin.listOrganizations.useQuery();
  
  // Check if email is configured
  const { data: emailConfig } = trpc.admin.isEmailConfigured.useQuery();
  
  // Create invite mutation
  const createInvite = trpc.admin.createOrganizationInvite.useMutation({
    onSuccess: (data) => {
      utils.admin.listOrganizationInvites.invalidate();
      setShowInviteDialog(false);
      setInviteForm({
        email: '',
        organizationName: '',
        contactName: '',
        notes: '',
        trialDays: 30,
      });
      if (data.emailSent) {
        alert('✅ Invite created and email sent successfully!');
      } else {
        alert(`⚠️ Invite created but email not sent: ${data.emailError || 'Email service not configured'}\n\nYou can copy the invite link manually.`);
      }
    },
    onError: (error) => {
      alert(`Failed to send invite: ${error.message}`);
    },
  });

  // Resend invite mutation
  const resendInvite = trpc.admin.resendOrganizationInvite.useMutation({
    onSuccess: (data) => {
      utils.admin.listOrganizationInvites.invalidate();
      if (data.emailSent) {
        alert('✅ Invite resent successfully!');
      } else {
        alert(`⚠️ Invite updated but email not sent: ${data.emailError || 'Email service not configured'}`);
      }
    },
  });

  // Cancel invite mutation
  const cancelInvite = trpc.admin.cancelOrganizationInvite.useMutation({
    onSuccess: () => {
      utils.admin.listOrganizationInvites.invalidate();
      alert('Invite cancelled.');
    },
  });

  const handleSendInvite = () => {
    if (!inviteForm.email || !inviteForm.organizationName) {
      alert('Please fill in email and organization name');
      return;
    }
    createInvite.mutate(inviteForm);
  };

  const copyInviteLink = (token: string) => {
    const link = `${window.location.origin}/accept-invite?token=${token}`;
    navigator.clipboard.writeText(link);
    alert('Invite link copied to clipboard!');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-300"><Clock className="h-3 w-3" /> Pending</Badge>;
      case 'accepted':
        return <Badge variant="outline" className="gap-1 text-green-600 border-green-300"><CheckCircle2 className="h-3 w-3" /> Accepted</Badge>;
      case 'expired':
        return <Badge variant="outline" className="gap-1 text-gray-600 border-gray-300"><XCircle className="h-3 w-3" /> Expired</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="gap-1 text-red-600 border-red-300"><XCircle className="h-3 w-3" /> Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Email Status Banner */}
      {emailConfig && !emailConfig.configured && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <Mail className="h-5 w-5 text-yellow-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">Email Service Not Configured</p>
            <p className="text-sm text-yellow-700">
              Add RESEND_API_KEY to Railway to enable automatic invite emails.
              You can still create invites and copy the link manually.
            </p>
          </div>
        </div>
      )}
      
      {emailConfig?.configured && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium text-green-800">Email Service Connected</p>
            <p className="text-sm text-green-700">
              Invite emails will be sent automatically via Resend.
            </p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Management</h1>
          <p className="mt-2 text-gray-600">
            Invite and manage accounting firms using Lightpoint
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Invite New Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Organizations</p>
                <p className="text-2xl font-bold">{organizations?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Mail className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Invites</p>
                <p className="text-2xl font-bold">
                  {invites?.filter((i: any) => i.status === 'pending').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Accepted Invites</p>
                <p className="text-2xl font-bold">
                  {invites?.filter((i: any) => i.status === 'accepted').length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Invites */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Pending Invites
          </CardTitle>
        </CardHeader>
        <CardContent>
          {invitesLoading ? (
            <p className="text-center py-8 text-gray-500">Loading...</p>
          ) : !invites || invites.filter((i: any) => i.status === 'pending').length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No pending invites. Click "Invite New Customer" to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {invites
                .filter((i: any) => i.status === 'pending')
                .map((invite: any) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">{invite.organization_name}</span>
                        {getStatusBadge(invite.status)}
                      </div>
                      <div className="text-sm text-gray-600">
                        <Mail className="h-3 w-3 inline mr-1" />
                        {invite.email}
                        {invite.contact_name && ` (${invite.contact_name})`}
                      </div>
                      <div className="text-xs text-gray-500">
                        Invited {format(new Date(invite.created_at), 'dd MMM yyyy')} • 
                        Expires {format(new Date(invite.expires_at), 'dd MMM yyyy')}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyInviteLink(invite.token)}
                        className="gap-1"
                      >
                        <Copy className="h-3 w-3" />
                        Copy Link
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resendInvite.mutate({ inviteId: invite.id })}
                        disabled={resendInvite.isPending}
                        className="gap-1"
                      >
                        <RefreshCw className="h-3 w-3" />
                        Resend
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (confirm('Cancel this invite?')) {
                            cancelInvite.mutate({ inviteId: invite.id });
                          }
                        }}
                        className="gap-1 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <XCircle className="h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Organizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Active Organizations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orgsLoading ? (
            <p className="text-center py-8 text-gray-500">Loading...</p>
          ) : !organizations || organizations.length === 0 ? (
            <p className="text-center py-8 text-gray-500">
              No organizations yet. Invite your first customer to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {organizations.map((org: any) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-600" />
                      <span className="font-medium">{org.name}</span>
                      <Badge variant="outline" className="text-green-600 border-green-300">
                        Active
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <Users className="h-3 w-3 inline mr-1" />
                      {org.user_count || 0} users • 
                      {org.complaint_count || 0} complaints
                    </div>
                    <div className="text-xs text-gray-500">
                      Created {format(new Date(org.created_at), 'dd MMM yyyy')}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite History */}
      <Card>
        <CardHeader>
          <CardTitle>Invite History</CardTitle>
        </CardHeader>
        <CardContent>
          {invitesLoading ? (
            <p className="text-center py-8 text-gray-500">Loading...</p>
          ) : !invites || invites.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No invites yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Organization</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Invited</th>
                    <th className="text-left py-3 px-4">Expires/Accepted</th>
                  </tr>
                </thead>
                <tbody>
                  {invites.map((invite: any) => (
                    <tr key={invite.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{invite.organization_name}</td>
                      <td className="py-3 px-4">{invite.email}</td>
                      <td className="py-3 px-4">{getStatusBadge(invite.status)}</td>
                      <td className="py-3 px-4 text-gray-600">
                        {format(new Date(invite.created_at), 'dd MMM yyyy')}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {invite.accepted_at 
                          ? format(new Date(invite.accepted_at), 'dd MMM yyyy')
                          : format(new Date(invite.expires_at), 'dd MMM yyyy')
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      {showInviteDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5" />
                Invite New Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="orgName">Organization Name *</Label>
                <Input
                  id="orgName"
                  placeholder="e.g., Smith & Partners Accountants"
                  value={inviteForm.organizationName}
                  onChange={(e) => setInviteForm({ ...inviteForm, organizationName: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="email">Admin Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@smithpartners.co.uk"
                  value={inviteForm.email}
                  onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  className="mt-1.5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This person will be the organization admin and can invite team members.
                </p>
              </div>

              <div>
                <Label htmlFor="contactName">Contact Name</Label>
                <Input
                  id="contactName"
                  placeholder="e.g., John Smith"
                  value={inviteForm.contactName}
                  onChange={(e) => setInviteForm({ ...inviteForm, contactName: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="trialDays">Trial Period (days)</Label>
                <Input
                  id="trialDays"
                  type="number"
                  min="7"
                  max="90"
                  value={inviteForm.trialDays}
                  onChange={(e) => setInviteForm({ ...inviteForm, trialDays: parseInt(e.target.value) || 30 })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="notes">Internal Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Any notes about this customer (only visible to admins)"
                  value={inviteForm.notes}
                  onChange={(e) => setInviteForm({ ...inviteForm, notes: e.target.value })}
                  className="mt-1.5"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowInviteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendInvite}
                  disabled={createInvite.isPending}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  {createInvite.isPending ? 'Sending...' : 'Send Invite'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

