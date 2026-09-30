"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { Bell, Menu, GraduationCap, LogOut, User as UserIcon, CheckCheck, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ApiClient } from '@/lib/api';
import { NotificationItem } from '@/types';
import { formatDate } from '@/lib/utils';

interface NavbarProps {
  onMobileMenuToggle?: () => void;
}

export function Navbar({ onMobileMenuToggle }: NavbarProps) {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const fetchNotifications = () => {
    if (!user) return;
    ApiClient.get<{ notifications: NotificationItem[]; unreadCount: number }>('/notifications')
      .then((res) => {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await ApiClient.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    } catch {}
  };

  const roleColorMap = {
    ADMINISTRATOR: 'destructive' as const,
    TEACHER: 'info' as const,
    STUDENT: 'success' as const,
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMobileMenuToggle}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:bg-muted"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-700 to-indigo-500 text-white shadow-md shadow-primary-500/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-foreground">
                  CNHS StudentX
                </span>
                <span className="rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold px-1.5 py-0.2">
                  EASDS
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-tight">
                Centrala National High School • Surallah
              </p>
            </div>
          </Link>
        </div>

        {/* Right: Actions, Notifications, Theme, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifDropdown(!showNotifDropdown);
                setShowUserDropdown(false);
              }}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shadow-sm"
              aria-label="View notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-card p-3 shadow-2xl z-50">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/70 px-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold px-1.5">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1"
                    >
                      <CheckCheck className="h-3 w-3" /> Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1.5 divide-y divide-border/40">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs text-muted-foreground">
                      No notifications at this time
                    </div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div
                        key={n.id}
                        className={`pt-2 pb-1.5 px-2 rounded-lg text-xs transition-colors ${
                          !n.is_read ? 'bg-primary-50/50 dark:bg-primary-950/30' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <p className="font-semibold text-foreground">{n.title}</p>
                          <span className="text-[10px] text-muted-foreground">
                            {formatDate(n.created_at)}
                          </span>
                        </div>
                        <p className="text-muted-foreground text-[11px] line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-border/70 text-center">
                  <Link
                    href="/notifications"
                    onClick={() => setShowNotifDropdown(false)}
                    className="text-xs font-medium text-primary-600 hover:underline inline-flex items-center gap-1"
                  >
                    View all notifications <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Profile */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  setShowNotifDropdown(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-border bg-card p-1.5 hover:bg-accent transition-colors shadow-sm"
              >
                <div className="h-7 w-7 rounded-lg overflow-hidden bg-primary-100 flex items-center justify-center font-bold text-xs text-primary-700">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.firstName} className="h-full w-full object-cover" />
                  ) : (
                    <span>{user.firstName[0]}</span>
                  )}
                </div>
                <div className="hidden md:block text-left pr-2">
                  <p className="text-xs font-bold text-foreground leading-tight">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                    {user.role}
                  </p>
                </div>
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card p-2 shadow-2xl z-50">
                  <div className="px-3 py-2 border-b border-border/70 mb-1">
                    <p className="text-xs font-bold text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                    <div className="mt-1.5">
                      <Badge variant={roleColorMap[user.role]}>
                        {user.role}
                      </Badge>
                    </div>
                  </div>

                  {user.role === 'STUDENT' && (
                    <Link
                      href="/student/portfolio"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs rounded-lg hover:bg-muted text-foreground transition-colors"
                    >
                      <UserIcon className="h-3.5 w-3.5" />
                      <span>My Digital Portfolio</span>
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-primary-700 transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
