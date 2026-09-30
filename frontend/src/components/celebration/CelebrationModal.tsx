"use client";

import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Award, Sparkles, Star, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ApiClient } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { formatDate } from '@/lib/utils';

interface UncelebratedAward {
  record_id: string;
  award_type: string;
  title: string;
  description: string;
  tier: string;
  color: string;
  icon_name: string;
  earned_at: string;
}

export function CelebrationModal() {
  const { user } = useAuth();
  const [currentAward, setCurrentAward] = useState<UncelebratedAward | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'STUDENT') return;

    let isMounted = true;
    ApiClient.get<UncelebratedAward[]>('/achievements/uncelebrated')
      .then((awards) => {
        if (isMounted && awards && awards.length > 0) {
          setCurrentAward(awards[0]);
          setIsOpen(true);
          triggerConfettiBlast();
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [user]);

  const triggerConfettiBlast = () => {
    try {
      const duration = 2.5 * 1000;
      const animationEnd = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#4F46E5', '#F59E0B', '#10B981', '#EC4899'],
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#4F46E5', '#F59E0B', '#10B981', '#EC4899'],
        });

        if (Date.now() < animationEnd) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    } catch (e) {
      // safe fallback if canvas is restricted
    }
  };

  const handleDismiss = async () => {
    if (!currentAward) return;
    try {
      await ApiClient.post('/achievements/celebrate', { recordId: currentAward.record_id });
    } catch {}
    setIsOpen(false);
  };

  if (!isOpen || !currentAward) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleDismiss}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Celebration Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-card border-2 border-amber-400/40 p-8 text-center shadow-2xl"
        >
          {/* Ambient Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-4 right-4 rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Animated Badge Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.1, damping: 15 }}
            className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 text-white shadow-xl shadow-amber-500/30"
          >
            <Trophy className="h-12 w-12 text-amber-950 animate-pulse" />
          </motion.div>

          {/* Sparks Banner */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>NEW ACHIEVEMENT UNLOCKED</span>
          </div>

          <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Congratulations, {user?.firstName}!
          </h2>

          <p className="mt-2 text-sm text-muted-foreground">
            Centrala National High School commends your active extracurricular participation.
          </p>

          {/* Award Card Detail */}
          <div className="my-6 rounded-2xl bg-muted/60 p-4 border border-border text-left">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                {currentAward.tier} Tier Badge
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(currentAward.earned_at)}
              </span>
            </div>
            <h4 className="text-base font-bold text-foreground flex items-center gap-2">
              <Award className="h-4 w-4 text-amber-500" />
              {currentAward.title}
            </h4>
            <p className="text-xs text-muted-foreground mt-1">
              {currentAward.description}
            </p>
          </div>

          <Button
            onClick={handleDismiss}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-3 text-base shadow-lg shadow-amber-500/25 rounded-xl"
          >
            Collect Badge & Add to Portfolio
          </Button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
