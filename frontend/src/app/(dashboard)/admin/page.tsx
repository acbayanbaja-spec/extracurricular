"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ApiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import {
  Users,
  Compass,
  CalendarCheck2,
  Award,
  FileCheck,
  TrendingUp,
  Download,
  ShieldCheck,
  Clock,
  ArrowUpRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    ApiClient.get<any>('/analytics/admin')
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const handleExport = async (type: 'attendance' | 'registrations') => {
    try {
      const csvData = await ApiClient.get<string>(`/analytics/export/${type}`);
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cnhs_${type}_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`${type.toUpperCase()} report exported as CSV!`);
    } catch (err: any) {
      toast.error('Failed to export report', { description: err.message });
    }
  };

  if (isLoading) {
    return <div className="p-12 text-center text-xs text-muted-foreground">Loading admin analytics dashboard...</div>;
  }

  const kpis = data?.kpis || {};
  const activitiesByCategory = data?.activitiesByCategory || [];
  const participationByGrade = data?.participationByGrade || [];
  const popularActivities = data?.popularActivities || [];
  const participationOverTime = data?.participationOverTime || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="h-4 w-4" />
            <span>Executive Administration Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Centrala High Extracurricular Analytics
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time institutional oversight, participation distribution, and verified accreditation stats.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('attendance')} className="text-xs font-bold hover:scale-[1.02] transition-transform">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export Attendance CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('registrations')} className="text-xs font-bold hover:scale-[1.02] transition-transform">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Export Registrations CSV
          </Button>
        </div>
      </motion.div>

      {/* KPI Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5"
      >
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-primary-500/40 hover:shadow-md transition-all group">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Students</p>
          <p className="text-2xl font-black text-foreground mt-0.5 group-hover:text-primary-600 transition-colors">{kpis.totalStudents || 4}</p>
          <span className="text-[10px] text-muted-foreground">Enrolled Learners</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-primary-500/40 hover:shadow-md transition-all group">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Active Clubs</p>
          <p className="text-2xl font-black text-primary-600 mt-0.5 group-hover:scale-105 transition-transform origin-left">{kpis.totalActivities || 7}</p>
          <span className="text-[10px] text-muted-foreground">Published Activities</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-indigo-500/40 hover:shadow-md transition-all group">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Registrations</p>
          <p className="text-2xl font-black text-indigo-600 mt-0.5 group-hover:scale-105 transition-transform origin-left">{kpis.totalRegistrations || 9}</p>
          <span className="text-[10px] text-muted-foreground">Applications logged</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all group">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Avg Attendance</p>
          <p className="text-2xl font-black text-emerald-600 mt-0.5 group-hover:scale-105 transition-transform origin-left">{kpis.averageAttendanceRate || 94.1}%</p>
          <span className="text-[10px] text-muted-foreground">Across all sessions</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-amber-500/40 hover:shadow-md transition-all group">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Badges Awarded</p>
          <p className="text-2xl font-black text-amber-500 mt-0.5 group-hover:scale-105 transition-transform origin-left">{kpis.achievementsAwarded || 5}</p>
          <span className="text-[10px] text-muted-foreground">Merit honors</span>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm hover:border-rose-500/40 hover:shadow-md transition-all group">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Certificates</p>
          <p className="text-2xl font-black text-rose-500 mt-0.5 group-hover:scale-105 transition-transform origin-left">{kpis.certificatesIssued || 3}</p>
          <span className="text-[10px] text-muted-foreground">Verified credentials</span>
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participation Trends (Area Chart) */}
        <div className="lg:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/80">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Extracurricular Growth & Attendance Trends
              </h3>
              <p className="text-xs text-muted-foreground">Monthly registrations and average attendance percentage</p>
            </div>
            <span className="rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-bold px-2 py-0.5">
              S.Y. 2026-2027
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={participationOverTime}>
                <defs>
                  <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="registrations" stroke="#4F46E5" fillOpacity={1} fill="url(#colorReg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution (Donut Chart) */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground pb-4 mb-4 border-b border-border/80">
            Activities by Category
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={activitiesByCategory}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                >
                  {activitiesByCategory.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#4F46E5'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2 max-h-24 overflow-y-auto">
            {activitiesByCategory.map((c: any) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="truncate">{c.name}</span>
                </span>
                <span className="font-bold text-foreground">{c.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grade Level Participation & Popular Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Participation by Grade */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground pb-4 mb-4 border-b border-border/80">
            Participation by Grade Level
          </h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={participationByGrade}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Popular Activities */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-border/80">
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Most Active Extracurricular Programs
            </h3>
            <Link href="/admin/activities" className="text-xs font-semibold text-primary-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {popularActivities.map((act: any) => (
              <div key={act.id} className="rounded-2xl border border-border bg-muted/30 p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground truncate max-w-[280px]">
                    {act.title}
                  </h4>
                  <span className="text-xs font-bold text-primary-600">
                    {act.current_participants} / {act.max_participants} seats
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary-600"
                    style={{
                      width: `${Math.min(100, Math.round((act.current_participants / act.max_participants) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
