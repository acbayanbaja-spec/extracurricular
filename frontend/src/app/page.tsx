"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import {
  GraduationCap,
  Sparkles,
  Award,
  Compass,
  CalendarCheck2,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Users,
  CheckCircle2,
  BookOpen,
  MapPin,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { Activity } from '@/types';
import { ActivityCard } from '@/components/activities/ActivityCard';

export default function LandingPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [featuredActivities, setFeaturedActivities] = useState<Activity[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState<string | null>(null);

  useEffect(() => {
    ApiClient.get<Activity[]>('/activities?limit=3')
      .then((data) => {
        if (data && Array.isArray(data)) {
          setFeaturedActivities(data.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  const handleQuickLogin = async (role: 'admin' | 'teacher' | 'student') => {
    setIsLoggingIn(role);
    const creds = {
      admin: { email: 'admin@cnhs.edu.ph', password: 'Password123!' },
      teacher: { email: 'maria.santos@cnhs.edu.ph', password: 'Password123!' },
      student: { email: 'student@cnhs.edu.ph', password: 'Password123!' },
    };
    await login(creds[role].email, creds[role].password);
    setIsLoggingIn(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-700 to-indigo-500 text-white shadow-md shadow-primary-500/25">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-foreground">
                  CNHS StudentX
                </span>
                <span className="rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold px-1.5 py-0.5">
                  South Cotabato
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Centrala National High School, Surallah
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link href={`/${user.role.toLowerCase()}`}>
                <Button size="sm" className="font-bold shadow-sm">
                  Go to Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="font-semibold">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="font-bold shadow-sm">
                    Student Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
          {/* Background Ambient Glows */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-primary-500/10 dark:bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10 text-center">
            {/* DepEd Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-50 dark:bg-primary-950/60 px-3.5 py-1 text-xs font-semibold text-primary-700 dark:text-primary-300 shadow-sm mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary-600" />
              <span>Official Extracurricular Platform • Centrala National High School</span>
            </div>

            <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl md:text-7xl max-w-4xl mx-auto leading-[1.1]">
              Empowering Students Beyond the <span className="bg-gradient-to-r from-primary-600 via-indigo-500 to-amber-500 bg-clip-text text-transparent">Classroom.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Discover verified school clubs, track extracurricular attendance with QR codes, earn accredited badges, and showcase a lifetime digital participation portfolio for Centrala National High School.
            </p>

            {/* Quick Demo Switcher for Evaluation */}
            <div className="mt-8 max-w-xl mx-auto rounded-2xl border border-border/80 bg-card p-4 shadow-xl">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                ⚡ 1-Click Role Login (Instant Testing)
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('student')}
                  isLoading={isLoggingIn === 'student'}
                  className="font-bold text-xs hover:border-emerald-500"
                >
                  Student Portal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('teacher')}
                  isLoading={isLoggingIn === 'teacher'}
                  className="font-bold text-xs hover:border-sky-500"
                >
                  Teacher Portal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin('admin')}
                  isLoading={isLoggingIn === 'admin'}
                  className="font-bold text-xs hover:border-indigo-500"
                >
                  Admin Portal
                </Button>
              </div>
            </div>

            {/* Key Metrics Strip */}
            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-primary-600 mb-1">
                  <Compass className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Clubs & Activities</span>
                </div>
                <p className="text-2xl font-black text-foreground">12+ Active</p>
                <p className="text-[11px] text-muted-foreground">SSLG, RCY, STEM, Sports</p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <CalendarCheck2 className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Attendance</span>
                </div>
                <p className="text-2xl font-black text-foreground">94.5% Rate</p>
                <p className="text-[11px] text-muted-foreground">QR-verified check-in</p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <Award className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recognition</span>
                </div>
                <p className="text-2xl font-black text-foreground">8 Tier Badges</p>
                <p className="text-[11px] text-muted-foreground">Bronze, Silver, Gold, Platinum</p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 text-rose-500 mb-1">
                  <FileCheck className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Certificates</span>
                </div>
                <p className="text-2xl font-black text-foreground">100% Verifiable</p>
                <p className="text-[11px] text-muted-foreground">DepEd & CNHS Accredited</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Upcoming Activities */}
        <section className="py-12 bg-muted/30 border-y border-border/70">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary-600">Upcoming Opportunities</span>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground mt-1">
                  Discover Activities at Centrala National High School
                </h2>
              </div>
              <Link href="/login">
                <Button variant="outline" size="sm" className="font-semibold">
                  Browse All Activities <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredActivities.length > 0 ? (
                featuredActivities.map((act) => (
                  <ActivityCard key={act.id} activity={act} />
                ))
              ) : (
                <div className="col-span-3 text-center py-10 text-muted-foreground text-sm">
                  Loading CNHS activities...
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Pillars of Student Development */}
        <section className="py-16">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600">Holistic Growth</span>
              <h2 className="text-3xl font-black tracking-tight text-foreground mt-1">
                Engineered for Meaningful Student Development
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                Going beyond superficial event lists: our platform tracks skill progression, attendance reliability, and builds a comprehensive digital portfolio for college applications and senior high tracks.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 mb-4">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Smart Activity Discovery</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Personalized recommendations matching your Grade level, student interests (STEM, Arts, Leadership, Sports), and past activity history.
                </p>
              </div>

              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 mb-4">
                  <CalendarCheck2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Anti-Fraud QR Attendance</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Secure time-windowed session QR codes generated by faculty advisers. Students scan in real time, validating attendance rates and participation streaks.
                </p>
              </div>

              <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 mb-4">
                  <Award className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Digital Participation Portfolio</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  A verifiable showcase of your leadership milestones, earned badges, hours logged, and officially certified DepEd credentials.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-card py-8">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary-600" />
            <span className="font-semibold text-foreground">
              Centrala National High School Extracurricular System
            </span>
            <span>• Surallah, South Cotabato</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/verify/CNHS-ECO-2026-0042" className="hover:text-foreground">
              Verify Certificate
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Portal Login
            </Link>
            <span>DepEd Region XII</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
