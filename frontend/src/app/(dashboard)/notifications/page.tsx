"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ApiClient } from '@/lib/api';
import { NotificationItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Bell, CheckCheck, ExternalLink, Calendar, Award, FileCheck, CheckCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchNotifications = () => {
    setIsLoading(true);
    ApiClient.get<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications')
      .then((data) => {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await ApiClient.put('/notifications/read-all');
      toast.success('All notifications marked as read');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch (err: any) {
      toast.error('Failed to mark notifications', { description: err.message });
    }
  };

  const handleMarkSingleRead = async (id: string) => {
    try {
      await ApiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Bell className="h-4 w-4" />
            <span>Notification Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Activity Alerts & Updates
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time updates regarding registrations, badge achievements, and attendance confirmations.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="font-semibold">
            <CheckCheck className="mr-1.5 h-4 w-4 text-primary-600" />
            Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-full px-3.5 py-1 text-xs font-bold transition-colors ${
            filter === 'all'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`rounded-full px-3.5 py-1 text-xs font-bold transition-colors ${
            filter === 'unread'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 rounded-2xl bg-muted/40 animate-pulse border border-border" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
          No notifications found.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`flex items-start justify-between rounded-2xl border p-4 gap-4 transition-all ${
                !item.is_read
                  ? 'border-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20'
                  : 'border-border bg-card'
              }`}
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground">{item.title}</h4>
                  {!item.is_read && (
                    <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    {formatDate(item.created_at)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.message}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {item.link && (
                  <Link href={item.link}>
                    <Button size="sm" variant="outline" className="text-xs h-8">
                      View <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                )}
                {!item.is_read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleMarkSingleRead(item.id)}
                    className="text-xs h-8 text-muted-foreground hover:text-foreground"
                    title="Mark as read"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
