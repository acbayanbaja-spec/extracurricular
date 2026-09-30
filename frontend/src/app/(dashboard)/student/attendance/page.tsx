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
  XCircle,
  AlertTriangle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

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
  }, []);

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
            {stats ? `${stats.attendanceRate}%` : '100%'}
          </p>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
            <CheckCircle2 className="h-3 w-3" /> Excellent Standing
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Streak</p>
          <p className="text-3xl font-black text-amber-500 mt-1 flex items-center gap-1.5">
            <Flame className="h-6 w-6 fill-amber-500" />
            {stats ? stats.streakCount : 0}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5">Consecutive sessions</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Present</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">
            {stats ? stats.present : 0}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5">Sessions attended</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Late</p>
          <p className="text-3xl font-black text-amber-500 mt-1">
            {stats ? stats.late : 0}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5">Checked in with delay</span>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Absent</p>
          <p className="text-3xl font-black text-rose-600 mt-1">
            {stats ? stats.absent : 0}
          </p>
          <span className="text-[11px] text-muted-foreground mt-0.5">Missed sessions</span>
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
          <div className="p-12 text-center text-xs text-muted-foreground">
            No attendance sessions recorded yet. Scan a session QR code or attend an activity to begin!
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
                      {record.check_in_method === 'qr_scan' ? (
                        <span className="flex items-center gap-1 text-primary-600 font-bold">
                          <QrCode className="h-3 w-3" /> QR Scan
                        </span>
                      ) : (
                        'Manual'
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
