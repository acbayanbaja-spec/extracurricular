"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Compass,
  Sparkles,
  Calendar,
  Clock,
  Award,
  FileCheck,
  User,
  Megaphone,
  Bell,
  ClipboardCheck,
  CalendarCheck2,
  Users,
  ShieldCheck,
  ChevronRight,
  School,
  X,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ isMobileOpen = false, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const adminNav = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Activities', href: '/admin/activities', icon: Compass },
    { name: 'Registrations', href: '/admin/registrations', icon: ClipboardCheck },
    { name: 'Attendance', href: '/admin/attendance', icon: CalendarCheck2 },
    { name: 'Users & Roles', href: '/admin/users', icon: Users },
    { name: 'Announcements', href: '/announcements', icon: Megaphone },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldCheck },
  ];

  const teacherNav = [
    { name: 'Dashboard', href: '/teacher', icon: LayoutDashboard },
    { name: 'My Activities', href: '/teacher/activities', icon: Calendar },
    { name: 'Registrations', href: '/teacher/registrations', icon: ClipboardCheck },
    { name: 'Attendance', href: '/teacher/attendance', icon: CalendarCheck2 },
    { name: 'Students', href: '/teacher/students', icon: Users },
    { name: 'Announcements', href: '/announcements', icon: Megaphone },
  ];

  const studentNav = [
    { name: 'Dashboard', href: '/student', icon: LayoutDashboard },
    { name: 'Discover Activities', href: '/student/discover', icon: Compass },
    { name: 'Recommended For You', href: '/student/recommended', icon: Sparkles, badge: 'Smart' },
    { name: 'My Activities', href: '/student/my-activities', icon: Calendar },
    { name: 'My Attendance', href: '/student/attendance', icon: Clock },
    { name: 'Badges & Milestones', href: '/student/badges', icon: Award },
    { name: 'Certificates', href: '/student/certificates', icon: FileCheck },
    { name: 'My Portfolio', href: '/student/portfolio', icon: User },
    { name: 'Announcements', href: '/announcements', icon: Megaphone },
  ];

  let items = studentNav;
  if (user?.role === 'ADMINISTRATOR') items = adminNav;
  else if (user?.role === 'TEACHER') items = teacherNav;

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onMobileClose}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-border/80 bg-card p-4 transition-transform duration-200 ease-in-out md:static md:translate-x-0 flex flex-col justify-between',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div>
          {/* Header in mobile */}
          <div className="flex items-center justify-between pb-4 mb-2 md:hidden border-b border-border">
            <span className="font-extrabold text-sm text-foreground">Menu Navigation</span>
            <button
              onClick={onMobileClose}
              className="p-1 rounded-lg text-muted-foreground hover:bg-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Role Indicator Tag */}
          <div className="mb-4 px-2 py-2 rounded-xl bg-muted/50 border border-border/60">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Portal View</p>
            <p className="text-xs font-bold text-foreground capitalize">
              {user?.role ? `${user.role.toLowerCase()} Portal` : 'Guest'}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/student' && item.href !== '/teacher' && item.href !== '/admin' && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onMobileClose}
                  className={cn(
                    'group flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150',
                    isActive
                      ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/25'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-muted-foreground group-hover:text-foreground')} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={cn(
                      'text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full',
                      isActive ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    )}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="pt-4 border-t border-border/70 px-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2 mb-1 text-foreground font-semibold">
            <School className="h-3.5 w-3.5 text-primary-600" />
            <span>Centrala National High</span>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Surallah, South Cotabato
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            S.Y. 2026-2027 • v1.0.0
          </p>
        </div>
      </aside>
    </>
  );
}
