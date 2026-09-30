"use client";

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { Activity, Category, ClubOrganization } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { QrDisplayModal } from '@/components/attendance/QrDisplayModal';
import {
  Calendar,
  PlusCircle,
  QrCode,
  MapPin,
  Clock,
  Users,
  Search,
  CheckCircle,
  Plus,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function TeacherActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [clubs, setClubs] = useState<ClubOrganization[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [activeActivityForSession, setActiveActivityForSession] = useState<Activity | null>(null);
  const [activeSessionForQr, setActiveSessionForQr] = useState<{ id: string; title: string } | null>(null);

  // Create Activity form
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    categoryId: '',
    organizationId: '',
    location: '',
    date: '',
    startTime: '08:00 AM',
    endTime: '12:00 PM',
    registrationDeadline: '',
    maxParticipants: 30,
    points: 25,
    bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    eligibilityGradeLevels: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
  });

  // Session form
  const [newSession, setNewSession] = useState({
    sessionTitle: '',
    sessionDate: '',
    startTime: '08:00 AM',
    endTime: '12:00 PM',
  });

  const fetchActivities = () => {
    setIsLoading(true);
    ApiClient.get<Activity[]>('/activities')
      .then((data) => setActivities(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchActivities();
    ApiClient.get<Category[]>('/activities/categories').then((c) => setCategories(c || []));
    ApiClient.get<ClubOrganization[]>('/activities/organizations').then((cl) => setClubs(cl || []));
  }, []);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.post('/activities', {
        ...newActivity,
        categoryId: newActivity.categoryId || (categories[0]?.id || 'cat-01'),
        organizationId: newActivity.organizationId || (clubs[0]?.id || 'club-01'),
      });
      toast.success('Activity Created Successfully! 🌟');
      setIsCreateModalOpen(false);
      fetchActivities();
    } catch (err: any) {
      toast.error('Failed to create activity', { description: err.message });
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeActivityForSession) return;
    try {
      const res = await ApiClient.post<{ id: string }>('/attendance/sessions', {
        ...newSession,
        activityId: activeActivityForSession.id,
      });
      toast.success('Session created!');
      setIsSessionModalOpen(false);
      // Immediately open QR for this new session
      setActiveSessionForQr({ id: res.id, title: newSession.sessionTitle });
    } catch (err: any) {
      toast.error('Failed to create session', { description: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Calendar className="h-4 w-4" />
            <span>Activity Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Manage School Activities & Sessions
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Create new student programs, schedule attendance sessions, and launch live check-in QR codes.
          </p>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)} className="font-bold shadow-md">
          <PlusCircle className="mr-1.5 h-4 w-4" /> Create Activity
        </Button>
      </div>

      {/* Activities Table */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Active Extracurricular Activities ({activities.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading activities...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">Activity Title</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <p className="line-clamp-1">{act.title}</p>
                      <p className="text-[11px] font-normal text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-3 w-3 text-rose-500" />
                        <span className="truncate">{act.location}</span>
                      </p>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <p className="font-semibold text-foreground">{formatDate(act.date)}</p>
                      <p className="text-[10px]">{act.start_time} - {act.end_time}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-foreground">
                        {act.current_participants} / {act.max_participants}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: act.category_color || '#4F46E5' }}
                      >
                        {act.category_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={act.status === 'Published' ? 'success' : 'secondary'}>
                        {act.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setActiveActivityForSession(act);
                          setNewSession({
                            sessionTitle: `${act.title} - Session`,
                            sessionDate: act.date,
                            startTime: act.start_time,
                            endTime: act.end_time,
                          });
                          setIsSessionModalOpen(true);
                        }}
                        className="text-xs h-8"
                      >
                        <Plus className="mr-1 h-3 w-3" /> New Session
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Activity Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Extracurricular Activity"
        description="Add a new sanctioned school club activity or varsity trial for Centrala National High School."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateActivity} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Activity Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Annual Youth Leadership Summit 2026"
              value={newActivity.title}
              onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Detailed Description *</label>
            <textarea
              required
              rows={3}
              placeholder="Describe objectives, schedule breakdown, and expectations..."
              value={newActivity.description}
              onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Category *</label>
              <select
                value={newActivity.categoryId}
                onChange={(e) => setNewActivity({ ...newActivity, categoryId: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Club / Organization</label>
              <select
                value={newActivity.organizationId}
                onChange={(e) => setNewActivity({ ...newActivity, organizationId: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              >
                {clubs.map((cl) => (
                  <option key={cl.id} value={cl.id}>
                    {cl.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Location / Venue *</label>
              <input
                type="text"
                required
                placeholder="e.g. CNHS Gymnasium"
                value={newActivity.location}
                onChange={(e) => setNewActivity({ ...newActivity, location: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Event Date *</label>
              <input
                type="date"
                required
                value={newActivity.date}
                onChange={(e) => setNewActivity({ ...newActivity, date: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Registration Deadline *</label>
              <input
                type="date"
                required
                value={newActivity.registrationDeadline}
                onChange={(e) => setNewActivity({ ...newActivity, registrationDeadline: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Start Time</label>
              <input
                type="text"
                placeholder="08:00 AM"
                value={newActivity.startTime}
                onChange={(e) => setNewActivity({ ...newActivity, startTime: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">End Time</label>
              <input
                type="text"
                placeholder="04:30 PM"
                value={newActivity.endTime}
                onChange={(e) => setNewActivity({ ...newActivity, endTime: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Max Capacity (Seats)</label>
              <input
                type="number"
                min={1}
                value={newActivity.maxParticipants}
                onChange={(e) => setNewActivity({ ...newActivity, maxParticipants: parseInt(e.target.value, 10) })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="font-bold">
              Publish Activity
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Attendance Session Modal */}
      <Modal
        isOpen={isSessionModalOpen}
        onClose={() => setIsSessionModalOpen(false)}
        title="Schedule Attendance Session"
        description={`Set up a check-in session for "${activeActivityForSession?.title}".`}
      >
        <form onSubmit={handleCreateSession} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Session Title *</label>
            <input
              type="text"
              required
              value={newSession.sessionTitle}
              onChange={(e) => setNewSession({ ...newSession, sessionTitle: e.target.value })}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Date *</label>
              <input
                type="date"
                required
                value={newSession.sessionDate}
                onChange={(e) => setNewSession({ ...newSession, sessionDate: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Time Window</label>
              <input
                type="text"
                value={`${newSession.startTime} - ${newSession.endTime}`}
                onChange={(e) => {
                  const parts = e.target.value.split('-');
                  setNewSession({ ...newSession, startTime: parts[0]?.trim() || '', endTime: parts[1]?.trim() || '' });
                }}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsSessionModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Create & Launch QR Code
            </Button>
          </div>
        </form>
      </Modal>

      {/* Live QR Modal */}
      {activeSessionForQr && (
        <QrDisplayModal
          isOpen={!!activeSessionForQr}
          onClose={() => setActiveSessionForQr(null)}
          sessionId={activeSessionForQr.id}
          sessionTitle={activeSessionForQr.title}
        />
      )}
    </div>
  );
}
