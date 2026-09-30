"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { GraduationCap, ArrowRight, User, Mail, Lock, BookOpen } from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { toast } from 'sonner';

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    studentIdNumber: '',
    gradeLevel: 'Grade 10',
    section: 'Rizal',
    trackStrand: 'STEM',
    guardianName: '',
    guardianPhone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await ApiClient.post<{
        accessToken: string;
        refreshToken: string;
        user: any;
      }>('/auth/register', formData);

      localStorage.setItem('cnhs_access_token', data.accessToken);
      localStorage.setItem('cnhs_refresh_token', data.refreshToken);
      localStorage.setItem('cnhs_user', JSON.stringify(data.user));

      toast.success('Registration Complete! 🎉', {
        description: 'Welcome to Centrala National High School Extracurricular Portal.',
      });

      router.push('/student');
    } catch (err: any) {
      toast.error('Registration Failed', {
        description: err.message || 'Please check all required fields.',
      });
    } finally {
      setIsLoading(false);
    }
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

      {/* Register Box */}
      <div className="flex flex-1 items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-xl space-y-6 rounded-3xl border border-border/80 bg-card p-6 sm:p-8 shadow-2xl">
          <div className="text-center space-y-1">
            <span className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-bold px-3 py-1 border border-emerald-200 dark:border-emerald-800">
              Learner Self-Service Enrollment
            </span>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl mt-2">
              Create Student Account
            </h1>
            <p className="text-xs text-muted-foreground">
              Join clubs, earn digital badges, and track your extracurricular achievements
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Angelo"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Morales"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Institutional Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g. angelo@cnhs.edu.ph"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 6 characters"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Student LRN *</label>
                <input
                  type="text"
                  name="studentIdNumber"
                  value={formData.studentIdNumber}
                  onChange={handleChange}
                  placeholder="12-digit LRN"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Grade Level *</label>
                <select
                  name="gradeLevel"
                  value={formData.gradeLevel}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Section *</label>
                <input
                  type="text"
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  placeholder="e.g. Rizal / Bonifacio"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Track / Strand</label>
                <select
                  name="trackStrand"
                  value={formData.trackStrand}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
                >
                  <option value="STEM">Senior High - STEM</option>
                  <option value="ABM">Senior High - ABM</option>
                  <option value="HUMSS">Senior High - HUMSS</option>
                  <option value="TVL">Senior High - TVL / ICT</option>
                  <option value="Special Program in Arts">JHS - Special Program in Arts (SPA)</option>
                  <option value="Special Science Class">JHS - Special Science Class (SSC)</option>
                  <option value="General Curriculum">JHS - General Curriculum</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">Guardian Contact Phone</label>
                <input
                  type="text"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={handleChange}
                  placeholder="+63 9XX XXX XXXX"
                  className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <Button type="submit" size="md" isLoading={isLoading} className="w-full font-bold shadow-md mt-2">
              Register as Centrala High Student <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-1">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-primary-600 dark:text-primary-400 hover:underline">
              Sign In
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
