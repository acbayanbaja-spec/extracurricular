"use client";

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { Registration, Activity } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ClipboardCheck, CheckCircle2, XCircle, Search, Filter, User, Users2, MapPin, Phone, HeartPulse, Sparkles, ShieldCheck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { realtimeSync } from '@/lib/realtime';
import { useAuth } from '@/context/AuthContext';

export default function TeacherRegistrationsPage() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Review modal
  const [activeReg, setActiveReg] = useState<Registration | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'Approved' | 'Rejected' | 'Waitlisted'>('Approved');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRegistrations = () => {
    setIsLoading(true);
    ApiClient.get<Registration[]>('/registrations', {
      activityId: selectedActivity !== 'all' ? selectedActivity : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
    })
      .then((data) => setRegistrations(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchRegistrations();
    ApiClient.get<Activity[]>('/activities').then((acts) => setActivities(acts || []));

    const unsubscribe = realtimeSync.subscribe((msg) => {
      if (msg.type === 'REGISTRATION_SUBMITTED') {
        fetchRegistrations();
      }
    });
    return () => unsubscribe();
  }, [selectedActivity, selectedStatus]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReg) return;

    setIsSubmitting(true);
    try {
      await ApiClient.put(`/registrations/${activeReg.id}/status`, {
        status: reviewStatus,
        reviewNotes,
      });
      toast.success(`Registration marked as ${reviewStatus}`);

      realtimeSync.broadcast(
        'REGISTRATION_REVIEWED',
        {
          id: activeReg.id,
          status: reviewStatus,
          studentName: activeReg.first_name,
          activityTitle: activeReg.activity_title,
        },
        user ? `${user.firstName} ${user.lastName}`.trim() : 'Activity Adviser',
        'TEACHER'
      );

      setActiveReg(null);
      setReviewNotes('');
      fetchRegistrations();
    } catch (err: any) {
      toast.error('Failed to update registration', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
          <ClipboardCheck className="h-4 w-4" />
          <span>Registration Approvals</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Student Registrations Review Center
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Approve or reject participant applications for your assigned clubs and activities.
        </p>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Filter by Activity
          </label>
          <select
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-2 text-xs text-foreground"
          >
            <option value="all">All Activities</option>
            {activities.map((act) => (
              <option key={act.id} value={act.id}>
                {act.title}
              </option>
            ))}
          </select>
        </div>

        <div className="w-48">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
            Filter Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full rounded-xl border border-input bg-background p-2 text-xs text-foreground"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Waitlisted">Waitlisted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Registrations Roster Table */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Applications ({registrations.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading applications...</div>
        ) : registrations.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No registrations found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">LRN / Grade / Section</th>
                  <th className="py-3 px-4">Activity Applied</th>
                  <th className="py-3 px-4">Registration Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <p>{reg.first_name} {reg.last_name}</p>
                      <p className="text-[11px] font-normal text-muted-foreground">{reg.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <p className="font-semibold text-foreground">{reg.grade_level} - {reg.section}</p>
                      <p className="font-mono text-[10px]">LRN: {reg.student_id_number}</p>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-foreground max-w-xs truncate">
                      {reg.activity_title}
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {formatDate(reg.registration_date)}
                    </td>
                    <td className="py-3.5 px-4">
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
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveReg(reg);
                          setReviewStatus('Approved');
                          setReviewNotes(reg.review_notes || '');
                        }}
                        className="text-xs h-8"
                      >
                        Evaluate
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal Dialog */}
      <Modal
        isOpen={!!activeReg}
        onClose={() => setActiveReg(null)}
        maxWidth="2xl"
        title="Review Student Registration"
        description={`Applicant: ${activeReg?.first_name} ${activeReg?.last_name} (${activeReg?.grade_level})`}
      >
        {/* Applicant Declaration Details */}
        {activeReg && (
          <div className="space-y-4 mb-5 rounded-2xl border border-border/80 bg-muted/40 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  <User className="h-3 w-3" /> Learner
                </p>
                <p className="text-xs font-bold text-foreground">{activeReg.participant_name || `${activeReg.first_name} ${activeReg.last_name}`}</p>
                <p className="text-[11px] text-muted-foreground">
                  {activeReg.grade_level} - {activeReg.section} • LRN <span className="font-mono">{activeReg.student_id_number || activeReg.lrn}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">{activeReg.email}</p>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  <Phone className="h-3 w-3" /> Contact & Address
                </p>
                <p className="text-[11px] text-foreground font-medium">{activeReg.contact_number || 'Not provided'}</p>
                <p className="text-[11px] text-muted-foreground flex items-start gap-1">
                  <MapPin className="h-3 w-3 mt-0.5 shrink-0 text-rose-500" />
                  {activeReg.address || 'Not provided'}
                </p>
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  <Users2 className="h-3 w-3" /> Parent / Guardian
                </p>
                <div className="flex items-center gap-1.5">
                  <p className="text-[11px] font-bold text-foreground">{activeReg.guardian_name || activeReg.student_guardian_name || 'Not provided'}</p>
                  {activeReg.guardian_relationship && (
                    <span className="rounded-full bg-primary-600/10 text-primary-700 dark:text-primary-400 px-1.5 py-0.25 text-[9px] font-bold">
                      {activeReg.guardian_relationship}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {activeReg.guardian_contact || activeReg.student_guardian_phone || 'No contact number'}
                </p>
                {activeReg.guardian_consent ? (
                  <p className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                    <ShieldCheck className="h-3 w-3" /> Guardian consent certified
                  </p>
                ) : (
                  <p className="text-[10px] font-semibold text-amber-600 mt-0.5">Legacy application — no consent record</p>
                )}
              </div>

              <div>
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  <HeartPulse className="h-3 w-3" /> Medical Notes
                </p>
                <p className="text-[11px] text-foreground/90">{activeReg.medical_notes || 'None declared'}</p>
              </div>
            </div>

            {activeReg.motivation && (
              <div className="pt-2 border-t border-border/60">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                  <Sparkles className="h-3 w-3" /> Learner Motivation
                </p>
                <p className="text-[11px] text-foreground/90 italic leading-relaxed">"{activeReg.motivation}"</p>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleReviewSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Decision Status *</label>
            <select
              value={reviewStatus}
              onChange={(e) => setReviewStatus(e.target.value as any)}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground font-semibold"
            >
              <option value="Approved">Approve Registration</option>
              <option value="Waitlisted">Place on Waitlist</option>
              <option value="Rejected">Reject Registration</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Adviser Feedback / Note</label>
            <textarea
              rows={3}
              placeholder="e.g. Meets prerequisites. Please attend Friday orientation."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setActiveReg(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} className="font-bold">
              Confirm Decision
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
