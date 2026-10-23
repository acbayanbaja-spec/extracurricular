"use client";

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { Activity, AttendanceSession } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { QrDisplayModal } from '@/components/attendance/QrDisplayModal';
import {
  CalendarCheck2,
  QrCode,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { realtimeSync } from '@/lib/realtime';

export default function TeacherAttendancePage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const fetchSessions = (activityId: string) => {
    if (!activityId) return;
    ApiClient.get<AttendanceSession[]>(`/attendance/sessions/${activityId}`).then((sess) => {
      setSessions(sess || []);
      if (sess && sess.length > 0) {
        setSelectedSessionId(sess[0].id);
      }
    });
  };

  useEffect(() => {
    ApiClient.get<Activity[]>('/activities').then((acts) => {
      setActivities(acts || []);
      if (acts && acts.length > 0) {
        setSelectedActivityId(acts[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedActivityId) {
      fetchSessions(selectedActivityId);
    }
  }, [selectedActivityId]);

  const loadSessionRoster = () => {
    if (!selectedSessionId) return;
    setIsLoading(true);
    ApiClient.get<any>(`/attendance/session/${selectedSessionId}`)
      .then((data) => setSessionData(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadSessionRoster();
  }, [selectedSessionId]);

  // Real-time listener: when any student checks in via QR, instantly update the roster
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe((msg) => {
      if (msg.type === 'ATTENDANCE_CHECKED_IN') {
        loadSessionRoster();
      }
    });
    return () => unsubscribe();
  }, [selectedSessionId]);

  const handleQuickLaunchQR = async () => {
    if (!selectedActivityId) return;
    if (selectedSessionId) {
      setIsQrModalOpen(true);
      return;
    }

    try {
      const act = activities.find((a) => a.id === selectedActivityId);
      const res = await ApiClient.post<{ id: string }>('/attendance/sessions', {
        activityId: selectedActivityId,
        sessionTitle: act ? `${act.title} - Live Session` : 'Active Attendance Session',
        sessionDate: act?.date || new Date().toISOString().split('T')[0],
        startTime: act?.start_time || '08:00 AM',
        endTime: act?.end_time || '12:00 PM',
      });
      toast.success('Session created! Opening Live QR...');
      setSelectedSessionId(res.id);
      setIsQrModalOpen(true);
      fetchSessions(selectedActivityId);
    } catch (err: any) {
      toast.error('Failed to create session', { description: err.message });
    }
  };

  const handleMarkStatus = async (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    try {
      await ApiClient.post('/attendance/mark', {
        sessionId: selectedSessionId || 'ses-01',
        activityId: selectedActivityId || 'act-01',
        studentId,
        status,
      });
      toast.success(`Marked as ${status}`);

      realtimeSync.broadcast('ATTENDANCE_MARKED', { studentId, status, activityId: selectedActivityId }, 'Javidec Monsion', 'TEACHER');

      // Optimistic update in table
      if (sessionData && sessionData.records) {
        setSessionData({
          ...sessionData,
          records: sessionData.records.map((r: any) =>
            r.student_id === studentId ? { ...r, status, check_in_time: new Date().toISOString() } : r
          ),
        });
      }
    } catch (err: any) {
      toast.error('Failed to update attendance', { description: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarCheck2 className="h-4 w-4" />
            <span>Attendance Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Session Attendance & QR Verification
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Take roll-call attendance or project session QR codes for instant student check-in.
          </p>
        </div>

        <Button
          onClick={handleQuickLaunchQR}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md hover:scale-[1.02] transition-transform"
        >
          <QrCode className="mr-1.5 h-4 w-4" /> Present Live Session QR
        </Button>
      </div>

      {/* Select Activity & Session Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-3xl border border-border bg-card p-5 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-foreground mb-1">Select Activity</label>
          <select
            value={selectedActivityId}
            onChange={(e) => setSelectedActivityId(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground font-semibold"
          >
            {activities.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-foreground mb-1">Select Session Date</label>
          <select
            value={selectedSessionId}
            onChange={(e) => setSelectedSessionId(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground font-semibold"
            disabled={sessions.length === 0}
          >
            {sessions.length === 0 ? (
              <option value="">No sessions scheduled</option>
            ) : (
              sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.session_title} ({formatDate(s.session_date)})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Session Roster */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Student Attendance Roster
          </h3>
          {sessionData?.session && (
            <span className="text-xs text-muted-foreground font-semibold">
              {formatDate(sessionData.session.session_date)} • {sessionData.session.start_time} - {sessionData.session.end_time}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading session roster...</div>
        ) : !sessionData || !sessionData.records || sessionData.records.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No approved students in this activity session.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">LRN / Section</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Check-in Time</th>
                  <th className="py-3 px-4 text-right">Quick Mark Attendance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {sessionData.records.map((r: any) => (
                  <tr key={r.student_id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <p>{r.first_name} {r.last_name}</p>
                      <p className="text-[11px] font-normal text-muted-foreground">{r.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <p className="font-semibold text-foreground">{r.grade_level} - {r.section}</p>
                      <p className="font-mono text-[10px]">LRN: {r.student_id_number}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          r.status === 'Present'
                            ? 'success'
                            : r.status === 'Late'
                            ? 'warning'
                            : r.status === 'Absent'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {r.status || 'Absent'}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {r.check_in_time ? formatDate(r.check_in_time) : '—'}
                      {r.check_in_method === 'qr_scan' && (
                        <span className="ml-1 text-[10px] text-primary-600 font-bold">(QR Scan)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <button
                        onClick={() => handleMarkStatus(r.student_id, 'Present')}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                          r.status === 'Present'
                            ? 'bg-emerald-600 text-white'
                            : 'border border-emerald-500/40 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                        }`}
                      >
                        Present
                      </button>
                      <button
                        onClick={() => handleMarkStatus(r.student_id, 'Late')}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                          r.status === 'Late'
                            ? 'bg-amber-500 text-white'
                            : 'border border-amber-500/40 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                        }`}
                      >
                        Late
                      </button>
                      <button
                        onClick={() => handleMarkStatus(r.student_id, 'Absent')}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors ${
                          r.status === 'Absent'
                            ? 'bg-rose-600 text-white'
                            : 'border border-rose-500/40 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                        }`}
                      >
                        Absent
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Projection Modal */}
      {selectedSessionId && (
        <QrDisplayModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          sessionId={selectedSessionId}
          sessionTitle={sessionData?.session?.session_title || 'Activity Session'}
        />
      )}
    </div>
  );
}
