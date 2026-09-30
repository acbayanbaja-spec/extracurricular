"use client";

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, Search, Filter, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = () => {
    setIsLoading(true);
    ApiClient.get<any[]>('/audit-logs', { search })
      .then((data) => setLogs(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
          <ShieldCheck className="h-4 w-4" />
          <span>Security & Accountability</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          System Audit Trail & Event Logs
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Immutable logging of critical actions, logins, registration approvals, and certificate issuance events.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by action, user email, or entity..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-input bg-card pl-10 pr-4 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary-500 shadow-sm"
        />
      </div>

      {/* Audit Log Table */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Activity History ({logs.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading audit log stream...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">No audit logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Operator / User</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-foreground">
                      <span className="rounded bg-muted px-2 py-0.5 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {log.email ? (
                        <>
                          <p className="font-semibold text-foreground">{log.first_name} {log.last_name}</p>
                          <p className="text-[10px] text-muted-foreground">{log.email} ({log.user_role})</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">System Internal</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                      {log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground font-mono text-[10px]">
                      {log.ip_address || '127.0.0.1'}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {formatDate(log.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
