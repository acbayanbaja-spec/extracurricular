"use client";

import React from 'react';
import Link from 'next/link';
import { Activity } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Calendar, MapPin, Users, Award, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface ActivityCardProps {
  activity: Activity;
  onRegister?: (activityId: string) => void;
  isRegistering?: boolean;
}

export function ActivityCard({ activity, onRegister, isRegistering = false }: ActivityCardProps) {
  const { user } = useAuth();
  const max = activity.max_participants || 30;
  const current = activity.current_participants || 0;
  const percentFilled = Math.min(100, Math.round((current / max) * 100));

  const isRegistered = !!activity.myRegistration;
  const regStatus = activity.myRegistration?.status;

  const defaultBanner =
    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card hover:border-primary-500/50 hover:shadow-xl transition-all duration-200">
      <div>
        {/* Banner with Badge Overlay */}
        <div className="relative h-44 w-full overflow-hidden bg-muted">
          <img
            src={activity.banner_image || defaultBanner}
            alt={activity.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow"
              style={{ backgroundColor: activity.category_color || '#4F46E5' }}
            >
              {activity.category_name || 'General'}
            </span>

            {isRegistered ? (
              <Badge variant={regStatus === 'Approved' ? 'success' : regStatus === 'Pending' ? 'warning' : 'secondary'}>
                {regStatus}
              </Badge>
            ) : (
              <Badge variant={activity.registration_status === 'Registration Open' ? 'success' : 'secondary'}>
                {activity.registration_status}
              </Badge>
            )}
          </div>

          {/* Points Pill */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-md bg-black/60 backdrop-blur-md px-2 py-0.5 text-xs font-semibold text-amber-300">
            <Award className="h-3 w-3" />
            <span>+{activity.points || 20} pts</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h3 className="line-clamp-2 text-base font-bold text-foreground group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {activity.title}
          </h3>

          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {activity.description}
          </p>

          {/* Details Metadata */}
          <div className="mt-3.5 space-y-1.5 text-xs text-muted-foreground border-t border-border/60 pt-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary-500" />
              <span>{formatDate(activity.date)}</span>
              <span className="text-muted-foreground/40">•</span>
              <Clock className="h-3.5 w-3.5 text-primary-500" />
              <span>{activity.start_time} - {activity.end_time}</span>
            </div>

            <div className="flex items-center gap-2 truncate">
              <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{activity.location}</span>
            </div>

            {activity.organization_name && (
              <p className="text-[11px] font-medium text-foreground/80 truncate">
                Club: {activity.organization_name}
              </p>
            )}
          </div>

          {/* Capacity Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3 w-3" />
                Capacity
              </span>
              <span className="font-semibold text-foreground">
                {current} / {max} slots ({max - current} left)
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  percentFilled >= 90 ? 'bg-rose-500' : percentFilled >= 70 ? 'bg-amber-500' : 'bg-primary-600'
                }`}
                style={{ width: `${percentFilled}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer Action */}
      <div className="p-4 sm:p-5 pt-0">
        {user?.role === 'STUDENT' ? (
          isRegistered ? (
            <Link href="/student/my-activities" className="w-full">
              <Button variant="outline" size="sm" className="w-full font-semibold">
                Manage My Registration
              </Button>
            </Link>
          ) : (
            <Button
              onClick={() => onRegister && onRegister(activity.id)}
              disabled={activity.registration_status !== 'Registration Open' || isRegistering}
              isLoading={isRegistering}
              size="sm"
              className="w-full font-bold shadow-sm"
            >
              {activity.current_participants >= activity.max_participants
                ? 'Join Waitlist'
                : 'Register Now'}
            </Button>
          )
        ) : (
          <Link href={`/${user?.role?.toLowerCase() || 'student'}/activities`} className="w-full">
            <Button variant="outline" size="sm" className="w-full font-semibold">
              View Activity Roster
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
