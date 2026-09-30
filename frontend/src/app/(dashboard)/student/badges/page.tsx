"use client";

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { Badge as BadgeType, Milestone } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Award, Trophy, Star, Target, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function StudentBadgesPage() {
  const [badges, setBadges] = useState<BadgeType[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      ApiClient.get<BadgeType[]>('/achievements/badges/my').catch(() => []),
      ApiClient.get<Milestone[]>('/achievements/milestones/my').catch(() => []),
    ]).then(([bdgs, mls]) => {
      setBadges(bdgs || []);
      setMilestones(mls || []);
      setIsLoading(false);
    });
  }, []);

  const tierColors: Record<string, string> = {
    Bronze: 'from-amber-600 to-amber-800 text-amber-100',
    Silver: 'from-slate-400 to-slate-600 text-slate-100',
    Gold: 'from-amber-400 to-yellow-600 text-amber-950',
    Platinum: 'from-indigo-400 via-purple-500 to-indigo-700 text-white',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">
          <Award className="h-4 w-4" />
          <span>Accreditation & Honors</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Badges & Development Milestones
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
          Digital credentials earned through active service, high attendance, leadership roles, and extracurricular excellence at Centrala National High School.
        </p>
      </div>

      {/* Badges Showcase Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            Digital Badges Collection
          </h2>
          <span className="text-xs font-semibold text-muted-foreground">
            {badges.filter((b) => b.isUnlocked).length} / {badges.length} Unlocked
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-48 rounded-2xl bg-muted/40 animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {badges.map((badge) => {
              const unlocked = badge.isUnlocked;
              return (
                <div
                  key={badge.id}
                  className={`relative flex flex-col justify-between rounded-2xl border p-5 transition-all duration-200 ${
                    unlocked
                      ? 'border-amber-400/50 bg-card shadow-lg hover:shadow-xl'
                      : 'border-border/60 bg-muted/20 opacity-60'
                  }`}
                >
                  <div>
                    {/* Top Tier Tag */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {badge.tier} Tier
                      </span>
                      {unlocked ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Unlocked
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
                          <Lock className="h-3 w-3" /> Locked
                        </span>
                      )}
                    </div>

                    {/* Badge Icon Emblem */}
                    <div
                      className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr shadow-md ${
                        unlocked
                          ? tierColors[badge.tier] || 'from-amber-400 to-amber-600'
                          : 'from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800 text-gray-500'
                      }`}
                    >
                      <Award className="h-8 w-8" />
                    </div>

                    <h3 className="text-sm font-bold text-foreground text-center">
                      {badge.name}
                    </h3>
                    <p className="mt-1 text-[11px] text-muted-foreground text-center leading-relaxed">
                      {badge.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/60 text-[10px] text-muted-foreground">
                    <p className="font-semibold text-foreground/80 mb-0.5">Criteria:</p>
                    <p className="italic">{badge.criteria}</p>
                    {unlocked && badge.earnedAt && (
                      <p className="mt-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        Earned: {formatDate(badge.earnedAt)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Milestones Roadmap Section */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            Student Development Roadmap & Milestones
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Progress toward official credentials and school-wide recognition levels.
          </p>
        </div>

        <div className="space-y-4">
          {milestones.map((m) => {
            const completed = Boolean(m.is_completed);
            const current = m.current_value || 0;
            const target = m.target_value || 1;
            const percent = Math.min(100, Math.round((current / target) * 100));

            return (
              <div
                key={m.id}
                className="rounded-2xl border border-border/80 bg-muted/30 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">
                      {m.category}
                    </span>
                    {completed && (
                      <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                        Completed ✓
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-foreground">{m.title}</h3>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                </div>

                <div className="w-full sm:w-56 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-foreground">
                      {current} / {target}
                    </span>
                    <span className="text-muted-foreground">{percent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        completed ? 'bg-emerald-500' : 'bg-primary-600'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  {m.badge_name && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Award className="h-3 w-3 text-amber-500" />
                      Awards: <span className="font-semibold text-foreground">{m.badge_name}</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
