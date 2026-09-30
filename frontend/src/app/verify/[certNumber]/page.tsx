"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ApiClient } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ShieldCheck, Award, GraduationCap, XCircle, Printer } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function CertificateVerificationPage() {
  const params = useParams();
  const certNumber = params?.certNumber as string;
  const [cert, setCert] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!certNumber) return;
    setIsLoading(true);
    ApiClient.get<any>(`/certificates/verify/${certNumber}`)
      .then((data) => setCert(data))
      .catch(() => setCert(null))
      .finally(() => setIsLoading(false));
  }, [certNumber]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="flex h-16 items-center justify-between px-6 border-b border-border/80">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-700 to-indigo-500 text-white shadow-md">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-foreground">
              Centrala National High School
            </span>
            <p className="text-[10px] text-muted-foreground">Surallah, South Cotabato</p>
          </div>
        </Link>
      </header>

      {/* Main Verification Card */}
      <main className="container mx-auto max-w-xl py-12 px-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-muted-foreground">Verifying certificate credentials...</div>
        ) : !cert ? (
          <div className="rounded-3xl border border-destructive/40 bg-destructive/10 p-8 text-center space-y-3">
            <XCircle className="h-12 w-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold text-foreground">Certificate Record Not Found</h2>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              No record matches certificate number <span className="font-mono font-bold text-foreground">{certNumber}</span> in the official Centrala National High School database.
            </p>
            <Link href="/" className="inline-block mt-4">
              <Button size="sm">Return Home</Button>
            </Link>
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-emerald-500/40 bg-card p-6 sm:p-8 shadow-xl space-y-6">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold px-3 py-1 mb-2">
                <ShieldCheck className="h-4 w-4" />
                <span>OFFICIALLY VERIFIED CREDENTIAL</span>
              </div>
              <h1 className="text-2xl font-black text-foreground">
                Authentic Certificate Record
              </h1>
              <p className="text-xs text-muted-foreground">
                Centrala National High School Extracurricular Activities Board
              </p>
            </div>

            <div className="rounded-2xl bg-muted/40 p-4 border border-border/80 space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground font-semibold">Certificate Number:</span>
                <span className="font-mono font-bold text-foreground">{cert.certificate_number}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground font-semibold">Recipient Learner:</span>
                <span className="font-bold text-primary-600">{cert.student_first_name} {cert.student_last_name}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground font-semibold">Learner Reference Number:</span>
                <span className="font-mono text-foreground">{cert.student_id_number}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground font-semibold">Program / Activity:</span>
                <span className="font-bold text-foreground text-right">{cert.activity_title}</span>
              </div>
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground font-semibold">Date Conferred:</span>
                <span className="text-foreground">{formatDate(cert.issue_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">Authorized Authority:</span>
                <span className="text-foreground">{cert.issuer_first_name ? `${cert.issuer_first_name} ${cert.issuer_last_name}` : 'CNHS Administration'}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button size="sm" onClick={() => window.print()} className="font-bold">
                <Printer className="mr-1.5 h-3.5 w-3.5" /> Print Verification Sheet
              </Button>
            </div>
          </div>
        )}
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border">
        Centrala National High School • Surallah, South Cotabato • Region XII
      </footer>
    </div>
  );
}
