"use client";

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { Activity, Category } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  Compass,
  PlusCircle,
  Search,
  Trash2,
  Edit3,
  Calendar,
  MapPin,
  Clock,
  Users,
  CheckCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    location: '',
    date: '',
    startTime: '08:00 AM',
    endTime: '04:00 PM',
    registrationDeadline: '',
    maxParticipants: 30,
    points: 30,
    status: 'Published' as const,
    registrationStatus: 'Registration Open' as const,
    bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    eligibilityGradeLevels: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
  });

  const fetchActivities = () => {
    setIsLoading(true);
    ApiClient.get<Activity[]>('/activities', {
      search,
      categoryId: selectedCategory !== 'all' ? selectedCategory : undefined,
    })
      .then((data) => setActivities(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchActivities();
    ApiClient.get<Category[]>('/activities/categories').then((c) => {
      setCategories(c || []);
      if (c && c.length > 0) setFormData((prev) => ({ ...prev, categoryId: c[0].id }));
    });
  }, [search, selectedCategory]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.post('/activities', {
        ...formData,
        categoryId: formData.categoryId || (categories[0]?.id || 'cat-01'),
      });
      toast.success('Activity created successfully! 🌟');
      setIsCreateOpen(false);
      fetchActivities();
    } catch (err: any) {
      toast.error('Failed to create activity', { description: err.message });
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;
    try {
      await ApiClient.put(`/activities/${editingActivity.id}`, formData);
      toast.success('Activity updated!');
      setEditingActivity(null);
      fetchActivities();
    } catch (err: any) {
      toast.error('Failed to update activity', { description: err.message });
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${title}"?`)) return;
    try {
      await ApiClient.delete(`/activities/${id}`);
      toast.success('Activity removed');
      fetchActivities();
    } catch (err: any) {
      toast.error('Failed to delete activity', { description: err.message });
    }
  };

  const openEditModal = (act: Activity) => {
    setEditingActivity(act);
    setFormData({
      title: act.title,
      description: act.description,
      categoryId: act.category_id,
      location: act.location,
      date: act.date,
      startTime: act.start_time,
      endTime: act.end_time,
      registrationDeadline: act.registration_deadline?.split('T')?.[0] || act.date,
      maxParticipants: act.max_participants,
      points: act.points || 25,
      status: act.status as any,
      registrationStatus: act.registration_status as any,
      bannerImage: act.banner_image || '',
      eligibilityGradeLevels: ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Compass className="h-4 w-4" />
            <span>Extracurricular Portfolio Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            All School Extracurricular Activities
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Create, publish, edit, or archive sanctioned school activities, clubs, and sports programs.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="font-bold shadow-md">
          <PlusCircle className="mr-1.5 h-4 w-4" /> Create New Activity
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search activities by title, location, or keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-56 rounded-xl border border-input bg-background p-2 text-xs text-foreground"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Activities Directory ({activities.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading activities...</div>
        ) : activities.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">No activities found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">Title & Venue</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Enrolled / Cap</th>
                  <th className="py-3 px-4">Registration</th>
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
                    <td className="py-3.5 px-4">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: act.category_color || '#4F46E5' }}
                      >
                        {act.category_name}
                      </span>
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
                      <Badge variant={act.registration_status === 'Registration Open' ? 'success' : 'secondary'}>
                        {act.registration_status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={act.status === 'Published' ? 'success' : 'secondary'}>
                        {act.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditModal(act)}
                        className="text-xs h-8"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(act.id, act.title)}
                        className="text-xs h-8 text-rose-600 hover:border-rose-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isCreateOpen || !!editingActivity}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingActivity(null);
        }}
        title={editingActivity ? 'Edit Activity Details' : 'Create Extracurricular Activity'}
        description="Configure activity settings, capacity limits, and registration status."
        maxWidth="2xl"
      >
        <form onSubmit={editingActivity ? handleUpdate : handleCreate} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Activity Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Description *</label>
            <textarea
              rows={3}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
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
              <label className="block text-xs font-bold text-foreground mb-1">Location *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Date *</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Start Time</label>
              <input
                type="text"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">End Time</label>
              <input
                type="text"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Max Capacity (Seats)</label>
              <input
                type="number"
                min={1}
                value={formData.maxParticipants}
                onChange={(e) => setFormData({ ...formData, maxParticipants: parseInt(e.target.value, 10) })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              >
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">Registration State</label>
              <select
                value={formData.registrationStatus}
                onChange={(e) => setFormData({ ...formData, registrationStatus: e.target.value as any })}
                className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
              >
                <option value="Registration Open">Registration Open</option>
                <option value="Registration Closed">Registration Closed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingActivity(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" className="font-bold">
              {editingActivity ? 'Save Changes' : 'Publish Activity'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
