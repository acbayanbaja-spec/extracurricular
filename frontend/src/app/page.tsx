"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  Search,
  ExternalLink,
  Flame,
  QrCode,
  School,
} from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { Activity } from '@/types';
import { ActivityCard } from '@/components/activities/ActivityCard';

export default function LandingPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [featuredActivities, setFeaturedActivities] = useState<Activity[]>([]);
  const [isLoggingIn, setIsLoggingIn] = useState<string | null>(null);
  const [certQuery, setCertQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'admin'>('student');

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

  const handleVerifySearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certQuery.trim()) return;
    router.push(`/verify/${encodeURIComponent(certQuery.trim())}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-700 to-indigo-500 text-white shadow-md shadow-primary-500/25 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-foreground">
                  CNHS StudentX
                </span>
                <span className="rounded-full bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300 text-[10px] font-black px-2 py-0.5 border border-primary-500/20">
                  Surallah
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Centrala National High School • DepEd Region XII
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <Link href={`/${user.role.toLowerCase()}`}>
                <Button size="sm" variant="gradient" className="font-bold shadow-sm">
                  Dashboard <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="font-semibold text-xs">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" variant="gradient" className="font-bold text-xs shadow-sm">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-primary-500/10 dark:bg-primary-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10 text-center">
            {/* DepEd Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-50 dark:bg-primary-950/60 px-4 py-1.5 text-xs font-bold text-primary-700 dark:text-primary-300 shadow-sm mb-6"
            >
              <School className="h-3.5 w-3.5 text-primary-600" />
              <span>Centrala National High School • School ID: 305412</span>
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl font-black tracking-tight text-foreground sm:text-6xl md:text-7xl max-w-4xl mx-auto leading-[1.1]"
            >
              Empowering Centralian Students Beyond the{' '}
              <span className="bg-gradient-to-r from-primary-600 via-indigo-500 to-amber-500 bg-clip-text text-transparent">
                Classroom.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Centralize official school clubs, verify extracurricular attendance with fraud-resistant QR codes, earn recognized DepEd milestones, and showcase an authentic digital student portfolio.
            </motion.p>

            {/* Quick Demo Switcher */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-8 max-w-xl mx-auto rounded-3xl border border-border/80 bg-card/90 backdrop-blur-xl p-5 shadow-2xl shadow-primary-500/5"
            >
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-primary-500" />
                <span>1-Click Role Login (Instant Testing)</span>
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleQuickLogin('student')}
                  isLoading={isLoggingIn === 'student'}
                  className="font-bold text-xs hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20"
                >
                  🎓 Student
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleQuickLogin('teacher')}
                  isLoading={isLoggingIn === 'teacher'}
                  className="font-bold text-xs hover:border-sky-500 hover:bg-sky-50/50 dark:hover:bg-sky-950/20"
                >
                  🧑‍🏫 Teacher
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => handleQuickLogin('admin')}
                  isLoading={isLoggingIn === 'admin'}
                  className="font-bold text-xs hover:border-indigo-500 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20"
                >
                  🏛️ Admin
                </Button>
              </div>
            </motion.div>

            {/* Key Metrics Strip */}
            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm hover:border-primary-500/40 transition-colors">
                <div className="flex items-center gap-2 text-primary-600 mb-1">
                  <Compass className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Clubs & Organizations</span>
                </div>
                <p className="text-2xl font-black text-foreground">12+ Active</p>
                <p className="text-[11px] text-muted-foreground">SSLG, RCY, STEM, Blue Knights</p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm hover:border-emerald-500/40 transition-colors">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <CalendarCheck2 className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Attendance</span>
                </div>
                <p className="text-2xl font-black text-foreground">94.5% Rate</p>
                <p className="text-[11px] text-muted-foreground">QR-verified anti-fraud check-in</p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm hover:border-amber-500/40 transition-colors">
                <div className="flex items-center gap-2 text-amber-500 mb-1">
                  <Award className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recognition</span>
                </div>
                <p className="text-2xl font-black text-foreground">8 Tier Badges</p>
                <p className="text-[11px] text-muted-foreground">Bronze, Silver, Gold, Platinum</p>
              </div>

              <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm hover:border-rose-500/40 transition-colors">
                <div className="flex items-center gap-2 text-rose-500 mb-1">
                  <FileCheck className="h-4 w-4" />
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Credentials</span>
                </div>
                <p className="text-2xl font-black text-foreground">100% Verifiable</p>
                <p className="text-[11px] text-muted-foreground">Cryptographic certificate codes</p>
              </div>
            </div>

            {/* Public Certificate Quick Verification Widget */}
            <div className="mt-10 max-w-xl mx-auto p-4 rounded-2xl bg-muted/40 border border-border/80 text-left">
              <div className="flex items-center gap-2 text-xs font-extrabold text-foreground mb-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>Verify DepEd Certificate Authenticity</span>
              </div>
              <form onSubmit={handleVerifySearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="e.g. CNHS-ECO-2026-0042"
                    value={certQuery}
                    onChange={(e) => setCertQuery(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background pl-9 pr-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <Button type="submit" size="sm" variant="gradient" className="text-xs font-bold px-4">
                  Verify Code
                </Button>
              </form>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                Try demo verification code: <code className="bg-background px-1.5 py-0.5 rounded text-primary-600 font-mono">CNHS-ECO-2026-0042</code>
              </p>
            </div>
          </div>
        </section>

        {/* Official Recognized Clubs Section */}
        <section className="py-14 border-t border-border/70 bg-card/40">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
                Official Student Organizations
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
                Centrala National High School Chapters
              </h2>
              <p className="text-xs text-muted-foreground mt-2">
                Recognized co-curricular and extracurricular clubs operating under DepEd South Cotabato guidelines.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  code: 'CNHS-SSLG',
                  name: 'Supreme Secondary Learner Government',
                  category: 'Leadership & Governance',
                  adviser: 'Maria Santos',
                  desc: 'The highest governing student council of Centrala National High School representing student welfare and school leadership.',
                  icon: '🏛️',
                  badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
                },
                {
                  code: 'CNHS-VARSITY',
                  name: 'Centralian Blue Knights Varsity',
                  category: 'Sports & Athletics',
                  adviser: 'Roberto Dela Cruz',
                  desc: 'Varsity athletics training in basketball, volleyball, badminton, and track for provincial athletic meets.',
                  icon: '🏆',
                  badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
                },
                {
                  code: 'CNHS-ROBOTICS',
                  name: 'STEM Science & Robotics Guild',
                  category: 'Science & Technology',
                  adviser: 'Jennifer Lim',
                  desc: 'Hands-on Arduino, robotics programming, environmental science investigations, and DepEd Division science fairs.',
                  icon: '🤖',
                  badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
                },
                {
                  code: 'CNHS-RCY',
                  name: 'Red Cross Youth - Centrala Chapter',
                  category: 'Community & First Aid',
                  adviser: 'Maria Santos',
                  desc: 'Humanitarian leadership, disaster preparedness, youth blood donation drives, and certified emergency first aid.',
                  icon: '⛑️',
                  badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
                },
                {
                  code: 'CNHS-JOURN',
                  name: 'The Centralian Echo (Ang Alingawngaw)',
                  category: 'Campus Journalism',
                  adviser: 'Jennifer Lim',
                  desc: 'Official campus press training in news writing, editorial cartooning, photojournalism, and broadcasting.',
                  icon: '📰',
                  badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
                },
                {
                  code: 'CNHS-ECO',
                  name: 'Centrala Eco-Warriors Club',
                  category: 'Environmental Stewardship',
                  adviser: 'Roberto Dela Cruz',
                  desc: 'Tree planting drives across Surallah, campus solid waste management, and organic school garden initiatives.',
                  icon: '🌱',
                  badgeColor: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
                },
              ].map((club) => (
                <div
                  key={club.code}
                  className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm hover:shadow-md hover:border-primary-500/40 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl">{club.icon}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${club.badgeColor}`}>
                        {club.category}
                      </span>
                    </div>
                    <h3 className="font-extrabold text-base text-foreground mb-1">
                      {club.name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                      {club.desc}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-border/70 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Adviser: <strong className="text-foreground">{club.adviser}</strong></span>
                    <span className="font-mono text-[10px] text-primary-600">{club.code}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Live Activities */}
        {featuredActivities.length > 0 && (
          <section className="py-14">
            <div className="container mx-auto max-w-7xl px-4 sm:px-6">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-600">
                    Live Extracurricular Events
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-1">
                    Featured Activities in Surallah
                  </h2>
                </div>
                <Link href="/login">
                  <Button variant="outline" size="sm" className="font-bold text-xs">
                    View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredActivities.map((act) => (
                  <ActivityCard key={act.id} activity={act} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/80 bg-card/60 py-8 text-xs text-muted-foreground">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary-600" />
            <span className="font-bold text-foreground">Centrala National High School</span>
            <span>• Surallah, South Cotabato, Philippines</span>
          </div>
          <div className="flex items-center gap-4">
            <span>DepEd Region XII</span>
            <span>School ID: 305412</span>
            <Link href="/verify/CNHS-ECO-2026-0042" className="text-primary-600 hover:underline">
              Certificate Authenticator
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
