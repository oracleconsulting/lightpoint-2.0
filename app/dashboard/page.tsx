'use client';

import { trpc } from '@/lib/trpc/Provider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, FileText, AlertCircle, CheckCircle, Clock, Building2, Trash2, Users, Shield, LogOut, BookOpen, Settings, Cog, Calendar, Video, X } from 'lucide-react';
import { useState } from 'react';
import { logger } from '../../lib/logger';
import HeroMetrics from '@/components/dashboard/HeroMetrics';
import OnboardingBanner from '@/components/dashboard/OnboardingBanner';


// Mock data for demo - replace with actual auth
const MOCK_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000001';

export default function DashboardPage() {
  const { currentUser, canManageUsers, isSuperAdmin } = useUser();
  const { signOut } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('all');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const handleLogout = async () => {
    logger.info('🔴 LOGOUT BUTTON CLICKED');
    
    if (confirm('Are you sure you want to sign out?')) {
      logger.info('🔴 USER CONFIRMED LOGOUT');
      setIsLoggingOut(true);
      
      // Don't await - signOut redirects immediately
      signOut();
    } else {
      logger.info('🔴 USER CANCELLED LOGOUT');
    }
  };
  
  const utils = trpc.useUtils();
  const { data: complaints, isLoading, error } = trpc.complaints.list.useQuery({
    organizationId: MOCK_ORGANIZATION_ID,
  });
  
  // Get real metrics
  const { data: metrics } = trpc.dashboard.getMetrics.useQuery();
  
  // Get onboarding status
  const { data: onboardingStatus } = trpc.dashboard.getOnboardingStatus.useQuery();

  const deleteComplaint = trpc.complaints.delete.useMutation({
    onSuccess: () => {
      // Refresh the complaints list
      utils.complaints.list.invalidate();
      setDeletingId(null);
    },
    onError: (error) => {
      alert(`Failed to delete complaint: ${error.message}`);
      setDeletingId(null);
    },
  });

  const handleDelete = (e: React.MouseEvent, complaintId: string, complaintRef: string) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Stop event bubbling
    
    if (confirm(`Are you sure you want to delete complaint "${complaintRef}"? This action cannot be undone.`)) {
      setDeletingId(complaintId);
      deleteComplaint.mutate(complaintId);
    }
  };

  // Debug logging
  logger.info('🔍 Dashboard State:', { 
    isLoading, 
    hasData: !!complaints, 
    dataLength: complaints?.length,
    error: error?.message,
    orgId: MOCK_ORGANIZATION_ID 
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      assessment: 'secondary',
      draft: 'secondary',
      active: 'default',
      escalated: 'destructive',
      resolved: 'default',
      closed: 'secondary',
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'assessment':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'active':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'escalated':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const stats = {
    total: complaints?.length || 0,
    assessment: complaints?.filter((c: any) => c.status === 'assessment').length || 0,
    active: complaints?.filter((c: any) => c.status === 'active').length || 0,
    escalated: complaints?.filter((c: any) => c.status === 'escalated').length || 0,
    resolved: complaints?.filter((c: any) => c.status === 'resolved').length || 0,
  };

  // Filter complaints based on selected status
  const filteredComplaints = statusFilter === 'all' 
    ? complaints 
    : complaints?.filter((c: any) => c.status === statusFilter);

  return (
    <div className="min-h-screen bg-background">
      {/* Logout Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-8 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-lg font-semibold">Signing out...</p>
              <p className="text-sm text-muted-foreground">Please wait</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Lightpoint</h1>
            <p className="text-sm text-muted-foreground">HMRC Complaint Management</p>
            {currentUser && (
              <p className="text-xs text-muted-foreground mt-1">
                Logged in as: <span className="font-medium">{currentUser.full_name || currentUser.email}</span>
              </p>
            )}
          </div>
          <div className="flex gap-2 items-center">
            <Link href="/settings">
              <Button variant="outline">
                <Building2 className="h-4 w-4 mr-2" />
                Practice Settings
              </Button>
            </Link>
            {/* Practice admin buttons - Users & Management */}
            {canManageUsers && (
              <>
                <Link href="/users">
                  <Button variant="outline">
                    <Users className="h-4 w-4 mr-2" />
                    Users
                  </Button>
                </Link>
                <Link href="/management">
                  <Button variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Management
                  </Button>
                </Link>
              </>
            )}
            {/* Superadmin only buttons */}
            {isSuperAdmin && (
              <>
                <Link href="/knowledge-base">
                  <Button variant="outline">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Knowledge Base
                  </Button>
                </Link>
                <Link href="/settings/ai">
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    AI Settings
                  </Button>
                </Link>
                <Link href="/admin">
                  <Button variant="outline" className="bg-brand-blurple/10 border-brand-blurple text-brand-blurple hover:bg-brand-blurple hover:text-white">
                    <Cog className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              </>
            )}
            <Link href="/complaints/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Complaint
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              onClick={handleLogout} 
              disabled={isLoggingOut}
              title={isLoggingOut ? "Signing out..." : "Sign Out"}
            >
              {isLoggingOut ? (
                <span className="h-4 w-4 animate-spin">⏳</span>
              ) : (
                <LogOut className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Onboarding Banner - Show for new users without complaints */}
        {onboardingStatus && !onboardingStatus.hasComplaints && !onboardingStatus.onboardingCompleted && (
          <OnboardingBanner 
            meetingBooked={onboardingStatus.meetingBooked}
            meetingDate={onboardingStatus.meetingDate}
          />
        )}
        
        {/* Hero Metrics - Now using real data */}
        <HeroMetrics
          activeComplaints={metrics?.activeComplaints ?? stats.active + stats.escalated}
          successRate={metrics?.successRate ?? (stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0)}
          avgResolutionDays={metrics?.avgResolutionDays ?? 0}
          totalRecovered={metrics?.totalRecovered ?? 0}
          trends={metrics?.trends}
          activeAppeals={metrics?.activeAppeals}
          penaltyValueAtStake={metrics?.penaltyValueAtStake}
          penaltiesCancelled={metrics?.penaltiesCancelled}
          onMetricClick={(metric) => {
            if (metric === 'active') setStatusFilter('active');
            if (metric === 'success') setStatusFilter('resolved');
          }}
        />

        {/* Complaints List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {statusFilter === 'all' ? 'All Complaints' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Complaints`}
              </CardTitle>
              {statusFilter !== 'all' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  Clear Filter
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading complaints...</p>
            ) : error ? (
              <div className="text-center py-12 text-red-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p className="font-medium mb-2">Error loading complaints</p>
                <p className="text-sm">{error.message}</p>
              </div>
            ) : filteredComplaints && filteredComplaints.length > 0 ? (
              <div className="space-y-4">
                {filteredComplaints.map((complaint: any) => (
                  <div key={complaint.id} className="border rounded-lg p-4 hover:bg-muted transition-colors relative group">
                    <Link href={`/complaints/${complaint.id}`} className="block">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {getStatusIcon(complaint.status)}
                          <div className="flex-1">
                            <p className="font-medium">
                              {complaint.complaint_reference || 'Untitled Complaint'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {complaint.client_name_encrypted || 'Client'} • {complaint.status}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Created {new Date(complaint.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(complaint.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => handleDelete(e, complaint.id, complaint.complaint_reference)}
                            disabled={deletingId === complaint.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  {statusFilter === 'all' ? 'No complaints yet' : `No ${statusFilter} complaints`}
                </p>
                {statusFilter !== 'all' ? (
                  <Button onClick={() => setStatusFilter('all')} variant="outline">
                    View All Complaints
                  </Button>
                ) : (
                  <Link href="/complaints/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Complaint
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

