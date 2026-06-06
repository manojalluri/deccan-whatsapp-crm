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

export function AgencyTab() {
  const [accounts, setAccounts] = useState<AgencyAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingExpiryId, setEditingExpiryId] = useState<string | null>(null);
  const [expiryInput, setExpiryInput] = useState<string>('');
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
        <CardHeader>
          <CardTitle className="text-white">Agency Workspaces</CardTitle>
          <CardDescription className="text-slate-400">
            You are an Agency Owner. From here, you can see all client accounts on this server and instantly enter their workspace.
          </CardDescription>
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
                          {acc.memberCount}
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
    </div>
  );
}
