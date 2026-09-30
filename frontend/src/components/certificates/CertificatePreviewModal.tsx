"use client";

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Certificate } from '@/types';
import { Printer, ShieldCheck, Award, Download, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface CertificatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: Certificate | null;
  studentName?: string;
}

export function CertificatePreviewModal({
  isOpen,
  onClose,
  certificate,
  studentName,
}: CertificatePreviewModalProps) {
  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-amber-500" />
          <span>Verified Certificate Credentials</span>
        </div>
      }
      description="Official certificate issued by Centrala National High School, Surallah, South Cotabato."
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {/* Certificate Paper View */}
        <div
          id="certificate-print-area"
          className="relative overflow-hidden rounded-2xl border-4 border-double border-amber-600/60 bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 p-8 text-center text-slate-800 shadow-xl dark:border-amber-500/40 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 dark:text-slate-100"
        >
          {/* Subtle Watermark Seal */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
            <Award className="h-96 w-96 text-amber-500" />
          </div>

          {/* School Header */}
          <div className="space-y-1">
            <p className="text-[11px] font-bold tracking-widest uppercase text-amber-800 dark:text-amber-400">
              Republic of the Philippines • Department of Education • Region XII
            </p>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Centrala National High School
            </h2>
            <p className="text-xs text-muted-foreground">
              Surallah, South Cotabato • Division of South Cotabato
            </p>
          </div>

          <div className="my-6">
            <div className="inline-block rounded-full border border-amber-400/50 bg-amber-100/60 dark:bg-amber-950/60 px-4 py-1 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
              Certificate of Commendation
            </div>
            <p className="text-xs text-muted-foreground mt-3 italic">This is proudly conferred upon</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-primary-700 dark:text-primary-400 my-2 tracking-tight">
              {studentName || 'Angelo Morales'}
            </h3>
            <p className="text-xs text-muted-foreground max-w-lg mx-auto">
              for exemplary active participation and meritorious accomplishment in
            </p>
            <h4 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              "{certificate.title}"
            </h4>
            {certificate.description && (
              <p className="text-xs text-muted-foreground max-w-md mx-auto mt-2 leading-relaxed">
                {certificate.description}
              </p>
            )}
          </div>

          {/* Signatures & Verification */}
          <div className="mt-8 pt-6 border-t border-amber-300/40 dark:border-amber-700/40 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
            <div className="text-left">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-0.5">
                <ShieldCheck className="h-4 w-4" />
                <span>OFFICIALLY VERIFIED</span>
              </div>
              <p className="font-mono text-[11px] text-muted-foreground">
                No: {certificate.certificate_number}
              </p>
              <p className="text-[10px] text-muted-foreground">
                Conferred: {formatDate(certificate.issue_date)}
              </p>
            </div>

            <div className="text-center sm:text-right">
              <div className="h-8 border-b border-slate-400/50 w-44 mx-auto sm:ml-auto" />
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-1">
                {certificate.issuer_first_name ? `${certificate.issuer_first_name} ${certificate.issuer_last_name}` : 'School Administrator'}
              </p>
              <p className="text-[10px] text-muted-foreground">Activity Adviser / CNHS Authority</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 no-print">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="mr-1.5 h-3.5 w-3.5" /> Print / Save as PDF
          </Button>
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
