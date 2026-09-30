"use client";

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { Registration } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { QrScannerModal } from '@/components/attendance/QrScannerModal';
import { Calendar, MapPin, Clock, QrCode, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function MyActivitiesPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [filter, setFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const fetchRegistrations = () => {
    setIsLoading(true);
    ApiClient.get<Registration[]>('/registrations/my')
      .then((data) => setRegistrations(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleCancelRegistration = async (regId: string) => {
    if (!confirm('Are you sure you wish to cancel this registration?')) return;
    try {
      await ApiClient.delete(`/registrations/${regId}`);
      toast.info('Registration cancelled');
      fetchRegistrations();
    } catch (err: any) {
      toast.error('Failed to cancel registration', { description: err.message });
    }
  };

  const filtered = registrations.filter((r) => {
    if (filter === 'all') return true;
    return r.status.toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="h-4 w-4" />
            <span>My Extracurricular Schedule</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            My Activities & Registrations
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Track your approval status, upcoming sessions, and record attendance check-ins.
          </p>
        </div>

        <Button onClick={() => setIsQrModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md">
          <QrCode className="mr-1.5 h-4 w-4" /> Scan Attendance QR
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border/80 pb-3">
        {['all', 'Approved', 'Pending', 'Completed', 'Waitlisted'].map((st) => (
          <button
            key={st}
            onClick={() => setFilter(st)}
            className={`rounded-full px-3.5 py-1 text-xs font-bold capitalize transition-colors ${
              filter === st
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            {st} {st !== 'all' && `(${registrations.filter((r) => r.status.toLowerCase() === st.toLowerCase()).length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-muted/40 animate-pulse border border-border" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground text-xs">
          No registrations found in this category.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((reg) => (
            <div
              key={reg.id}
              className="flex flex-col md:flex-row items-start md:items-center justify-between rounded-2xl border border-border bg-card p-5 gap-4 shadow-sm hover:border-primary-500/40 transition-colors"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      reg.status === 'Approved'
                        ? 'success'
                        : reg.status === 'Pending'
                        ? 'warning'
                        : reg.status === 'Waitlisted'
                        ? 'destructive'
                        : 'secondary'
                    }
                  >
                    {reg.status}
                  </Badge>
                  {reg.category_name && (
                    <span className="text-[11px] font-semibold text-muted-foreground">
                      {reg.category_name}
                    </span>
                  )}
                  <span className="text-muted-foreground/40">•</span>
                  <span className="text-[11px] text-muted-foreground">
                    Applied {formatDate(reg.registration_date)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-foreground">{reg.activity_title}</h3>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary-500" />
                    <span>{formatDate(reg.date || '')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary-500" />
                    <span>{reg.start_time} - {reg.end_time}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" />
                    <span>{reg.location}</span>
                  </div>
                </div>

                {reg.review_notes && (
                  <p className="text-xs bg-muted/60 rounded-lg p-2 text-foreground/80 mt-1">
                    <span className="font-bold">Adviser Note:</span> {reg.review_notes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                {reg.status === 'Approved' && (
                  <Button
                    size="sm"
                    onClick={() => setIsQrModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold w-full md:w-auto text-xs"
                  >
                    <QrCode className="mr-1.5 h-3.5 w-3.5" /> Check In
                  </Button>
                )}
                {reg.status !== 'Completed' && reg.status !== 'Cancelled' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCancelRegistration(reg.id)}
                    className="text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 w-full md:w-auto"
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Cancel
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onSuccess={fetchRegistrations}
      />
    </div>
  );
}
