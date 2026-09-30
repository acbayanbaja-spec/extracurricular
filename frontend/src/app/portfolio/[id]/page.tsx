"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ApiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import {
  GraduationCap,
  ShieldCheck,
  Award,
  Calendar,
  CheckCircle2,
  Printer,
  Sparkles,
  Flame,
  FileCheck,
  ExternalLink,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function PublicPortfolioPage() {
  const params = useParams();
  const studentId = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!studentId) return;
    setIsLoading(true);
    ApiClient.get<any>(`/portfolio/${studentId}`)
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-xs text-muted-foreground">
        Loading verified student portfolio...
      </div>
    );
  }

  if (!data || !data.student) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <h2 className="text-xl font-bold text-foreground">Portfolio Not Found</h2>
        <p className="text-xs text-muted-foreground mt-1">
          The requested student portfolio does not exist or has been made private.
        </p>
        <Link href="/" className="mt-4">
          <Button size="sm">Return to Home</Button>
        </Link>
      </div>
    );
  }

  const student = data.student;
  const attendance = data.attendanceStats;

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-indigo-500 selection:text-white">
      {/* Top Verification Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md no-print">
        <div className="container mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-700 to-indigo-500 text-white shadow-md">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-foreground">
                Centrala National High School
              </span>
              <p className="text-[10px] text-muted-foreground">Surallah, South Cotabato • Region XII</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button size="sm" onClick={() => window.print()} className="font-bold">
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print / Save PDF
            </Button>
          </div>
        </div>
      </header>

      {/* Main Portfolio Container */}
      <main className="container mx-auto max-w-4xl py-10 px-4 sm:px-6 space-y-8">
        {/* Verification Banner */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                Official DepEd School Extracurricular Record
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                Authenticated by Centrala National High School Academic & Activity Board
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
            LRN: {student.student_id_number}
          </span>
        </div>

        {/* Profile Details */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-3xl overflow-hidden bg-primary-100 dark:bg-primary-950 border-2 border-primary-500/40 shadow-md shrink-0">
              {student.avatar_url ? (
                <img src={student.avatar_url} alt={student.first_name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-3xl font-black text-primary-700">
                  {student.first_name[0]}
                </div>
              )}
            </div>

            <div className="space-y-1 flex-1">
              <h1 className="text-2xl sm:text-3xl font-black text-foreground">
                {student.first_name} {student.last_name}
              </h1>
              <p className="text-xs font-bold text-primary-600">
                {student.grade_level} • Section {student.section} • {student.track_strand || 'General Curriculum'}
              </p>
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {student.bio || 'Dedicated learner actively participating in school clubs and leadership initiatives.'}
              </p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border text-center">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Attendance Rate</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{attendance?.attendanceRate || 100}%</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Participation Streak</p>
              <p className="text-2xl font-black text-amber-500 mt-0.5">{attendance?.streakCount || 0} Sessions</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Activities Completed</p>
              <p className="text-2xl font-black text-foreground mt-0.5">{data?.activities?.length || 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Merit Growth Points</p>
              <p className="text-2xl font-black text-primary-600 mt-0.5">{student.total_points || 380} pts</p>
            </div>
          </div>
        </div>

        {/* Interests & Skills */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary-600" />
              Declared Student Interests
            </h3>
            <div className="flex flex-wrap gap-2">
              {(data?.interests || []).map((int: string) => (
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
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Award className="h-4 w-4 text-emerald-600" />
              Validated Competencies & Skills
            </h3>
            <div className="flex flex-wrap gap-2">
              {(data?.skills || []).map((sk: any) => (
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
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-500" />
            Accredited Badges ({data?.badges?.length || 0})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            {(data?.badges || []).map((b: any) => (
              <div key={b.id} className="rounded-2xl border border-amber-300/40 bg-amber-50/20 p-3.5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm mb-2">
                  <Award className="h-6 w-6 text-amber-950" />
                </div>
                <p className="text-xs font-bold text-foreground">{b.name}</p>
                <p className="text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase">{b.tier} Tier</p>
                <p className="text-[9px] text-muted-foreground mt-0.5">{formatDate(b.earned_at)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Development Timeline */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary-600" />
            Official Extracurricular Timeline
          </h3>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
            {(data?.timeline || []).map((item: any, idx: number) => (
              <div key={idx} className="relative">
                <div
                  className="absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 border-background shadow-sm"
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
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-muted-foreground border-t border-border">
        Centrala National High School • Surallah, South Cotabato • Division of South Cotabato
      </footer>
    </div>
  );
}
