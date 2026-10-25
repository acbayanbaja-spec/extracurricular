"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import {
  QrCode,
  RefreshCw,
  Copy,
  Check,
  Monitor,
  X,
  TimerReset,
  Users,
} from 'lucide-react';
import { ApiClient } from '@/lib/api';
import { toast } from 'sonner';

interface QrDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionTitle: string;
}

function remaining(expiresAt: string | null): number {
  if (!expiresAt) return 0;
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Number.isFinite(ms) ? Math.max(0, ms) : 0;
}

function formatRemaining(ms: number): string {
  const total = Math.floor(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function QrDisplayModal({ isOpen, onClose, sessionId, sessionTitle }: QrDisplayModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [msLeft, setMsLeft] = useState(0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isProjector, setIsProjector] = useState(false);
  const [checkIns, setCheckIns] = useState<number | null>(null);
  const lastRefreshRef = useRef<number>(Date.now());

  const generateCode = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await ApiClient.post<{ token: string; qrDataUrl: string; expiresAt: string }>(
        `/attendance/session/${sessionId}/qr`,
        { minutes: 5 }
      );
      setQrDataUrl(res.qrDataUrl);
      setToken(res.token);
      setExpiresAt(res.expiresAt);
      lastRefreshRef.current = Date.now();
      setMsLeft(remaining(res.expiresAt));
      if (!silent) toast.success('Live QR code is now on screen.');
    } catch (err: any) {
      if (!silent) toast.error('Failed to generate session QR code', { description: err.message });
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    if (isOpen && sessionId) generateCode();
  }, [isOpen, sessionId, generateCode]);

  // Countdown tick
  useEffect(() => {
    if (!isOpen) return;
    const tick = window.setInterval(() => setMsLeft(remaining(expiresAt)), 1000);
    return () => window.clearInterval(tick);
  }, [isOpen, expiresAt]);

  // Auto-rotate the code every 4 minutes so a photographed code stops working
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;
    const rotate = window.setInterval(() => {
      void generateCode(true);
    }, 240_000);
    return () => window.clearInterval(rotate);
  }, [isOpen, autoRefresh, generateCode]);

  // Live check-in tally so the adviser sees the room fill up
  useEffect(() => {
    if (!isOpen || !sessionId) return;
    const poll = async () => {
      try {
        const data = await ApiClient.get<any>(`/attendance/session/${sessionId}`);
        const records = data?.records || [];
        setCheckIns(records.filter((r: any) => r.status === 'Present' || r.status === 'Late').length);
      } catch {}
    };
    void poll();
    const timer = window.setInterval(poll, 15_000);
    return () => window.clearInterval(timer);
  }, [isOpen, sessionId]);

  useEffect(() => {
    if (!isProjector) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsProjector(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isProjector]);

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard?.writeText(token);
    setIsCopied(true);
    toast.success('Token copied — read it aloud for learners without a camera.');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const isExpiringSoon = msLeft > 0 && msLeft < 60_000;
  const isExpired = expiresAt !== null && msLeft === 0;

  const codePanel = (large = false) => (
    <div className="flex flex-col items-center">
      <div
        className={`relative flex items-center justify-center rounded-3xl bg-white p-4 shadow-xl ${
          large ? 'h-[min(78vh,78vw)] w-[min(78vh,78vw)]' : 'h-64 w-64'
        }`}
      >
        {isLoading && !qrDataUrl ? (
          <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
        ) : qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt={`Attendance QR for ${sessionTitle}`}
            className="h-full w-full object-contain"
          />
        ) : (
          <p className="text-xs text-muted-foreground">Generating code…</p>
        )}

        {isExpired && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl bg-slate-900/90 text-center p-4">
            <TimerReset className="h-8 w-8 text-amber-300" />
            <p className="text-sm font-bold text-white">Code expired</p>
            <Button size="sm" onClick={() => void generateCode()} className="font-bold">
              Generate a new code
            </Button>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-black tabular-nums ${
            isExpired
              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
              : isExpiringSoon
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${isExpired ? 'bg-rose-500' : isExpiringSoon ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`} />
          {isExpired ? 'Closed' : `Rotates in ${formatRemaining(msLeft)}`}
        </span>

        {checkIns !== null && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1 text-xs font-black text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
            <Users className="h-3.5 w-3.5" />
            {checkIns} checked in
          </span>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Modal
        isOpen={isOpen && !isProjector}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-indigo-600" />
            <span>Live Attendance QR</span>
          </div>
        }
        description={`Learners scan this to check in to “${sessionTitle}”.`}
        maxWidth="md"
      >
        <div className="flex flex-col items-center justify-center p-2 text-center">
          {codePanel(false)}

          {token && (
            <div className="mt-4 w-full rounded-xl bg-muted/60 p-3 border border-border flex items-center justify-between gap-2">
              <div className="text-left overflow-hidden mr-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fallback session token</p>
                <p className="text-xs font-mono text-foreground truncate">{token}</p>
              </div>
              <Button size="sm" variant="outline" onClick={copyToken} className="h-8 px-2.5 shrink-0">
                {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              </Button>
            </div>
          )}

          <label className="mt-4 flex w-full cursor-pointer items-center justify-between rounded-xl border border-border bg-card px-3 py-2.5">
            <span className="text-xs font-bold text-foreground">
              Rotate automatically
              <span className="block text-[11px] font-medium text-muted-foreground">
                New code every 4 minutes so screenshots cannot be reused
              </span>
            </span>
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 accent-indigo-600"
            />
          </label>

          <div className="mt-5 flex flex-wrap items-center gap-3 w-full">
            <Button variant="outline" size="sm" onClick={() => void generateCode()} isLoading={isLoading} className="flex-1">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh now
            </Button>
            <Button variant="default" size="sm" onClick={() => setIsProjector(true)} className="flex-1 font-bold">
              <Monitor className="mr-1.5 h-3.5 w-3.5" /> Project full screen
            </Button>
          </div>
        </div>
      </Modal>

      {/* Projector mode for the classroom TV / projector */}
      {isProjector && (
        <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-6 bg-slate-950 p-6 text-center">
          <button
            onClick={() => setIsProjector(false)}
            className="absolute right-5 top-5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <X className="mr-1.5 inline h-3.5 w-3.5" /> Exit projector
          </button>

          <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-300">Centrala National High School</p>
          <h2 className="max-w-3xl text-2xl sm:text-4xl font-black tracking-tight text-white">{sessionTitle}</h2>
          <p className="text-sm text-slate-300">Open the StudentX portal, tap “Scan Attendance QR” and point your camera at this screen.</p>

          {codePanel(true)}

          {token && (
            <p className="max-w-xl font-mono text-[11px] break-all text-slate-400">
              Learners without a camera can enter: {token}
            </p>
          )}

          <Button size="sm" variant="outline" onClick={() => void generateCode()} isLoading={isLoading}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> New code
          </Button>
        </div>
      )}
    </>
  );
}
