"use client";

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { Registration, Activity } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { ClipboardCheck, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function TeacherRegistrationsPage() {
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
                          setReviewStatus(reg.status === 'Approved' ? 'Approved' : 'Approved');
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
        title="Review Student Registration"
        description={`Applicant: ${activeReg?.first_name} ${activeReg?.last_name} (${activeReg?.grade_level})`}
      >
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
