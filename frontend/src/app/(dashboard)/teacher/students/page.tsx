"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ApiClient } from '@/lib/api';
import { StudentProfile, Badge as BadgeType, Activity } from '@/types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Users, Award, FileCheck, ExternalLink, Search, Flame } from 'lucide-react';
import { toast } from 'sonner';

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Award Badge Modal
  const [selectedStudentForBadge, setSelectedStudentForBadge] = useState<any>(null);
  const [selectedBadgeId, setSelectedBadgeId] = useState('');

  // Issue Certificate Modal
  const [selectedStudentForCert, setSelectedStudentForCert] = useState<any>(null);
  const [certForm, setCertForm] = useState({
    title: 'Certificate of Meritorious Extracurricular Accomplishment',
    description: 'Awarded for active leadership, continuous participation, and dedication to school community projects.',
    activityId: '',
  });

  const fetchStudents = () => {
    setIsLoading(true);
    ApiClient.get<any[]>('/users/students', { search })
      .then((data) => setStudents(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStudents();
    ApiClient.get<BadgeType[]>('/achievements/badges').then((b) => {
      setBadges(b || []);
      if (b && b.length > 0) setSelectedBadgeId(b[0].id);
    });
    ApiClient.get<Activity[]>('/activities').then((a) => {
      setActivities(a || []);
      if (a && a.length > 0) setCertForm((prev) => ({ ...prev, activityId: a[0].id }));
    });
  }, []);

  const handleAwardBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForBadge || !selectedBadgeId) return;

    try {
      await ApiClient.post('/achievements/award-badge', {
        studentId: selectedStudentForBadge.id,
        badgeId: selectedBadgeId,
      });
      toast.success(`Badge awarded to ${selectedStudentForBadge.first_name}! 🏅`);
      setSelectedStudentForBadge(null);
      fetchStudents();
    } catch (err: any) {
      toast.error('Failed to award badge', { description: err.message });
    }
  };

  const handleIssueCertificate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForCert) return;

    try {
      await ApiClient.post('/certificates', {
        studentId: selectedStudentForCert.id,
        activityId: certForm.activityId || (activities[0]?.id || 'act-01'),
        title: certForm.title,
        description: certForm.description,
      });
      toast.success(`Certificate issued to ${selectedStudentForCert.first_name}! 📜`);
      setSelectedStudentForCert(null);
      fetchStudents();
    } catch (err: any) {
      toast.error('Failed to issue certificate', { description: err.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
          <Users className="h-4 w-4" />
          <span>Student Development Supervision</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Student Progress & Credentials Roster
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Monitor participation milestones, award badges, and issue certificates to deserving Centrala National High School learners.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search student by name, LRN number, or grade level..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-input bg-card pl-10 pr-4 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary-500 shadow-sm"
        />
      </div>

      {/* Students Table */}
      <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Enrolled Students ({students.length})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-muted-foreground">Loading student roster...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No students found matching your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/50 text-muted-foreground font-bold uppercase tracking-wider text-[10px] border-b border-border">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">LRN / Grade / Section</th>
                  <th className="py-3 px-4">Attendance Rate</th>
                  <th className="py-3 px-4">Growth Points</th>
                  <th className="py-3 px-4">Activities</th>
                  <th className="py-3 px-4 text-right">Faculty Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {students.map((std) => (
                  <tr key={std.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      <p>{std.first_name} {std.last_name}</p>
                      <p className="text-[11px] font-normal text-muted-foreground">{std.email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      <p className="font-semibold text-foreground">{std.grade_level} - {std.section}</p>
                      <p className="font-mono text-[10px]">LRN: {std.student_id_number}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {std.attendance_rate || 94.5}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      {std.total_points || 0} pts
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground">
                      {std.activities_joined_count || 1} completed
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedStudentForBadge(std)}
                        className="text-xs h-8 text-amber-600 hover:border-amber-400"
                      >
                        <Award className="mr-1 h-3.5 w-3.5" /> Award Badge
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedStudentForCert(std)}
                        className="text-xs h-8 text-emerald-600 hover:border-emerald-400"
                      >
                        <FileCheck className="mr-1 h-3.5 w-3.5" /> Issue Cert
                      </Button>
                      <Link href={`/portfolio/${std.id}`} target="_blank">
                        <Button size="sm" variant="ghost" className="text-xs h-8">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Award Badge Modal */}
      <Modal
        isOpen={!!selectedStudentForBadge}
        onClose={() => setSelectedStudentForBadge(null)}
        title="Award Digital Badge"
        description={`Confer a badge to ${selectedStudentForBadge?.first_name} ${selectedStudentForBadge?.last_name}.`}
      >
        <form onSubmit={handleAwardBadge} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Select Badge *</label>
            <select
              value={selectedBadgeId}
              onChange={(e) => setSelectedBadgeId(e.target.value)}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground font-semibold"
            >
              {badges.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.tier} Tier)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedStudentForBadge(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Award Badge
            </Button>
          </div>
        </form>
      </Modal>

      {/* Issue Certificate Modal */}
      <Modal
        isOpen={!!selectedStudentForCert}
        onClose={() => setSelectedStudentForCert(null)}
        title="Issue Official Certificate"
        description={`Issue a verifiable CNHS certificate to ${selectedStudentForCert?.first_name} ${selectedStudentForCert?.last_name}.`}
      >
        <form onSubmit={handleIssueCertificate} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Associated Activity *</label>
            <select
              value={certForm.activityId}
              onChange={(e) => setCertForm({ ...certForm, activityId: e.target.value })}
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
            <label className="block text-xs font-bold text-foreground mb-1">Certificate Title *</label>
            <input
              type="text"
              required
              value={certForm.title}
              onChange={(e) => setCertForm({ ...certForm, title: e.target.value })}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Citation / Description</label>
            <textarea
              rows={3}
              value={certForm.description}
              onChange={(e) => setCertForm({ ...certForm, description: e.target.value })}
              className="w-full rounded-xl border border-input bg-background p-2.5 text-xs text-foreground"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setSelectedStudentForCert(null)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
              Issue & Accredit Certificate
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
