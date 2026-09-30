"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ApiClient } from '@/lib/api';
import { Activity, Registration } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Calendar,
  ClipboardCheck,
  CalendarCheck2,
  Users,
  PlusCircle,
  FileCheck,
  Megaphone,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [pendingRegistrations, setPendingRegistrations] = useState<Registration[]>([]);
  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      ApiClient.get<any>('/analytics/teacher').catch(() => null),
      ApiClient.get<Registration[]>('/registrations?status=Pending').catch(() => []),
      ApiClient.get<Activity[]>('/activities').catch(() => []),
    ]).then(([tchStats, regs, acts]) => {
      setStats(tchStats);
      setPendingRegistrations(regs || []);
      setMyActivities(acts || []);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleReviewRegistration = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await ApiClient.put(`/registrations/${id}/status`, { status });
      toast.success(`Registration marked as ${status}`);
      loadData();
    } catch (err: any) {
      toast.error('Failed to update registration', { description: err.message });
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-900 via-indigo-900 to-sky-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <span className="rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-semibold text-sky-200 border border-white/10">
              Faculty Adviser & Teacher Portal
            </span>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight mt-2">
              Welcome, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-xs sm:text-sm text-sky-100 mt-1 max-w-xl">
              {user?.teacher?.title} • {user?.teacher?.department} • Employee ID: {user?.teacher?.employee_id}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link href="/teacher/activities">
              <Button size="sm" className="bg-sky-500 hover:bg-sky-600 font-bold shadow-lg shadow-sky-500/25">
                <PlusCircle className="mr-1.5 h-4 w-4" /> Create Activity
              </Button>
            </Link>
            <Link href="/teacher/attendance">
              <Button size="sm" variant="secondary" className="font-semibold bg-white/20 hover:bg-white/30 text-white border-0">
                <CalendarCheck2 className="mr-1.5 h-4 w-4" /> Record Attendance
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">My Activities</p>
          <p className="text-3xl font-black text-foreground mt-1">{myActivities.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Advising & Supervised</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Pending Reviews</p>
          <p className="text-3xl font-black text-amber-500 mt-1">{pendingRegistrations.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Awaiting teacher signoff</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Today's Sessions</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">2 Active</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Ready for QR check-in</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Participating Students</p>
          <p className="text-3xl font-black text-primary-600 mt-1">84</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Across sanctioned clubs</p>
        </div>
      </div>

      {/* 2-Column Split: Pending Registrations & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Pending Registrations Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-amber-500" />
                Pending Registrations Awaiting Action
              </h2>
              <p className="text-xs text-muted-foreground">
                Review eligibility and confirm participant enrollments
              </p>
            </div>
            <Link href="/teacher/registrations" className="text-xs font-bold text-primary-600 hover:underline">
              View All
            </Link>
          </div>

          {pendingRegistrations.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              All registrations have been reviewed. Outstanding job!
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRegistrations.slice(0, 4).map((reg) => (
                <div
                  key={reg.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl border border-border bg-card p-4 gap-4 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground text-sm">
                        {reg.first_name} {reg.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        ({reg.student_id_number})
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {reg.grade_level} • Section {reg.section} • Applying for <span className="font-semibold text-foreground">{reg.activity_title}</span>
                    </p>
                    <span className="text-[10px] text-muted-foreground/80 block">
                      Submitted {formatDate(reg.registration_date)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      onClick={() => handleReviewRegistration(reg.id, 'Approved')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex-1 sm:flex-none"
                    >
                      <CheckCircle className="mr-1 h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReviewRegistration(reg.id, 'Rejected')}
                      className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex-1 sm:flex-none"
                    >
                      <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Quick Actions Menu */}
        <div className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Faculty Quick Operations
            </h3>

            <div className="space-y-2.5">
              <Link href="/teacher/activities" className="block">
                <Button variant="outline" className="w-full justify-start text-xs font-semibold h-11">
                  <PlusCircle className="mr-2 h-4 w-4 text-sky-500" />
                  Create New Activity
                </Button>
              </Link>
              <Link href="/teacher/attendance" className="block">
                <Button variant="outline" className="w-full justify-start text-xs font-semibold h-11">
                  <CalendarCheck2 className="mr-2 h-4 w-4 text-emerald-500" />
                  Launch Session Attendance QR
                </Button>
              </Link>
              <Link href="/teacher/students" className="block">
                <Button variant="outline" className="w-full justify-start text-xs font-semibold h-11">
                  <FileCheck className="mr-2 h-4 w-4 text-amber-500" />
                  Issue Certificate of Merit
                </Button>
              </Link>
              <Link href="/announcements" className="block">
                <Button variant="outline" className="w-full justify-start text-xs font-semibold h-11">
                  <Megaphone className="mr-2 h-4 w-4 text-indigo-500" />
                  Post Club Announcement
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
