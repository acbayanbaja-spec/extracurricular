"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ApiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { CertificatePreviewModal } from '@/components/certificates/CertificatePreviewModal';
import {
  User,
  GraduationCap,
  Award,
  Sparkles,
  Calendar,
  Clock,
  Flame,
  FileCheck,
  Share2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Printer,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function StudentPortfolioPage() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCert, setSelectedCert] = useState<any>(null);

  // Edit fields
  const [bio, setBio] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<{ skill: string; level: string }[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchPortfolio = () => {
    if (!user?.student?.id) return;
    setIsLoading(true);
    ApiClient.get<any>(`/portfolio/${user.student.id}`)
      .then((data) => {
        setPortfolio(data);
        if (data.student) {
          setBio(data.student.bio || '');
          setInterests(data.interests || []);
          setSkills(
            (data.skills || []).map((s: any) => ({
              skill: s.skill_name,
              level: s.proficiency_level,
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPortfolio();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await ApiClient.put('/portfolio/profile/update', {
        bio,
        interests,
        skills,
      });
      toast.success('Portfolio preferences updated!');
      setIsEditModalOpen(false);
      fetchPortfolio();
    } catch (err: any) {
      toast.error('Failed to update portfolio', { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()]);
      setInterestInput('');
    }
  };

  const handleRemoveInterest = (item: string) => {
    setInterests(interests.filter((i) => i !== item));
  };

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      setSkills([...skills, { skill: newSkill.trim(), level: 'Intermediate' }]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillName: string) => {
    setSkills(skills.filter((s) => s.skill !== skillName));
  };

  const handleCopyPublicLink = () => {
    if (!portfolio?.student?.id) return;
    const shareUrl = `${window.location.origin}/portfolio/${portfolio.student.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Public portfolio link copied to clipboard!');
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-muted-foreground">Loading your digital portfolio...</div>;
  }

  const student = portfolio?.student;
  const attendance = portfolio?.attendanceStats;

  return (
    <div className="space-y-8">
      {/* Portfolio Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
            <User className="h-4 w-4" />
            <span>Digital Participation Portfolio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Student Extracurricular Portfolio
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Centrala National High School • Learner Development Record
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
            <Edit3 className="mr-1.5 h-3.5 w-3.5" /> Edit Profile Details
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyPublicLink}>
            <Share2 className="mr-1.5 h-3.5 w-3.5" /> Share Link
          </Button>
          <Button size="sm" onClick={() => window.print()} className="font-bold">
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print / Export PDF
          </Button>
        </div>
      </div>

      {/* Profile Card Banner */}
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl overflow-hidden bg-primary-100 dark:bg-primary-950 border-2 border-primary-500/40 shadow-md shrink-0">
            {student?.avatar_url ? (
              <img src={student.avatar_url} alt={student.first_name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-3xl font-black text-primary-700">
                {student?.first_name?.[0] || 'S'}
              </div>
            )}
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-200 dark:border-emerald-800">
                Verified CNHS Student
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                LRN: {student?.student_id_number}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
              {student?.first_name} {student?.last_name}
            </h2>

            <p className="text-xs font-semibold text-muted-foreground">
              {student?.grade_level} • Section {student?.section} • {student?.track_strand || 'General Curriculum'}
            </p>

            <p className="text-xs text-foreground/80 mt-2 max-w-2xl leading-relaxed">
              {student?.bio || 'Passionate student active in Centrala National High School extracurricular activities.'}
            </p>
          </div>
        </div>

        {/* Attendance & Points Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border/80 text-center">
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Attendance Rate</p>
            <p className="text-2xl font-black text-foreground mt-0.5">{attendance?.attendanceRate || 100}%</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Participation Streak</p>
            <p className="text-2xl font-black text-amber-500 mt-0.5">{attendance?.streakCount || 0} Sessions</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Activities Completed</p>
            <p className="text-2xl font-black text-foreground mt-0.5">{portfolio?.activities?.length || 0}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground uppercase">Merit Growth Points</p>
            <p className="text-2xl font-black text-primary-600 mt-0.5">{student?.total_points || 380} pts</p>
          </div>
        </div>
      </div>

      {/* Interests & Skills Chips */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-primary-600" />
            Extracurricular Interests
          </h3>
          <div className="flex flex-wrap gap-2">
            {(portfolio?.interests || []).map((int: string) => (
              <span
                key={int}
                className="rounded-xl border border-primary-200 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-800 dark:border-primary-900/60 dark:bg-primary-950/40 dark:text-primary-300"
              >
                {int}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-emerald-600" />
            Validated Skills
          </h3>
          <div className="flex flex-wrap gap-2">
            {(portfolio?.skills || []).map((sk: any) => (
              <span
                key={sk.skill_name}
                className="rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-xs font-medium text-foreground flex items-center gap-2"
              >
                <span>{sk.skill_name}</span>
                <span className="text-[10px] text-muted-foreground font-bold">({sk.proficiency_level})</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Badges Collection */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/80">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <Award className="h-4 w-4 text-amber-500" />
            Earned Badges Showcase
          </h3>
          <span className="text-xs text-muted-foreground font-semibold">
            {portfolio?.badges?.length || 0} Badges
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(portfolio?.badges || []).map((b: any) => (
            <div
              key={b.id}
              className="rounded-2xl border border-amber-300/40 bg-amber-50/30 dark:bg-amber-950/10 p-4 text-center shadow-sm"
            >
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 text-white shadow-md mb-2">
                <Award className="h-7 w-7 text-amber-950" />
              </div>
              <p className="text-xs font-bold text-foreground">{b.name}</p>
              <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 uppercase">{b.tier} Tier</p>
              <p className="text-[10px] text-muted-foreground mt-1">{formatDate(b.earned_at)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Official Certificates */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/80">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-emerald-600" />
            Verified Certificates
          </h3>
          <span className="text-xs text-muted-foreground font-semibold">
            {portfolio?.certificates?.length || 0} Issued
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(portfolio?.certificates || []).map((cert: any) => (
            <div
              key={cert.id}
              onClick={() => setSelectedCert(cert)}
              className="cursor-pointer rounded-2xl border border-border bg-muted/30 p-4 hover:border-amber-400 hover:shadow-md transition-all flex items-center justify-between"
            >
              <div className="space-y-1">
                <span className="font-mono text-[10px] font-bold text-primary-600">
                  {cert.certificate_number}
                </span>
                <h4 className="text-xs font-bold text-foreground">{cert.title}</h4>
                <p className="text-[10px] text-muted-foreground">Conferred {formatDate(cert.issue_date)}</p>
              </div>
              <Button size="sm" variant="outline" className="text-xs h-8">
                Preview
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Development Timeline */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2 pb-3 mb-6 border-b border-border/80">
          <Calendar className="h-4 w-4 text-primary-600" />
          Extracurricular Development Chronology
        </h3>

        <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          {(portfolio?.timeline || []).map((item: any, idx: number) => (
            <div key={idx} className="relative">
              <div
                className="absolute -left-[27px] top-1 h-4 w-4 rounded-full border-2 border-background shadow"
                style={{ backgroundColor: item.color || '#4F46E5' }}
              />
              <p className="text-xs font-bold text-foreground">{item.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{item.subtitle}</p>
              <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                {formatDate(item.date)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Portfolio Preferences"
        description="Update your extracurricular bio, interests, and skills to refine activity recommendations."
      >
        <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1">About Me / Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
              placeholder="Tell others about your extracurricular aspirations..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Interests</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                placeholder="e.g. Robotics, Basketball, Arts"
                className="flex-1 rounded-xl border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
              <Button type="button" size="sm" variant="outline" onClick={handleAddInterest}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {interests.map((int) => (
                <span
                  key={int}
                  onClick={() => handleRemoveInterest(int)}
                  className="cursor-pointer rounded-lg bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300 text-xs px-2.5 py-1 flex items-center gap-1 hover:bg-rose-100 hover:text-rose-700"
                  title="Click to remove"
                >
                  {int} &times;
                </span>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1">Declared Skills</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="e.g. Public Speaking, Arduino"
                className="flex-1 rounded-xl border border-input bg-background px-3 py-1.5 text-xs text-foreground"
              />
              <Button type="button" size="sm" variant="outline" onClick={handleAddSkill}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((sk) => (
                <span
                  key={sk.skill}
                  onClick={() => handleRemoveSkill(sk.skill)}
                  className="cursor-pointer rounded-lg bg-muted text-foreground text-xs px-2.5 py-1 flex items-center gap-1 hover:bg-rose-100 hover:text-rose-700"
                  title="Click to remove"
                >
                  {sk.skill} &times;
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" isLoading={isSaving} className="font-bold">
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Certificate Preview Modal */}
      <CertificatePreviewModal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        certificate={selectedCert}
        studentName={`${student?.first_name} ${student?.last_name}`}
      />
    </div>
  );
}
