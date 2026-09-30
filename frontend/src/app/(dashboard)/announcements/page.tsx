"use client";

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { Announcement } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Megaphone, Pin, PlusCircle, Trash2, Calendar, User } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New announcement form
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    targetAudience: 'All' as const,
    isPinned: false,
    imageUrl: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAnnouncements = () => {
    setIsLoading(true);
    ApiClient.get<Announcement[]>('/announcements')
      .then((data) => setAnnouncements(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await ApiClient.post('/announcements', newNotice);
      toast.success('Announcement published! 📢');
      setIsCreateOpen(false);
      setNewNotice({
        title: '',
        content: '',
        targetAudience: 'All',
        isPinned: false,
        imageUrl: '',
      });
      fetchAnnouncements();
    } catch (err: any) {
      toast.error('Failed to post announcement', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await ApiClient.delete(`/announcements/${id}`);
      toast.success('Announcement removed');
      fetchAnnouncements();
    } catch (err: any) {
      toast.error('Failed to remove notice', { description: err.message });
    }
  };

  const canPublish = user?.role === 'ADMINISTRATOR' || user?.role === 'TEACHER';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Megaphone className="h-4 w-4" />
            <span>Campus Communication</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Official Announcements & Bulletins
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Notices, schedule adjustments, and club updates for Centrala National High School.
          </p>
        </div>

        {canPublish && (
          <Button onClick={() => setIsCreateOpen(true)} className="font-bold shadow-md">
            <PlusCircle className="mr-1.5 h-4 w-4" /> Post Announcement
          </Button>
        )}
      </div>

      {/* Announcements Stream */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-40 rounded-3xl bg-muted/40 animate-pulse border border-border" />
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
          No announcements published at this time.
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((item) => (
            <div
              key={item.id}
              className={`rounded-3xl border bg-card p-6 shadow-sm transition-all ${
                item.is_pinned
                  ? 'border-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/10 shadow-indigo-500/5'
                  : 'border-border'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {Boolean(item.is_pinned) && (
                      <span className="flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5">
                        <Pin className="h-3 w-3" /> Pinned Notice
                      </span>
                    )}
                    <Badge variant="secondary">Audience: {item.target_audience}</Badge>
                    {item.activity_title && (
                      <span className="text-xs font-semibold text-primary-600">
                        • {item.activity_title}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mt-1">{item.title}</h3>
                </div>

                {canPublish && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(item.id)}
                    className="text-muted-foreground hover:text-rose-600 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <p className="text-xs sm:text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
                {item.content}
              </p>

              {item.image_url && (
                <div className="mt-4 rounded-2xl overflow-hidden max-h-72 border border-border/80">
                  <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5 font-medium text-foreground">
                  <User className="h-3.5 w-3.5 text-primary-600" />
                  {item.first_name} {item.last_name} ({item.author_role || 'Faculty'})
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(item.publish_date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Announcement Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Publish School Announcement"
        description="Share important bulletins or club announcements with students and faculty."
      >
        <form onSubmit={handleCreateNotice} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Schedule Adjustment for Foundation Day Tryouts"
              value={newNotice.title}
              onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Notice Content *</label>
            <textarea
              required
              rows={4}
              placeholder="Write detailed announcements here..."
              value={newNotice.content}
              onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Target Audience</label>
              <select
                value={newNotice.targetAudience}
                onChange={(e) => setNewNotice({ ...newNotice, targetAudience: e.target.value as any })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              >
                <option value="All">All School (Students & Staff)</option>
                <option value="Students">Students Only</option>
                <option value="Teachers">Faculty / Teachers Only</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="isPinned"
                checked={newNotice.isPinned}
                onChange={(e) => setNewNotice({ ...newNotice, isPinned: e.target.checked })}
                className="h-4 w-4 rounded border-input text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="isPinned" className="text-xs font-bold text-foreground cursor-pointer">
                Pin to top of bulletin board
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSubmitting} className="font-bold">
              Publish Announcement
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
