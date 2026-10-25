"use client";

import React, { useEffect, useState } from 'react';
import { Activity } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { ApiClient } from '@/lib/api';
import { toast } from 'sonner';
import { realtimeSync } from '@/lib/realtime';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  ShieldCheck,
  HeartPulse,
  MapPin,
  Phone,
  Users2,
  ClipboardList,
  Calendar,
  Clock,
  Award,
  CheckCircle2,
} from 'lucide-react';

interface RegistrationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  onRegistered?: () => void;
}

interface FormState {
  participantName: string;
  address: string;
  contactNumber: string;
  guardianName: string;
  guardianRelationship: string;
  guardianContact: string;
  guardianConsent: boolean;
  medicalNotes: string;
  motivation: string;
}

const EMPTY_FORM: FormState = {
  participantName: '',
  address: '',
  contactNumber: '',
  guardianName: '',
  guardianRelationship: 'Parent',
  guardianContact: '',
  guardianConsent: false,
  medicalNotes: '',
  motivation: '',
};

const RELATIONSHIPS = ['Parent', 'Mother', 'Father', 'Legal Guardian', 'Grandparent', 'Sibling', 'Aunt / Uncle', 'Other Relative'];

function SectionLabel({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="flex items-center gap-3 pb-2 border-b border-border/60 mb-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-600/10 text-primary-600 dark:text-primary-400">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-bold text-foreground leading-tight">{title}</h4>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

const inputCls =
  'w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-shadow';
const labelCls = 'block text-[11px] font-bold text-foreground mb-1.5';

export function RegistrationFormModal({ isOpen, onClose, activity, onRegistered }: RegistrationFormModalProps) {
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touchedSubmit, setTouchedSubmit] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setForm((prev) => ({
        ...prev,
        participantName: prev.participantName || `${user.firstName} ${user.lastName}`.trim(),
        contactNumber: prev.contactNumber || (user.phone && !user.phone.startsWith('+63 9') ? '' : prev.contactNumber),
        guardianName: prev.guardianName || (user.student?.guardian_name || ''),
        guardianContact: prev.guardianContact || (user.student?.guardian_phone || ''),
      }));
      setTouchedSubmit(false);
    }
  }, [isOpen, user]);

  if (!activity) return null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.participantName.trim()) errors.participantName = 'Full name is required';
  if (!form.address.trim()) errors.address = 'Home address is required';
  if (!form.contactNumber.trim()) errors.contactNumber = 'Contact number is required';
  if (!form.guardianName.trim()) errors.guardianName = "Guardian's name is required";
  if (!form.guardianContact.trim()) errors.guardianContact = "Guardian's contact number is required";
  if (!form.guardianConsent) errors.guardianConsent = 'Guardian consent is required to register';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouchedSubmit(true);
    if (Object.keys(errors).length > 0) {
      toast.error('Please complete the required fields', {
        description: Object.values(errors)[0],
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await ApiClient.post('/registrations/register', {
        activityId: activity.id,
        participantName: form.participantName.trim(),
        address: form.address.trim(),
        contactNumber: form.contactNumber.trim(),
        guardianName: form.guardianName.trim(),
        guardianRelationship: form.guardianRelationship,
        guardianContact: form.guardianContact.trim(),
        guardianConsent: form.guardianConsent,
        medicalNotes: form.medicalNotes.trim() || undefined,
        motivation: form.motivation.trim() || undefined,
      });

      const studentDisplayName = user ? `${user.firstName} ${user.lastName}` : form.participantName;
      toast.success('Registration Submitted! 🎉', {
        description: 'Your application has been forwarded to the adviser for approval. Watch for the approval notification.',
      });

      realtimeSync.broadcast(
        'REGISTRATION_SUBMITTED',
        {
          activityId: activity.id,
          activityTitle: activity.title,
          studentName: studentDisplayName,
        },
        studentDisplayName,
        'STUDENT'
      );

      setForm(EMPTY_FORM);
      onRegistered?.();
      onClose();
    } catch (err: any) {
      toast.error('Registration Failed', { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="3xl"
      title="Activity Registration Form"
      description="Complete your learner details and secure your guardian's consent to apply."
    >
      {/* Activity summary banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 mb-5">
        <div className="absolute inset-0">
          <img src={activity.banner_image} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
        </div>
        <div className="relative p-4 sm:p-5 text-white">
          <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ backgroundColor: activity.category_color || '#4F46E5' }}>
            {activity.category_name || 'Extracurricular'}
          </span>
          <h3 className="text-base sm:text-lg font-black leading-snug">{activity.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-white/85">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> {activity.date}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {activity.start_time} - {activity.end_time}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {activity.location}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-amber-300">
              <Award className="h-3.5 w-3.5" /> +{activity.points || 20} pts
            </span>
          </div>
          {user?.student && (
            <p className="mt-2 text-[11px] text-white/70">
              Filing as <span className="font-bold text-white">{user.student.grade_level} - {user.student.section}</span>
              {' • '}LRN <span className="font-mono font-bold text-white">{user.student.student_id_number}</span>
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-h-[55vh] overflow-y-auto pr-1 -mr-1">
        {/* SECTION 1: PERSONAL INFORMATION */}
        <section>
          <SectionLabel
            icon={<User className="h-4 w-4" />}
            title="1. Learner Personal Information"
            subtitle="Confirm your details as they should appear on official records"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className={labelCls}>Full Name *</label>
              <input
                type="text"
                value={form.participantName}
                onChange={(e) => set('participantName', e.target.value)}
                placeholder="e.g. Nicole Maquilan"
                className={inputCls}
              />
              {touchedSubmit && errors.participantName && (
                <p className="text-[10px] font-semibold text-rose-600 mt-1">{errors.participantName}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Home Address *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="Purok, Barangay, Municipality"
                  className={`${inputCls} pl-9`}
                />
              </div>
              {touchedSubmit && errors.address && (
                <p className="text-[10px] font-semibold text-rose-600 mt-1">{errors.address}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Contact Number (Mobile) *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="tel"
                  value={form.contactNumber}
                  onChange={(e) => set('contactNumber', e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  className={`${inputCls} pl-9`}
                />
              </div>
              {touchedSubmit && errors.contactNumber && (
                <p className="text-[10px] font-semibold text-rose-600 mt-1">{errors.contactNumber}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>
                Medical Conditions / Allergies
                <span className="font-normal text-muted-foreground"> (optional, visible to advisers only)</span>
              </label>
              <div className="relative">
                <HeartPulse className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground" />
                <textarea
                  rows={2}
                  value={form.medicalNotes}
                  onChange={(e) => set('medicalNotes', e.target.value)}
                  placeholder="e.g. Asthma, peanut allergy, or write 'None'"
                  className={`${inputCls} pl-9 resize-none`}
                />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: GUARDIAN INFORMATION */}
        <section>
          <SectionLabel
            icon={<Users2 className="h-4 w-4" />}
            title="2. Parent / Guardian Information"
            subtitle="Required for school clearance and emergency contact"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Guardian Full Name *</label>
              <input
                type="text"
                value={form.guardianName}
                onChange={(e) => set('guardianName', e.target.value)}
                placeholder="e.g. Maria Maquilan"
                className={inputCls}
              />
              {touchedSubmit && errors.guardianName && (
                <p className="text-[10px] font-semibold text-rose-600 mt-1">{errors.guardianName}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>Relationship to Student *</label>
              <select
                value={form.guardianRelationship}
                onChange={(e) => set('guardianRelationship', e.target.value)}
                className={inputCls}
              >
                {RELATIONSHIPS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Guardian Contact Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="tel"
                  value={form.guardianContact}
                  onChange={(e) => set('guardianContact', e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  className={`${inputCls} pl-9`}
                />
              </div>
              {touchedSubmit && errors.guardianContact && (
                <p className="text-[10px] font-semibold text-rose-600 mt-1">{errors.guardianContact}</p>
              )}
            </div>
          </div>
        </section>

        {/* SECTION 3: MOTIVATION + CONSENT */}
        <section>
          <SectionLabel
            icon={<ClipboardList className="h-4 w-4" />}
            title="3. Motivation & Guardian Consent"
            subtitle="Tell the adviser why you want to join, then certify consent"
          />
          <div className="space-y-3">
            <div>
              <label className={labelCls}>
                Why do you want to join this activity?
                <span className="font-normal text-muted-foreground"> (optional)</span>
              </label>
              <textarea
                rows={3}
                value={form.motivation}
                onChange={(e) => set('motivation', e.target.value)}
                placeholder="e.g. I want to develop my public speaking skills and represent our school in the division summit..."
                className={`${inputCls} resize-none`}
              />
            </div>

            <label
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors ${
                form.guardianConsent
                  ? 'border-emerald-500/60 bg-emerald-50/60 dark:bg-emerald-950/30'
                  : touchedSubmit && errors.guardianConsent
                  ? 'border-rose-400/70 bg-rose-50/50 dark:bg-rose-950/20'
                  : 'border-border bg-muted/40 hover:border-primary-500/40'
              }`}
            >
              <input
                type="checkbox"
                checked={form.guardianConsent}
                onChange={(e) => set('guardianConsent', e.target.checked)}
                className="sr-only"
              />
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                  form.guardianConsent
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-muted-foreground/40 bg-background'
                }`}
              >
                {form.guardianConsent && <CheckCircle2 className="h-4 w-4" />}
              </span>
              <span className="text-[11px] leading-relaxed text-foreground/90">
                <span className="font-bold">Guardian Consent Declaration. *</span> I certify that my{' '}
                <span className="font-bold">{form.guardianName.trim() || 'parent/guardian'}</span> has been informed
                of this activity and grants permission for my participation in
                {" "}<span className="font-bold">&quot;{activity.title}&quot;</span>, including its scheduled
                sessions, travel, and documented attendance requirements of Centrala National High School.
              </span>
            </label>
            {touchedSubmit && errors.guardianConsent && (
              <p className="text-[10px] font-semibold text-rose-600">{errors.guardianConsent}</p>
            )}
          </div>
        </section>
      </form>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 mt-4 border-t border-border">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Details are shared only with the activity adviser and school administrators.</span>
        </div>
        <div className="flex items-center gap-2 sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSubmit as any} isLoading={isSubmitting} className="font-bold shadow-md px-5">
            Submit Application
          </Button>
        </div>
      </div>
    </Modal>
  );
}
