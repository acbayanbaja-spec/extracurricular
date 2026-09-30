"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { ApiClient } from '@/lib/api';
import { Activity, RecommendedActivity, NotificationItem } from '@/types';
import { ActivityCard } from '@/components/activities/ActivityCard';
import { QrScannerModal } from '@/components/attendance/QrScannerModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  Calendar,
  Sparkles,
  Award,
  QrCode,
  Flame,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  FileCheck,
  User,
  Compass,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendedActivity[]>([]);
  const [myActivities, setMyActivities] = useState<any[]>([]);
  const [badges, setBadges] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const student = user?.student;

  const loadData = () => {
    setIsLoading(true);
    Promise.all([
      ApiClient.get<RecommendedActivity[]>('/recommendations').catch(() => []),
      ApiClient.get<any[]>('/registrations/my').catch(() => []),
      ApiClient.get<any[]>('/achievements/badges/my').catch(() => []),
      student ? ApiClient.get<any>(`/portfolio/${student.id}`).catch(() => null) : Promise.resolve(null),
    ]).then(([recs, regs, bdgs, port]) => {
      setRecommendations(recs || []);
      setMyActivities(regs || []);
      setBadges(bdgs || []);
      if (port && port.timeline) {
        setTimeline(port.timeline);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRegister = async (activityId: string) => {
    try {
      await ApiClient.post('/registrations/register', { activityId });
      toast.success('Registration Submitted!', {
        description: 'Your registration is awaiting adviser review.',
      });
      loadData();
    } catch (err: any) {
      toast.error('Registration Failed', { description: err.message });
    }
  };

  const unlockedBadges = badges.filter((b) => b.isUnlocked);

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-900 via-indigo-900 to-primary-800 p-6 sm:p-8 text-white shadow-xl shadow-primary-950/20"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md px-3 py-1 text-xs font-semibold text-indigo-200 border border-white/10 mb-2">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Centrala National High School • Learner Development Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Mabuhay, {user?.firstName}! 👋
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-indigo-100 max-w-xl">
              {student?.grade_level} • Section {student?.section} {student?.track_strand ? `(${student.track_strand})` : ''} • LRN: {student?.student_id_number}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              onClick={() => setIsQrModalOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/25 border-0 hover:scale-[1.02] transition-transform"
              size="sm"
            >
              <QrCode className="mr-1.5 h-4 w-4" /> Scan Attendance QR
            </Button>
            <Link href="/student/portfolio">
              <Button variant="secondary" size="sm" className="font-semibold bg-white/20 hover:bg-white/30 text-white border-0 hover:scale-[1.02] transition-transform">
                <User className="mr-1.5 h-4 w-4" /> My Portfolio
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Quick KPI Stat Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {/* Attendance Rate */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-amber-500/40 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Attendance Rate</span>
            <div className="flex items-center gap-1 text-amber-500 text-xs font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Flame className="h-3.5 w-3.5 fill-amber-500 animate-pulse" />
              <span>{student?.streak_count || 1} streak</span>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground group-hover:text-amber-500 transition-colors">
            {student?.attendance_rate || 94.5}%
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Reliable attendee across sessions</p>
        </div>

        {/* Activities Joined */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-primary-500/40 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Activities</span>
            <Compass className="h-4 w-4 text-primary-500 group-hover:rotate-45 transition-transform" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground group-hover:text-primary-600 transition-colors">
            {myActivities.length}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Registered & Completed</p>
        </div>

        {/* Badges Collected */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-amber-500/40 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Badges</span>
            <Award className="h-4 w-4 text-amber-500 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground group-hover:text-amber-500 transition-colors">
            {unlockedBadges.length} / {badges.length || 8}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Recognized achievements</p>
        </div>

        {/* Total Points */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-muted-foreground mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Growth Points</span>
            <TrendingUp className="h-4 w-4 text-emerald-500 group-hover:translate-y-[-2px] transition-transform" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-foreground group-hover:text-emerald-600 transition-colors">
            {student?.total_points || 380}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Extracurricular merit score</p>
        </div>
      </motion.div>

      {/* Main 2-Column Split: Development Journey & Recommended Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 Cols): Recommended Activities & Upcoming */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recommended Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                  Recommended For You
                </h2>
                <p className="text-xs text-muted-foreground">
                  Smart suggestions based on your grade level, interests, and skills
                </p>
              </div>
              <Link href="/student/recommended" className="text-xs font-bold text-primary-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendations.slice(0, 2).map((act) => (
                <div key={act.id} className="relative">
                  {/* Match Reason Tag */}
                  <div className="absolute top-2 right-2 z-20">
                    <span className="rounded-full bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 shadow">
                      {act.matchScore}% Match
                    </span>
                  </div>
                  <ActivityCard activity={act} onRegister={handleRegister} />
                </div>
              ))}
            </div>
          </div>

          {/* My Upcoming Activities Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                My Enrolled Activities
              </h2>
              <Link href="/student/my-activities" className="text-xs font-bold text-primary-600 hover:underline">
                Manage Schedule
              </Link>
            </div>

            {myActivities.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
                You haven't joined any activities yet. Explore the{' '}
                <Link href="/student/discover" className="text-primary-600 font-bold hover:underline">
                  Discovery Center
                </Link>{' '}
                to get started!
              </div>
            ) : (
              <div className="space-y-3">
                {myActivities.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl border border-border bg-card p-4 gap-4 shadow-sm hover:border-primary-500/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={
                            item.status === 'Approved'
                              ? 'success'
                              : item.status === 'Pending'
                              ? 'warning'
                              : 'secondary'
                          }
                        >
                          {item.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(item.date)} • {item.start_time}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-foreground">{item.activity_title}</h4>
                      <p className="text-xs text-muted-foreground">{item.location}</p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsQrModalOpen(true)}
                        className="text-xs w-full sm:w-auto"
                      >
                        <QrCode className="mr-1 h-3.5 w-3.5" /> Check In
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): "Your Development Journey" Timeline */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/80">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary-600" />
                Your Development Journey
              </h3>
              <Link href="/student/portfolio" className="text-[11px] font-semibold text-primary-600 hover:underline">
                Full Portfolio
              </Link>
            </div>

            {/* Timeline Stream */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {timeline.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Your development events will appear here as you participate in activities and earn badges.
                </p>
              ) : (
                timeline.slice(0, 5).map((ev, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle Dot */}
                    <div
                      className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-background shadow-sm"
                      style={{ backgroundColor: ev.color || '#4F46E5' }}
                    />
                    <p className="text-xs font-bold text-foreground leading-tight">{ev.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{ev.subtitle}</p>
                    <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                      {formatDate(ev.date)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Badges Showcase */}
          <div className="rounded-3xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/80">
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Award className="h-4 w-4 text-amber-500" />
                Recent Badges
              </h3>
              <Link href="/student/badges" className="text-[11px] font-semibold text-primary-600 hover:underline">
                View All
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {badges.slice(0, 4).map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-xl border p-2.5 text-center transition-all ${
                    badge.isUnlocked
                      ? 'border-amber-400/40 bg-amber-50/40 dark:bg-amber-950/20'
                      : 'border-border/60 bg-muted/30 opacity-60'
                  }`}
                >
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 text-white shadow-sm mb-1.5">
                    <Award className="h-5 w-5 text-amber-950" />
                  </div>
                  <p className="text-xs font-bold text-foreground truncate">{badge.name}</p>
                  <p className="text-[10px] text-muted-foreground">{badge.tier} Tier</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* QR Scanner Modal */}
      <QrScannerModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
