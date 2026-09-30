"use client";

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { Activity, Category } from '@/types';
import { ActivityCard } from '@/components/activities/ActivityCard';
import { Button } from '@/components/ui/Button';
import { Search, Filter, Compass, SlidersHorizontal, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function DiscoverActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [isLoading, setIsLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const fetchActivities = () => {
    setIsLoading(true);
    ApiClient.get<Activity[]>('/activities', {
      search,
      categoryId: selectedCategory,
      gradeLevel: selectedGrade,
      sortBy,
    })
      .then((data) => {
        setActivities(data || []);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    ApiClient.get<Category[]>('/activities/categories')
      .then((cats) => setCategories(cats || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(fetchActivities, 250);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, selectedGrade, sortBy]);

  const handleRegister = async (activityId: string) => {
    setRegisteringId(activityId);
    try {
      await ApiClient.post('/registrations/register', { activityId });
      toast.success('Registration Submitted! 🎉', {
        description: 'Your registration request has been forwarded to the adviser for approval.',
      });
      fetchActivities();
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
          <Compass className="h-4 w-4" />
          <span>Extracurricular Discovery</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          Discover Activities & School Clubs
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Explore sanctioned student clubs, competitions, leadership seminars, and athletic tryouts at Centrala National High School.
        </p>
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3 rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by activity title, club, keywords, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-input bg-background pl-10 pr-4 py-2.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="rounded-xl border border-input bg-background px-3 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Grades</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-input bg-background px-3 py-2.5 text-xs text-foreground focus:ring-2 focus:ring-primary-500"
            >
              <option value="date">Sort by Date</option>
              <option value="popularity">Most Popular</option>
              <option value="points">Highest Points</option>
              <option value="title">Alphabetical</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
          >
            All Categories
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-all ${
                selectedCategory === c.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Activities Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-80 rounded-2xl bg-muted/40 animate-pulse border border-border" />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-3">
            <Compass className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-foreground">No activities found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria, selecting a different category, or removing grade filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch('');
              setSelectedCategory('all');
              setSelectedGrade('all');
            }}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activities.map((act) => (
            <ActivityCard
              key={act.id}
              activity={act}
              onRegister={handleRegister}
              isRegistering={registeringId === act.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
