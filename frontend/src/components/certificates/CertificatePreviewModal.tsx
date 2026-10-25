"use client";

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Certificate } from '@/types';
import { Printer, ShieldCheck, Award, BadgeCheck } from 'lucide-react';
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
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const verifyUrl =
    typeof window !== 'undefined' && certificate
      ? `${window.location.origin}/verify/${certificate.certificate_number}`
      : certificate
        ? `https://cnhs-studentx.vercel.app/verify/${certificate.certificate_number}`
        : '';

  useEffect(() => {
    if (isOpen && certificate && verifyUrl) {
      QRCode.toDataURL(verifyUrl, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 220,
        color: { dark: '#1E3A8A', light: '#FFFFFF' },
      })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(null));
    }
  }, [isOpen, certificate, verifyUrl]);

  if (!certificate) return null;

  const handlePrint = () => {
    document.body.classList.add('printing-certificate');
    window.print();
    setTimeout(() => document.body.classList.remove('printing-certificate'), 500);
  };

  const isRevoked = certificate.status === 'REVOKED';

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
      maxWidth="3xl"
    >
      <div className="space-y-4">
        {/* Certificate Paper View */}
        <div
          id="certificate-print-area"
          className="certificate-paper relative overflow-hidden rounded-2xl border-[6px] border-double border-amber-600/70 bg-gradient-to-br from-amber-50 via-white to-amber-50 p-8 sm:p-10 text-center text-slate-800 shadow-2xl"
        >
          {/* Inner decorative frame */}
          <div className="pointer-events-none absolute inset-3 rounded-xl border border-amber-400/40" />

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
            <Award className="h-96 w-96 text-amber-600" />
          </div>

          {/* School Header */}
          <div className="relative space-y-1">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-800/80">
              Republic of the Philippines • Department of Education • Region XII
            </p>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900">
              Centrala National High School
            </h2>
            <p className="text-xs text-slate-500">
              Surallah, South Cotabato • Division of South Cotabato
            </p>
            <div className="mx-auto mt-3 h-px w-40 bg-gradient-to-r from-transparent via-amber-500/70 to-transparent" />
          </div>

          <div className="relative my-7">
            <div className="inline-block rounded-full border border-amber-400/60 bg-amber-100/70 px-5 py-1.5 text-sm font-black uppercase tracking-[0.15em] text-amber-900">
              Certificate of Commendation
            </div>
            <p className="text-xs text-slate-500 mt-4 italic">This is proudly conferred upon</p>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-indigo-900 my-2 tracking-tight font-serif">
              {studentName || 'Nicole Maquilan'}
            </h3>
            <div className="mx-auto mb-3 h-px w-56 bg-slate-400/50" />
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              for exemplary active participation and meritorious accomplishment in
            </p>
            <h4 className="text-lg font-bold text-slate-900 mt-1.5 max-w-xl mx-auto leading-snug">
              &quot;{certificate.title}&quot;
            </h4>
            {certificate.description && (
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-2 leading-relaxed">
                {certificate.description}
              </p>
            )}
          </div>

          {/* QR Verification + Signatures */}
          <div className="relative mt-6 pt-6 border-t border-amber-300/50 grid grid-cols-1 sm:grid-cols-[auto_1fr_auto] items-center gap-6 text-xs">
            {/* QR Authenticity Seal */}
            <div className="flex flex-col items-center gap-1 justify-self-center">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Certificate verification QR" className="h-20 w-20 rounded-lg border border-amber-300/60 bg-white p-1 shadow-sm" />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-slate-200 animate-pulse" />
              )}
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                Scan to Verify Authenticity
              </span>
            </div>

            {/* Credential Number */}
            <div className="text-center">
              <div className={`inline-flex items-center gap-1.5 font-bold text-[11px] mb-1 ${isRevoked ? 'text-rose-600' : 'text-emerald-700'}`}>
                <ShieldCheck className="h-4 w-4" />
                <span>{isRevoked ? 'REVOKED CREDENTIAL' : 'OFFICIALLY VERIFIED'}</span>
              </div>
              <p className="font-mono text-[12px] font-bold text-slate-700">
                No: {certificate.certificate_number}
              </p>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Conferred: {formatDate(certificate.issue_date)}
              </p>
              <p className="text-[9px] text-slate-400 mt-1 break-all max-w-[240px] mx-auto">
                {verifyUrl}
              </p>
            </div>

            {/* Signature */}
            <div className="text-center justify-self-center">
              <div className="h-9 border-b-2 border-slate-400/60 w-44 mx-auto" />
              <p className="font-bold text-slate-800 mt-1.5 tracking-wide">
                {certificate.issuer_first_name
                  ? `${certificate.issuer_first_name} ${certificate.issuer_last_name || ''}`
                  : 'School Administrator'}
              </p>
              <p className="text-[10px] text-slate-500">Activity Adviser / CNHS Authority</p>
              {certificate.activity_title && (
                <p className="text-[9px] text-slate-400 italic mt-0.5 max-w-[180px]">
                  for {certificate.activity_title}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-1 no-print">
          <a
            href={`/verify/${certificate.certificate_number}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[11px] font-bold text-primary-600 hover:text-primary-700 hover:underline"
          >
            <BadgeCheck className="h-4 w-4" />
            Open public verification page
          </a>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print / Save as PDF
            </Button>
            <Button size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
