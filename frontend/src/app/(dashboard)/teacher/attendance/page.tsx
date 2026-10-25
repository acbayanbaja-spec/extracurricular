"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  ExternalLink,
  ShieldAlert,
  RefreshCw,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { realtimeSync } from '@/lib/realtime';
import { useAuth } from '@/context/AuthContext';

const PRESENT_STATES = ['Present', 'Late'];

export default function TeacherAttendancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [sessions, setSessions] = useState<AttendanceSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionData, setSessionData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);
  const [autoOpenQr, setAutoOpenQr] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [justArrived, setJustArrived] = useState<string[]>([]);

  // Learners already known to be checked in, so a poll only flashes genuine new arrivals.
  const knownPresent = useRef<Set<string> | null>(null);

  const fetchSessions = (activityId: string) => {
    if (!activityId) return;
    setSessionsLoaded(false);
    ApiClient.get<AttendanceSession[]>(`/attendance/sessions/${activityId}`).then((sess) => {
      const list = sess || [];
      setSessions(list);
      // Never clobber the session the adviser just opened — the projected QR must match the roster.
      setSelectedSessionId((prev) =>
        prev && list.some((s) => s.id === prev) ? prev : list.length > 0 ? list[0].id : ''
      );
      setSessionsLoaded(true);
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

  const loadSessionRoster = useCallback(async (silent = false) => {
    if (!selectedSessionId) return;
    if (!silent) setIsLoading(true);
    try {
      const data = await ApiClient.get<any>(`/attendance/session/${selectedSessionId}`);
      const records: any[] = data?.records || [];
      const presentNow = new Set(
        records.filter((r) => PRESENT_STATES.includes(r.status)).map((r) => String(r.student_id))
      );

      if (knownPresent.current) {
        const arrivals = records.filter(
          (r) => PRESENT_STATES.includes(r.status) && !knownPresent.current!.has(String(r.student_id))
        );
        if (arrivals.length > 0) {
          setJustArrived(arrivals.map((r) => String(r.student_id)));
          for (const r of arrivals.slice(0, 3)) {
            const viaQr = r.check_in_method === 'qr_scan';
            toast.success(`${r.first_name} ${r.last_name}`.trim() + ` is ${r.status}`, {
              description: viaQr ? 'Checked in by scanning the session QR' : 'Marked by roll call',
            });
          }
          if (arrivals.length > 3) toast.success(`${arrivals.length - 3} more learners checked in`);
        }
      }
      knownPresent.current = presentNow;
      setSessionData(data);
      setLastSyncedAt(new Date());
    } catch {
      /* keep the last good roster on screen */
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    knownPresent.current = null;
    setJustArrived([]);
    loadSessionRoster();
  }, [loadSessionRoster]);

  // The learner scans on their own phone, so cross-device updates need a poll —
  // BroadcastChannel only reaches tabs open in this same browser.
  useEffect(() => {
    if (!selectedSessionId) return;
    const timer = window.setInterval(() => loadSessionRoster(true), isQrModalOpen ? 4000 : 10000);
    return () => window.clearInterval(timer);
  }, [selectedSessionId, isQrModalOpen, loadSessionRoster]);

  useEffect(() => {
    if (justArrived.length === 0) return;
    const clear = window.setTimeout(() => setJustArrived([]), 4000);
    return () => window.clearTimeout(clear);
  }, [justArrived]);

  // Real-time listener: instant refresh for check-ins made in another tab of this browser
  useEffect(() => {
    const unsubscribe = realtimeSync.subscribe((msg) => {
      if (msg.type === 'ATTENDANCE_CHECKED_IN' || msg.type === 'ATTENDANCE_MARKED') {
        loadSessionRoster(true);
      }
    });
    return () => unsubscribe();
  }, [loadSessionRoster]);

  // Catch up the moment the adviser returns to the tab
  useEffect(() => {
    const wake = () => {
      if (document.visibilityState === 'visible') loadSessionRoster(true);
    };
    window.addEventListener('focus', wake);
    document.addEventListener('visibilitychange', wake);
    return () => {
      window.removeEventListener('focus', wake);
      document.removeEventListener('visibilitychange', wake);
    };
  }, [loadSessionRoster]);

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

  // Arriving from the adviser dashboard shortcut: open the projector as soon as this
  // page knows the adviser's real session, so the code shown always matches this roster.
  useEffect(() => {
    setAutoOpenQr(new URLSearchParams(window.location.search).get('live') === '1');
  }, []);

  useEffect(() => {
    if (!autoOpenQr || !selectedActivityId || !sessionsLoaded) return;
    setAutoOpenQr(false);
    if (window.location.search.includes('live=1')) router.replace('/teacher/attendance');
    void handleQuickLaunchQR();
  }, [autoOpenQr, selectedActivityId, sessionsLoaded]);

  const handleMarkStatus = async (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    if (!selectedSessionId) {
      toast.error('Select a session first', { description: 'Attendance is recorded per session, never against a placeholder.' });
      return;
    }
    try {
      await ApiClient.post('/attendance/mark', {
        sessionId: selectedSessionId,
        activityId: selectedActivityId,
        studentId,
        status,
      });
      toast.success(`Marked as ${status}`);

      realtimeSync.broadcast('ATTENDANCE_MARKED', { studentId, status, activityId: selectedActivityId }, user ? `${user.firstName} ${user.lastName}`.trim() : 'Activity Adviser', 'TEACHER');

      if (knownPresent.current) {
        if (PRESENT_STATES.includes(status)) knownPresent.current.add(String(studentId));
        else knownPresent.current.delete(String(studentId));
      }

      // Optimistic update in table
      if (sessionData && sessionData.records) {
        setSessionData({
          ...sessionData,
          records: sessionData.records.map((r: any) =>
            r.student_id === studentId ? { ...r, status, check_in_time: new Date().toISOString() } : r
          ),
        });
      }
      void loadSessionRoster(true);
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
        <div className="p-4 sm:p-5 border-b border-border flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Student Attendance Roster
            </h3>
            {selectedSessionId && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                Live{lastSyncedAt ? ` · synced ${lastSyncedAt.toLocaleTimeString([], { hour12: false })}` : ''}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {sessionData?.session && (
              <span className="text-xs text-muted-foreground font-semibold">
                {formatDate(sessionData.session.session_date)} • {sessionData.session.start_time} - {sessionData.session.end_time}
              </span>
            )}
            <button
              onClick={() => loadSessionRoster()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-input px-2.5 py-1.5 text-[11px] font-bold text-foreground hover:bg-muted/60"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
        </div>

        {(() => {
          const recs: any[] = sessionData?.records || [];
          if (recs.length === 0) return null;
          const present = recs.filter((r) => r.status === 'Present').length;
          const late = recs.filter((r) => r.status === 'Late').length;
          const scans = recs.filter((r) => r.check_in_method === 'qr_scan' && PRESENT_STATES.includes(r.status)).length;
          const stats = [
            { label: 'On the roster', value: recs.length, tone: 'text-foreground' },
            { label: 'Present', value: present, tone: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Late', value: late, tone: 'text-amber-600 dark:text-amber-400' },
            { label: 'Not yet checked in', value: recs.length - present - late, tone: 'text-rose-600 dark:text-rose-400' },
          ];
          return (
            <div className="px-4 sm:px-5 py-3 border-b border-border grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-2xl bg-muted/40 px-3 py-2">
                  <p className={`text-lg font-black leading-none ${s.tone}`}>{s.value}</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{s.label}</p>
                </div>
              ))}
              <p className="col-span-full text-[10px] text-muted-foreground">
                {scans} check-in{scans === 1 ? '' : 's'} verified by QR scan this session · new arrivals appear here automatically.
              </p>
            </div>
          );
        })()}

        {(sessionData?.siblingSessions || []).length > 0 && (
          <div className="px-4 sm:px-5 py-3 border-b border-border bg-sky-50/70 dark:bg-sky-950/20 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-sky-900 dark:text-sky-200">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
            <span className="font-bold">Check-ins recorded on another session of this activity:</span>
            {sessionData.siblingSessions.map((s: any) => (
              <button
                key={s.id}
                onClick={() => setSelectedSessionId(s.id)}
                className="font-bold underline underline-offset-2 hover:opacity-80"
              >
                {s.session_title} ({formatDate(s.session_date)}) — {s.present_count} present
              </button>
            ))}
          </div>
        )}

        {(() => {
          const onHold = (sessionData?.records || []).filter(
            (r: any) => !['Approved', 'Completed'].includes(r.enrolment_status)
          );
          if (onHold.length === 0) return null;
          const scanned = onHold.filter((r: any) => PRESENT_STATES.includes(r.status));
          const heldNames = scanned.map((r: any) => `${r.first_name} ${r.last_name}`.trim() || r.student_id_number).slice(0, 3);
          return (
            <div className="px-4 sm:px-5 py-3 border-b border-border bg-amber-50/70 dark:bg-amber-950/20 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-amber-900 dark:text-amber-200">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="font-bold">{onHold.length} learner(s) still awaiting approval.</span>
              {scanned.length > 0 && (
                <span>
                  {heldNames.join(', ')}
                  {scanned.length > heldNames.length ? ` and ${scanned.length - heldNames.length} more` : ''} already
                  checked in — approve {scanned.length === 1 ? 'their registration' : 'their registrations'} to bank{' '}
                  {scanned.length === 1 ? 'their' : 'their'} growth points.
                </span>
              )}
              <Link href="/teacher/registrations" className="font-bold underline underline-offset-2">
                Review now
              </Link>
            </div>
          );
        })()}

        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading session roster...</div>
        ) : !sessionData || !sessionData.records || sessionData.records.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-xs text-muted-foreground">
              Nobody has registered for this activity yet, so there is no roster to check in.
            </p>
            <p className="mx-auto max-w-md text-[11px] leading-relaxed text-muted-foreground/80">
              A learner appears here the moment they register or scan the session QR — no refresh needed.
            </p>
            <Link
              href="/teacher/registrations"
              className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-[11px] font-bold text-foreground hover:bg-muted/60"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Review registrations
            </Link>
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
                  <tr
                    key={r.student_id}
                    className={`transition-colors ${
                      justArrived.includes(String(r.student_id))
                        ? 'cnhs-checkin-arrive'
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <p>{r.first_name} {r.last_name}</p>
                      <p className="text-[11px] font-normal text-muted-foreground">{r.email || '—'}</p>
                      {!['Approved', 'Completed'].includes(r.enrolment_status) && (
                        <Badge
                          variant={r.enrolment_status === 'Pending' ? 'warning' : r.enrolment_status === 'Walk-in' ? 'secondary' : 'destructive'}
                          className="mt-1.5 text-[9px]"
                        >
                          <ShieldAlert className="mr-1 h-2.5 w-2.5" />
                          {r.enrolment_status === 'Walk-in' ? 'Scanned without registering — points on hold' : `${r.enrolment_status} — points on hold`}
                        </Badge>
                      )}
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
