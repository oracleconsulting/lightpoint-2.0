'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { trpc } from '@/lib/trpc/Provider';

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  organization_id: string;
  job_title?: string;
  phone?: string;
  is_active: boolean;
  is_super_admin?: boolean; // Product-level superadmin
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAdmin: boolean;           // Practice-level admin
  isManager: boolean;         // Practice-level manager
  isSuperAdmin: boolean;      // Product-level superadmin (info@lightpoint.uk)
  canManageUsers: boolean;
  canManageKnowledgeBase: boolean;  // Super admin only
  canEditComplaint: (complaint: any) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, loading: authLoading } = useAuth();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Fetch user profile from lightpoint_users when auth user changes
  const { data: userProfile, isLoading: profileLoading } = trpc.users.list.useQuery(undefined, {
    enabled: !!authUser,
  });

  // Fetch super_admin status from user_roles table
  const { data: superAdminStatus } = trpc.users.checkSuperAdmin.useQuery(undefined, {
    enabled: !!authUser,
  });

  useEffect(() => {
    if (authUser && userProfile) {
      // Find the user profile that matches the authenticated user
      const profile = userProfile.find((u: any) => u.id === authUser.id);
      if (profile) {
        setCurrentUser({
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
          organization_id: profile.organization_id,
          job_title: profile.job_title,
          phone: profile.phone,
          is_active: profile.is_active,
          is_super_admin: superAdminStatus?.isSuperAdmin || false,
        });
      }
    } else if (!authUser) {
      setCurrentUser(null);
    }
  }, [authUser, userProfile, superAdminStatus]);

  const isAdmin = currentUser?.role === 'admin';
  const isManager = currentUser?.role === 'manager' || isAdmin;
  const isSuperAdmin = currentUser?.is_super_admin || false;
  const canManageUsers = isAdmin || isManager;
  const canManageKnowledgeBase = isSuperAdmin; // Only super admin can manage KB

  const canEditComplaint = (complaint: any) => {
    if (!currentUser) return false;
    if (isAdmin) return true; // Admin can edit anything
    if (complaint.assigned_to === currentUser.id) return true; // Assigned user
    if (complaint.created_by === currentUser.id) return true; // Creator
    return false;
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isAdmin,
        isManager,
        isSuperAdmin,
        canManageUsers,
        canManageKnowledgeBase,
        canEditComplaint,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

