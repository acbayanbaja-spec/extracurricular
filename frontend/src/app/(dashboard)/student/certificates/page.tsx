"use client";

import React, { useState, useEffect } from 'react';
import { ApiClient } from '@/lib/api';
import { Certificate } from '@/types';
import { CertificatePreviewModal } from '@/components/certificates/CertificatePreviewModal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileCheck, ShieldCheck, Eye, Printer, Award, ExternalLink } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

export default function StudentCertificatesPage() {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    ApiClient.get<Certificate[]>('/certificates/my')
      .then((data) => setCertificates(data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-primary-600 text-xs font-bold uppercase tracking-wider mb-1">
          <FileCheck className="h-4 w-4" />
          <span>Accredited Credentials</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
          My Certificates of Commendation
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
          Official, digitally verifiable certificates issued by Centrala National High School for completed extracurricular programs.
        </p>
      </div>

      {/* Certificates Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-64 rounded-2xl bg-muted/40 animate-pulse border border-border" />
          ))}
        </div>
      ) : certificates.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
          No certificates issued yet. Complete an extracurricular program or tree-planting outreach with high attendance to qualify for verified certificate issuance.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {certificates.map((cert) => (
            <div
              key={cert.id}
              className="group flex flex-col justify-between rounded-2xl border-2 border-border/80 bg-card p-6 shadow-md hover:border-amber-400/60 hover:shadow-xl transition-all duration-200"
            >
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/70">
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                    <ShieldCheck className="h-4 w-4" />
                    <span>VERIFIED CREDENTIAL</span>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-muted-foreground">
                    {cert.certificate_number}
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 shadow-sm">
                    <Award className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground leading-snug">
                      {cert.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {cert.description || 'Awarded for active extracurricular participation.'}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 mt-2">
                      Conferred: <span className="font-semibold text-foreground">{formatDate(cert.issue_date)}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border/70 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  Activity: <span className="font-medium text-foreground">{cert.activity_title}</span>
                </span>
                <Button
                  size="sm"
                  onClick={() => setSelectedCert(cert)}
                  className="font-bold shadow-sm"
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" /> View Certificate
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Certificate Preview Modal */}
      <CertificatePreviewModal
        isOpen={!!selectedCert}
        onClose={() => setSelectedCert(null)}
        certificate={selectedCert}
        studentName={user ? `${user.firstName} ${user.lastName}` : 'Angelo Morales'}
      />
    </div>
  );
}
