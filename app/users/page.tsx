'use client';

/**
 * User Management Page
 *
 * Features:
 * - Delete user (with confirmation modal)
 * - Set temporary password (generates and displays it for the admin to share)
 */

import { useState } from 'react';
import { trpc } from '@/lib/trpc/Provider';
import { useUser } from '@/contexts/UserContext';
import {
  UserPlus,
  Trash2,
  KeyRound,
  Copy,
  Check,
  X,
  Shield,
  Briefcase,
  User as UserIcon,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LightpointUser {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  is_active: boolean;
  job_title?: string;
  created_at: string;
  updated_at?: string;
}

// ─── Role badge ───────────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    admin: {
      label: 'Admin',
      className: 'bg-pink-100 text-pink-700 border border-pink-200',
      icon: <Shield size={11} />,
    },
    manager: {
      label: 'Manager',
      className: 'bg-purple-100 text-purple-700 border border-purple-200',
      icon: <Briefcase size={11} />,
    },
    analyst: {
      label: 'Analyst',
      className: 'bg-blue-100 text-blue-700 border border-blue-200',
      icon: <UserIcon size={11} />,
    },
    viewer: {
      label: 'Viewer',
      className: 'bg-slate-100 text-slate-600 border border-slate-200',
      icon: <UserIcon size={11} />,
    },
  };
  const cfg = map[role] ?? map.viewer;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Confirmation modal ───────────────────────────────────────────────────────

function ConfirmModal({
  user,
  onConfirm,
  onCancel,
  loading,
}: {
  user: LightpointUser;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start gap-4 mb-5">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Remove user?</h2>
            <p className="text-sm text-slate-500 mt-1">
              This will permanently delete <strong>{user.full_name}</strong> ({user.email}) from
              Lightpoint. Their complaints and time logs will be retained but the account will be
              gone.
            </p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <span className="animate-spin h-4 w-4 border-2 border-white/40 border-t-white rounded-full" />
            ) : (
              <Trash2 size={14} />
            )}
            {loading ? 'Removing…' : 'Remove user'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Password modal ───────────────────────────────────────────────────────────

function PasswordModal({
  user,
  password,
  onClose,
}: {
  user: LightpointUser;
  password: string;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Temporary password set</h2>
            <p className="text-sm text-slate-500 mt-1">
              Send this to <strong>{user.full_name}</strong> — they should change it on first
              login.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Password display */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 mb-4">
          <code className="flex-1 text-base font-mono text-slate-800 select-all tracking-wide">
            {password}
          </code>
          <button
            onClick={copyToClipboard}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors shadow-sm"
            title="Copy to clipboard"
          >
            {copied ? (
              <Check size={14} className="text-green-600" />
            ) : (
              <Copy size={14} />
            )}
          </button>
        </div>

        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
          This password will not be shown again. Copy it before closing.
        </p>

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const { currentUser, canManageUsers } = useUser();

  // Fetch users via tRPC (uses the existing users.list procedure)
  const { data: users, isLoading, refetch } = trpc.users.list.useQuery();

  // Local UI state
  const [deleteTarget, setDeleteTarget] = useState<LightpointUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<LightpointUser | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    full_name: '',
    role: 'analyst' as 'admin' | 'manager' | 'analyst' | 'viewer',
    job_title: '',
  });

  const inviteUser = trpc.users.invite.useMutation({
    onSuccess: () => {
      refetch();
      setShowInviteForm(false);
      setInviteForm({ email: '', full_name: '', role: 'analyst', job_title: '' });
      setError(null);
    },
    onError: (e) => setError(e.message),
  });

  // ── Delete handler ──────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/users/manage', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteTarget.id }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to delete user');

      setDeleteTarget(null);
      refetch();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Password reset handler ──────────────────────────────────────────────────

  const handleSetPassword = async (user: LightpointUser) => {
    setPasswordTarget(user);
    setPasswordLoading(true);
    setGeneratedPassword(null);
    setError(null);

    try {
      const res = await fetch('/api/users/manage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to set password');

      setGeneratedPassword(json.temporaryPassword);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to set password');
      setPasswordTarget(null);
    } finally {
      setPasswordLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  if (!canManageUsers) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-6 text-center">
          You don&apos;t have permission to manage users. Contact your administrator.
        </div>
      </div>
    );
  }

  const activeUsers = (users as LightpointUser[] | undefined)?.filter((u) => u.is_active) ?? [];
  const inactiveUsers = (users as LightpointUser[] | undefined)?.filter((u) => !u.is_active) ?? [];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage team members, roles, and access</p>
        </div>
        <Button
          onClick={() => setShowInviteForm((v) => !v)}
          className="gap-2 bg-amber-500 hover:bg-amber-600"
        >
          <UserPlus size={15} />
          Add User
        </Button>
      </div>

      {/* Invite form */}
      {showInviteForm && (
        <div className="mb-8 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Invite team member</h2>
          <form
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!inviteForm.email || !inviteForm.full_name) return;
              inviteUser.mutate({
                email: inviteForm.email,
                full_name: inviteForm.full_name,
                role: inviteForm.role,
                job_title: inviteForm.job_title || undefined,
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@example.com"
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-name">Full name *</Label>
              <Input
                id="invite-name"
                placeholder="Jane Smith"
                value={inviteForm.full_name}
                onChange={(e) => setInviteForm({ ...inviteForm, full_name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select
                value={inviteForm.role}
                onValueChange={(v: 'admin' | 'manager' | 'analyst' | 'viewer') =>
                  setInviteForm({ ...inviteForm, role: v })
                }
              >
                <SelectTrigger id="invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="analyst">Analyst</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  {currentUser?.role === 'admin' && <SelectItem value="admin">Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite-title">Job title</Label>
              <Input
                id="invite-title"
                placeholder="Senior Analyst"
                value={inviteForm.job_title}
                onChange={(e) => setInviteForm({ ...inviteForm, job_title: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex gap-2">
              <Button type="submit" disabled={inviteUser.isPending}>
                {inviteUser.isPending ? 'Sending…' : 'Send invite'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowInviteForm(false);
                  setInviteForm({ email: '', full_name: '', role: 'analyst', job_title: '' });
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
          <p className="text-xs text-slate-500 mt-3">
            They will receive an email to set their password and join your organisation.
          </p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mb-5 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          <AlertTriangle size={15} />
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Users table */}
      {isLoading ? (
        <div className="text-center text-slate-400 py-20">Loading…</div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Active users */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700">
              Team Members ({activeUsers.length})
            </span>
          </div>

          <ul className="divide-y divide-slate-100">
            {activeUsers.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                isSelf={u.id === currentUser?.id}
                onDelete={() => setDeleteTarget(u)}
                onSetPassword={() => handleSetPassword(u)}
                passwordLoading={passwordLoading && passwordTarget?.id === u.id}
              />
            ))}
          </ul>

          {/* Inactive users */}
          {inactiveUsers.length > 0 && (
            <>
              <div className="px-5 py-4 border-t border-slate-100 bg-slate-50">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Inactive ({inactiveUsers.length})
                </span>
              </div>
              <ul className="divide-y divide-slate-100 bg-slate-50/50">
                {inactiveUsers.map((u) => (
                  <UserRow
                    key={u.id}
                    user={u}
                    isSelf={u.id === currentUser?.id}
                    onDelete={() => setDeleteTarget(u)}
                    onSetPassword={() => handleSetPassword(u)}
                    passwordLoading={passwordLoading && passwordTarget?.id === u.id}
                    inactive
                  />
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {/* Modals */}
      {deleteTarget && (
        <ConfirmModal
          user={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleteLoading}
        />
      )}

      {passwordTarget && generatedPassword && (
        <PasswordModal
          user={passwordTarget}
          password={generatedPassword}
          onClose={() => {
            setPasswordTarget(null);
            setGeneratedPassword(null);
          }}
        />
      )}
    </div>
  );
}

// ─── User row ─────────────────────────────────────────────────────────────────

function UserRow({
  user,
  isSelf,
  onDelete,
  onSetPassword,
  passwordLoading,
  inactive = false,
}: {
  user: LightpointUser;
  isSelf: boolean;
  onDelete: () => void;
  onSetPassword: () => void;
  passwordLoading: boolean;
  inactive?: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-4 px-5 py-4 group transition-colors hover:bg-slate-50 ${
        isSelf ? 'bg-indigo-50/40' : ''
      }`}
    >
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 ${
          inactive
            ? 'bg-slate-200 text-slate-400'
            : 'bg-gradient-to-br from-indigo-400 to-purple-500 text-white'
        }`}
      >
        {user.full_name?.charAt(0)?.toUpperCase() ?? '?'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-sm font-medium ${inactive ? 'text-slate-400' : 'text-slate-800'}`}>
            {user.full_name}
          </span>
          {inactive && (
            <span className="text-xs text-slate-400 border border-slate-200 rounded-full px-2 py-0.5">
              Inactive
            </span>
          )}
          {isSelf && (
            <span className="text-xs text-indigo-600 font-medium">(you)</span>
          )}
        </div>
        <div className="text-xs text-slate-400 truncate mt-0.5">{user.email}</div>
        {user.job_title && (
          <div className="text-xs text-slate-400 mt-0.5">{user.job_title}</div>
        )}
      </div>

      {/* Role */}
      <RoleBadge role={user.role} />

      {/* Created */}
      <div className="text-xs text-slate-400 hidden sm:block w-28 text-right">
        Created: {new Date(user.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </div>

      {/* Actions — only show for non-self */}
      {!isSelf && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Set password */}
          <button
            onClick={onSetPassword}
            disabled={passwordLoading}
            title="Set temporary password"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            {passwordLoading ? (
              <span className="animate-spin h-3.5 w-3.5 border-2 border-indigo-300 border-t-indigo-600 rounded-full" />
            ) : (
              <KeyRound size={15} />
            )}
          </button>

          {/* Delete */}
          <button
            onClick={onDelete}
            title="Remove user"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={15} />
          </button>
        </div>
      )}
    </li>
  );
}
