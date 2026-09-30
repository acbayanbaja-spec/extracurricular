"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import {
  GraduationCap,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Award,
  QrCode,
  Sparkles,
  CheckCircle2,
  School,
  Activity,
  Layers,
  HelpCircle,
  Loader2,
} from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRoleTab, setActiveRoleTab] = useState<'student' | 'teacher' | 'admin'>('student');
  const [launchingRole, setLaunchingRole] = useState<string | null>(null);

  const demoAccounts = {
    student: {
      email: 'student@cnhs.edu.ph',
      password: 'Password123!',
      name: 'Angelo Morales (Learner)',
      desc: 'Access Club Registrations, QR Attendance Check-In & Portfolio',
      roleLabel: 'Grade 11 - STEM Varsity Delegate',
    },
    teacher: {
      email: 'maria.santos@cnhs.edu.ph',
      password: 'Password123!',
      name: 'Maria Santos (Faculty)',
      desc: 'Manage SSLG & Clubs, Generate QR Codes & Approve Registrations',
      roleLabel: 'SSLG & Red Cross Club Adviser',
    },
    admin: {
      email: 'admin@cnhs.edu.ph',
      password: 'Password123!',
      name: 'Rodrigo Mendoza (Admin)',
      desc: 'School-wide KPIs, Audit Logs, User Governance & CSV Reports',
      roleLabel: 'CNHS Extracurricular Coordinator',
    },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  const handleInstantLaunch = async (roleKey: 'student' | 'teacher' | 'admin') => {
    setActiveRoleTab(roleKey);
    const acc = demoAccounts[roleKey];
    setEmail(acc.email);
    setPassword(acc.password);
    setLaunchingRole(roleKey);

    await login(acc.email, acc.password);
    setLaunchingRole(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-primary-500 selection:text-white relative overflow-hidden">
      {/* Ambient Animated Gradient Orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 -right-40 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Institutional Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary-700 via-primary-600 to-indigo-500 text-white shadow-md shadow-primary-500/25 group-hover:scale-105 transition-transform duration-200">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-foreground">
                  CNHS StudentX
                </span>
                <span className="rounded-full bg-primary-100 text-primary-800 dark:bg-primary-950/80 dark:text-primary-300 text-[10px] font-black px-2 py-0.5 border border-primary-500/20">
                  Surallah
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block font-medium">
                Centrala National High School • DepEd Region XII
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Back4App Cloud: Operational</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Dual-Column Authentication Canvas */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="w-full max-w-5xl grid lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Institutional Brand & Features Showcase */}
          <motion.div 
            initial={{ opacity: 0, x: -25 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="hidden lg:flex lg:col-span-5 flex-col justify-between space-y-8 p-8 rounded-3xl bg-gradient-to-br from-primary-950 via-primary-900 to-indigo-950 text-white border border-primary-800/40 shadow-2xl shadow-primary-950/50 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

            <div className="space-y-4 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold tracking-wide">
                <School className="h-3.5 w-3.5 text-amber-400" />
                <span>School ID: 305412 • Surallah</span>
              </div>
              <h2 className="text-3xl font-black tracking-tight leading-tight">
                Empowering Centralian Excellence
              </h2>
              <p className="text-xs text-primary-200/90 leading-relaxed font-normal">
                Welcome to Centrala National High School’s integrated Extracurricular Activities and Student Development System. Discover recognized organizations, verify official attendance, and build an authentic digital portfolio.
              </p>
            </div>

            {/* Feature Pills */}
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                  <QrCode className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Anti-Fraud QR Check-In</h4>
                  <p className="text-[11px] text-primary-200/70">Time-windowed dynamic tokens for club meetings</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Digital Student Portfolio</h4>
                  <p className="text-[11px] text-primary-200/70">Automatic milestone badges & verified certificates</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">DepEd Recognized Security</h4>
                  <p className="text-[11px] text-primary-200/70">Role-based access control with comprehensive audit trail</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 text-[11px] text-primary-300/80 flex items-center justify-between relative z-10">
              <span>Region XII • SOCCSKSARGEN</span>
              <span className="font-semibold text-white">Academic Year 2026-2027</span>
            </div>
          </motion.div>

          {/* Right Column: Interactive Login Portal */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-7 w-full max-w-xl mx-auto rounded-3xl border border-border/80 bg-card/90 backdrop-blur-2xl p-6 sm:p-10 shadow-2xl shadow-primary-500/5 relative"
          >
            <div className="text-center space-y-1.5 mb-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 dark:bg-primary-950/70 px-3.5 py-1 text-xs font-bold text-primary-700 dark:text-primary-300 border border-primary-500/20">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Official Institutional Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                Sign In to CNHS StudentX
              </h1>
              <p className="text-xs text-muted-foreground">
                Enter your credentials or choose a quick 1-click test role below
              </p>
            </div>

            {/* Quick 1-Click Role Switcher & Instant Launcher */}
            <div className="mb-6 p-3.5 rounded-2xl bg-muted/50 border border-border/80 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
                <span>1-CLICK QUICK LAUNCH:</span>
                <span className="text-[10px] text-primary-600 dark:text-primary-400 font-semibold">Pre-populated Test Credentials</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(['student', 'teacher', 'admin'] as const).map((roleKey) => (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => handleInstantLaunch(roleKey)}
                    disabled={launchingRole !== null || isLoading}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer relative group ${
                      activeRoleTab === roleKey
                        ? 'bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/25 scale-[1.02]'
                        : 'bg-background hover:bg-accent border-border/80 text-foreground hover:border-primary-500/40'
                    }`}
                  >
                    {launchingRole === roleKey ? (
                      <Loader2 className="h-4 w-4 animate-spin mb-1 text-white" />
                    ) : (
                      <span className="text-sm mb-0.5">
                        {roleKey === 'student' ? '🎓' : roleKey === 'teacher' ? '🧑‍🏫' : '🏛️'}
                      </span>
                    )}
                    <span className="capitalize text-[11px] font-extrabold">{roleKey}</span>
                    <span className={`text-[9px] font-normal ${activeRoleTab === roleKey ? 'text-primary-100' : 'text-muted-foreground'}`}>
                      {roleKey === 'student' ? 'Learner' : roleKey === 'teacher' ? 'Adviser' : 'Admin'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Active Role Card Preview */}
              <div className="p-2.5 rounded-xl bg-background/80 border border-border/70 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-foreground text-[11px]">{demoAccounts[activeRoleTab].name}</p>
                  <p className="text-[10px] text-muted-foreground">{demoAccounts[activeRoleTab].roleLabel}</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="gradient"
                  className="text-xs h-7 px-3 font-bold"
                  onClick={() => handleInstantLaunch(activeRoleTab)}
                  isLoading={launchingRole === activeRoleTab}
                >
                  Launch Now <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Standard Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5">
                  Institutional Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    placeholder="name@cnhs.edu.ph"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background/70 pl-10 pr-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-foreground">Password</label>
                  <span 
                    onClick={() => alert('For test accounts, the password is: Password123!\n\nFor personal accounts, please contact the Centrala National High School ICT Coordinator.')}
                    className="text-[11px] text-primary-600 dark:text-primary-400 hover:underline cursor-pointer font-medium"
                  >
                    Forgot Password?
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background/70 pl-10 pr-10 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="gradient"
                size="lg"
                className="w-full font-black text-sm h-11 shadow-lg shadow-primary-500/25 mt-2"
                isLoading={isLoading}
              >
                Sign In to Centrala Portal <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            {/* Bottom Actions */}
            <div className="mt-6 pt-5 border-t border-border/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-muted-foreground font-medium">
                New Centralian student?{' '}
                <Link href="/register" className="font-bold text-primary-600 dark:text-primary-400 hover:underline">
                  Create an account
                </Link>
              </span>
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors font-medium">
                ← Back to Homepage
              </Link>
            </div>
          </motion.div>

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 border-t border-border/60 text-center text-[11px] text-muted-foreground">
        <p>Centrala National High School, Surallah, South Cotabato • DepEd Region XII • School ID: 305412</p>
      </footer>
    </div>
  );
}
