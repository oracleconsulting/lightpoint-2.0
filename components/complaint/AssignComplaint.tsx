'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserPlus, Users, TrendingUp, Clock, FileText } from 'lucide-react';
import { trpc } from '@/lib/trpc/Provider';
import { useUser } from '@/contexts/UserContext';

interface AssignComplaintProps {
  complaintId: string;
  currentAssignedTo?: string;
  onAssigned?: () => void;
}

export function AssignComplaint({ complaintId, currentAssignedTo, onAssigned }: AssignComplaintProps) {
  const { currentUser, isAdmin, isManager } = useUser();
  const [selectedUserId, setSelectedUserId] = useState<string>(currentAssignedTo || '');

  const { data: users } = trpc.users.list.useQuery();
  const assignMutation = trpc.complaints.assign.useMutation({
    onSuccess: () => {
      onAssigned?.();
      alert('Complaint assigned successfully!');
    },
    onError: (error) => {
      alert(`Failed to assign: ${error.message}`);
    },
  });

  // Only admins/managers can assign
  if (!isAdmin && !isManager) {
    return null;
  }

  // Filter to active analysts, managers, and admins
  const assignableUsers = users?.filter((u: any) => 
    u.is_active && ['admin', 'manager', 'analyst'].includes(u.role)
  ) || [];

  const currentAssignee = users?.find((u: any) => u.id === currentAssignedTo);

  const handleAssign = () => {
    if (!selectedUserId) {
      alert('Please select a user');
      return;
    }

    assignMutation.mutate({
      complaintId,
      userId: selectedUserId,
      assignedBy: currentUser?.id || '',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-300';
      case 'manager': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'analyst': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <UserPlus className="h-4 w-4 text-blue-600" />
          Assign Complaint
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Assignment */}
        {currentAssignee ? (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Currently assigned to:</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{currentAssignee.full_name || currentAssignee.email}</p>
                <p className="text-xs text-muted-foreground">{currentAssignee.email}</p>
              </div>
              <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(currentAssignee.role)}`}>
                {currentAssignee.role}
              </Badge>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Not assigned to anyone yet
            </p>
          </div>
        )}

        {/* Assignment Controls */}
        <div className="space-y-2">
          <Label htmlFor="assignUser">Assign to:</Label>
          <Select
            value={selectedUserId}
            onValueChange={setSelectedUserId}
            disabled={assignMutation.isPending}
          >
            <SelectTrigger id="assignUser">
              <SelectValue placeholder="Select a team member..." />
            </SelectTrigger>
            <SelectContent>
              {assignableUsers.length > 0 ? (
                assignableUsers.map((user: any) => (
                  <SelectItem key={user.id} value={user.id}>
                    <div className="flex items-center gap-2">
                      <span>{user.full_name || user.email}</span>
                      <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                        {user.role}
                      </Badge>
                    </div>
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>
                  No users available
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleAssign}
          disabled={!selectedUserId || selectedUserId === currentAssignedTo || assignMutation.isPending}
          className="w-full"
        >
          {assignMutation.isPending ? 'Assigning...' : selectedUserId === currentAssignedTo ? 'Already Assigned' : 'Assign Complaint'}
        </Button>

        {/* User Stats (optional) */}
        {selectedUserId && selectedUserId !== currentAssignedTo && (
          <div className="text-xs text-muted-foreground border-t pt-3">
            <p className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              This will reassign the complaint to the selected user
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Component to show workload distribution (for management dashboard)
export function UserWorkloadCard() {
  const { isAdmin, isManager } = useUser();
  const { data: overview } = trpc.management.getOverview.useQuery(undefined, {
    enabled: isAdmin || isManager,
  });

  if (!isAdmin && !isManager) {
    return null;
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-700 border-red-300';
      case 'manager': return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'analyst': return 'bg-blue-100 text-blue-700 border-blue-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-600" />
          Team Workload Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {overview?.users?.map((user: any) => (
            <div key={user.user_id} className="flex items-center gap-3 p-2 border rounded hover:bg-accent/50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{user.full_name || user.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                    {user.role}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <p className="font-semibold text-blue-600">{user.total_complaints || 0}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-green-600">{user.active_complaints || 0}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-purple-600">{Math.round((user.total_minutes_logged || 0) / 60)}h</p>
                  <p className="text-xs text-muted-foreground">Hours</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

