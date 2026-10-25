"use client";

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { AttendanceRecord, AttendanceStats } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { QrScannerModal } from '@/components/attendance/QrScannerModal';
import {
  Clock,
  QrCode,
  Flame,
  CheckCircle2,
  CalendarClock,
  AlertTriangle,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { realtimeSync } from '@/lib/realtime';

function rateTone(rate: number) {
  if (rate >= 95) return { label: 'Excellent standing', cls: 'text-emerald-600 dark:text-emerald-400' };
  if (rate >= 85) return { label: 'Good standing', cls: 'text-primary-600 dark:text-primary-400' };
  if (rate >= 75) return { label: 'Needs improvement', cls: 'text-amber-600 dark:text-amber-400' };
  return { label: 'At risk', cls: 'text-rose-600 dark:text-rose-400' };
}

export default function StudentAttendancePage() {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const fetchAttendance = () => {
    setIsLoading(true);
    ApiClient.get<{ stats: AttendanceStats; history: AttendanceRecord[] }>('/attendance/my')
      .then((data) => {
        setStats(data.stats);
        setHistory(data.history || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAttendance();
    const interval = setInterval(fetchAttendance, 20000);
    const unsubscribe = realtimeSync.subscribe((msg) => {
      if (msg.type === 'ATTENDANCE_MARKED' || msg.type === 'ATTENDANCE_CHECKED_IN') {
        fetchAttendance();
      }
    });
    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const tone = rateTone(stats?.attendanceRate ?? 0);
  const scheduled = stats?.scheduled ?? history.filter((h: any) => h.status === 'Scheduled').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Clock className="h-4 w-4" />
            <span>Attendance & Participation Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            My Attendance Record
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Official extracurricular attendance logs validated by Centrala National High School.
          </p>
        </div>

        <Button
          onClick={() => setIsQrModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md"
        >
          <QrCode className="mr-1.5 h-4 w-4" /> Scan Session QR Code
        </Button>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Attendance %</p>
          <p className="text-3xl font-black text-foreground mt-1">
            {(stats?.attendanceRate ?? 0).toFixed(1)}%
          </p>
          <span className={`text-[11px] font-semibold flex items-center gap-1 mt-0.5 ${tone.cls}`}>
            <CheckCircle2 className="h-3 w-3" /> {tone.label}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Streak</p>
          <p className="text-3xl font-black text-amber-500 mt-1 flex items-center gap-1.5">
            <Flame className="h-6 w-6 fill-amber-500" />
            {stats?.streakCount ?? 0}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5">Consecutive sessions</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Present</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">{stats?.present ?? 0}</p>
          <span className="text-[11px] text-muted-foreground mt-0.5">of {stats?.totalSessions ?? 0} held sessions</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Late / Absent</p>
          <p className="text-3xl font-black text-foreground mt-1">
            <span className="text-amber-500">{stats?.late ?? 0}</span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-rose-600">{stats?.absent ?? 0}</span>
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5">Needs adviser attention</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Growth Points</p>
          <p className="text-3xl font-black text-primary-600 mt-1 flex items-center gap-1">
            <TrendingUp className="h-5 w-5" />
            {stats?.totalPoints ?? 0}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5">
            {scheduled > 0 ? `${scheduled} upcoming session${scheduled > 1 ? 's' : ''}` : 'No upcoming sessions'}
          </span>
        </div>
      </div>

      {/* History Log Table */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border/80 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Activity Session Attendance Log
          </h3>
          <span className="text-xs text-muted-foreground font-semibold">
            {history.length} Sessions Logged
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading attendance log...</div>
        ) : history.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarClock className="h-9 w-9 text-muted-foreground/60 mx-auto mb-2" />
            <p className="text-sm font-bold text-foreground">No sessions yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Once your adviser opens a session for an activity you are enrolled in, it appears here.
              Scan the live QR code on the day to record your attendance.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">Activity & Session</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Check-in Method</th>
                  <th className="py-3 px-4">Recorded Time</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <p>{record.activity_title}</p>
                      <p className="text-[11px] font-normal text-muted-foreground">
                        {record.session_title}
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <p className="font-medium text-foreground">{formatDate(record.session_date || '')}</p>
                      <p className="text-[10px]">{record.start_time} - {record.end_time}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          record.status === 'Present'
                            ? 'success'
                            : record.status === 'Late'
                            ? 'warning'
                            : record.status === 'Absent'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {record.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-muted-foreground">
                      {record.status === 'Scheduled' ? (
                        <button
                          onClick={() => setIsQrModalOpen(true)}
                          className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/40 px-2.5 py-1 text-[10px] font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors normal-case"
                        >
                          <QrCode className="h-3 w-3" /> Scan when open
                        </button>
                      ) : record.check_in_method === 'qr_scan' ? (
                        <span className="flex items-center gap-1 text-primary-600 font-bold">
                          <QrCode className="h-3 w-3" /> QR Scan
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Adviser record
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {record.check_in_time ? formatDate(record.check_in_time) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground italic max-w-xs truncate">
                      {record.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onSuccess={fetchAttendance}
      />
    </div>
  );
}
