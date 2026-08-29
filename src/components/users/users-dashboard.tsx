'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createUserAction, toggleUserStatusAction, resetUserPasswordAction, deleteUserAction } from '@/app/actions/users';
import {
  Users,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Lock,
  UserCheck,
  UserX,
  Mail,
  ShieldCheck,
  Building
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface UsersDashboardProps {
  users: any[];
  sites: any[];
  currentUserSession: any;
}

export default function UsersDashboard({
  users,
  sites,
  currentUserSession
}: UsersDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPass, setCreatePass] = useState('');
  const [createRole, setCreateRole] = useState('FRONT_DESK');
  const [createSiteId, setCreateSiteId] = useState('');
  const [createError, setCreateError] = useState('');

  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetUserId, setResetUserId] = useState('');
  const [resetUserName, setResetUserName] = useState('');
  const [resetPass, setResetPass] = useState('');
  const [resetError, setResetError] = useState('');

  // Submit Create User
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createName || !createEmail || !createPass || !createRole || !createSiteId) {
      setCreateError('Please fill in all required fields.');
      return;
    }
    setCreateError('');

    startTransition(async () => {
      const res = await createUserAction(createName, createEmail, createPass, createRole, createSiteId);
      if (res.success) {
        setCreateModalOpen(false);
        setCreateName('');
        setCreateEmail('');
        setCreatePass('');
        setCreateRole('FRONT_DESK');
        setCreateSiteId('');
        router.refresh();
      } else {
        setCreateError(res.message);
      }
    });
  };

  // Submit Reset Password
  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUserId || !resetPass || resetPass.length < 6) {
      setResetError('Password must be at least 6 characters.');
      return;
    }
    setResetError('');

    startTransition(async () => {
      const res = await resetUserPasswordAction(resetUserId, resetPass);
      if (res.success) {
        setResetModalOpen(false);
        setResetUserId('');
        setResetUserName('');
        setResetPass('');
        router.refresh();
      } else {
        setResetError(res.message);
      }
    });
  };

  // Toggle status
  const handleToggleStatus = (id: string, currentStatus: string) => {
    if (id === currentUserSession.userId) {
      alert('Self-deactivation is prohibited.');
      return;
    }
    if (!confirm(`Are you sure you want to ${currentStatus === 'ACTIVE' ? 'deactivate' : 'activate'} this user login?`)) return;

    startTransition(async () => {
      const res = await toggleUserStatusAction(id, currentStatus);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };
  
  // Delete user permanently
  const handleDeleteUser = (id: string, name: string) => {
    if (id === currentUserSession.userId) {
      alert('Self-deletion is prohibited.');
      return;
    }
    if (!confirm(`⚠️ WARNING: Are you sure you want to PERMANENTLY delete user account for ${name}?\n\nThis action cannot be undone and will reassign all historical operational logs created by this user to you.`)) return;

    startTransition(async () => {
      const res = await deleteUserAction(id);
      if (res.success) {
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'HR':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 font-sans text-sm">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">User Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage system logins, assign office roles (HR, Admin, Front Desk), and reset representative passwords.
          </p>
        </div>
        <button
          onClick={() => {
            setCreateModalOpen(true);
            if (sites.length > 0) setCreateSiteId(sites[0].id);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-medium rounded-md shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Add User Account
        </button>
      </div>

      {/* Users table */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-secondary/30 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-3">User Name</th>
                <th className="px-5 py-3">Email Address</th>
                <th className="px-5 py-3">System Role</th>
                <th className="px-5 py-3">Assigned Site</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-sm">
              {users.map((user) => {
                const isActive = user.status === 'ACTIVE';
                const isSelf = user.id === currentUserSession.userId;
                return (
                  <tr key={user.id} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-5 py-4 font-semibold text-foreground">
                      {user.name} {isSelf && <span className="text-[10px] text-primary italic font-sans ml-1">(You)</span>}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground font-mono text-xs">{user.email}</td>
                    <td className="px-5 py-4">
                      <span className={cn('inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border', getRoleBadge(user.role))}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{user.site?.name || '-'}</td>
                    <td className="px-5 py-4">
                      <span
                        className={cn(
                          'inline-flex px-2 py-0.5 text-xs font-semibold rounded-full border',
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        )}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setResetUserId(user.id);
                            setResetUserName(user.name);
                            setResetModalOpen(true);
                          }}
                          className="px-2 py-1 border border-border bg-card hover:bg-secondary text-xs font-semibold rounded transition-colors"
                          title="Reset Password"
                        >
                          Reset Pass
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          disabled={isSelf || isPending}
                          className={cn(
                            'px-2 py-1 border text-xs font-semibold rounded transition-colors disabled:opacity-40 disabled:pointer-events-none',
                            isActive
                              ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          )}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          disabled={isSelf || isPending}
                          className="px-2 py-1 border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded transition-colors disabled:opacity-40 disabled:pointer-events-none"
                          title="Delete Login Permanently"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Create User Account */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Create User Account</h3>
              <button onClick={() => setCreateModalOpen(false)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{createError}</div>}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={createEmail}
                  onChange={(e) => setCreateEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. rahul@houseofevoq.com"
                />
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Default Password *</label>
                <input
                  type="password"
                  required
                  value={createPass}
                  onChange={(e) => setCreatePass(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Default password (min 6 chars)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Assigned Role *</label>
                  <select
                    value={createRole}
                    onChange={(e) => setCreateRole(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="FRONT_DESK">Front Desk</option>
                    <option value="HR">HR Officer</option>
                    <option value="ADMIN">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-muted-foreground uppercase mb-1.5">Assigned Site *</label>
                  <select
                    value={createSiteId}
                    onChange={(e) => setCreateSiteId(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {sites.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Create User
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Reset User Password */}
      {resetModalOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md border border-border rounded-lg shadow-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center border-b border-border pb-3">
              <h3 className="text-md font-serif font-bold text-foreground">Reset Password</h3>
              <button onClick={() => setResetModalOpen(false)} className="p-1 hover:bg-secondary rounded text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetError && <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">{resetError}</div>}

            <form onSubmit={handleResetSubmit} className="space-y-4 text-xs font-sans">
              <div>
                <span className="block font-semibold text-muted-foreground uppercase mb-1">Reset target</span>
                <p className="text-sm font-semibold text-foreground py-1">User: {resetUserName}</p>
                <p className="text-[10px] text-muted-foreground leading-normal">
                  Note: The new password will take effect immediately. The user will be prompted to enter this password on their next login check.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-muted-foreground uppercase mb-1.5">New Password *</label>
                <input
                  type="password"
                  required
                  value={resetPass}
                  onChange={(e) => setResetPass(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Specify new password (min 6 chars)"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center py-2.5 bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-md shadow-sm transition-all disabled:opacity-50"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Overwrite Password
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
