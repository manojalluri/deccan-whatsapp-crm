'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';

interface AgencyAccount {
  id: string;
  name: string;
  created_at: string;
  owner_user_id: string;
  memberCount?: number;
  expires_at?: string | null;
}

interface Member {
  id: string;
  full_name: string | null;
  email: string;
  account_role: string;
  is_agency_owner: boolean;
}

function ViewMembersModal({
  accountId,
  accountName,
  onClose
}: {
  accountId: string;
  accountName: string;
  onClose: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(`/api/agency/accounts/${accountId}/members`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load members");
        setMembers(data.members || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading members");
      } finally {
        setLoading(false);
      }
    };
    fetchMembers();
  }, [accountId]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm px-4">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Workspace Members</h2>
            <p className="text-sm text-slate-400 mt-1">{accountName}</p>
          </div>
          <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">Close</Button>
        </div>
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="text-sm text-slate-400">Loading members...</div>
          ) : error ? (
            <div className="text-sm text-red-400">{error}</div>
          ) : (
            <div className="space-y-4">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-950">
                  <div>
                    <div className="font-medium text-white">{m.full_name || 'Unnamed User'}</div>
                    <div className="text-sm text-slate-400">{m.email}</div>
                  </div>
                  <div className="flex gap-2">
                    {m.is_agency_owner && (
                      <span className="bg-purple-500/20 text-purple-400 text-xs px-2 py-1 rounded border border-purple-500/30">
                        Agency Owner
                      </span>
                    )}
                    <span className="bg-slate-800 text-slate-300 text-xs px-2 py-1 rounded capitalize border border-slate-700">
                      {m.account_role}
                    </span>
                  </div>
                </div>
              ))}
              {members.length === 0 && <div className="text-slate-500 text-sm">No members found.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddUserModal({
  accounts,
  onClose,
  onSuccess
}: {
  accounts: AgencyAccount[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceAction, setWorkspaceAction] = useState<"new" | "existing">("new");
  const [workspaceName, setWorkspaceName] = useState("");
  const [accountId, setAccountId] = useState(accounts.length > 0 ? accounts[0].id : "");
  const [role, setRole] = useState<"admin" | "agent" | "viewer">("agent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agency/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName, email, password, workspaceAction, workspaceName, accountId, role
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create user");
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/80 backdrop-blur-sm px-4 overflow-y-auto pt-20 pb-10">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Add Client / User</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Full Name</label>
            <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Email</label>
            <input required type="email" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Password (give this to the user)</label>
            <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white" value={password} onChange={e => setPassword(e.target.value)} />
          </div>

          <div className="pt-4 border-t border-slate-800">
            <label className="block text-sm font-medium text-slate-300 mb-2">Workspace Assignment</label>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input type="radio" checked={workspaceAction === "new"} onChange={() => setWorkspaceAction("new")} />
                New Workspace
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                <input type="radio" checked={workspaceAction === "existing"} onChange={() => setWorkspaceAction("existing")} />
                Existing Workspace
              </label>
            </div>

            {workspaceAction === "new" ? (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Workspace Name</label>
                <input required type="text" className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} />
                <p className="text-xs text-slate-500 mt-1">This user will be the Owner of the new workspace.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Select Workspace</label>
                  <select required className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white" value={accountId} onChange={e => setAccountId(e.target.value)}>
                    <option value="" disabled>Select a workspace</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Role</label>
                  <select required className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white" value={role} onChange={e => setRole(e.target.value as any)}>
                    <option value="admin">Admin</option>
                    <option value="agent">Agent</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {error && <div className="text-red-400 text-sm mt-2">{error}</div>}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AgencyTab() {
  const [accounts, setAccounts] = useState<AgencyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingExpiryId, setEditingExpiryId] = useState<string | null>(null);
  const [expiryInput, setExpiryInput] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingMembersAcc, setViewingMembersAcc] = useState<{ id: string; name: string } | null>(null);
  const { accountId, refreshProfile } = useAuth();

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/agency/accounts');
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load accounts');
      }
      
      setAccounts(data.accounts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadAccounts();
  }, []);

  const handleImpersonate = async (targetId: string) => {
    if (targetId === accountId) return; // already in this account
    
    try {
      const res = await fetch('/api/agency/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: targetId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to switch account');
      
      // Refresh the global auth profile so the UI instantly flips over
      await refreshProfile();
      window.location.href = '/dashboard';
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error switching accounts');
    }
  };

  const handleUpdateExpiry = async (targetId: string) => {
    try {
      // Empty input means lifetime / never expires
      const expiresAt = expiryInput ? new Date(expiryInput).toISOString() : null;
      
      const res = await fetch('/api/agency/accounts/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: targetId, expiresAt })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update subscription');
      
      setEditingExpiryId(null);
      await loadAccounts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error updating subscription');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-slate-800 bg-slate-900">
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-white">Agency Workspaces</CardTitle>
            <CardDescription className="text-slate-400 mt-1">
              You are an Agency Owner. From here, you can see all client accounts on this server and instantly enter their workspace.
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0">
            + Add Client / User
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-slate-400">Loading accounts...</div>
          ) : error ? (
            <div className="text-sm text-red-400">{error}</div>
          ) : (
            <div className="rounded-md border border-slate-800 overflow-hidden">
              <table className="w-full text-sm text-left text-slate-300">
                <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">
                  <tr>
                    <th className="px-6 py-3 font-medium">Workspace Name</th>
                    <th className="px-6 py-3 font-medium text-center">Members</th>
                    <th className="px-6 py-3 font-medium">Expires</th>
                    <th className="px-6 py-3 font-medium">Created On</th>
                    <th className="px-6 py-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {accounts.map((acc) => {
                    const isCurrent = acc.id === accountId;
                    return (
                      <tr key={acc.id} className="hover:bg-slate-800/30">
                        <td className="px-6 py-4 flex items-center gap-2">
                          <span className="font-medium text-white">{acc.name}</span>
                          {isCurrent && (
                            <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => setViewingMembersAcc({ id: acc.id, name: acc.name })}
                            className="text-primary hover:underline font-medium hover:text-primary/80 transition-colors cursor-pointer"
                          >
                            {acc.memberCount} members
                          </button>
                        </td>
                        <td className="px-6 py-4">
                          {editingExpiryId === acc.id ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="date" 
                                className="bg-slate-800 border border-slate-700 text-sm rounded px-2 py-1 text-white"
                                value={expiryInput}
                                onChange={(e) => setExpiryInput(e.target.value)}
                              />
                              <Button size="sm" onClick={() => handleUpdateExpiry(acc.id)}>Save</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingExpiryId(null)}>Cancel</Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              {acc.expires_at ? format(new Date(acc.expires_at), 'MMM d, yyyy') : 'Never'}
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 px-2 text-xs text-slate-400 hover:text-white"
                                onClick={() => {
                                  setEditingExpiryId(acc.id);
                                  setExpiryInput(acc.expires_at ? new Date(acc.expires_at).toISOString().split('T')[0] : '');
                                }}
                              >
                                Edit
                              </Button>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {format(new Date(acc.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isCurrent}
                            onClick={() => handleImpersonate(acc.id)}
                            className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
                          >
                            {isCurrent ? 'Current' : 'Enter Workspace'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                  {accounts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                        No workspaces found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {showAddModal && (
        <AddUserModal 
          accounts={accounts} 
          onClose={() => setShowAddModal(false)} 
          onSuccess={() => {
            setShowAddModal(false);
            loadAccounts();
          }} 
        />
      )}

      {viewingMembersAcc && (
        <ViewMembersModal 
          accountId={viewingMembersAcc.id}
          accountName={viewingMembersAcc.name}
          onClose={() => setViewingMembersAcc(null)}
        />
      )}
    </div>
  );
}
