"use client";

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { CalendarCheck2, Download, Search, CheckCircle2, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminAttendancePage() {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    // Fetch attendance history via student stats or direct endpoint
    ApiClient.get<{ stats: any; history: any[] }>('/attendance/student/std-01')
      .then((data) => {
        setRecords(data?.history || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleExport = async () => {
    try {
      const csvData = await ApiClient.get<string>('/analytics/export/attendance');
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cnhs_attendance_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success('Attendance report exported as CSV!');
    } catch (err: any) {
      toast.error('Failed to export report', { description: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarCheck2 className="h-4 w-4" />
            <span>Attendance Master Registry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            School-Wide Attendance Supervision
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Official records of student session attendances, QR scan check-ins, and tardiness logs.
          </p>
        </div>

        <Button onClick={handleExport} className="font-bold shadow-md">
          <Download className="mr-1.5 h-4 w-4" /> Export Complete Attendance CSV
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Recent Attendance Check-in Logs
          </h3>
          <span className="text-xs text-muted-foreground font-semibold">
            {records.length} Logs Displayed
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading attendance records...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">Activity & Session</th>
                  <th className="py-3 px-4">Session Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Check-in Time</th>
                  <th className="py-3 px-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <p>{r.activity_title}</p>
                      <p className="text-[11px] font-normal text-muted-foreground">{r.session_title}</p>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <p className="font-semibold text-foreground">{formatDate(r.session_date)}</p>
                      <p className="text-[10px]">{r.start_time} - {r.end_time}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={r.status === 'Present' ? 'success' : r.status === 'Late' ? 'warning' : 'destructive'}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[10px] font-bold text-muted-foreground">
                      {r.check_in_method === 'qr_scan' ? 'QR Code Scan' : 'Manual'}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {r.check_in_time ? formatDate(r.check_in_time) : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground italic">
                      {r.notes || '—'}
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
