"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ApiClient } from '@/lib/api';
import { User, UserRole } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Users, Search, UserCheck, UserX, Shield, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = () => {
    setIsLoading(true);
    ApiClient.get<User[]>('/users', {
      search,
      role: roleFilter !== 'all' ? roleFilter : undefined,
    })
      .then((data) => setUsers(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter]);

  const handleToggleStatus = async (userItem: User) => {
    const newStatus = userItem.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await ApiClient.put(`/users/${userItem.id}/status`, { status: newStatus });
      toast.success(`User marked as ${newStatus}`);
      fetchUsers();
    } catch (err: any) {
      toast.error('Failed to update status', { description: err.message });
    }
  };

  const roleVariants: Record<string, any> = {
    ADMINISTRATOR: 'destructive',
    TEACHER: 'info',
    STUDENT: 'success',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
          <Users className="h-4 w-4" />
          <span>User & Role Governance</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          System Users & Identity Management
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Manage accounts, institutional roles, and portal authorization across Centrala National High School.
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search users by name, email, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="w-full sm:w-48 rounded-xl border border-input bg-background p-2 text-xs text-foreground"
        >
          <option value="all">All Roles</option>
          <option value="STUDENT">Students</option>
          <option value="TEACHER">Teachers & Advisers</option>
          <option value="ADMINISTRATOR">Administrators</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Registered Accounts ({users.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">No accounts match your query.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Identity / Department</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {users.map((u: any) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <p>{u.first_name} {u.last_name}</p>
                      <p className="text-[11px] font-normal text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={roleVariants[u.role] || 'secondary'}>
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {u.role === 'STUDENT' ? (
                        <>
                          <p className="font-semibold text-foreground">{u.grade_level} - {u.section}</p>
                          <p className="font-mono text-[10px]">LRN: {u.student_id_number}</p>
                        </>
                      ) : u.role === 'TEACHER' ? (
                        <>
                          <p className="font-semibold text-foreground">{u.teacher_title || 'Faculty'}</p>
                          <p className="text-[10px]">{u.teacher_department}</p>
                        </>
                      ) : (
                        <p className="font-semibold text-foreground">School Administration</p>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleStatus(u)}
                        className={`text-xs h-8 ${
                          u.status === 'ACTIVE'
                            ? 'text-rose-600 hover:border-rose-400'
                            : 'text-emerald-600 hover:border-emerald-400'
                        }`}
                      >
                        {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </Button>
                      {u.role === 'STUDENT' && u.student_id && (
                        <Link href={`/portfolio/${u.student_id}`} target="_blank">
                          <Button size="sm" variant="ghost" className="text-xs h-8">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}
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
