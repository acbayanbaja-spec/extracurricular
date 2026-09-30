"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { GraduationCap, Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  const handleDemoFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="flex h-16 items-center justify-between px-6 border-b border-border/80">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-700 to-indigo-500 text-white shadow-md">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-foreground">
              CNHS StudentX
            </span>
            <p className="text-[10px] text-muted-foreground">Centrala National High School</p>
          </div>
        </Link>
        <ThemeToggle />
      </header>

      {/* Login Box */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl">
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1 text-xs font-bold text-primary-700 dark:text-primary-300 mb-2">
              <Sparkles className="h-3 w-3" />
              <span>Surallah, South Cotabato</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
              Welcome Back
            </h1>
            <p className="text-xs text-muted-foreground">
              Sign in to your Extracurricular & Student Development account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Institutional Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="name@cnhs.edu.ph"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background pl-10 pr-3.5 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-foreground">Password</label>
                <span className="text-[11px] text-primary-600 dark:text-primary-400 hover:underline cursor-pointer">
                  Forgot?
                </span>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background pl-10 pr-10 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" size="md" isLoading={isLoading} className="w-full font-bold shadow-md">
              Sign In to CNHS Portal <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Logins for instant evaluation */}
          <div className="rounded-2xl bg-muted/50 p-3.5 border border-border/70 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
              Quick Test Demo Accounts (1-Click Fill)
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleDemoFill('student@cnhs.edu.ph')}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-[11px] font-semibold text-foreground hover:border-emerald-500 hover:text-emerald-600 transition-colors"
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('maria.santos@cnhs.edu.ph')}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-[11px] font-semibold text-foreground hover:border-sky-500 hover:text-sky-600 transition-colors"
              >
                👩‍🏫 Teacher
              </button>
              <button
                type="button"
                onClick={() => handleDemoFill('admin@cnhs.edu.ph')}
                className="rounded-lg border border-border bg-card px-2 py-1.5 text-[11px] font-semibold text-foreground hover:border-indigo-500 hover:text-indigo-600 transition-colors"
              >
                🛡️ Admin
              </button>
            </div>
            <p className="text-[10px] text-center text-muted-foreground">
              All demo passwords: <span className="font-mono font-bold">Password123!</span>
            </p>
          </div>

          <div className="text-center text-xs text-muted-foreground pt-1">
            New CNHS student?{' '}
            <Link href="/register" className="font-bold text-primary-600 dark:text-primary-400 hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-[11px] text-muted-foreground border-t border-border/80">
        Centrala National High School, Surallah, South Cotabato • DepEd Region XII
      </footer>
    </div>
  );
}
