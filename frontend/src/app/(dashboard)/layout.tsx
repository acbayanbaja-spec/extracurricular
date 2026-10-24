"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { CelebrationModal } from '@/components/celebration/CelebrationModal';
import { Loader2 } from 'lucide-react';
import { realtimeSync, RealtimeMessage } from '@/lib/realtime';
import { toast } from 'sonner';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  // Real-time cross-tab & cross-user notification listener
  useEffect(() => {
    if (!user) return;

    const unsubscribe = realtimeSync.subscribe((msg: RealtimeMessage) => {
      // Don't show toast to the user who triggered it unless it's a global notification
      if (msg.type === 'ANNOUNCEMENT_POSTED') {
        toast.info('📢 New Campus Bulletin', {
          description: `${msg.senderName || 'Faculty'}: "${msg.payload?.title || 'Notice'}"`,
        });
      } else if (msg.type === 'REGISTRATION_SUBMITTED' && (user.role === 'TEACHER' || user.role === 'ADMINISTRATOR')) {
        toast.info('📝 New Participant Registration', {
          description: `${msg.payload?.studentName || 'Learner'} applied for "${msg.payload?.activityTitle || 'Activity'}"`,
        });
      } else if (msg.type === 'REGISTRATION_REVIEWED' && user.role === 'STUDENT') {
        toast.success(`🎉 Application ${msg.payload?.status}!`, {
          description: `Your registration for "${msg.payload?.activityTitle || 'Club'}" was marked as ${msg.payload?.status}.`,
        });
      } else if (msg.type === 'ATTENDANCE_CHECKED_IN' && (user.role === 'TEACHER' || user.role === 'ADMINISTRATOR')) {
        toast.success('✅ Student Check-In Verified', {
          description: `${msg.payload?.studentName || 'Learner'} checked in via session QR scan.`,
        });
      } else if (msg.type === 'CERTIFICATE_ISSUED' && user.role === 'STUDENT') {
        toast.success('📜 Official Certificate Conferred!', {
          description: `You were awarded "${msg.payload?.title || 'Credential'}" by Adviser Javidec Monsion.`,
        });
      } else if (msg.type === 'ACTIVITY_CREATED' && user.role === 'STUDENT') {
        toast.info('🌟 New Activity Published!', {
          description: `"${msg.payload?.title || 'Program'}" is now open for registration! Check Discover Activities.`,
        });
      } else if (msg.type === 'BADGE_AWARDED' && user.role === 'STUDENT') {
        toast.success(`🏅 Honor Badge Conferred: ${msg.payload?.badgeName || 'Honor Badge'}!`, {
          description: `Adviser ${msg.senderName || 'Javidec Monsion'} has conferred the ${msg.payload?.badgeTier || 'Honor'} badge to your portfolio.`,
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-primary-600">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Loading Centrala High Portal...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Top Navbar */}
      <Navbar onMobileMenuToggle={() => setMobileSidebarOpen(!mobileSidebarOpen)} />

      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar
          isMobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Celebration Popup (Confetti + Modal when student receives award) */}
      <CelebrationModal />
    </div>
  );
}
