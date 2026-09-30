"use client";

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { RecommendedActivity } from '@/types';
import { ActivityCard } from '@/components/activities/ActivityCard';
import { Button } from '@/components/ui/Button';
import { Sparkles, CheckCircle2, Award, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function RecommendedActivitiesPage() {
  const [recommendations, setRecommendations] = useState<RecommendedActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const fetchRecommendations = () => {
    setIsLoading(true);
    ApiClient.get<RecommendedActivity[]>('/recommendations')
      .then((data) => {
        setRecommendations(data || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleRegister = async (activityId: string) => {
    setRegisteringId(activityId);
    try {
      await ApiClient.post('/registrations/register', { activityId });
      toast.success('Registration Submitted!', {
        description: 'Your request has been forwarded to the adviser.',
      });
      fetchRecommendations();
    } catch (err: any) {
      toast.error('Registration Failed', { description: err.message });
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
          <Sparkles className="h-4 w-4" />
          <span>Smart Matching Engine</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Recommended For You
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
          Curated opportunities calculated by matching your student interests, declared skills, grade level, and previous activity attendance.
        </p>
      </div>

      {/* Explanation Banner */}
      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 dark:border-indigo-900/40 dark:bg-indigo-950/20 p-4 flex items-start gap-3 text-xs text-indigo-900 dark:text-indigo-200">
        <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">How our recommendation algorithm works:</p>
          <p className="mt-0.5 text-muted-foreground dark:text-indigo-300">
            We evaluate active extracurricular opportunities against your grade eligibility (+25 pts), matching student interests (+25 pts), declared skills (+20 pts), available seat capacity (+15 pts), and strand track curriculum alignment.
          </p>
        </div>
      </div>

      {/* Recommendations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-96 rounded-2xl bg-muted/40 animate-pulse border border-border" />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-base font-bold text-foreground">No matches at the moment</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Check your profile settings to add more interests and skills!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recommendations.map((rec) => (
            <div key={rec.id} className="flex flex-col justify-between rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="p-3 bg-muted/40 border-b border-border/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Compatibility
                  </span>
                  <span className="rounded-full bg-emerald-600 text-white text-xs font-black px-2.5 py-0.5 shadow">
                    {rec.matchScore}% Match
                  </span>
                </div>

                {/* Match Reasons List */}
                <div className="space-y-1">
                  {rec.matchReasons.slice(0, 2).map((reason, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-foreground/90 font-medium">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span className="truncate">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-2">
                <ActivityCard
                  activity={rec}
                  onRegister={handleRegister}
                  isRegistering={registeringId === rec.id}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
